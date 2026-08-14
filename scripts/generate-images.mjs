// Generates deterministic SVG artwork for the mehandi platform:
//  - artist profile images (elegant henna hand, 600×800)
//  - portfolio pieces (mandala / peacock / paisley compositions, 600×600)
//  - style category art (distinct design per style, 600×600)
// Run: node scripts/generate-images.mjs  (output: public/art/*.svg)
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "art");
mkdirSync(outDir, { recursive: true });

// Henna palettes: [skin, ink, deep, bg, accent, gold]
const PALETTES = [
  ["#eec49c", "#6b3410", "#451f07", "#fdf4e6", "#b3541e", "#c9973f"],
  ["#e4b489", "#7a3d12", "#4e2508", "#faeeda", "#a34a1a", "#c08a37"],
  ["#f0c9a2", "#5d2f0e", "#3f1e07", "#fdf6ec", "#c05f21", "#d1a04a"],
  ["#e8bb92", "#6d2436", "#451422", "#fbf0e4", "#a83a52", "#c9973f"],
  ["#eec29b", "#804218", "#552a0c", "#fcf4e6", "#b85a20", "#cd9c42"],
  ["#deac80", "#5f2d10", "#3d1c07", "#f9ecd6", "#9c4517", "#bd8834"],
  ["#f2cda8", "#8f4e1c", "#603210", "#fdf7ee", "#c66524", "#d6a850"],
  ["#e6b88f", "#7c2b3d", "#521726", "#fbf1e1", "#b04258", "#cb9a41"],
];

// Simple deterministic PRNG so every run produces identical art
function rng(seed) {
  let s = (seed * 2654435761) % 2147483647;
  return () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
}

const F = (n) => Number(n.toFixed(1));

// Point on a circle. Angle in degrees, 0 = top, clockwise.
function pt(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [F(cx + r * Math.cos(a)), F(cy + r * Math.sin(a))];
}

// Repeat `draw(x, y, deg, i)` around a circle.
function ring(cx, cy, r, count, draw, startDeg = 0) {
  let out = "";
  for (let i = 0; i < count; i++) {
    const deg = startDeg + (i * 360) / count;
    const [x, y] = pt(cx, cy, r, deg);
    out += draw(x, y, deg, i);
  }
  return out;
}

/* ── Motif primitives ─────────────────────────────────────────── */

// Pointed lotus petal, base at origin, tip pointing up (-y). len/wid in px.
function petalPath(len, wid) {
  return `M0 0 C${F(-wid)} ${F(-len * 0.3)} ${F(-wid * 0.82)} ${F(-len * 0.78)} 0 ${F(-len)} C${F(wid * 0.82)} ${F(-len * 0.78)} ${F(wid)} ${F(-len * 0.3)} 0 0 Z`;
}

function lotusRing(cx, cy, r, count, len, wid, fill, opts = {}) {
  const { opacity = 1, startDeg = 0, inner } = opts;
  return ring(
    cx, cy, r, count,
    (x, y, deg) =>
      `<g transform="translate(${x} ${y}) rotate(${F(deg)})">` +
      `<path d="${petalPath(len, wid)}" fill="${fill}" opacity="${opacity}"/>` +
      (inner
        ? `<path d="${petalPath(len * 0.62, wid * 0.55)}" fill="${inner}" transform="translate(0 ${F(-len * 0.16)})"/>`
        : "") +
      `</g>`,
    startDeg
  );
}

function dotRing(cx, cy, r, count, size, color, startDeg = 0) {
  return ring(cx, cy, r, count, (x, y) => `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}"/>`, startDeg);
}

// Lace of outward-bulging arcs with a dot at each cusp.
function scallopRing(cx, cy, r, count, depth, stroke, w = 1.6, withDots = true) {
  let d = "";
  for (let i = 0; i < count; i++) {
    const a1 = (i * 360) / count;
    const a2 = ((i + 1) * 360) / count;
    const [x1, y1] = pt(cx, cy, r, a1);
    const [x2, y2] = pt(cx, cy, r, a2);
    const [mx, my] = pt(cx, cy, r + depth, (a1 + a2) / 2);
    d += `${i === 0 ? `M${x1} ${y1}` : ""} Q${mx} ${my} ${x2} ${y2} `;
  }
  let out = `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`;
  if (withDots) out += dotRing(cx, cy, r + depth + 4, count, 1.8, stroke, 180 / count);
  return out;
}

