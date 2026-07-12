# RangRiti — Fixes Applied & Remaining Setup

_Last updated: 11 July 2026_

---

## 🆕 11 July 2026 — OTP reliability, Rajasthan districts, geo-tagging & permissions

### 1. SMS OTP now works reliably on Vercel (critical bug fixed)
The backend stored OTPs in an **in-memory `Map`**. Vercel serverless functions are
stateless, so the instance that handled `/api/otp/send` was often not the one that
handled `/api/otp/verify` — real OTPs failed randomly. It is now a **stateless signed
token** (HMAC): the server sends the code by SMS and returns a signed token binding
`phone + code + expiry`; verification recomputes the HMAC. No database required.
_(`api/index.js`, `firebase/authService.ts`)_

- **Action:** In the Vercel dashboard add env var `OTP_SECRET` = _(any long random string)_
  and redeploy. Also add `FAST2SMS_API_KEY` for real SMS (without it, the API stays in
  free **simulation mode** and shows the code on-screen). Test number `9999999999` still
  accepts `123456`.
- **Cost:** Fast2SMS "OTP route" is DLT-exempt and among the cheapest for India
  (~₹0.20–0.30 per SMS, no monthly fee). Alternatives if needed: MSG91, Twilio (free trial).

### 2. All 41 Rajasthan districts added
The state/city lists (previously 6 Rajasthan cities, duplicated in two files) are now in
one shared file listing **all 41 official Rajasthan districts (2025)**.
_(`constants/locations.ts`, used by `customer-login.tsx` & `artist-register.tsx`)_

### 3. Geo-tagged location for artists & customers
- Artist registration → **Location** step has a "Capture Current Location (GPS)" button that
  records the artist's real latitude/longitude (previously fake random coordinates).
  _(`app/auth/artist-register.tsx`, `utils/permissions.ts`, `context/AppContext.tsx`)_
- Customer **Sign Up** has an optional "Capture Current Location (GPS)" button; the
  coordinates are saved on the customer record and the signed-in profile (groundwork for
  "artists near me"). _(`app/auth/customer-login.tsx`)_
- Artists can re-tag anytime: Profile → **"Update My Location (GPS)"** captures fresh GPS
  coordinates and saves them to their artist profile in Firestore.
  _(`app/(tabs)/profile.tsx`)_

### 4. Runtime permissions (ask first, then proceed)
A shared helper requests the right permission **before** opening the gallery / camera / GPS,
and guides the user to Settings if it was permanently denied. Applied to every image upload
(portfolio, ID, bank, UPI QR, admin QR) and to location.
_(`utils/permissions.ts`; `app.json` permission strings; `AndroidManifest.xml`)_

- **Action:** `expo-location` is a new native module — rebuild the dev client / APK
  (`npx expo run:android` or an EAS build) so the native code is included.

### 5. The Website 🌐 (same model, same live database)
The app now exports as a full static website (Expo web) and deploys to the **same Vercel
project** as the API — one deployment serves both. The website has every feature of the
app (browse artists, OTP login, booking, artist dashboard, admin) backed by the same
Firestore data in real time.

**Web-specific fixes made:**
- `Alert.alert` is a silent no-op on react-native-web — every confirmation/validation
  dialog (including "Registration submitted → Got it!" which navigates home) did nothing
  on web. Patched with a browser-native alert/confirm shim. _(`utils/webAlert.ts`)_
- Deep links to `/auth/...` bounced back to onboarding because the root layout redirected
  every logged-out visitor unconditionally. Auth pages are now reachable by URL.
  _(`app/_layout.tsx`)_
- Added SEO/social meta tags (title, description, WhatsApp/OG preview image) via the
  custom HTML shell. _(`app/+html.tsx`, `public/og-image.png`)_
- `app.json` → `web.output: "static"`; `vercel.json` now builds the site
  (`npx expo export -p web` → `dist/`) and routes `/api/*` to the Express serverless
  function, everything else to the static site (with SPA fallback).

**To deploy (from the project folder):**
```
npx vercel --prod
```
This single deploy publishes the website AND the updated OTP API together (important:
the new signed-OTP client requires the new API — they ship in the same deployment, so
nothing can get out of sync). Then set the env vars `OTP_SECRET` and `FAST2SMS_API_KEY`
in the Vercel dashboard if not already done.

**Local preview:** `npx expo export -p web && npx serve dist -l 4173` → http://localhost:4173

---

This document explains what was corrected in the app, and the few items that need a
decision or an external account before the app is fully production-ready.

---

## ✅ Bugs fixed in this pass

These were real defects that broke core flows. All are now corrected in the codebase.

