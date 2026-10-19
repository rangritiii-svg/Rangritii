# Status — October 2026 update

Done in this round (all typechecked, `npm run build` passes, flow tested in demo
mode and the SQL tested on Postgres 16):

1. **Token-first bookings** — packages → total → fixed token on Rangritii UPI →
   admin verifies → artist accepts/declines (auto-decline after the response
   window) → balance after service → net settlement. `supabase/token-flow-v3.sql`.
2. **Security fixes** (same SQL file):
   - any logged-in user could make themselves admin (`profiles.role` was self-editable)
   - artists could set their own payments "verified" / commission "settled" via the API
   - artist WhatsApp/UPI were readable by anyone via the API (contact gate bypass)
   - uploads had no size/type limit; search box could break the artist query
3. **Redesign** — mobile-first app shell (bottom tabs, sticky booking bar),
   new type (Rozha One + Hind, works for Hindi), photo-first artist cards,
   3-step booking form with price summary, new pay page with status.
   "Styles" menu now opens on tap (was hover-only → dead on phones).
4. **Admin artist review page** `/admin/artists/[id]` (was PROGRESS item 3).
5. **Android app** in `mobile/` + GitHub Actions workflow that builds the APK/AAB.

## To go live
1. Supabase → SQL Editor → run `supabase/token-flow-v3.sql` (project `frstwnyhajyxirfffqiw`).
   (`payment-flow-v2.sql` is no longer needed — v3 replaces those functions.)
2. Push to GitHub → Vercel deploys the site.
3. `/admin/settings` → set UPI ID + QR, token amount, response hours.
4. Ask artists to add their packages in `/account` (or add them in admin → edit artist).
5. GitHub → Actions → "Android APK" → Run workflow → download the APK.

## Known limits
- Google sign-in is hidden inside the Android app (Google blocks it in app WebViews); email login works.
- Expiry of unanswered requests runs whenever bookings are viewed — no cron needed,
  but an admin/artist/customer opening a page is what triggers it.