// Teardrops pointing outward from the ring.
function teardropRing(cx, cy, r, count, size, fill, startDeg = 0) {
  const drop = `M0 0 C${F(-size * 0.42)} ${F(-size * 0.35)} ${F(-size * 0.42)} ${F(-size * 0.75)} 0 ${F(-size)} C${F(size * 0.42)} ${F(-size * 0.75)} ${F(size * 0.42)} ${F(-size * 0.35)} 0 0 Z`;
  return ring(cx, cy, r, count, (x, y, deg) => `<g transform="translate(${x} ${y}) rotate(${F(deg)})"><path d="${drop}" fill="${fill}"/></g>`, startDeg);
}

// Small rose-flower: overlapping round petals + centre.
function flower(cx, cy, r, petals, fill, centerFill) {
  let g = ring(cx, cy, r * 0.62, petals, (x, y) => `<circle cx="${x}" cy="${y}" r="${F(r * 0.46)}" fill="${fill}"/>`);
  g += `<circle cx="${cx}" cy="${cy}" r="${F(r * 0.42)}" fill="${centerFill}"/>`;
  return g;
}

// The centrepiece: many-layered mandala. R = outer radius, nf = fold count.
function grandMandala(cx, cy, R, ink, deep, accent, bg, nf = 12, gold) {
  let g = "";
  g += `<circle cx="${cx}" cy="${cy}" r="${F(R)}" fill="none" stroke="${ink}" stroke-width="${F(R * 0.018)}"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="${F(R * 1.05)}" fill="none" stroke="${ink}" stroke-width="1" stroke-dasharray="${F(R * 0.03)} ${F(R * 0.045)}"/>`;
  g += dotRing(cx, cy, R * 0.955, nf * 3, R * 0.016, deep);
  g += scallopRing(cx, cy, R * 0.80, nf * 2, R * 0.10, ink, R * 0.014, false);
  g += dotRing(cx, cy, R * 0.905, nf * 2, R * 0.02, accent, 180 / (nf * 2));
  g += lotusRing(cx, cy, R * 0.44, nf, R * 0.34, R * 0.105, ink, { inner: bg });
  g += lotusRing(cx, cy, R * 0.40, nf, R * 0.24, R * 0.075, accent, { startDeg: 180 / nf, opacity: 0.95 });
  g += teardropRing(cx, cy, R * 0.63, nf, R * 0.09, gold || accent, 180 / nf);
  g += `<circle cx="${cx}" cy="${cy}" r="${F(R * 0.31)}" fill="none" stroke="${deep}" stroke-width="${F(R * 0.014)}"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="${F(R * 0.285)}" fill="${bg}" stroke="${ink}" stroke-width="${F(R * 0.01)}"/>`;
  g += lotusRing(cx, cy, R * 0.10, 8, R * 0.155, R * 0.055, ink);
  g += flower(cx, cy, R * 0.10, 6, accent, deep);
  g += `<circle cx="${cx}" cy="${cy}" r="${F(R * 0.028)}" fill="${bg}"/>`;
  return g;
}

