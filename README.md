# Rangritii — Ethnic Wear Store

A completely new, modern e-commerce website + installable mobile app (PWA) for **Rangritii** — stylish cotton kurtis, co-ord sets, kurta sets & party wear.

Built with **Next.js 15 · React 19 · Tailwind CSS 4 · Supabase · Vercel**.

## ✨ Features

**Storefront**
- Home page with hero, categories, new arrivals, bestsellers & promo sections
- Shop with category filters, search, and price sorting
- Product pages with size selection, quantity, discount badges & related products
- Cart + Wishlist (saved on the device, survives refreshes)
- Checkout with Cash on Delivery, free shipping above ₹999
- Customer accounts with order history (when Supabase is connected)
- Contact form, About, Size guide, all policy pages, WhatsApp chat button
- **Installable as a mobile app** (PWA — "Add to Home Screen" on any phone)

**Admin panel** (`/admin`)
- Secure login (demo mode or Supabase auth with an `admin` role)
- Dashboard: revenue, orders, pending count, product count, recent orders
- Products: create / edit / delete, stock, pricing, discounts, visibility flags
- Orders: full details, customer contact links, one-click status updates
- Categories: add / delete

**Two modes, zero friction**
- **Demo mode** (no setup): runs instantly with 18 sample products, an in-memory
  order store and a demo admin login. Perfect for previewing.
- **Supabase mode**: set 2 env vars and everything persists in Postgres with
  Row-Level Security, tamper-proof checkout (prices computed in the database),
  and real customer auth.

## 🚀 Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the store runs in **demo mode** immediately.

**Demo admin login** (`/admin/login`):
- Email: `admin@rangritii.com`
- Password: `rangritii123`

(Override with `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` env vars.)

## 🗄️ Connect Supabase (5 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard open **SQL Editor** and run, in order:
   - [`supabase/schema.sql`](supabase/schema.sql) — tables, RLS policies, checkout function
   - [`supabase/seed.sql`](supabase/seed.sql) — starter catalogue (18 products, 6 categories)
3. Copy `.env.example` to `.env.local` and fill in from
   **Project Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ…
   ```
4. Restart the dev server. Sign up on `/account` with your email, then make
   yourself admin (SQL Editor):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'YOUR_EMAIL');
   ```
5. Log in at `/admin/login` with that account. Done — everything now persists.

**Product photos:** upload images to Supabase **Storage** (create a public
bucket, e.g. `products`), copy each image's public URL, and paste it in the
admin product form (one URL per line). The bundled SVG artwork works as
placeholders until then.

## ▲ Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the
   `rangritii` GitHub repository (log in with GitHub).
2. Framework is auto-detected (Next.js) — no settings needed.
3. (Optional but recommended) Add the two Supabase environment variables under
   **Environment Variables** before clicking Deploy.
4. Click **Deploy**. Your store is live on a `*.vercel.app` URL — connect a
   custom domain (e.g. `rangritii.com`) from the Vercel dashboard whenever
   you're ready.

Without the env vars the deployed site runs in demo mode (fine for previewing;
demo orders reset on redeploy). Add the env vars + redeploy to go live for real.

## 📱 The mobile app

The site is a full PWA: on Android (Chrome) visitors get an "Install app"
prompt; on iPhone use Share → **Add to Home Screen**. It launches full-screen
with its own icon and caches assets for speed.

## 🧰 Project structure

```
src/
  app/
    (store)/          # customer-facing pages (home, shop, product, cart, …)
    admin/            # admin login + protected panel
    layout.tsx        # fonts, providers, PWA metadata
  components/         # UI components (Header, ProductCard, CartProvider, …)
  lib/
    data.ts           # unified data layer — Supabase OR demo store
    orders.ts         # order creation & management
    admin-auth.ts     # two-mode admin authentication
    supabase/         # Supabase server/browser clients
  middleware.ts       # session refresh + /admin route protection
supabase/
  schema.sql          # tables, RLS, place_order() checkout function
  seed.sql            # starter catalogue
scripts/
  generate-images.mjs # regenerates product/category SVG artwork
  generate-icons.mjs  # regenerates PWA PNG icons (pure Node, no deps)
```

## 🔒 Security notes

- All admin mutations verify the session server-side (not just middleware).
- In Supabase mode, checkout totals are computed **inside Postgres** from real
  product prices — the client can never tamper with amounts.
- Row-Level Security: customers see only their own orders; only admins can
  write products/categories or read contact messages.
- The demo admin cookie is HMAC-signed and HTTP-only.
