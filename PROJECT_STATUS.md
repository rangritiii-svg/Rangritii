# RangRiti — Project Status

_Last updated: 9 August 2026 (after the "RangRiti 2.0" engagement)_
_Ye file isliye hai taaki koi bhi (ya AI assistant) folder kholte hi samajh jaye ki kya ho chuka hai aur kahan se shuru karna hai._

---

## 🏗️ Architecture (ek nazar me)

- **Ek hi Expo Router codebase** = Android app + website (react-native-web)
- **Website + API** ek saath Vercel par: project `rangritii-api` → https://rangritii-api.vercel.app, aur GitHub-connected deploy → **https://rangritii.vercel.app** (public URL, canonical)
- **`api/index.js` = poora backend** (Express serverless): email verify, SMS OTP (Fast2SMS/simulation, stateless HMAC tokens), admin auth
- **`server.js`** sirf local dev ke liye — `api/index.js` ko hi wrap karta hai
- **Database**: Firebase Firestore (project `rangritii`), JS SDK se direct client access
- **Auth quirk**: customers/artists Firebase Auth use NAHI karte — phone+password Firestore me (plaintext, known issue). Google login alag se hai (neeche dekho)
- **Design system "RangRiti 2.0"**: dark maroon `#1A0A0E`/`#4A1020` + gold `#C9932F` + cream `#FFF8F0` + blush `#FDEDF3`; tokens har screen me top par const ke roop me duplicated hain; reference = `app/onboarding.tsx`

## ✅ Kya-kya COMPLETE hai (Aug 8-9, 2026)

1. **Google Login (customers)** — web: Firebase `signInWithPopup`; Android: `@react-native-google-signin` native module. Web client ID `constants/googleAuth.ts` me wired. Firebase console me Google provider enabled, SHA-1 registered, authorized domains me dono vercel domains added. **Tested live — kaam karta hai.**
2. **Secure Admin Login** — purana Firestore passcode (public readable!) hata diya. Ab `/admin/login` screen → server-verified: `/api/admin/login|google|session` endpoints, HMAC session tokens. Credentials sirf Vercel env vars me: `ADMIN_EMAILS=rangritiii@gmail.com` (Google admin login) + `OTP_SECRET` set hain; `ADMIN_EMAIL`/`ADMIN_PASSWORD` NOT set (password login disabled, fails closed — ye intentional hai).
3. **Poora UI redesign** — landing (full marketing page: hero, styles gallery, how-it-works, FAQ, footer), saare auth screens, tabs, artist detail, booking, payment — sab RangRiti 2.0 language me, desktop-responsive, bilingual EN/हिंदी.
4. **Web map** — `components/ProximityMap.web.tsx` ab asli Leaflet + OpenStreetMap map hai (CDN se load hota hai, free, no API key). Artist pins + user location + click-to-select.
5. **Role policy** — customer ↔ artist mode switching BLOCKED (profile me info card hai). Same email se 2 alag accounts (1 customer + 1 artist) allowed — by design.
6. **APK v2.0.0** — built, signed (`android/app/debug.keystore`, SHA-1 `5e8f16...f625` — Firebase me registered), **public repo par released**: https://github.com/rangritiii-svg/RangRiti-app/releases/latest (main repo PRIVATE hai isliye alag public releases repo). Website ka "Download Android App" button yahi deta hai.
7. **SEO/GEO** — `app/+html.tsx` (JSON-LD, geo meta, OG tags), `public/robots.txt|sitemap.xml|llms.txt|manifest`, per-page titles (`scripts/postexport-seo.js` — Vercel build me chalti hai).

## ⚙️ Deploy / Build kaise karein

```bash
# Website + API production deploy (ya bas git push — GitHub auto-deploy bhi hai)
npx vercel --prod

# Local website check
npm run typecheck && npx expo export -p web && node scripts/postexport-seo.js

# Android APK
cd android && ./gradlew.bat assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# Nayi APK release (website button isi se latest uthata hai)
gh release create vX.Y.Z <apk-file> --repo rangritiii-svg/RangRiti-app --title "..." --notes "..."
```

- `vercel.json` me **legacy `builds`+`routes`** hai — naya CLI Express auto-detect karke tod deta hai, ise mat hatana
- `.vercelignore` android/ ko exclude karta hai (parallel gradle build ke saath EBUSY fix)
- `android/local.properties` me SDK path hai (gitignored, machine-specific)

## ⚠️ PENDING — yahan se shuru karo

1. **🔴 Firestore security rules deploy karna** (SABSE ZAROORI): `firestore.rules` me stage-1 hardening committed hai par **Firebase par deploy NAHI hua**. Rules deploy karne se pehle `/api/admin/settings` endpoint chahiye (admin settings writes API se hongi kyunki rules `settings/*` writes lock kar denge) — ye endpoint abhi EXISTS NAHI. Poora plan `firestore.rules` ke comments me likha hai. Abhi bhi DB wide-open hai (koi bhi admin UPI overwrite kar sakta hai = payment hijack risk).
2. **FAST2SMS_API_KEY** Vercel me set nahi — SMS OTP simulation mode me hai (code alert me dikhta hai)
3. Artist flow me Google login nahi hai (sirf customer me hai) — chahiye to `utils/googleAuth.ts` reuse karo
4. Customer/artist passwords Firestore me plaintext hain — Firebase Auth migration ya server-side hashing (stage-2, rules wale plan me covered)
5. Custom domain (e.g. rangriti.in) lena ho to: `app/+html.tsx` ka SITE_URL + `public/*` ke URLs + Firebase authorized domains update karna

## 🔑 Accounts / Console state

- **Firebase project**: `rangritii` (owner: rangritiii@gmail.com) — Google provider ON, support email set, public-facing name "RangRiti"
- **Vercel**: account `rangritiii-5130`, project `rangritii-api` (CLI linked); env vars: `ADMIN_EMAILS`, `OTP_SECRET`
- **GitHub**: `rangritiii-svg/Rangritii` (PRIVATE, source) + `rangritiii-svg/RangRiti-app` (PUBLIC, sirf APK releases)
- Detailed setup history: `FIXES_AND_NOTES.md`