// Classic paisley (ambi): fat teardrop + curled flame tip, nested outline, flower heart.
function paisley(cx, cy, s, ink, deep, accent, bg, rot = 0) {
  const drop = `M0 ${F(s)} C${F(-s * 0.85)} ${F(s * 0.9)} ${F(-s * 0.95)} ${F(-s * 0.1)} ${F(-s * 0.35)} ${F(-s * 0.62)} C${F(-s * 0.05)} ${F(-s * 0.85)} ${F(s * 0.35)} ${F(-s * 0.85)} ${F(s * 0.5)} ${F(-s * 0.5)} C${F(s * 0.72)} ${F(-s * 0.05)} ${F(s * 0.6)} ${F(s * 0.62)} 0 ${F(s)} Z`;
  const curl = `M${F(s * 0.18)} ${F(-s * 0.78)} C${F(s * 0.5)} ${F(-s * 1.05)} ${F(s * 0.95)} ${F(-s * 0.9)} ${F(s * 0.98)} ${F(-s * 0.5)} C${F(s * 0.85)} ${F(-s * 0.72)} ${F(s * 0.55)} ${F(-s * 0.82)} ${F(s * 0.34)} ${F(-s * 0.62)} Z`;
  const innerDrop = `M0 ${F(s * 0.78)} C${F(-s * 0.63)} ${F(s * 0.7)} ${F(-s * 0.72)} ${F(-s * 0.05)} ${F(-s * 0.26)} ${F(-s * 0.46)} C${F(-s * 0.02)} ${F(-s * 0.64)} ${F(s * 0.27)} ${F(-s * 0.64)} ${F(s * 0.38)} ${F(-s * 0.37)} C${F(s * 0.55)} ${F(-s * 0.02)} ${F(s * 0.46)} ${F(s * 0.48)} 0 ${F(s * 0.78)} Z`;
  let g = `<g transform="translate(${F(cx)} ${F(cy)}) rotate(${rot})">`;
  g += `<path d="${curl}" fill="${ink}"/>`;
  g += `<path d="${drop}" fill="${ink}"/>`;
  g += `<path d="${innerDrop}" fill="${bg}"/>`;
  g += `<circle cx="${F(-s * 0.02)}" cy="${F(s * 0.1)}" r="${F(s * 0.3)}" fill="none" stroke="${accent}" stroke-width="${F(s * 0.05)}"/>`;
  g += `<circle cx="${F(-s * 0.02)}" cy="${F(s * 0.1)}" r="${F(s * 0.15)}" fill="${accent}"/>`;
  g += `<circle cx="${F(-s * 0.02)}" cy="${F(s * 0.1)}" r="${F(s * 0.065)}" fill="${deep}"/>`;
  for (const [dx, dy] of [[-0.38, -0.1], [-0.22, -0.34], [0.06, -0.44], [0.28, -0.3]]) {
    g += `<circle cx="${F(s * dx)}" cy="${F(s * dy)}" r="${F(s * 0.045)}" fill="${deep}"/>`;
  }
  g += `</g>`;
  return g;
}

// Curving vine with alternating leaves and dot buds, from (x,y1) down to (x,y2).
function vine(x, y1, y2, ink, accent, sway = 16) {
  const mid = (y1 + y2) / 2;
  let g = `<path d="M${x} ${y2} C${F(x - sway)} ${F(mid + (y2 - y1) * 0.2)} ${F(x + sway)} ${F(mid - (y2 - y1) * 0.2)} ${x} ${y1}" fill="none" stroke="${ink}" stroke-width="2.6"/>`;
  const steps = Math.max(2, Math.floor((y2 - y1) / 30));
  for (let i = 1; i < steps; i++) {
    const y = y1 + ((y2 - y1) * i) / steps;
    const side = i % 2 === 0 ? 1 : -1;
    const lx = x + side * 12;
    g += `<g transform="translate(${F(lx)} ${F(y)}) rotate(${side * 52})"><path d="${petalPath(17, 6)}" fill="${ink}"/></g>`;
    g += `<circle cx="${F(x - side * 8)}" cy="${F(y + 8)}" r="2.6" fill="${accent}"/>`;
  }
  return g;
}

// Quarter-lace flourish for canvas corners. corner: [cx, cy] placed at a canvas corner.
function cornerLace(cx, cy, R, ink, accent, deep) {
  let g = "";
  g += `<circle cx="${cx}" cy="${cy}" r="${F(R)}" fill="none" stroke="${ink}" stroke-width="1.4" opacity="0.55"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="${F(R * 0.86)}" fill="none" stroke="${ink}" stroke-width="1" stroke-dasharray="3 6" opacity="0.55"/>`;
  g += lotusRing(cx, cy, R * 0.52, 18, R * 0.22, R * 0.055, ink, { opacity: 0.5 });
  g += dotRing(cx, cy, R * 0.95, 30, 1.6, accent, 6);
  g += dotRing(cx, cy, R * 0.70, 22, 1.4, deep, 0);
  return g;
}

// Double frame + margin dots.
function frame(w, h, ink, opacity = 0.5) {
  return (
    `<rect x="13" y="13" width="${w - 26}" height="${h - 26}" fill="none" stroke="${ink}" stroke-width="1.8" opacity="${opacity}"/>` +
    `<rect x="21" y="21" width="${w - 42}" height="${h - 42}" fill="none" stroke="${ink}" stroke-width="0.8" stroke-dasharray="2 5" opacity="${opacity}"/>`
  );
}

