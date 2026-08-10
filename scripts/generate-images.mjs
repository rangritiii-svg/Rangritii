// Generates deterministic SVG artwork for the mehandi platform:
//  - artist profile images (stylised henna hand)
//  - portfolio pieces (mandala designs)
//  - style category art
// Run: node scripts/generate-images.mjs  (output: public/art/*.svg)
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "art");
mkdirSync(outDir, { recursive: true });

// Henna palettes: [skin, henna ink, deep ink, background, accent]
const PALETTES = [
  ["#e9bd93", "#7c3f14", "#54290b", "#fdf3e3", "#b3541e"],
  ["#dfae83", "#6d3512", "#4a220a", "#faeeda", "#a34a1a"],
  ["#f0c9a2", "#8a4a1a", "#5d2f0e", "#fdf6ec", "#c05f21"],
  ["#e3b48c", "#753a13", "#502709", "#fbf0e0", "#aa4f1c"],
  ["#ecc29b", "#804218", "#572c0c", "#fcf4e6", "#b85a20"],
  ["#dcaa7e", "#683211", "#452008", "#f9ecd6", "#9c4517"],
  ["#f2cda8", "#8f4e1c", "#603210", "#fdf7ee", "#c66524"],
  ["#e6b88f", "#783d15", "#52290b", "#fbf1e1", "#ad521d"],
];

// Simple deterministic PRNG so every run produces identical art
function rng(seed) {
  let s = seed * 2654435761 % 2147483647;
  return () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
}

function ring(cx, cy, r, count, draw) {
  let out = "";
  for (let i = 0; i < count; i++) {
    const a = (i * 2 * Math.PI) / count - Math.PI / 2;
    out += draw(cx + r * Math.cos(a), cy + r * Math.sin(a), (a * 180) / Math.PI + 90, i);
  }
  return out;
}

function petalRing(cx, cy, r, count, len, wid, color, opacity = 1) {
  return ring(cx, cy, r, count, (x, y, deg) =>
    `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${wid}" ry="${len}" fill="${color}" opacity="${opacity}" transform="rotate(${deg.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
}

function dotRing(cx, cy, r, count, size, color) {
  return ring(cx, cy, r, count, (x, y) =>
    `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size}" fill="${color}"/>`);
}

function mandala(cx, cy, scale, ink, deep, accent, rand) {
  const petals = [8, 10, 12][Math.floor(rand() * 3)];
  let g = "";
  g += `<circle cx="${cx}" cy="${cy}" r="${90 * scale}" fill="none" stroke="${ink}" stroke-width="${2.5 * scale}"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="${96 * scale}" fill="none" stroke="${ink}" stroke-width="${1.2 * scale}" stroke-dasharray="${4 * scale} ${5 * scale}"/>`;
  g += petalRing(cx, cy, 70 * scale, petals, 20 * scale, 8 * scale, ink);
  g += petalRing(cx, cy, 48 * scale, petals, 14 * scale, 6 * scale, accent, 0.85);
  g += dotRing(cx, cy, 84 * scale, petals * 2, 2.6 * scale, deep);
  g += dotRing(cx, cy, 32 * scale, 8, 2.4 * scale, deep);
  g += `<circle cx="${cx}" cy="${cy}" r="${16 * scale}" fill="${ink}"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="${7 * scale}" fill="${accent}"/>`;
  return g;
}

function vine(x, yTop, yBottom, ink, rand) {
  const mid = (yTop + yBottom) / 2;
  const sway = 10 + rand() * 8;
  let g = `<path d="M${x} ${yBottom} C ${x - sway} ${mid + 40}, ${x + sway} ${mid - 40}, ${x} ${yTop}" fill="none" stroke="${ink}" stroke-width="3"/>`;
  for (let y = yBottom - 18; y > yTop + 10; y -= 26) {
    const side = ((y / 26) | 0) % 2 === 0 ? 1 : -1;
    g += `<ellipse cx="${x + side * 9}" cy="${y}" rx="8" ry="4.5" fill="${ink}" transform="rotate(${side * 40} ${x + side * 9} ${y})"/>`;
  }
  return g;
}

