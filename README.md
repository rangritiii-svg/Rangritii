# Rangritii — Mehandi Artists ↔ Customers

**Mehandi ka rang, aapki kahaani.** A platform that connects mehandi (henna) artists with customers — browse real portfolios, filter by city & style, and book your date online. Artists register free, get a professional profile page, and receive bookings with zero commission.

Built with **Next.js 15 · React 19 · Tailwind CSS 4 · Supabase · Vercel** — website + installable mobile app (PWA) from one codebase.

## ✨ Features

**For customers**
- Browse verified artists with real portfolio galleries
- Filter by **city**, **style** (Bridal, Arabic, Indo-Arabic, Traditional, Minimal, Festive) and search
- Artist profile pages: portfolio, experience, price range, WhatsApp contact
- **Free booking requests** — event date, occasion, address; no advance payment
- Save favourite artists (♥) to compare later
- Account with booking history
- Installable as a mobile app (PWA)

**For artists**
- Free self-registration (`/join`): profile + portfolio photo uploads (Supabase Storage)
- Profile goes live after admin approval — verified badge
- Edit profile anytime from `/account`; see incoming booking requests with customer contact
- Zero commission — payment directly from customer

**Admin panel** (`/admin`)
- Dashboard: artists, pending approvals, bookings at a glance
- Approve/unapprove artist profiles (one click), full artist CRUD
- Manage all bookings with status updates (pending → confirmed → completed)
- Manage style categories

**Two modes**
- **Demo mode** (no env vars): runs instantly with 8 sample artists in-memory — great for previews.
- **Supabase mode**: full persistence, auth, artist signup, photo uploads, RLS security.

## 🚀 Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

**Demo admin login** (`/admin/login`, demo mode): `admin@rangritii.com` / `rangritii123`

## 🗄️ Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → run [`supabase/schema.sql`](supabase/schema.sql), then [`supabase/seed.sql`](supabase/seed.sql).
   (schema.sql also creates the public `portfolios` storage bucket for photo uploads, and safely removes the earlier e-commerce tables if they exist. Want sample artists for testing? Optionally run [`supabase/sample-artists.sql`](supabase/sample-artists.sql) — remove later with `delete from public.artists;`)
3. `.env.local` (and Vercel → Environment Variables):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ…
   ```
4. Sign up in the app, then make yourself admin (SQL Editor):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'YOUR_EMAIL');
   ```
5. Log in at `/admin/login`. Done.

**Tip:** In Supabase → Authentication → Sign In / Up → Email, you can turn OFF
"Confirm email" so artists/customers can log in immediately after signup.

## ▲ Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → import the `Rangritii` GitHub repo.
2. Add the two Supabase env vars → **Deploy**.
3. Connect your custom domain from the Vercel dashboard whenever ready.

## 📱 Mobile app

Full PWA: Android Chrome shows an "Install app" prompt; on iPhone use Share →
**Add to Home Screen**. Launches full-screen with its own icon.

## 🧰 Project structure

```
src/
  app/
    (store)/            # public site: home, artists, artist/[slug], book/[slug],
                        # join, saved, account, about, contact, policies
    admin/              # admin login + protected panel (artists, bookings, styles)
  components/           # UI (Header, ArtistCard, BookingForm, ImageListInput, …)
  lib/
    data.ts             # artists & styles — Supabase OR in-memory demo store
    bookings.ts         # booking creation & management
    admin-auth.ts       # two-mode admin authentication
  middleware.ts         # session refresh + /admin protection
supabase/
  schema.sql            # tables, RLS, place_booking(), storage bucket
  seed.sql              # 6 style categories (required)
  sample-artists.sql    # OPTIONAL sample artists for testing only
scripts/
  generate-images.mjs   # regenerates the henna-art SVGs (hands, mandalas)
  generate-icons.mjs    # regenerates PWA PNG icons
```

## 🔒 Security notes

- Bookings are created only via a `SECURITY DEFINER` SQL function that validates
  the artist server-side; customers/artists see only their own bookings (RLS).
- Artist self-signup can never self-approve: a DB trigger blocks non-admins from
  changing `is_approved`, `is_active`, `slug`, or `user_id`.
- Admin mutations verify the session server-side on every action.
- The demo admin cookie is HMAC-signed and HTTP-only.