function defsGlow(id, color) {
  return `<defs><radialGradient id="${id}"><stop offset="0%" stop-color="${color}" stop-opacity="0.34"/><stop offset="70%" stop-color="${color}" stop-opacity="0.10"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>`;
}

/* ── Henna hand (600×800 artist profile) ──────────────────────── */

// Tapered finger capsule pointing up from origin. Returns [shapePath, decor].
function finger(L, wb, wt, ink, deep, accent, bg) {
  const shape =
    `M${-wb} 0 C${-wb} ${F(-L * 0.42)} ${-wt} ${F(-L * 0.58)} ${-wt} ${F(-(L - wt))}` +
    ` A${wt} ${wt} 0 0 1 ${wt} ${F(-(L - wt))}` +
    ` C${wt} ${F(-L * 0.58)} ${wb} ${F(-L * 0.42)} ${wb} 0 Z`;
  const capY = -(L - wt);
  const wIn = wt - 1.5;
  let decor = "";
  // dipped fingertip
  decor += `<path d="M${-wIn} ${F(capY)} A${wIn} ${wIn} 0 0 1 ${wIn} ${F(capY)} L${wIn} ${F(capY + wt + 16)} L${-wIn} ${F(capY + wt + 16)} Z" fill="${ink}"/>`;
  decor += `<circle cx="0" cy="${F(capY - wt * 0.1)}" r="2.6" fill="${bg}" opacity="0.9"/>`;
  // ring bands below the cap
  decor += `<rect x="${-wIn}" y="${F(capY + wt + 24)}" width="${wIn * 2}" height="5" rx="2.5" fill="${accent}"/>`;
  decor += `<rect x="${-wIn}" y="${F(capY + wt + 33)}" width="${wIn * 2}" height="2.6" rx="1.3" fill="${deep}"/>`;
  // dot ladder + leaf at the knuckle
  decor += `<circle cx="0" cy="${F(capY + wt + 48)}" r="3" fill="${deep}"/>`;
  decor += `<circle cx="0" cy="${F(capY + wt + 62)}" r="2.2" fill="${ink}"/>`;
  decor += `<g transform="translate(0 ${F(capY + wt + 92)})"><path d="${petalPath(20, 7)}" fill="${ink}"/></g>`;
  decor += `<circle cx="0" cy="${F(capY + wt + 104)}" r="2.2" fill="${accent}"/>`;
  return [shape, decor];
}

