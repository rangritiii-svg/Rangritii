-- ============================================================
-- Rangritii — v3: TOKEN-FIRST BOOKINGS + SECURITY FIXES
-- Run this ONCE in Supabase → SQL Editor, after schema.sql
-- (and after payment-flow-v2.sql on an older live database).
-- Safe to re-run.
--
-- New booking flow
--   1. Customer picks the artist's packages → total is known up front.
--   2. Booking is created as `awaiting_token` — the artist does NOT see it.
--   3. Customer pays the fixed token on Rangritii's UPI QR + submits the UTR.
--   4. Admin verifies the token → status `pending`, the request now shows up
--      for the artist (sent_to_artist_at = now()).
--   5. Artist accepts (→ `confirmed`, contacts unlock) or declines
--      (→ `declined`, token marked `refund_due`). No answer within
--      `response_hours` → auto-declined the same way.
--   6. After the service the customer pays the balance (total − token)
--      to Rangritii UPI or in cash to the artist; admin and artist settle
--      the net difference.
--
-- Security fixes in this file
--   • Users could make themselves admin (profiles.role was self-editable).
--   • Artists could mark their own payments "verified" and commission
--     "settled" straight through the API — artist writes now go only
--     through checked functions.
--   • Artist WhatsApp / UPI were readable by anyone via the public API,
--     which defeated "contact unlocks after confirmation".
--   • Upload bucket had no size / type limit.
-- ============================================================

-- ── 1. profiles: role can only be changed by an admin ─────────────
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for the SQL editor / service role: those may change roles.
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.id := old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_columns on public.profiles;
create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Same idea for artists: logged-in non-admins can't approve themselves, but
-- approving from the SQL editor (no logged-in user) now works.
create or replace function public.protect_artist_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.is_approved := old.is_approved;
    new.is_active   := old.is_active;
    new.user_id     := old.user_id;
    new.slug        := old.slug;
  end if;
  return new;
end;
$$;

-- ── 2. artists: packages + private contact/UPI columns ───────────
alter table public.artists add column if not exists packages jsonb not null default '[]'::jsonb;

-- Public (anon + logged-in) may read every column EXCEPT whatsapp / upi_id / upi_qr.
revoke select on public.artists from anon, authenticated;
grant select (
  id, user_id, name, slug, bio, city, area, experience_years, price_min, price_max,
  styles, profile_image, portfolio_images, packages, is_approved, is_active, created_at
) on public.artists to anon, authenticated;

-- Owner or admin reads the private columns through this function.
create or replace function public.get_artist_private(p_artist_ids uuid[])
returns table (artist_id uuid, whatsapp text, upi_id text, upi_qr text)
language sql
security definer
set search_path = public
stable
as $$
  select a.id, a.whatsapp, a.upi_id, a.upi_qr
  from public.artists a
  where a.id = any (p_artist_ids)
    and (a.user_id = auth.uid() or public.is_admin());
$$;
revoke all on function public.get_artist_private(uuid[]) from public;
grant execute on function public.get_artist_private(uuid[]) to authenticated;

-- ── 3. platform settings: token + response window ────────────────
alter table public.platform_settings add column if not exists token_amount numeric(10,2) not null default 500
  check (token_amount >= 0);
alter table public.platform_settings add column if not exists response_hours int not null default 24
  check (response_hours between 1 and 168);

-- ── 4. bookings: token columns + new statuses ────────────────────
-- Existing bookings pre-date tokens: they get token 0 / 'verified' so they
-- keep working exactly as before.
alter table public.bookings add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.bookings add column if not exists token_amount numeric(10,2) not null default 0;
alter table public.bookings add column if not exists token_status text not null default 'verified';
alter table public.bookings alter column token_status set default 'unpaid';
alter table public.bookings add column if not exists token_utr text not null default '';
alter table public.bookings add column if not exists refund_utr text not null default '';
alter table public.bookings add column if not exists sent_to_artist_at timestamptz;
alter table public.bookings add column if not exists responded_at timestamptz;
alter table public.bookings add column if not exists decline_reason text not null default '';

update public.bookings set sent_to_artist_at = created_at
  where sent_to_artist_at is null and status <> 'awaiting_token';

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('awaiting_token', 'pending', 'confirmed', 'completed', 'declined', 'cancelled'));
alter table public.bookings drop constraint if exists bookings_token_status_check;
alter table public.bookings add constraint bookings_token_status_check
  check (token_status in ('unpaid', 'claimed', 'verified', 'refund_due', 'refunded'));

