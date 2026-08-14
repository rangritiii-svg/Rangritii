-- ============================================================
-- Rangritii (Mehandi Platform) — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query.
-- Then run seed.sql to load the starter styles.
-- Safe to run on a fresh project OR on top of the earlier
-- e-commerce schema (it cleans that up first). Idempotent.
-- Includes the UPI payments system.
-- ============================================================

-- ── 0. Clean up the old store schema (if present) ───────────
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.products cascade;
drop table if exists public.categories cascade;
drop function if exists public.place_order(jsonb, jsonb);

-- ── 1. Profiles (linked to Supabase Auth users) ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',  -- Google login provides 'name'
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin check used by RLS policies (SECURITY DEFINER avoids RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── 2. Styles ───────────────────────────────────────────────
create table if not exists public.styles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ── 3. Artists ──────────────────────────────────────────────
create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  slug text not null unique,
  bio text not null default '',
  city text not null default '',
  area text not null default '',
  whatsapp text not null default '',
  experience_years int not null default 0 check (experience_years between 0 and 60),
  price_min numeric(10,2) not null default 0 check (price_min >= 0),
  price_max numeric(10,2) not null default 0 check (price_max >= 0),
  styles text[] not null default '{}',
  profile_image text not null default '',
  portfolio_images text[] not null default '{}',
  upi_id text not null default '',
  upi_qr text not null default '',
  is_approved boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.artists add column if not exists upi_id text not null default '';
alter table public.artists add column if not exists upi_qr text not null default '';

create index if not exists artists_city_idx on public.artists (lower(city));
create index if not exists artists_approved_idx on public.artists (is_approved, is_active);

-- Non-admins can never change approval/identity fields on their own row
create or replace function public.protect_artist_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.is_approved := old.is_approved;
    new.is_active   := old.is_active;
    new.user_id     := old.user_id;
    new.slug        := old.slug;
  end if;
  return new;
end;
$$;

drop trigger if exists artists_protect_columns on public.artists;
create trigger artists_protect_columns
  before update on public.artists
  for each row execute function public.protect_artist_columns();

-- ── 4. Bookings (with payment tracking) ─────────────────────
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique,
  artist_id uuid not null references public.artists (id) on delete cascade,
  artist_name text not null,
  customer_name text not null,
  phone text not null,
  email text not null default '',
  address text not null,
  city text not null,
  event_date date not null,
  event_type text not null,
  notes text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  amount numeric(10,2) check (amount is null or amount > 0),
  commission_amount numeric(10,2),
  payment_method text not null default '',
  payment_status text not null default 'unpaid',
  payment_utr text not null default '',
  settlement_status text not null default 'na',
  settlement_utr text not null default '',
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.bookings add column if not exists amount numeric(10,2) check (amount is null or amount > 0);
alter table public.bookings add column if not exists commission_amount numeric(10,2);
alter table public.bookings add column if not exists payment_method text not null default '';
alter table public.bookings add column if not exists payment_status text not null default 'unpaid';
alter table public.bookings add column if not exists payment_utr text not null default '';
alter table public.bookings add column if not exists settlement_status text not null default 'na';
alter table public.bookings add column if not exists settlement_utr text not null default '';

alter table public.bookings drop constraint if exists bookings_payment_method_check;
alter table public.bookings add constraint bookings_payment_method_check
  check (payment_method in ('', 'upi_admin', 'upi_artist', 'cash'));
alter table public.bookings drop constraint if exists bookings_payment_status_check;
alter table public.bookings add constraint bookings_payment_status_check
  check (payment_status in ('unpaid', 'claimed', 'verified'));
alter table public.bookings drop constraint if exists bookings_settlement_status_check;
alter table public.bookings add constraint bookings_settlement_status_check
  check (settlement_status in ('na', 'pending', 'claimed', 'settled'));

create index if not exists bookings_artist_idx on public.bookings (artist_id);
create index if not exists bookings_user_idx on public.bookings (user_id);

-- Non-admins (artists) can manage status & payment fields only —
-- customer identity / core fields stay locked
create or replace function public.protect_booking_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
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

-- ── 5. Platform settings (admin UPI, commission, contact info) ───
create table if not exists public.platform_settings (
  id int primary key check (id = 1),
  upi_id text not null default '',
  upi_qr text not null default '',
  commission_percent numeric(5,2) not null default 10 check (commission_percent between 0 and 50),
  contact_phone text not null default '+91 99250 26318',
  contact_whatsapp text not null default '919925026318',
  contact_email text not null default 'rangritii21@gmail.com',
  contact_hours text not null default 'Mon–Sat, 10am–7pm',
  updated_at timestamptz not null default now()
);

alter table public.platform_settings add column if not exists contact_phone text not null default '+91 99250 26318';
alter table public.platform_settings add column if not exists contact_whatsapp text not null default '919925026318';
alter table public.platform_settings add column if not exists contact_email text not null default 'rangritii21@gmail.com';
alter table public.platform_settings add column if not exists contact_hours text not null default 'Mon–Sat, 10am–7pm';

insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

-- ── 6. Contact messages ─────────────────────────────────────
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ── 7. RPCs ─────────────────────────────────────────────────
-- Booking creation: validates the artist server-side, inserts atomically.
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
  select id, name, whatsapp into v_artist
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

  return jsonb_build_object(
    'booking_number', v_booking_number,
    'artist_name', v_artist.name,
    'artist_whatsapp', v_artist.whatsapp
  );
end;
$$;

revoke all on function public.place_booking(uuid, jsonb) from public;
grant execute on function public.place_booking(uuid, jsonb) to anon, authenticated;

-- Public payment page info (needs booking number + matching phone)
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

-- Customer claims "I have paid" with UTR (admin/artist verifies later)
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

-- ── 8. Row Level Security ───────────────────────────────────
alter table public.profiles enable row level security;
alter table public.styles enable row level security;
alter table public.artists enable row level security;
alter table public.bookings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.platform_settings enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- styles: public read, admin write
drop policy if exists "styles_public_read" on public.styles;
create policy "styles_public_read" on public.styles
  for select using (true);
drop policy if exists "styles_admin_insert" on public.styles;
create policy "styles_admin_insert" on public.styles
  for insert with check (public.is_admin());
drop policy if exists "styles_admin_update" on public.styles;
create policy "styles_admin_update" on public.styles
  for update using (public.is_admin());
drop policy if exists "styles_admin_delete" on public.styles;
create policy "styles_admin_delete" on public.styles
  for delete using (public.is_admin());

-- artists: public sees approved+active; owners see & edit their own; admins all
drop policy if exists "artists_read" on public.artists;
create policy "artists_read" on public.artists
  for select using (
    (is_approved and is_active) or user_id = auth.uid() or public.is_admin()
  );
drop policy if exists "artists_self_insert" on public.artists;
create policy "artists_self_insert" on public.artists
  for insert to authenticated
  with check (user_id = auth.uid() and is_approved = false);
drop policy if exists "artists_admin_insert" on public.artists;
create policy "artists_admin_insert" on public.artists
  for insert with check (public.is_admin());
drop policy if exists "artists_update" on public.artists;
create policy "artists_update" on public.artists
  for update using (user_id = auth.uid() or public.is_admin());
drop policy if exists "artists_admin_delete" on public.artists;
create policy "artists_admin_delete" on public.artists
  for delete using (public.is_admin());

-- bookings: created only via place_booking(); visible to customer, artist & admins;
-- artists can update their own bookings (payment/status fields only, via trigger)
drop policy if exists "bookings_select" on public.bookings;
create policy "bookings_select" on public.bookings
  for select using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.artists a
      where a.id = artist_id and a.user_id = auth.uid()
    )
  );
