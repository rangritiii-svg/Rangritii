/**
 * postexport-seo.js — runs after `npx expo export -p web` (see vercel.json).
 *
 * The expo-router static export emits an EMPTY react-helmet placeholder
 * `<title data-rh="true"></title>` on every page (per-screen <Head> titles are
 * only applied at runtime in the browser). Browsers and crawlers read the FIRST
 * <title> in the document, so without this step every page would present an
 * empty title to non-JS crawlers.
 *
 * This script fills that placeholder with the correct per-route title and
 * marks all /admin pages noindex. Idempotent — safe to run multiple times.
 */

const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "..", "dist");

const DEFAULT_TITLE = "RangRiti — Book Verified Mehndi Artists in Rajasthan | रंगरीति";

// route html file (relative to dist, posix slashes) → title
const TITLES = {
  "index.html": DEFAULT_TITLE,
  "onboarding.html": DEFAULT_TITLE,
  "auth/customer-login.html": "Customer Login & Sign Up — RangRiti | Book Mehndi Artists Online",
  "auth/artist-login.html": "Mehndi Artist Login — RangRiti | Grow Your Mehndi Business",
  "auth/artist-register.html": "Register as a Mehndi Artist — RangRiti | Free Artist Onboarding",
  "admin/login.html": "Admin Login — RangRiti",
  "admin/index.html": "Admin Dashboard — RangRiti",
};

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : full.endsWith(".html") ? [full] : [];
  });
}

if (!fs.existsSync(DIST)) {
  console.error("postexport-seo: dist/ not found — run `npx expo export -p web` first.");
  process.exit(1);
}

let patched = 0;
for (const file of walk(DIST)) {
  const rel = path.relative(DIST, file).split(path.sep).join("/");
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  const title = TITLES[rel] || DEFAULT_TITLE;
  html = html.replace(
    /<title data-rh="true"><\/title>/,
    `<title data-rh="true">${title}</title>`
  );

  // Keep every admin page out of search results (defense in depth on top of robots.txt)
  if (rel.startsWith("admin/") && !html.includes('name="robots" content="noindex')) {
    html = html.replace(
      /<meta name="robots"[^>]*\/?>/,
      '<meta name="robots" content="noindex, nofollow"/>'
    );
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    patched++;
    console.log(`postexport-seo: patched ${rel}`);
  }
}
console.log(`postexport-seo: done (${patched} file(s) updated).`);
