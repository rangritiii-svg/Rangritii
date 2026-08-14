-- ============================================================
-- Rangritii — UPI PAYMENTS UPGRADE (migration)
-- Run this on an already-live database (after schema.sql).
-- Fresh project? schema.sql alone is enough (it includes all of this).
-- ============================================================

-- ── 1. Platform settings (admin UPI + commission) ───────────
create table if not exists public.platform_settings (
  id int primary key check (id = 1),
  upi_id text not null default '',
  upi_qr text not null default '',
  commission_percent numeric(5,2) not null default 10 check (commission_percent between 0 and 50),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

drop policy if exists "settings_auth_read" on public.platform_settings;
create policy "settings_auth_read" on public.platform_settings
  for select to authenticated using (true);
drop policy if exists "settings_admin_update" on public.platform_settings;
create policy "settings_admin_update" on public.platform_settings
  for update using (public.is_admin());
drop policy if exists "settings_admin_insert" on public.platform_settings;
create policy "settings_admin_insert" on public.platform_settings
  for insert with check (public.is_admin());

-- ── 2. Artist UPI details ───────────────────────────────────
alter table public.artists add column if not exists upi_id text not null default '';
alter table public.artists add column if not exists upi_qr text not null default '';

-- ── 3. Booking payment fields ───────────────────────────────
alter table public.bookings add column if not exists amount numeric(10,2) check (amount is null or amount > 0);
alter table public.bookings add column if not exists commission_amount numeric(10,2);
alter table public.bookings add column if not exists payment_method text not null default ''
  ;
alter table public.bookings drop constraint if exists bookings_payment_method_check;
alter table public.bookings add constraint bookings_payment_method_check
  check (payment_method in ('', 'upi_admin', 'upi_artist', 'cash'));
alter table public.bookings add column if not exists payment_status text not null default 'unpaid';
alter table public.bookings drop constraint if exists bookings_payment_status_check;
alter table public.bookings add constraint bookings_payment_status_check
  check (payment_status in ('unpaid', 'claimed', 'verified'));
alter table public.bookings add column if not exists payment_utr text not null default '';
alter table public.bookings add column if not exists settlement_status text not null default 'na';
alter table public.bookings drop constraint if exists bookings_settlement_status_check;
alter table public.bookings add constraint bookings_settlement_status_check
  check (settlement_status in ('na', 'pending', 'claimed', 'settled'));
alter table public.bookings add column if not exists settlement_utr text not null default '';

-- ── 4. Artists can now update their own bookings' payment fields,
--       but can never touch customer identity / core fields ────
drop policy if exists "bookings_artist_update" on public.bookings;
create policy "bookings_artist_update" on public.bookings
  for update to authenticated
  using (
    exists (
      select 1 from public.artists a
      where a.id = artist_id and a.user_id = auth.uid()
    )
  );

create or replace function public.protect_booking_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    -- non-admins (artists) can manage status & payment fields only
    new.booking_number := old.booking_number;
    new.artist_id      := old.artist_id;
    new.artist_name    := old.artist_name;
    new.customer_name  := old.customer_name;
    new.phone          := old.phone;
    new.email          := old.email;
    new.address        := old.address;
    new.city           := old.city;
    new.event_date     := old.event_date;
    new.event_type     := old.event_type;
    new.notes          := old.notes;
    new.user_id        := old.user_id;
    new.created_at     := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_protect_columns on public.bookings;
create trigger bookings_protect_columns
  before update on public.bookings
  for each row execute function public.protect_booking_columns();

-- ── 5. Public payment page RPCs (booking number + phone required) ──
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
  select * into v_b
    from public.bookings
    where upper(booking_number) = upper(trim(p_booking_number))
      and right(regexp_replace(phone, '\D', '', 'g'), 10) = p_phone;
  if not found then
    return null;
  end if;

  select upi_id, upi_qr into v_artist from public.artists where id = v_b.artist_id;
  select upi_id, upi_qr into v_settings from public.platform_settings where id = 1;

  return jsonb_build_object(
    'booking_number', v_b.booking_number,
    'artist_name', v_b.artist_name,
    'event_date', v_b.event_date,
    'status', v_b.status,
    'amount', v_b.amount,
    'payment_method', v_b.payment_method,
    'payment_status', v_b.payment_status,
    'artist_upi', coalesce(v_artist.upi_id, ''),
    'artist_qr', coalesce(v_artist.upi_qr, ''),
    'admin_upi', coalesce(v_settings.upi_id, ''),
    'admin_qr', coalesce(v_settings.upi_qr, '')
  );
end;
$$;

revoke all on function public.get_payment_info(text, text) from public;
grant execute on function public.get_payment_info(text, text) to anon, authenticated;

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
  if p_method not in ('upi_admin', 'upi_artist') then
    raise exception 'Invalid payment method';
  end if;
  if length(trim(p_utr)) < 4 then
    raise exception 'UTR/reference number required';
  end if;

  select id into v_id
    from public.bookings
    where upper(booking_number) = upper(trim(p_booking_number))
      and right(regexp_replace(phone, '\D', '', 'g'), 10) = p_phone
      and payment_status <> 'verified'
      and status <> 'cancelled';
  if not found then
    raise exception 'Booking not found, cancelled, or the payment is already verified';
  end if;

  update public.bookings
    set payment_method = p_method,
        payment_status = 'claimed',
        payment_utr = left(trim(p_utr), 40)
    where id = v_id;
end;
$$;

revoke all on function public.claim_payment(text, text, text, text) from public;
grant execute on function public.claim_payment(text, text, text, text) to anon, authenticated;