### Data & sync (the marketplace now actually works across devices)
- **Bookings never loaded from the cloud.** The real-time Firestore listeners existed but
  were never switched on, so an artist or the admin saw *none* of the booking requests
  customers sent. The app now subscribes to bookings in real time, scoped by role
  (customer → their own, artist → theirs, admin → all). _(`context/AppContext.tsx`)_
- **New artists were saved only on the device.** Registration never wrote to Firestore, so
  a new artist never reached the admin approval queue and was invisible to customers on
  other phones. Registration now saves to Firestore. _(`context/AppContext.tsx`)_
- **Artists list is now live.** Admin approvals / blocks propagate in real time via a
  Firestore subscription. _(`context/AppContext.tsx`)_
- **Cancellations, disputes and artist "strikes" were lost on restart** (written only to
  local storage). They now persist to Firestore so the other party and the admin see them.
  _(`context/AppContext.tsx`)_

### Privacy
- **Every user could see every other user's bookings.** A leftover `|| true` disabled the
  filter, exposing names, phone numbers and occasions. Bookings are now correctly scoped to
  the signed-in user. _(`app/(tabs)/bookings.tsx`)_

### Data that was silently dropped
- **Bank account number & IFSC were discarded** on save (only the photo was kept) — so
  artists could not actually be paid. Now all fields are saved. _(`app/artist/bank.tsx`)_
- **ID type & ID number were discarded** on save (only the photo was kept). Now saved.
  _(`app/artist/documents.tsx`)_
- **Rates screen** used a confusing triple-write (including an `updateArtistStatus` hack) to
  persist the hourly rate. Simplified to a single, reliable write. _(`app/artist/rates.tsx`)_

### Crashes / correctness
- **Cancellation refunds defaulted to the worst tier** because
  `new Date("2026-07-10 9:00 AM")` returns `Invalid Date` on phones (Hermes/iOS). Added a
  robust date parser. _(`utils/dateUtils.ts`, used in `AppContext.tsx` & `bookings.tsx`)_
- **`router.dismiss()` could crash** when a screen wasn't opened as a modal. All calls are
  now guarded with `router.canDismiss()`. _(`app/book/[artistid].tsx`, `app/payment/[bookingid].tsx`)_
- **Corrupted files.** `app/artist/rates.tsx` contained stray NUL bytes at the end of the
  file that break the TypeScript compiler. Removed.

### Chat is now real
- The old chat **faked replies** with random canned messages. Chat now persists messages to
  Firestore in real time (collection `chats/{conversationId}/messages`).
  _(`firebase/firestoreService.ts`, `context/AppContext.tsx`, `app/chat/[artistid].tsx`)_
  - Note: there is not yet an **artist-side chat inbox** screen, so replies from the artist
    require adding that screen (the data layer is ready for it).

---

## ⚠️ Needs your decision / an external account

### 1. Login OTP is now custom-built via Fast2SMS
Instead of Firebase Phone Auth (which requires a paid subscription), the app now routes OTP requests to your own Vercel backend API using **Fast2SMS**.

- **Endpoints:** `/api/otp/send` and `/api/otp/verify` are added to the Vercel API.
- **Client Service:** `firebase/authService.ts` calls these backend endpoints.
- **Test Bypass:** Standard testing number `+91 99999 99999` (or raw `9999999999`) bypasses the SMS provider and always accepts `123456`.

**Action Items:**
1. Sign up at [fast2sms.com](https://www.fast2sms.com) and copy your **API Key** from the developer dashboard.
2. In the **Vercel Project Dashboard**, add an environment variable:
   `FAST2SMS_API_KEY` = `<your_key>`
3. Redeploy your Vercel backend.
4. *Note:* If the key is not set, the API runs in **simulation mode** where it will print/alert you with the code (so testing is 100% free and easy).

### 2. Online payment is self-confirmed (no real gateway)
A customer taps "I paid" and the admin manually confirms — there is no gateway verifying the
money actually moved. For real transactions, integrate a gateway (e.g. **Razorpay** or
**PayU**) with a **server-side webhook** that flips the booking's payment status only after
the provider confirms. Your existing backend (`server.js` / `api/index.js`) is a good place
for the webhook.

### 3. Firestore Security Rules
Admin access is currently granted by a client-side passcode (default `000000`, changeable in
the admin dashboard). Before launch, set proper **Firestore Security Rules** so that, e.g.,
only the owning customer/artist can read their bookings and only admins can change settings.
A client passcode alone does not protect the database.

---

## How to verify the build on your machine
From the project folder:
```
npm install
npm run typecheck   # runs: tsc --noEmit  → should report no errors
npx expo start      # launch the app
```
`npm run typecheck` is the quickest way to confirm everything compiles cleanly.
