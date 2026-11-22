-- ============================================================
-- Rangritii — CONTACT GATING + PAYMENT ROUTING (migration)
-- Run this on an already-live database (after schema.sql /
-- payments-migration.sql). Fresh project? schema.sql already includes it.
--
-- What changes:
--   1. place_booking() no longer hands the artist's WhatsApp to the customer —
--      contact details unlock only after the artist confirms the booking.
--   2. get_payment_info() no longer exposes the artist's UPI ID / QR to
--      customers (those are for the admin's payouts only). It returns the
--      artist's WhatsApp instead, and only on confirmed/completed bookings.
--   3. claim_payment() accepts 'upi_admin' (UTR required) or 'cash' (no UTR).
--      'upi_artist' is rejected for new payments; old rows keep working.
-- ============================================================

-- ── 1. Booking creation: no artist contact in the response ──
create or replace function public.place_booking(p_artist_id uuid, p_details jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_artist record;
  v_booking_number text;
  v_event_date date;
begin
  select id, name into v_artist
    from public.artists
    where id = p_artist_id and is_approved and is_active;
  if not found then
    raise exception 'This artist is not available for booking right now';
  end if;

  v_event_date := (p_details ->> 'event_date')::date;
  if v_event_date is null or v_event_date < current_date then
    raise exception 'Event date cannot be in the past';
  end if;

  v_booking_number := 'RB-' || upper(to_hex((extract(epoch from now()) * 1000)::bigint))
    || lpad(floor(random() * 100)::text, 2, '0');

  insert into public.bookings (
    booking_number, artist_id, artist_name, customer_name, phone, email,
    address, city, event_date, event_type, notes, status, user_id
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
    'pending', auth.uid()
  );

  -- The artist's contact is deliberately withheld until she confirms.
  return jsonb_build_object(
    'booking_number', v_booking_number,
    'artist_name', v_artist.name
  );
end;
$$;

revoke all on function public.place_booking(uuid, jsonb) from public;
grant execute on function public.place_booking(uuid, jsonb) to anon, authenticated;

-- ── 2. Payment page info: admin UPI only, artist contact when confirmed ──
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

  select whatsapp into v_artist from public.artists where id = v_b.artist_id;
  select upi_id, upi_qr into v_settings from public.platform_settings where id = 1;

  return jsonb_build_object(
    'booking_number', v_b.booking_number,
    'artist_name', v_b.artist_name,
    'event_date', v_b.event_date,
    'status', v_b.status,
    'amount', v_b.amount,
    'payment_method', v_b.payment_method,
    'payment_status', v_b.payment_status,
    -- contact unlocks only once the artist has confirmed the booking
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

-- ── 3. Customer payment claim: admin UPI (with UTR) or cash (no UTR) ──
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
  -- 'upi_artist' is retired: the artist's QR is for admin payouts only.
  if p_method not in ('upi_admin', 'cash') then
    raise exception 'Invalid payment method';
  end if;
  if p_method = 'upi_admin' and length(trim(coalesce(p_utr, ''))) < 4 then
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
        payment_utr = case
          when p_method = 'cash' then ''
          else left(trim(p_utr), 40)
        end
    where id = v_id;
end;
$$;

revoke all on function public.claim_payment(text, text, text, text) from public;
grant execute on function public.claim_payment(text, text, text, text) to anon, authenticated;
