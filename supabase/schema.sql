-- ============================================================
-- Rangritii (Mehandi Platform) — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query.
-- Then run seed.sql to load the starter styles & artists.
-- Safe to run on a fresh project OR on top of the earlier
-- e-commerce schema (it cleans that up first).
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
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
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
  is_approved boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

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

-- ── 4. Bookings ─────────────────────────────────────────────
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
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists bookings_artist_idx on public.bookings (artist_id);
create index if not exists bookings_user_idx on public.bookings (user_id);

-- ── 5. Contact messages ─────────────────────────────────────
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ── 6. Booking RPC ──────────────────────────────────────────
-- Validates the artist server-side and inserts atomically.
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

-- ── 7. Row Level Security ───────────────────────────────────
alter table public.profiles enable row level security;
alter table public.styles enable row level security;
alter table public.artists enable row level security;
alter table public.bookings enable row level security;
alter table public.contact_messages enable row level security;

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

-- bookings: created only via place_booking(); visible to customer, artist & admins
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

-- contact messages: anyone can write, only admins read
drop policy if exists "contact_insert" on public.contact_messages;
create policy "contact_insert" on public.contact_messages
  for insert with check (true);
drop policy if exists "contact_admin_read" on public.contact_messages;
create policy "contact_admin_read" on public.contact_messages
  for select using (public.is_admin());

-- ── 8. Storage: public 'portfolios' bucket for artist photos ─
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
-- 1. Run seed.sql for starter styles & artists.
-- 2. Sign up in the app with your email, then make yourself admin:
--      update public.profiles set role = 'admin'
--      where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');
-- ============================================================
