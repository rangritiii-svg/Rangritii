# RangRiti — Fixes Applied & Remaining Setup

_Last updated: 6 July 2026_

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

### 1. Login OTP is not real yet (security)
Today the "SMS OTP" is generated **on the phone** and shown on screen, so anyone can log in
as any number. This is fine for a demo but **not safe for real users**.

It was intentionally left in place for now because removing it without a real SMS provider
would lock users out. Real phone verification cannot run in this Expo *managed* app without
one of the two setups below — both need steps only you can do (Firebase console access and a
native build), so they could not be completed or tested from here.

**Recommended: Firebase Phone Authentication** (you already use Firebase).

Option A — Native build with `@react-native-firebase/auth` (most reliable for a real app):
1. In the [Firebase console](https://console.firebase.google.com) → Authentication →
   Sign-in method → enable **Phone**.
2. Add your app's **SHA-1 / SHA-256** fingerprints (Android) under Project Settings.
3. Install: `npx expo install @react-native-firebase/app @react-native-firebase/auth`
4. Switch to an EAS **development build** (this cannot run in Expo Go).
5. Replace the fake OTP in `app/auth/customer-login.tsx` and `app/auth/artist-login.tsx`:
   ```ts
   import auth from "@react-native-firebase/auth";
   // send code:
   const confirmation = await auth().signInWithPhoneNumber("+91" + phone);
   // verify code:
   await confirmation.confirm(otp);
   ```

Option B — Stay in Expo Go with the Firebase JS SDK + a reCAPTCHA verifier. This works but
relies on `expo-firebase-recaptcha`, which is unmaintained and not reliable on your current
SDK 54 / React 19 — **not recommended**.

Either way: **never send or display the code on the client**, and remove the on-screen
"tap to auto-fill" banner once real OTP is live.

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