create index if not exists bookings_status_idx on public.bookings (status);

-- Lock the token columns too for non-admins (belt & braces — artists no
-- longer have a direct UPDATE policy at all, see section 6).
create or replace function public.protect_booking_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.is_admin()
     and current_setting('rangritii.trusted', true) is distinct from 'on' then
    raise exception 'Bookings can only be changed through Rangritii';
  end if;
  return new;
end;
$$;

-- ── 5. Booking creation (token-first) ────────────────────────────
drop function if exists public.place_booking(uuid, jsonb);

create or replace function public.place_booking(p_artist_id uuid, p_details jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_artist record;
  v_settings record;
  v_booking_number text;
  v_event_date date;
  v_items jsonb := '[]'::jsonb;
  v_line jsonb;
  v_pkg jsonb;
  v_qty int;
  v_total numeric(10,2) := 0;
  v_token numeric(10,2);
begin
  select id, name, packages into v_artist
    from public.artists
    where id = p_artist_id and is_approved and is_active;
  if not found then
    raise exception 'This artist is not available for booking right now';
  end if;

  v_event_date := (p_details ->> 'event_date')::date;
  if v_event_date is null or v_event_date < current_date then
    raise exception 'Event date cannot be in the past';
  end if;

  -- Prices always come from the artist's saved packages, never from the browser.
  for v_line in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_qty := greatest(0, least(50, coalesce((v_line ->> 'qty')::int, 0)));
    continue when v_qty = 0;
    select p into v_pkg
      from jsonb_array_elements(v_artist.packages) p
      where p ->> 'id' = v_line ->> 'package_id';
    if v_pkg is null then
      raise exception 'One of the chosen packages is no longer offered — please refresh';
    end if;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'package_id', v_pkg ->> 'id',
      'name', v_pkg ->> 'name',
      'price', (v_pkg ->> 'price')::numeric,
      'qty', v_qty
    ));
    v_total := v_total + (v_pkg ->> 'price')::numeric * v_qty;
  end loop;

  if jsonb_array_length(v_artist.packages) > 0 and jsonb_array_length(v_items) = 0 then
    raise exception 'Please choose at least one package';
  end if;

  select token_amount, commission_percent into v_settings from public.platform_settings where id = 1;
  v_token := coalesce(v_settings.token_amount, 500);
  if v_total > 0 then v_token := least(v_token, v_total); end if;

  v_booking_number := 'RB-' || upper(substr(md5(gen_random_uuid()::text), 1, 8));

  perform set_config('rangritii.trusted', 'on', true);
  insert into public.bookings (
    booking_number, artist_id, artist_name, customer_name, phone, email,
    address, city, event_date, event_type, notes, status, user_id,
    items, amount, commission_amount, token_amount, token_status, sent_to_artist_at
  ) values (
    v_booking_number, v_artist.id, v_artist.name,
    left(p_details ->> 'customer_name', 120),
    left(p_details ->> 'phone', 15),
    left(coalesce(p_details ->> 'email', ''), 200),
    left(p_details ->> 'address', 500),
    left(p_details ->> 'city', 100),
    v_event_date,
    left(p_details ->> 'event_type', 60),
    left(coalesce(p_details ->> 'notes', ''), 1000),
    case when v_token > 0 then 'awaiting_token' else 'pending' end,
    auth.uid(),
    v_items,
    nullif(v_total, 0),
    case when v_total > 0 then round(v_total * coalesce(v_settings.commission_percent, 10) / 100) end,
    v_token,
    case when v_token > 0 then 'unpaid' else 'verified' end,
    case when v_token > 0 then null else now() end
  );

  return jsonb_build_object(
    'booking_number', v_booking_number,
    'artist_name', v_artist.name,
    'total', v_total,
    'token', v_token
  );
end;
$$;

revoke all on function public.place_booking(uuid, jsonb, jsonb) from public;
grant execute on function public.place_booking(uuid, jsonb, jsonb) to anon, authenticated;

