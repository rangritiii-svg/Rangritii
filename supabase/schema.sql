-- ============================================================
-- Rangritii — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query.
-- Then run seed.sql to load the starter catalogue.
-- ============================================================

-- ── Profiles (linked to Supabase Auth users) ────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile whenever someone signs up
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

-- ── Categories ──────────────────────────────────────────────
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ── Products ────────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  category_slug text not null references public.categories (slug) on update cascade,
  images text[] not null default '{}',
  sizes text[] not null default '{}',
  fabric text not null default '',
  stock int not null default 0 check (stock >= 0),
  is_new boolean not null default false,
  is_bestseller boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_slug);
create index if not exists products_active_idx on public.products (is_active);

-- ── Orders ──────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  payment_method text not null default 'cod',
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(10,2) not null,
  shipping_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  price numeric(10,2) not null,
  size text not null default '',
  quantity int not null check (quantity between 1 and 10),
  image text not null default ''
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ── Contact messages ────────────────────────────────────────
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ── Checkout RPC ────────────────────────────────────────────
-- Validates products, computes totals from DB prices (tamper-proof),
-- decrements stock, and inserts order + items atomically.
create or replace function public.place_order(customer jsonb, items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_subtotal numeric := 0;
  v_shipping numeric;
  item jsonb;
  v_product record;
  v_qty int;
begin
  if items is null or jsonb_array_length(items) = 0 then
    raise exception 'Cart is empty';
  end if;
  if jsonb_array_length(items) > 30 then
    raise exception 'Too many items';
  end if;

  for item in select * from jsonb_array_elements(items) loop
    v_qty := greatest(1, least(10, coalesce((item ->> 'quantity')::int, 1)));
    select id, name, price, images into v_product
      from public.products
      where id = (item ->> 'product_id')::uuid and is_active;
    if not found then
      raise exception 'A product in your cart is no longer available';
    end if;
    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  v_shipping := case when v_subtotal >= 999 then 0 else 79 end;
  v_order_number := 'RT-' || upper(to_hex((extract(epoch from now()) * 1000)::bigint))
    || lpad(floor(random() * 100)::text, 2, '0');

  insert into public.orders (
    id, order_number, customer_name, email, phone, address, city, state, pincode,
    payment_method, status, subtotal, shipping_fee, total, user_id
  ) values (
    v_order_id, v_order_number,
    customer ->> 'customer_name', customer ->> 'email', customer ->> 'phone',
    customer ->> 'address', customer ->> 'city', customer ->> 'state', customer ->> 'pincode',
    'cod', 'pending', v_subtotal, v_shipping, v_subtotal + v_shipping, auth.uid()
  );

  for item in select * from jsonb_array_elements(items) loop
    v_qty := greatest(1, least(10, coalesce((item ->> 'quantity')::int, 1)));
    select id, name, price, images into v_product
      from public.products where id = (item ->> 'product_id')::uuid;
    insert into public.order_items (order_id, product_id, product_name, price, size, quantity, image)
    values (
      v_order_id, v_product.id, v_product.name, v_product.price,
      coalesce(item ->> 'size', ''), v_qty,
      coalesce(v_product.images[1], '')
    );
    update public.products
      set stock = greatest(0, stock - v_qty)
      where id = v_product.id;
  end loop;

  return jsonb_build_object(
    'order_number', v_order_number,
    'total', v_subtotal + v_shipping
  );
end;
$$;

revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;

-- ── Row Level Security ──────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.contact_messages enable row level security;

-- profiles: read own (admins read all); update own, but never the role column
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- categories: public read, admin write
create policy "categories_public_read" on public.categories
  for select using (true);
create policy "categories_admin_insert" on public.categories
  for insert with check (public.is_admin());
create policy "categories_admin_update" on public.categories
  for update using (public.is_admin());
create policy "categories_admin_delete" on public.categories
  for delete using (public.is_admin());

-- products: everyone sees active products, admins see & manage all
create policy "products_read" on public.products
  for select using (is_active = true or public.is_admin());
create policy "products_admin_insert" on public.products
  for insert with check (public.is_admin());
create policy "products_admin_update" on public.products
  for update using (public.is_admin());
create policy "products_admin_delete" on public.products
  for delete using (public.is_admin());

-- orders: created only via place_order(); visible to owner & admins
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin());

-- order_items: visible with their order
create policy "order_items_select" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- contact messages: anyone can write, only admins can read
create policy "contact_insert" on public.contact_messages
  for insert with check (true);
create policy "contact_admin_read" on public.contact_messages
  for select using (public.is_admin());

-- ============================================================
-- AFTER RUNNING THIS FILE:
-- 1. Run seed.sql for the starter catalogue.
-- 2. Sign up in the app with your email, then make yourself admin:
--      update public.profiles set role = 'admin'
--      where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');
-- ============================================================