function handSvg(idx) {
  const [skin, ink, deep, bg, accent, gold] = PALETTES[idx - 1];
  const rand = rng(idx * 97 + 13);
  const nf = [10, 12, 14][Math.floor(rand() * 3)];

  // fingers: [baseX, baseY, angleDeg, length, halfWidthBase, halfWidthTip]
  const fingerSpec = [
    [228, 472, -7.5, 262, 29, 23.5],
    [297, 462, -1, 296, 30, 24.5],
    [363, 468, 5.5, 270, 28, 22.5],
    [421, 492, 13, 212, 24, 19],
  ];
  let fingerShapes = "";
  let fingerDecor = "";
  for (const [bx, by, ang, L, wb, wt] of fingerSpec) {
    const [shape, decor] = finger(L, wb, wt, ink, deep, accent, bg);
    fingerShapes += `<g transform="translate(${bx} ${by}) rotate(${ang})"><path d="${shape}" fill="url(#skin${idx})"/></g>`;
    fingerDecor += `<g transform="translate(${bx} ${by}) rotate(${ang})">${decor}</g>`;
  }
  // thumb
  const [tShape, tDecor] = finger(205, 26, 20.5, ink, deep, accent, bg);
  const thumb = `<g transform="translate(203 592) rotate(-32)"><path d="${tShape}" fill="url(#skin${idx})"/></g>`;
  const thumbDecor = `<g transform="translate(203 592) rotate(-32)">${tDecor}</g>`;

  const palm =
    `M178 484 C210 442 268 424 310 426 C362 424 424 446 450 488` +
    ` C470 524 468 590 450 628 C422 676 358 696 306 694` +
    ` C252 696 198 668 178 622 C160 582 160 518 178 484 Z`;
  const wrist = `M226 660 C260 688 360 688 396 660 L404 800 L218 800 Z`;

  // wrist cuff + hanging drops + bangles
  let cuff = "";
  cuff += `<path d="M222 700 L400 700 L401 716 L221 716 Z" fill="${ink}"/>`;
  for (let x = 234; x <= 390; x += 26) {
    cuff += `<g transform="translate(${x} 716) rotate(180)"><path d="${petalPath(15, 5.5)}" fill="${ink}"/></g>`;
    cuff += `<circle cx="${x}" cy="734" r="2.4" fill="${deep}"/>`;
  }
  cuff += `<rect x="219" y="748" width="184" height="7" rx="3.5" fill="${gold}"/>`;
  cuff += `<rect x="218" y="762" width="186" height="4" rx="2" fill="${accent}"/>`;
  for (let i = 0; i < 8; i++) cuff += `<circle cx="${240 + i * 20.5}" cy="778" r="3.2" fill="${deep}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
  ${defsGlow(`glow${idx}`, accent)}
  <defs>
    <linearGradient id="skin${idx}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${skin}"/>
      <stop offset="100%" stop-color="${skin}" stop-opacity="0.88"/>
    </linearGradient>
  </defs>
  <rect width="600" height="800" fill="${bg}"/>
  <g transform="translate(600 0)">${cornerLace(0, 0, 150, ink, accent, deep)}</g>
  <g transform="translate(0 800)">${cornerLace(0, 0, 160, ink, accent, deep)}</g>
  <circle cx="300" cy="520" r="290" fill="url(#glow${idx})"/>
  ${dotRing(300, 470, 336, 30, 2.2, ink, 6)}
  ${frame(600, 800, ink, 0.45)}
  <g>
    ${thumb}
    ${fingerShapes}
    <path d="${wrist}" fill="url(#skin${idx})"/>
    <path d="${palm}" fill="url(#skin${idx})"/>
    ${thumbDecor}
    ${fingerDecor}
    ${grandMandala(312, 556, 122, ink, deep, accent, skin, nf, gold)}
    ${cuff}
  </g>
  <text x="300" y="52" text-anchor="middle" font-family="Georgia, serif" font-size="21" fill="${deep}" opacity="0.7" letter-spacing="7">RANGRITII</text>
  <text x="300" y="76" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-style="italic" fill="${accent}" opacity="0.8" letter-spacing="2">mehandi artistry</text>
</svg>`;
}

/* ── Peacock line-art (portfolio motif) ───────────────────────── */

function peacock(cx, cy, s, ink, deep, accent, bg, gold) {
  let g = `<g transform="translate(${cx} ${cy}) scale(${s})">`;
  // fan of 9 curved tail feathers with peacock-eye tips
  for (let i = -4; i <= 4; i++) {
    const deg = i * 17;
    const bend = i * 6;
    g += `<g transform="rotate(${deg})">`;
    g += `<path d="M0 -10 Q${bend} -80 ${F(bend * 0.4)} -148" fill="none" stroke="${ink}" stroke-width="2.6"/>`;
    g += `<g transform="translate(${F(bend * 0.4)} -148) rotate(${F(-bend * 0.35)})">` +
      `<path d="M0 0 C-15 -8 -20 -34 0 -52 C20 -34 15 -8 0 0 Z" fill="${accent}"/>` +
      `<path d="M0 -8 C-9 -13 -12 -28 0 -40 C12 -28 9 -13 0 -8 Z" fill="${bg}"/>` +
      `<circle cx="0" cy="-24" r="6.5" fill="${deep}"/><circle cx="0" cy="-24" r="2.8" fill="${gold}"/></g>`;
    g += `<circle cx="${F(bend * 0.75)}" cy="-96" r="2.6" fill="${deep}"/>`;
    g += `</g>`;
  }
  // body: elegant leaning teardrop
  g += `<path d="M-2 64 C-40 60 -56 24 -44 -10 C-36 -34 -12 -46 6 -40 C30 -32 44 -4 38 26 C32 52 18 66 -2 64 Z" fill="${ink}"/>`;
  // neck: S-curve tapering into head
  g += `<path d="M-14 -34 C-38 -52 -44 -86 -28 -106 C-16 -120 4 -118 10 -104" fill="none" stroke="${ink}" stroke-width="11" stroke-linecap="round"/>`;
  g += `<circle cx="-6" cy="-108" r="12.5" fill="${ink}"/>`;
  g += `<path d="M-18 -112 L-33 -106 L-18 -101 Z" fill="${gold}"/>`;
  g += `<circle cx="-2" cy="-111" r="2.4" fill="${bg}"/>`;
  for (const dx of [-7, 0, 7]) {
    g += `<line x1="${-6 + dx * 0.4}" y1="-120" x2="${-6 + dx}" y2="-133" stroke="${ink}" stroke-width="1.6"/>`;
    g += `<circle cx="${-6 + dx}" cy="-136" r="2.8" fill="${accent}"/>`;
  }
  // wing detail arcs + tail dot
  g += `<path d="M-30 8 C-16 -6 12 -8 26 8" fill="none" stroke="${gold}" stroke-width="2.4"/>`;
  g += `<path d="M-26 24 C-12 12 12 10 24 24" fill="none" stroke="${accent}" stroke-width="2"/>`;
  g += `<circle cx="0" cy="42" r="2.6" fill="${gold}"/>`;
  g += `</g>`;
  return g;
}