-- ── 6. RLS: only the customer and admins read bookings directly ──
-- Artists read theirs through artist_bookings() below, which (a) only returns
-- requests that were actually sent to them (token verified), and (b) hides the
-- customer's phone, email and address until the artist has accepted.
drop policy if exists "bookings_select" on public.bookings;
create policy "bookings_select" on public.bookings
  for select using (user_id = auth.uid() or public.is_admin());

create or replace function public.artist_bookings()
returns setof public.bookings
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  r public.bookings;
begin
  for r in
    select b.*
    from public.bookings b
    join public.artists a on a.id = b.artist_id
    where a.user_id = auth.uid() and b.sent_to_artist_at is not null
    order by b.created_at desc
  loop
    if r.status not in ('confirmed', 'completed') then
      r.phone := '';
      r.email := '';
      r.address := '';
    end if;
    return next r;
  end loop;
end;
$$;
revoke all on function public.artist_bookings() from public;
grant execute on function public.artist_bookings() to authenticated;
-- Artists no longer update bookings directly (that let them self-verify payments).
drop policy if exists "bookings_artist_update" on public.bookings;

-- ── 7. Auto-expire requests the artist never answered ────────────
create or replace function public.expire_stale_bookings()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hours int;
  v_count int;
begin
  select coalesce(response_hours, 24) into v_hours from public.platform_settings where id = 1;
  perform set_config('rangritii.trusted', 'on', true);
  update public.bookings
    set status = 'declined',
        decline_reason = 'The artist did not respond within ' || v_hours || ' hours',
        responded_at = now(),
        token_status = case when token_status = 'verified' and token_amount > 0 then 'refund_due' else token_status end
    where status = 'pending'
      and sent_to_artist_at is not null
      and sent_to_artist_at < now() - make_interval(hours => v_hours);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.expire_stale_bookings() from public;
grant execute on function public.expire_stale_bookings() to anon, authenticated;

