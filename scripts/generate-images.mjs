// Generates deterministic SVG artwork for products & categories.
// Run: node scripts/generate-images.mjs  (output: public/products/*.svg)
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "products");
mkdirSync(outDir, { recursive: true });

// [id, base colour, deep shade, accent, motif]
const PRODUCTS = [
  ["p-01", "#c2477c", "#8b1e3f", "#f4da93", "floral"],
  ["p-02", "#3b5aa0", "#22376b", "#e9e2d0", "diamond"],
  ["p-03", "#e08b2d", "#a85a12", "#fdf3dd", "floral"],
  ["p-04", "#d9d3e8", "#a99ec9", "#8b7bb5", "dots"],
  ["p-05", "#7a9c4c", "#4f6b2d", "#f4da93", "diamond"],
  ["p-06", "#c03a2b", "#8a2418", "#f4da93", "floral"],
  ["p-07", "#7fb3d5", "#4a7fa5", "#fdfbf7", "dots"],
  ["p-08", "#e8945f", "#b85e8a", "#fdf3dd", "stripes"],
  ["p-09", "#d8a7b1", "#a5657a", "#fdfbf7", "floral"],
  ["p-10", "#5b84b1", "#33567e", "#dce9f5", "dots"],
  ["p-11", "#e9b432", "#bc8112", "#fdf8ec", "floral"],
  ["p-12", "#5d4a7e", "#3a2c54", "#e3c9f0", "diamond"],
  ["p-13", "#d85a4a", "#a03426", "#fdeee2", "floral"],
  ["p-14", "#b9bcc4", "#84899a", "#f2f3f5", "dots"],
  ["p-15", "#1e6e5a", "#0e4a3a", "#f4da93", "diamond"],
  ["p-16", "#2c3a6e", "#1a2447", "#f4da93", "dots"],
  ["p-17", "#1a7f8e", "#0d5561", "#f4da93", "floral"],
  ["p-18", "#a87ca0", "#77507a", "#f6e9f4", "dots"],
];

const CATEGORIES = [
  ["cat-coord", "#c2477c", "#8b1e3f", "Co-ord Sets"],
  ["cat-kurta-sets", "#7a9c4c", "#4f6b2d", "Kurta Sets"],
  ["cat-kurtis", "#7fb3d5", "#33567e", "Kurtis"],
  ["cat-onepiece", "#e9b432", "#a85a12", "One Piece"],
  ["cat-plus", "#5d4a7e", "#3a2c54", "Plus Size"],
  ["cat-party", "#1e6e5a", "#0e4a3a", "Party Wear"],
];

function motifLayer(kind, accent) {
  if (kind === "floral") {
    const petals = [0, 60, 120, 180, 240, 300]
      .map((a) => `<ellipse cx="0" cy="-11" rx="4.5" ry="10" transform="rotate(${a})"/>`)
      .join("");
    return `<pattern id="motif" width="72" height="72" patternUnits="userSpaceOnUse">
      <g fill="${accent}" opacity="0.35" transform="translate(36,36)">${petals}<circle r="4"/></g>
    </pattern>`;
  }
  if (kind === "diamond") {
    return `<pattern id="motif" width="56" height="56" patternUnits="userSpaceOnUse">
      <g stroke="${accent}" stroke-width="1.6" fill="none" opacity="0.4">
        <path d="M28 6 L50 28 L28 50 L6 28 Z"/><circle cx="28" cy="28" r="4"/>
      </g>
    </pattern>`;
  }
  if (kind === "stripes") {
    return `<pattern id="motif" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect x="0" y="0" width="8" height="26" fill="${accent}" opacity="0.28"/>
    </pattern>`;
  }
  return `<pattern id="motif" width="34" height="34" patternUnits="userSpaceOnUse">
    <circle cx="17" cy="17" r="3.4" fill="${accent}" opacity="0.45"/>
  </pattern>`;
}

// Stylised kurta silhouette (600x800 canvas)
const KURTA =
  "M235,165 L155,335 L215,368 L235,315 L222,700 Q300,735 378,700 L365,315 L385,368 L445,335 L365,165 Z";

function productSvg([, base, deep, accent, motif]) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${base}"/><stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    ${motifLayer(motif, accent)}
    <clipPath id="kurta"><path d="${KURTA}"/></clipPath>
  </defs>
  <rect width="600" height="800" fill="url(#bg)"/>
  <rect width="600" height="800" fill="url(#motif)" opacity="0.5"/>
  <circle cx="300" cy="420" r="255" fill="#fdfbf7" opacity="0.16"/>
  <g>
    <path d="${KURTA}" fill="${deep}" stroke="${accent}" stroke-width="3" opacity="0.96"/>
    <rect width="600" height="800" clip-path="url(#kurta)" fill="url(#motif)"/>
    <path d="M270,165 Q300,228 330,165 Z" fill="${accent}" opacity="0.9"/>
    <line x1="300" y1="228" x2="300" y2="452" stroke="${accent}" stroke-width="2.5" opacity="0.8"/>
    <circle cx="300" cy="260" r="4" fill="${accent}"/><circle cx="300" cy="295" r="4" fill="${accent}"/>
    <circle cx="300" cy="330" r="4" fill="${accent}"/>
  </g>
  <text x="300" y="775" text-anchor="middle" font-family="Georgia, serif" font-size="26"
    fill="#fdfbf7" opacity="0.85" letter-spacing="6">RANGRITII</text>
</svg>`;
}

function categorySvg([, base, deep, label]) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${base}"/><stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    ${motifLayer("floral", "#fdfbf7")}
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <rect width="600" height="600" fill="url(#motif)" opacity="0.6"/>
  <circle cx="300" cy="300" r="190" fill="none" stroke="#fdfbf7" stroke-width="2" opacity="0.6"/>
  <circle cx="300" cy="300" r="170" fill="#fdfbf7" opacity="0.14"/>
  <text x="300" y="290" text-anchor="middle" font-family="Georgia, serif" font-size="52"
    fill="#fdfbf7" font-style="italic">${label.split(" ")[0]}</text>
  <text x="300" y="350" text-anchor="middle" font-family="Georgia, serif" font-size="52"
    fill="#fdfbf7" font-style="italic">${label.split(" ").slice(1).join(" ")}</text>
</svg>`;
}

for (const p of PRODUCTS) writeFileSync(join(outDir, `${p[0]}.svg`), productSvg(p));
for (const c of CATEGORIES) writeFileSync(join(outDir, `${c[0]}.svg`), categorySvg(c));
console.log(`Wrote ${PRODUCTS.length} product + ${CATEGORIES.length} category SVGs to public/products/`);