/* ── Portfolio pieces (600×600) ───────────────────────────────── */

function portfolioSvg(artistIdx, pieceIdx) {
  const [, ink, deep, bg, accent, gold] = PALETTES[artistIdx - 1];
  const rand = rng(artistIdx * 100 + pieceIdx * 7);
  const nf = [10, 12, 14][Math.floor(rand() * 3)];

  const layouts = [
    // 1 — grand mandala, corner flourishes
    () =>
      `<g transform="translate(0 0)">${cornerLace(0, 0, 120, ink, accent, deep)}</g>` +
      `<g transform="translate(600 600)">${cornerLace(0, 0, 130, ink, accent, deep)}</g>` +
      `<circle cx="300" cy="300" r="250" fill="url(#pglow)"/>` +
      grandMandala(300, 300, 208, ink, deep, accent, bg, nf, gold) +
      dotRing(300, 300, 246, nf * 2, 2.4, deep, 90 / nf),

    // 2 — peacock centrepiece with lace ground
    () =>
      `<circle cx="300" cy="330" r="240" fill="url(#pglow)"/>` +
      scallopRing(300, 330, 238, 22, 16, ink, 1.6) +
      dotRing(300, 330, 218, 44, 1.8, accent, 4) +
      peacock(300, 352, 1.06, ink, deep, accent, bg, gold) +
      `<g transform="translate(300 520)">` +
      flower(0, 0, 17, 6, accent, deep) +
      `</g>` +
      dotRing(300, 520, 34, 10, 2, ink),

    // 3 — paisley garden: one large + two echoes + vine borders
    () =>
      paisley(255, 268, 128, ink, deep, accent, bg, -12) +
      paisley(452, 132, 56, accent, deep, ink, bg, 148) +
      paisley(468, 452, 62, deep, accent, ink, bg, 24) +
      paisley(122, 486, 48, accent, deep, ink, bg, -140) +
      vine(60, 90, 520, ink, accent, 13) +
      vine(546, 80, 500, ink, accent, 13) +
      dotRing(255, 268, 176, 22, 2.2, deep, 0),

    // 4 — jaali bands: half-mandala crown, flower chain, paisleys, lace base
    () =>
      `<g transform="translate(300 0)">${grandMandala(0, 0, 190, ink, deep, accent, bg, nf, gold)}</g>` +
      `<rect x="40" y="322" width="520" height="3" rx="1.5" fill="${accent}" opacity="0.75"/>` +
      `<rect x="40" y="406" width="520" height="3" rx="1.5" fill="${accent}" opacity="0.75"/>` +
      flower(115, 365, 27, 7, accent, deep) +
      flower(300, 365, 36, 8, ink, gold) +
      flower(485, 365, 27, 7, accent, deep) +
      `<g transform="translate(196 365) rotate(-90)"><path d="${petalPath(40, 13)}" fill="${ink}"/></g>` +
      `<g transform="translate(204 365) rotate(90)"><path d="${petalPath(40, 13)}" fill="${ink}"/></g>` +
      `<g transform="translate(396 365) rotate(-90)"><path d="${petalPath(40, 13)}" fill="${ink}"/></g>` +
      `<g transform="translate(404 365) rotate(90)"><path d="${petalPath(40, 13)}" fill="${ink}"/></g>` +
      dotRing(300, 365, 52, 12, 2, deep) +
      paisley(130, 495, 48, ink, deep, accent, bg, -18) +
      paisley(470, 495, 48, deep, ink, accent, bg, 18) +
      flower(300, 495, 24, 6, accent, deep) +
      dotRing(300, 495, 40, 10, 2, ink) +
      scallopRing(300, 862, 300, 24, 20, ink, 2) +
      dotRing(300, 862, 336, 48, 1.8, accent, 4),
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  ${defsGlow("pglow", accent)}
  <rect width="600" height="600" fill="${bg}"/>
  ${frame(600, 600, ink, 0.5)}
  ${layouts[(pieceIdx - 1) % layouts.length]()}
</svg>`;
}

/* ── Style category art (600×600, one distinct design each) ───── */

const STYLES = [
  ["style-bridal", "Bridal", 4],
  ["style-arabic", "Arabic", 2],
  ["style-indo-arabic", "Indo-Arabic", 5],
  ["style-traditional", "Traditional", 1],
  ["style-minimal", "Minimal", 3],
  ["style-festive", "Festive", 7],
];

function styleArt(slug, ink, deep, accent, bg, gold) {
  switch (slug) {
    case "style-bridal":
      // dense full mandala — the richest of all
      return (
        `<circle cx="300" cy="255" r="230" fill="url(#sglow)"/>` +
        grandMandala(300, 252, 186, ink, deep, accent, bg, 14, gold) +
        dotRing(300, 252, 222, 28, 2.2, deep, 6) +
        teardropRing(300, 252, 236, 14, 16, accent, 0) +
        `<g transform="translate(0 0)">${cornerLace(0, 0, 110, ink, accent, deep)}</g>` +
        `<g transform="translate(600 0)">${cornerLace(0, 0, 110, ink, accent, deep)}</g>`
      );
    case "style-arabic": {
      // bold diagonal floral vine — signature Arabic strip
      let band = "";
      band += `<rect x="20" y="196" width="560" height="3.5" rx="1.75" fill="${accent}" opacity="0.85"/>`;
      band += `<rect x="20" y="322" width="560" height="3.5" rx="1.75" fill="${accent}" opacity="0.85"/>`;
      for (let x = 45; x <= 555; x += 34) band += `<circle cx="${x}" cy="181" r="2.2" fill="${deep}"/>`;
      for (let x = 45; x <= 555; x += 34) band += `<circle cx="${x}" cy="338" r="2.2" fill="${deep}"/>`;
      band += flower(115, 259, 36, 7, ink, gold);
      band += flower(300, 259, 50, 8, deep, gold);
      band += flower(485, 259, 36, 7, ink, gold);
      band += dotRing(300, 259, 72, 14, 2.4, deep);
      for (const [lx, dir] of [[190, -90], [198, 90], [394, -90], [402, 90]]) {
        band += `<g transform="translate(${lx} 259) rotate(${dir})"><path d="${petalPath(48, 15)}" fill="${accent}"/></g>`;
      }
      // hanging drops below the band
      for (let x = 80; x <= 520; x += 55) {
        band += `<line x1="${x}" y1="326" x2="${x}" y2="${x % 110 === 80 % 110 ? 358 : 346}" stroke="${ink}" stroke-width="2"/>`;
        band += `<g transform="translate(${x} ${x % 110 === 80 % 110 ? 358 : 346}) rotate(180)"><path d="${petalPath(18, 6.5)}" fill="${ink}"/></g>`;
      }
      return (
        `<g transform="rotate(-33 300 260)">${band}</g>` +
        paisley(496, 120, 46, accent, deep, ink, bg, 150) +
        paisley(104, 424, 46, accent, deep, ink, bg, -30) +
        dotRing(300, 262, 254, 26, 1.8, ink, 7)
      );
    }
    case "style-indo-arabic":
      // ornate crown hanging from the top + paisley pair below
      return (
        `<g transform="translate(300 -34)">${grandMandala(0, 0, 214, ink, deep, accent, bg, 14, gold)}</g>` +
        teardropRing(300, -34, 236, 16, 20, accent, 6) +
        paisley(178, 330, 70, ink, deep, accent, bg, -20) +
        paisley(425, 282, 46, deep, ink, accent, bg, 34) +
        paisley(462, 420, 34, accent, deep, ink, bg, 12) +
        flower(322, 442, 26, 7, accent, deep) +
        dotRing(322, 442, 44, 12, 2.2, ink) +
        dotRing(300, 240, 190, 20, 2, deep, 9)
      );
    case "style-traditional":
      // peacock in an ornamental arch — heritage look
      return (
        `<circle cx="300" cy="268" r="228" fill="url(#sglow)"/>` +
        scallopRing(300, 268, 216, 20, 15, ink, 1.8) +
        dotRing(300, 268, 196, 40, 1.8, accent, 4.5) +
        peacock(300, 288, 0.98, ink, deep, accent, bg, gold) +
        `<g transform="translate(96 96)">${flower(0, 0, 20, 6, accent, deep)}</g>` +
        `<g transform="translate(504 96)">${flower(0, 0, 20, 6, accent, deep)}</g>`
      );
    case "style-minimal":
      // one delicate large ring, sparse dots, lots of air
      return (
        `<circle cx="300" cy="248" r="152" fill="none" stroke="${ink}" stroke-width="2.2"/>` +
        `<circle cx="300" cy="248" r="166" fill="none" stroke="${ink}" stroke-width="0.9" stroke-dasharray="2 8"/>` +
        lotusRing(300, 248, 74, 10, 52, 14, ink, { inner: bg }) +
        lotusRing(300, 248, 66, 10, 34, 9, accent, { startDeg: 18, opacity: 0.9 }) +
        flower(300, 248, 19, 6, accent, deep) +
        dotRing(300, 248, 122, 18, 2, deep, 10) +
        `<circle cx="300" cy="428" r="3.2" fill="${accent}"/>` +
        `<circle cx="300" cy="443" r="2.2" fill="${ink}"/>` +
        `<circle cx="300" cy="455" r="1.5" fill="${deep}"/>`
      );
    case "style-festive": {
      // mandala with hanging jhumka drops + marigold garland
      let jhumkas = "";
      for (const a of [-44, -22, 0, 22, 44]) {
        const rad = (a * Math.PI) / 180;
        const x = F(300 + 172 * Math.sin(rad));
        const y = F(230 + 172 * Math.cos(rad));
        const len = 40 - Math.abs(a) * 0.35;
        jhumkas += `<line x1="${x}" y1="${y}" x2="${x}" y2="${F(y + len)}" stroke="${ink}" stroke-width="2"/>`;
        jhumkas += `<g transform="translate(${x} ${F(y + len + 24)})"><path d="${petalPath(26, 10)}" fill="${gold}"/></g>`;
        jhumkas += `<circle cx="${x}" cy="${F(y + len + 30)}" r="3" fill="${deep}"/>`;
      }
      return (
        `<circle cx="300" cy="235" r="215" fill="url(#sglow)"/>` +
        grandMandala(300, 230, 158, ink, deep, accent, bg, 12, gold) +
        jhumkas +
        Array.from({ length: 13 }, (_, i) => `<circle cx="${68 + i * 39}" cy="${F(468 + Math.sin(i * 0.9) * 6)}" r="${7 + (i % 2) * 3}" fill="${i % 2 ? accent : gold}"/>`).join("") +
        dotRing(300, 230, 186, 24, 2, deep, 7)
      );
    }
    default:
      return grandMandala(300, 260, 170, ink, deep, accent, bg, 12, gold);
  }
}

function styleSvg([file, label, palIdx]) {
  const [, ink, deep, bg, accent, gold] = PALETTES[palIdx - 1];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  ${defsGlow("sglow", accent)}
  <rect width="600" height="600" fill="${bg}"/>
  ${frame(600, 600, ink, 0.45)}
  ${styleArt(file, ink, deep, accent, bg, gold)}
  <text x="300" y="537" text-anchor="middle" font-family="Georgia, serif" font-size="46" font-style="italic" fill="${deep}">${label}</text>
  <rect x="230" y="558" width="140" height="2.5" fill="${accent}"/>
  <circle cx="300" cy="559" r="4.5" fill="${gold}"/>
</svg>`;
}

/* ── Write everything ─────────────────────────────────────────── */

for (let a = 1; a <= 8; a++) {
  writeFileSync(join(outDir, `artist-${a}-profile.svg`), handSvg(a));
  for (let p = 1; p <= 4; p++) {
    writeFileSync(join(outDir, `artist-${a}-p${p}.svg`), portfolioSvg(a, p));
  }
}
for (const s of STYLES) writeFileSync(join(outDir, `${s[0]}.svg`), styleSvg(s));
console.log("Wrote 8 profiles + 32 portfolio pieces + 6 style images to public/art/");