-- ── 8. Public payment page (booking number + phone) ──────────────
create or replace function public.get_payment_info(p_booking_number text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_b record;
  v_artist record;
  v_settings record;
begin
  perform public.expire_stale_bookings();

  select * into v_b
    from public.bookings
    where upper(booking_number) = upper(trim(p_booking_number))
      and right(regexp_replace(phone, '\D', '', 'g'), 10) = p_phone;
  if not found then
    return null;
  end if;

  select whatsapp into v_artist from public.artists where id = v_b.artist_id;
  select upi_id, upi_qr into v_settings from public.platform_settings where id = 1;

  return jsonb_build_object(
    'booking_number', v_b.booking_number,
    'artist_name', v_b.artist_name,
    'event_date', v_b.event_date,
    'status', v_b.status,
    'items', v_b.items,
    'amount', v_b.amount,
    'token_amount', v_b.token_amount,
    'token_status', v_b.token_status,
    'decline_reason', v_b.decline_reason,
    'payment_method', v_b.payment_method,
    'payment_status', v_b.payment_status,
    'artist_whatsapp', case
      when v_b.status in ('confirmed', 'completed') then coalesce(v_artist.whatsapp, '')
      else ''
    end,
    'admin_upi', coalesce(v_settings.upi_id, ''),
    'admin_qr', coalesce(v_settings.upi_qr, '')
  );
end;
$$;
revoke all on function public.get_payment_info(text, text) from public;
grant execute on function public.get_payment_info(text, text) to anon, authenticated;

-- A UTR can only be used once across all token and balance payments
-- (stops one screenshot being submitted for several bookings).
create or replace function public.utr_in_use(p_utr text, p_except uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.bookings
    where id <> p_except
      and (
        (upper(token_utr) = upper(trim(p_utr)) and token_status <> 'unpaid')
        or (upper(payment_utr) = upper(trim(p_utr)) and payment_status in ('claimed', 'verified'))
      )
  );
$$;
revoke all on function public.utr_in_use(text, uuid) from public;

-- Customer submits the token UTR
create or replace function public.claim_token(p_booking_number text, p_phone text, p_utr text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if length(trim(coalesce(p_utr, ''))) < 6 then
    raise exception 'Please enter the 12-digit UTR / transaction reference';
  end if;
  select id into v_id
    from public.bookings
    where upper(booking_number) = upper(trim(p_booking_number))
      and right(regexp_replace(phone, '\D', '', 'g'), 10) = p_phone
      and status = 'awaiting_token'
      and token_status in ('unpaid', 'claimed');
  if not found then
    raise exception 'This booking is not waiting for a token payment';
  end if;
  if public.utr_in_use(p_utr, v_id) then
    raise exception 'This UTR is already recorded against another booking — please check it';
  end if;
  perform set_config('rangritii.trusted', 'on', true);
  update public.bookings
    set token_status = 'claimed', token_utr = left(trim(p_utr), 40)
    where id = v_id;
end;
$$;
revoke all on function public.claim_token(text, text, text) from public;
grant execute on function public.claim_token(text, text, text) to anon, authenticated;

-- Customer pays the BALANCE (after the artist has confirmed)
create or replace function public.claim_payment(
  p_booking_number text, p_phone text, p_method text, p_utr text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_method not in ('upi_admin', 'cash') then
    raise exception 'Invalid payment method';
  end if;
  if p_method = 'upi_admin' and length(trim(coalesce(p_utr, ''))) < 6 then
    raise exception 'UTR/reference number required';
  end if;

  select id into v_id
    from public.bookings
    where upper(booking_number) = upper(trim(p_booking_number))
      and right(regexp_replace(phone, '\D', '', 'g'), 10) = p_phone
      and payment_status <> 'verified'
      and status in ('confirmed', 'completed')
      and amount is not null;
  if not found then
    raise exception 'The balance can be paid once the artist has confirmed the booking';
  end if;
  if p_method = 'upi_admin' and public.utr_in_use(p_utr, v_id) then
    raise exception 'This UTR is already recorded against another booking — please check it';
  end if;

  perform set_config('rangritii.trusted', 'on', true);
  update public.bookings
    set payment_method = p_method,
        payment_status = 'claimed',
        payment_utr = case when p_method = 'cash' then '' else left(trim(p_utr), 40) end
    where id = v_id;
end;
$$;
revoke all on function public.claim_payment(text, text, text, text) from public;
grant execute on function public.claim_payment(text, text, text, text) to anon, authenticated;

-- ── 9. Artist actions (ownership checked inside) ─────────────────
create or replace function public.artist_own_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_b public.bookings;
begin
  select b.* into v_b
    from public.bookings b
    join public.artists a on a.id = b.artist_id
    where b.id = p_booking_id and a.user_id = auth.uid()
      and b.sent_to_artist_at is not null;
  if not found then
    raise exception 'This booking does not belong to you';
  end if;
  return v_b;
end;
$$;
revoke all on function public.artist_own_booking(uuid) from public;

create or replace function public.artist_respond(p_booking_id uuid, p_accept boolean, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_b public.bookings;
begin
  perform public.expire_stale_bookings();
  v_b := public.artist_own_booking(p_booking_id);
  if v_b.status <> 'pending' then
    raise exception 'This request has already been answered or has expired';
  end if;
  perform set_config('rangritii.trusted', 'on', true);
  if p_accept then
    update public.bookings set status = 'confirmed', responded_at = now() where id = v_b.id;
    -- Token already covers the whole total → nothing left to pay; start settlement.
    if v_b.amount is not null and v_b.token_status = 'verified' and v_b.amount <= v_b.token_amount then
      v_b.payment_status := 'verified';
      v_b.payment_method := '';
      update public.bookings
        set payment_status = 'verified',
            settlement_status = public.settlement_after_payment(v_b)
        where id = v_b.id;
    end if;
  else
    update public.bookings
      set status = 'declined', responded_at = now(),
          decline_reason = left(coalesce(nullif(trim(p_reason), ''), 'The artist is not available on this date'), 300),
          token_status = case when token_status = 'verified' and token_amount > 0 then 'refund_due' else token_status end
      where id = v_b.id;
  end if;
end;
$$;
revoke all on function public.artist_respond(uuid, boolean, text) from public;
grant execute on function public.artist_respond(uuid, boolean, text) to authenticated;

create or replace function public.artist_set_amount(p_booking_id uuid, p_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_b public.bookings;
  v_pct numeric;
begin
  v_b := public.artist_own_booking(p_booking_id);
  if v_b.status not in ('pending', 'confirmed', 'completed') then
    raise exception 'The amount can only be changed on an open booking';
  end if;
  if v_b.payment_status <> 'unpaid' then
    raise exception 'The total is locked once the customer has paid the balance';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount < v_b.token_amount then
    raise exception 'The total cannot be less than the token already paid';
  end if;
  select commission_percent into v_pct from public.platform_settings where id = 1;
  perform set_config('rangritii.trusted', 'on', true);
  update public.bookings
    set amount = p_amount, commission_amount = round(p_amount * coalesce(v_pct, 10) / 100)
    where id = v_b.id;
end;
$$;
revoke all on function public.artist_set_amount(uuid, numeric) from public;
grant execute on function public.artist_set_amount(uuid, numeric) to authenticated;

-- Net settlement once the balance is in: admin owes the artist
-- (amount − commission − what the artist collected directly).
create or replace function public.settlement_after_payment(v_b public.bookings)
returns text
language sql
immutable
as $$
  select case
    when v_b.amount is null or v_b.commission_amount is null then 'pending'
    when v_b.amount - v_b.commission_amount
         - case when v_b.payment_method in ('cash', 'upi_artist')
                then greatest(0, v_b.amount - case when v_b.token_status = 'verified' then v_b.token_amount else 0 end)
                else 0 end = 0
      then 'settled'
    else 'pending'
  end;
$$;

create or replace function public.artist_record_cash(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_b public.bookings;
begin
  v_b := public.artist_own_booking(p_booking_id);
  if v_b.status not in ('confirmed', 'completed') then
    raise exception 'Confirm the booking first';
  end if;
  if v_b.payment_status = 'verified' then raise exception 'Payment already verified'; end if;
  if v_b.amount is null then raise exception 'Set the amount first'; end if;

  -- The artist is the one receiving the cash, so her record is final.
  perform set_config('rangritii.trusted', 'on', true);
  v_b.payment_method := 'cash';
  v_b.payment_status := 'verified';
  update public.bookings
    set payment_method = 'cash',
        payment_status = 'verified',
        status = 'completed',
        settlement_status = public.settlement_after_payment(v_b)
    where id = v_b.id;
end;
$$;
revoke all on function public.artist_record_cash(uuid) from public;
grant execute on function public.artist_record_cash(uuid) to authenticated;

create or replace function public.artist_settlement_utr(p_booking_id uuid, p_utr text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_b public.bookings;
begin
  v_b := public.artist_own_booking(p_booking_id);
  if v_b.settlement_status not in ('pending', 'claimed') then
    raise exception 'No settlement is due on this booking';
  end if;
  if v_b.payment_method not in ('cash', 'upi_artist')
     or v_b.amount - v_b.commission_amount
        - greatest(0, v_b.amount - case when v_b.token_status = 'verified' then v_b.token_amount else 0 end) >= 0 then
    raise exception 'Rangritii owes you on this booking — there is nothing for you to pay';
  end if;
  if length(trim(coalesce(p_utr, ''))) < 6 then
    raise exception 'Please enter a valid UTR';
  end if;
  perform set_config('rangritii.trusted', 'on', true);
  update public.bookings
    set settlement_status = 'claimed', settlement_utr = left(trim(p_utr), 40)
    where id = v_b.id;
end;
$$;
revoke all on function public.artist_settlement_utr(uuid, text) from public;
grant execute on function public.artist_settlement_utr(uuid, text) to authenticated;

-- ── 10. Customer: artist contacts for their confirmed bookings ───
create or replace function public.my_booking_contacts()
returns table (artist_id uuid, whatsapp text)
language sql
security definer
set search_path = public
stable
as $$
  select distinct a.id, a.whatsapp
  from public.bookings b
  join public.artists a on a.id = b.artist_id
  where b.user_id = auth.uid() and b.status in ('confirmed', 'completed');
$$;
revoke all on function public.my_booking_contacts() from public;
grant execute on function public.my_booking_contacts() to authenticated;

-- ── 11. Uploads: images only, max 5 MB ───────────────────────────
update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  where id = 'portfolios';

-- ── 12. Contact form: sane lengths ───────────────────────────────
alter table public.contact_messages drop constraint if exists contact_messages_len_check;
alter table public.contact_messages add constraint contact_messages_len_check
  check (length(name) <= 120 and length(email) <= 200 and length(message) <= 3000) not valid;

-- Old two-step artist update path is gone; the SECURITY DEFINER functions
-- above set `rangritii.trusted` so the booking-protect trigger lets them through.