drop policy if exists "bookings_admin_update" on public.bookings;
create policy "bookings_admin_update" on public.bookings
  for update using (public.is_admin());
drop policy if exists "bookings_artist_update" on public.bookings;
create policy "bookings_artist_update" on public.bookings
  for update to authenticated
  using (
    exists (
      select 1 from public.artists a
      where a.id = artist_id and a.user_id = auth.uid()
    )
  );

-- contact messages: anyone can write, only admins read
drop policy if exists "contact_insert" on public.contact_messages;
create policy "contact_insert" on public.contact_messages
  for insert with check (true);
drop policy if exists "contact_admin_read" on public.contact_messages;
create policy "contact_admin_read" on public.contact_messages
  for select using (public.is_admin());

-- platform settings: public read (for contact details & admin UPI info); admin writes
drop policy if exists "settings_auth_read" on public.platform_settings;
drop policy if exists "settings_public_read" on public.platform_settings;
create policy "settings_public_read" on public.platform_settings
  for select using (true);
drop policy if exists "settings_admin_update" on public.platform_settings;
create policy "settings_admin_update" on public.platform_settings
  for update using (public.is_admin());
drop policy if exists "settings_admin_insert" on public.platform_settings;
create policy "settings_admin_insert" on public.platform_settings
  for insert with check (public.is_admin());

-- ── 9. Storage: public 'portfolios' bucket for photos/QR codes ─
insert into storage.buckets (id, name, public)
values ('portfolios', 'portfolios', true)
on conflict (id) do nothing;

drop policy if exists "portfolios_public_read" on storage.objects;
create policy "portfolios_public_read" on storage.objects
  for select using (bucket_id = 'portfolios');
drop policy if exists "portfolios_auth_upload" on storage.objects;
create policy "portfolios_auth_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolios');
drop policy if exists "portfolios_owner_delete" on storage.objects;
create policy "portfolios_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolios' and owner = auth.uid());

-- ============================================================
-- AFTER RUNNING THIS FILE:
-- 1. Run seed.sql for starter styles.
-- 2. Sign up in the app with your email, then make yourself admin:
--      update public.profiles set role = 'admin'
--      where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');
-- ============================================================