/* ── Artist profile: stylised henna hand (600×800) ── */
function handSvg(idx) {
  const [skin, ink, deep, bg, accent] = PALETTES[idx - 1];
  const rand = rng(idx * 97 + 13);
  // finger geometry: [centerX, topY]
  const fingers = [
    [205, 240],
    [278, 195],
    [351, 210],
    [424, 265],
  ];
  let fingerShapes = "";
  let fingerDecor = "";
  for (const [fx, fy] of fingers) {
    fingerShapes += `<rect x="${fx - 31}" y="${fy}" width="62" height="${560 - fy}" rx="31" fill="${skin}"/>`;
    // henna fingertip cap + dot chain
    fingerDecor += `<rect x="${fx - 31}" y="${fy}" width="62" height="58" rx="31" fill="${ink}"/>`;
    fingerDecor += `<circle cx="${fx}" cy="${fy + 78}" r="5" fill="${deep}"/>`;
    fingerDecor += `<circle cx="${fx}" cy="${fy + 100}" r="3.4" fill="${ink}"/>`;
    fingerDecor += `<ellipse cx="${fx}" cy="${fy + 128}" rx="10" ry="5" fill="${accent}" opacity="0.9"/>`;
    fingerDecor += `<circle cx="${fx}" cy="${fy + 152}" r="3.4" fill="${ink}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
  <rect width="600" height="800" fill="${bg}"/>
  ${dotRing(300, 400, 360, 26, 3, ink)}
  <g>
    <!-- wrist & bangles -->
    <rect x="190" y="620" width="220" height="180" rx="40" fill="${skin}"/>
    <!-- thumb -->
    <g transform="rotate(38 205 560)">
      <rect x="112" y="430" width="60" height="230" rx="30" fill="${skin}"/>
    </g>
    ${fingerShapes}
    <!-- palm -->
    <ellipse cx="300" cy="510" rx="158" ry="165" fill="${skin}"/>
    ${fingerDecor}
    <!-- palm mandala -->
    ${mandala(300, 505, 0.95, ink, deep, accent, rand)}
    <!-- vine up the wrist to palm -->
    ${vine(300, 640, 700, ink, rand)}
    <!-- bangle bands -->
    <rect x="190" y="700" width="220" height="14" fill="${ink}"/>
    <rect x="190" y="726" width="220" height="7" fill="${accent}"/>
    ${dotRing(300, 760, 0, 1, 0, ink)}
    <g>${Array.from({ length: 9 }, (_, i) => `<circle cx="${215 + i * 22}" cy="752" r="4" fill="${deep}"/>`).join("")}</g>
  </g>
  <text x="300" y="55" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="${deep}" opacity="0.75" letter-spacing="6">RANGRITII</text>
</svg>`;
}

/* ── Portfolio piece: mandala composition (600×600) ── */
function portfolioSvg(artistIdx, pieceIdx) {
  const [, ink, deep, bg, accent] = PALETTES[artistIdx - 1];
  const rand = rng(artistIdx * 100 + pieceIdx * 7);
  const layouts = [
    () => mandala(300, 300, 2.1, ink, deep, accent, rand),
    () =>
      mandala(300, 300, 1.5, ink, deep, accent, rand) +
      mandala(120, 120, 0.7, accent, deep, ink, rand) +
      mandala(480, 480, 0.7, accent, deep, ink, rand),
    () =>
      mandala(300, 210, 1.3, ink, deep, accent, rand) +
      petalRing(300, 470, 60, 12, 26, 10, ink) +
      dotRing(300, 470, 90, 18, 3, deep) +
      `<circle cx="300" cy="470" r="24" fill="${accent}"/>`,
    () =>
      mandala(180, 300, 1.05, ink, deep, accent, rand) +
      mandala(430, 300, 1.05, deep, ink, accent, rand),
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="${bg}"/>
  <rect x="14" y="14" width="572" height="572" fill="none" stroke="${ink}" stroke-width="2" opacity="0.5"/>
  <rect x="24" y="24" width="552" height="552" fill="none" stroke="${ink}" stroke-width="1" stroke-dasharray="3 6" opacity="0.5"/>
  ${layouts[(pieceIdx - 1) % layouts.length]()}
</svg>`;
}

/* ── Style category art (600×600) ── */
const STYLES = [
  ["style-bridal", "Bridal", 1],
  ["style-arabic", "Arabic", 2],
  ["style-indo-arabic", "Indo-Arabic", 3],
  ["style-traditional", "Traditional", 4],
  ["style-minimal", "Minimal", 5],
  ["style-festive", "Festive", 6],
];

function styleSvg([file, label, idx]) {
  const [, ink, deep, bg, accent] = PALETTES[(idx * 2) % PALETTES.length];
  const rand = rng(idx * 31 + 5);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="${bg}"/>
  ${mandala(300, 260, 1.5, ink, deep, accent, rand)}
  ${dotRing(300, 260, 175, 20, 3, deep)}
  <text x="300" y="510" text-anchor="middle" font-family="Georgia, serif" font-size="52" font-style="italic" fill="${deep}">${label}</text>
  <rect x="200" y="540" width="200" height="3" fill="${accent}"/>
</svg>`;
}

for (let a = 1; a <= 8; a++) {
  writeFileSync(join(outDir, `artist-${a}-profile.svg`), handSvg(a));
  for (let p = 1; p <= 4; p++) {
    writeFileSync(join(outDir, `artist-${a}-p${p}.svg`), portfolioSvg(a, p));
  }
}
for (const s of STYLES) writeFileSync(join(outDir, `${s[0]}.svg`), styleSvg(s));
console.log("Wrote 8 profiles + 32 portfolio pieces + 6 style images to public/art/");
