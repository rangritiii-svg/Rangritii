# Rangritii — Mehandi Artists ↔ Customers

**Mehandi ka rang, aapki kahaani.** A platform that connects mehandi (henna) artists with customers — browse real portfolios, filter by city & style, and book your date online. Artists register free, get a professional profile page, and receive bookings with zero commission.

Built with **Next.js 15 · React 19 · Tailwind CSS 4 · Supabase · Vercel** — website + installable mobile app (PWA) from one codebase.

## ✨ Features

**For customers**
- Browse verified artists with real portfolio galleries; filter by city & style
- Pick the artist's **packages** (e.g. Bridal ×1, Guest ×3) — the total is shown before paying anything
- Pay a small fixed **token** on Rangritii's UPI QR (UTR recorded) — only then does the request reach the artist
- Artist accepts within the response window (default 24 h) → phone/WhatsApp unlock both ways
- Artist declines or doesn't answer → booking auto-declined, token marked for full refund
- Balance (total − token) paid after the mehandi: UPI to Rangritii or cash to the artist
- Save favourite artists, account with booking history, installable app

**For artists**
- Free self-registration (`/join`) with a packages & prices editor and portfolio uploads
- Profile goes live after admin approval — verified badge
- Accept / decline requests from `/account`, adjust the total, record cash
- Rangritii's commission is netted against the token it already holds

**Payments & settlement**
- Admin sets UPI ID + QR, **token amount**, **artist response time** and commission % in `/admin/settings`
- Admin verifies token UTRs (→ request sent to artist), sends refunds, verifies balance payments
- Net settlement: if the customer paid Rangritii, admin pays the artist out; if the artist collected
  the balance in cash, the artist pays admin (commission − token), all UTR-tracked

**Admin panel** (`/admin`)
- Dashboard: artists, pending approvals, bookings at a glance
- Approve/unapprove artist profiles (one click), full artist CRUD
- Manage all bookings: status, final amount, payment verification, settlements
- Payment settings (UPI/QR/commission) and style categories

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
2. SQL Editor → run [`supabase/schema.sql`](supabase/schema.sql), then [`supabase/seed.sql`](supabase/seed.sql),
   then [`supabase/token-flow-v3.sql`](supabase/token-flow-v3.sql) (token bookings + security fixes).
   **Existing database?** Just run `token-flow-v3.sql` once — it upgrades everything in place.
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

## 📱 Android app (APK)

`mobile/` is a Capacitor app that opens the live website full-screen, so every
website deploy updates the app instantly. It fixes the old APK's problems: proper
mobile layout (no desktop view), and WhatsApp / call / UPI links open the right app.

**Build it on GitHub (no Android Studio needed):**
1. Push this repo. GitHub → **Actions** → **Android APK** → **Run workflow**.
2. When it finishes, download **rangritii-android** from the run's *Artifacts*:
   `Rangritii-1.0.N.apk` (install on phones) and `.aab` (for the Play Store).

**Signing (do once, before sharing the app):** add these repo secrets
(Settings → Secrets and variables → Actions):
`RANGRITII_KEYSTORE_BASE64` (base64 of your `.jks`), `RANGRITII_KEYSTORE_PASSWORD`,
`RANGRITII_KEY_ALIAS` (`rangritii`). Without them the APK is signed with the
debug key — fine for testing, not for the Play Store. Keep the `.jks` safe: every
future update must be signed with the same key.

**Different website address?** Change `server.url` in `mobile/capacitor.config.json`
(or type it when running the workflow).

Phones without the app can still install the PWA: Chrome → menu → *Install app*.

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
