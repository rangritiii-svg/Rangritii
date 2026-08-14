// Generates realistic showcase design images for the /designs gallery:
// back-of-hand henna renders with skin shading, nails, stain-glow linework —
// 3 variants for each of the 6 mehandi styles (600×750 portrait).
// Run: node scripts/generate-designs.mjs  (output: public/art/design-*.svg)
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "art");
mkdirSync(outDir, { recursive: true });

const W = 600, H = 750;
const F = (n) => Number(n.toFixed(1));

function rng(seed) {
  let s = (seed * 2654435761) % 2147483647;
  return () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
}

/* ── Hand geometry (shared by all designs) ────────────────────── */
// Back-of-hand view, fingers up, forearm to bottom edge.
const FINGERS = [
  { x: 222, y: 404, ang: -8, len: 172, w: 21 },   // index
  { x: 281, y: 390, ang: -2, len: 198, w: 22 },   // middle
  { x: 339, y: 395, ang: 4, len: 186, w: 20.5 },  // ring
  { x: 392, y: 416, ang: 11, len: 142, w: 17.5 }, // pinky
];
const THUMB = { x: 198, y: 494, ang: -34, len: 158, w: 19 };

const BACK =
  "M186 424 C198 396 248 382 300 382 C352 382 410 402 426 430 " +
  "C438 454 436 522 426 558 C412 612 372 642 302 644 " +
  "C240 644 200 618 186 568 C176 530 176 456 186 424 Z";
const FOREARM = "M238 632 C244 690 242 726 240 750 L372 750 C368 712 370 668 376 632 Z";

function capsule(len, wb, wt) {
  return (
    `M${-wb} 0 C${-wb} ${F(-len * 0.42)} ${-wt} ${F(-len * 0.58)} ${-wt} ${F(-(len - wt))}` +
    ` A${wt} ${wt} 0 0 1 ${wt} ${F(-(len - wt))}` +
    ` C${wt} ${F(-len * 0.58)} ${wb} ${F(-len * 0.42)} ${wb} 0 Z`
  );
}

function fingerGroup(f, inner) {
  return `<g transform="translate(${f.x} ${f.y}) rotate(${f.ang})">${inner}</g>`;
}

// All silhouette shapes with a given fill (used for shadow, skin, clip).
function silhouette(fill) {
  let g = `<path d="${FOREARM}" fill="${fill}"/>`;
  g += fingerGroup(THUMB, `<path d="${capsule(THUMB.len, THUMB.w, THUMB.w * 0.86)}" fill="${fill}"/>`);
  for (const f of FINGERS) {
    g += fingerGroup(f, `<path d="${capsule(f.len, f.w, f.w * 0.88)}" fill="${fill}"/>`);
  }
  g += `<path d="${BACK}" fill="${fill}"/>`;
  return g;
}

// clipPath ignores <g> children, so the clip variant puts the transform
// directly on each path element.
function silhouetteClip() {
  let g = `<path d="${FOREARM}"/>`;
  g += `<path d="${capsule(THUMB.len, THUMB.w, THUMB.w * 0.86)}" transform="translate(${THUMB.x} ${THUMB.y}) rotate(${THUMB.ang})"/>`;
  for (const f of FINGERS) {
    g += `<path d="${capsule(f.len, f.w, f.w * 0.88)}" transform="translate(${f.x} ${f.y}) rotate(${f.ang})"/>`;
  }
  g += `<path d="${BACK}"/>`;
  return g;
}

/* ── Skin + realism layers ────────────────────────────────────── */

function skinLayers(id, skin, shade, light, nails) {
  let g = "";
  // soft cast shadow
  g += `<g transform="translate(12 18)" filter="url(#blur12)" opacity="0.20">${silhouette("#3a1a08")}</g>`;
  // skin base
  g += silhouette(`url(#skin${id})`);
  // shading + highlights clipped inside the hand
  g += `<g clip-path="url(#hand${id})">`;
  g += `<ellipse cx="176" cy="520" rx="46" ry="150" fill="${shade}" opacity="0.35" filter="url(#blur16)"/>`;
  g += `<ellipse cx="436" cy="520" rx="40" ry="140" fill="${shade}" opacity="0.30" filter="url(#blur16)"/>`;
  g += `<ellipse cx="298" cy="470" rx="86" ry="120" fill="${light}" opacity="0.5" filter="url(#blur16)"/>`;
  g += `<ellipse cx="300" cy="712" rx="70" ry="60" fill="${shade}" opacity="0.22" filter="url(#blur16)"/>`;
  // finger center highlights + joint creases + knuckles
  for (const f of FINGERS) {
    g += fingerGroup(
      f,
      `<rect x="${-f.w * 0.32}" y="${-f.len + 8}" width="${f.w * 0.64}" height="${f.len - 16}" rx="${f.w * 0.3}" fill="${light}" opacity="0.34" filter="url(#blur6)"/>` +
        `<path d="M${-f.w * 0.72} ${F(-f.len * 0.42)} Q0 ${F(-f.len * 0.42 + 4)} ${f.w * 0.72} ${F(-f.len * 0.42)}" fill="none" stroke="${shade}" stroke-width="1.6" opacity="0.4"/>` +
        `<path d="M${-f.w * 0.6} ${F(-f.len * 0.7)} Q0 ${F(-f.len * 0.7 + 3)} ${f.w * 0.6} ${F(-f.len * 0.7)}" fill="none" stroke="${shade}" stroke-width="1.3" opacity="0.35"/>` +
        `<ellipse cx="0" cy="-8" rx="${f.w * 0.55}" ry="6" fill="${shade}" opacity="0.25" filter="url(#blur3)"/>`
    );
  }
  g += fingerGroup(
    THUMB,
    `<rect x="${-THUMB.w * 0.3}" y="${-THUMB.len + 8}" width="${THUMB.w * 0.6}" height="${THUMB.len - 16}" rx="5" fill="${light}" opacity="0.3" filter="url(#blur6)"/>`
  );
  // wrist crease
  g += `<path d="M244 640 Q305 654 372 638" fill="none" stroke="${shade}" stroke-width="2" opacity="0.35" filter="url(#blur1)"/>`;
  g += `</g>`;
  // nails (drawn before henna so caps can cover them)
  if (nails) {
    for (const f of FINGERS) {
      const ny = -(f.len - f.w * 1.12);
      g += fingerGroup(
        f,
        `<ellipse cx="0" cy="${F(ny)}" rx="${f.w * 0.52}" ry="${f.w * 0.66}" fill="url(#nail${id})"/>` +
          `<path d="M${-f.w * 0.3} ${F(ny - f.w * 0.34)} Q0 ${F(ny - f.w * 0.52)} ${f.w * 0.3} ${F(ny - f.w * 0.34)}" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.55"/>`
      );
    }
    const tny = -(THUMB.len - THUMB.w * 1.12);
    g += fingerGroup(
      THUMB,
      `<ellipse cx="0" cy="${F(tny)}" rx="${THUMB.w * 0.5}" ry="${THUMB.w * 0.62}" fill="url(#nail${id})"/>`
    );
  }
  return g;
}

/* ── Henna pattern helpers (emit "INK"/"INK2" color tokens) ───── */

function petal(len, wid) {
  return `M0 0 C${F(-wid)} ${F(-len * 0.3)} ${F(-wid * 0.82)} ${F(-len * 0.78)} 0 ${F(-len)} C${F(wid * 0.82)} ${F(-len * 0.78)} ${F(wid)} ${F(-len * 0.3)} 0 0 Z`;
}

function pt(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [F(cx + r * Math.cos(a)), F(cy + r * Math.sin(a))];
}

function ringN(cx, cy, r, count, draw, startDeg = 0) {
  let out = "";
  for (let i = 0; i < count; i++) {
    const deg = startDeg + (i * 360) / count;
    const [x, y] = pt(cx, cy, r, deg);
    out += draw(x, y, deg, i);
  }
  return out;
}

const dotRingP = (cx, cy, r, n, s, start = 0) =>
  ringN(cx, cy, r, n, (x, y) => `<circle cx="${x}" cy="${y}" r="${s}" fill="INK"/>`, start);

// Fine stroke-drawn mandala — reads like drawn henna, not flat print.
function mandalaFine(cx, cy, R, folds = 12) {
  let g = "";
  g += `<circle cx="${cx}" cy="${cy}" r="${F(R)}" fill="none" stroke="INK" stroke-width="2"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="${F(R * 0.9)}" fill="none" stroke="INK" stroke-width="1.2"/>`;
  g += ringN(cx, cy, R * 0.95, folds * 2, (x, y, deg) =>
    `<g transform="translate(${x} ${y}) rotate(${F(deg)})"><path d="${petal(R * 0.14, R * 0.05)}" fill="INK"/></g>`, 180 / (folds * 2));
  g += ringN(cx, cy, R * 0.62, folds, (x, y, deg) =>
    `<g transform="translate(${x} ${y}) rotate(${F(deg)})"><path d="${petal(R * 0.3, R * 0.11)}" fill="none" stroke="INK" stroke-width="1.6"/><path d="${petal(R * 0.18, R * 0.06)}" fill="INK2" transform="translate(0 ${F(-R * 0.05)})"/></g>`);
  g += dotRingP(cx, cy, R * 0.78, folds * 2, R * 0.022, 90 / folds);
  g += `<circle cx="${cx}" cy="${cy}" r="${F(R * 0.42)}" fill="none" stroke="INK" stroke-width="1.6"/>`;
  g += ringN(cx, cy, R * 0.28, 8, (x, y, deg) =>
    `<g transform="translate(${x} ${y}) rotate(${F(deg)})"><path d="${petal(R * 0.2, R * 0.075)}" fill="INK"/></g>`);
  g += `<circle cx="${cx}" cy="${cy}" r="${F(R * 0.1)}" fill="INK"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="${F(R * 0.045)}" fill="INK2"/>`;
  return g;
}

// Diagonal criss-cross net with dots — the bridal jaal.
function jaal(cx, cy, w, h, cell, id) {
  let lines = "";
  const x0 = cx - w / 2, y0 = cy - h / 2;
  for (let d = -h; d < w + h; d += cell) {
    lines += `<line x1="${F(x0 + d)}" y1="${F(y0)}" x2="${F(x0 + d - h)}" y2="${F(y0 + h)}" stroke="INK" stroke-width="1.3"/>`;
    lines += `<line x1="${F(x0 + d)}" y1="${F(y0)}" x2="${F(x0 + d + h)}" y2="${F(y0 + h)}" stroke="INK" stroke-width="1.3"/>`;
  }
  let dots = "";
  for (let yy = y0 + cell / 2; yy < y0 + h; yy += cell) {
    for (let xx = x0 + cell / 2; xx < x0 + w; xx += cell) {
      dots += `<circle cx="${F(xx)}" cy="${F(yy)}" r="1.6" fill="INK"/>`;
    }
  }
  return (
    `<clipPath id="${id}"><rect x="${F(x0)}" y="${F(y0)}" width="${w}" height="${h}" rx="10"/></clipPath>` +
    `<g clip-path="url(#${id})">${lines}${dots}</g>` +
    `<rect x="${F(x0)}" y="${F(y0)}" width="${w}" height="${h}" rx="10" fill="none" stroke="INK" stroke-width="1.8"/>`
  );
}

// Henna-dipped fingertip cap.
function capTip(f, depth = 42) {
  const wt = f.w * 0.88 - 1;
  const capY = -(f.len - wt);
  return fingerGroup(
    f,
    `<path d="M${-wt} ${F(capY)} A${wt} ${wt} 0 0 1 ${wt} ${F(capY)} L${wt} ${F(capY + depth)} L${-wt} ${F(capY + depth)} Z" fill="INK"/>` +
      `<path d="M${-wt} ${F(capY + depth + 7)} Q0 ${F(capY + depth + 13)} ${wt} ${F(capY + depth + 7)}" fill="none" stroke="INK" stroke-width="1.6"/>`
  );
}

// Ornament ladder down a finger: bands, chevrons, dots.
function ladder(f, from, to, rand) {
  let g = "";
  const wt = f.w * 0.8;
  let y = from;
  while (y < to) {
    const kind = Math.floor(rand() * 4);
    if (kind === 0) {
      g += `<rect x="${-wt}" y="${F(y)}" width="${wt * 2}" height="4" rx="2" fill="INK"/>`;
      y += 13;
    } else if (kind === 1) {
      g += `<path d="M${-wt} ${F(y + 6)} L0 ${F(y)} L${wt} ${F(y + 6)}" fill="none" stroke="INK" stroke-width="1.8"/>`;
      y += 12;
    } else if (kind === 2) {
      g += `<circle cx="0" cy="${F(y + 3)}" r="3" fill="INK"/>`;
      y += 14;
    } else {
      g += `<circle cx="${-wt * 0.5}" cy="${F(y + 3)}" r="2" fill="INK"/><circle cx="${wt * 0.5}" cy="${F(y + 3)}" r="2" fill="INK"/>`;
      y += 12;
    }
  }
  return fingerGroup(f, g);
}

// Leafy vine along a finger.
function fingerVine(f, from, to) {
  let g = `<path d="M0 ${F(from)} C-7 ${F(from + (to - from) * 0.33)} 7 ${F(from + (to - from) * 0.66)} 0 ${F(to)}" fill="none" stroke="INK" stroke-width="2"/>`;
  const steps = Math.max(2, Math.floor((to - from) / 24));
  for (let i = 0; i < steps; i++) {
    const y = from + ((to - from) * (i + 0.5)) / steps;
    const side = i % 2 === 0 ? 1 : -1;
    g += `<g transform="translate(${side * 7} ${F(y)}) rotate(${side * 55})"><path d="${petal(15, 5.5)}" fill="INK"/></g>`;
    g += `<circle cx="${-side * 6}" cy="${F(y + 6)}" r="1.8" fill="INK"/>`;
  }
  return fingerGroup(f, g);
}

// Bold Arabic rose (filled petals, stroke ring).
function rose(cx, cy, r) {
  let g = ringN(cx, cy, r * 0.6, 7, (x, y) => `<circle cx="${x}" cy="${y}" r="${F(r * 0.46)}" fill="INK"/>`);
  g += `<circle cx="${cx}" cy="${cy}" r="${F(r * 0.4)}" fill="INK2"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="${F(r * 0.16)}" fill="INK"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="${F(r * 1.15)}" fill="none" stroke="INK" stroke-width="1.4"/>`;
  return g;
}

// Big leaf pair for Arabic vines.
function leafPair(x, y, ang, s) {
  return (
    `<g transform="translate(${x} ${y}) rotate(${ang})">` +
    `<path d="${petal(s, s * 0.34)}" fill="INK"/>` +
    `<path d="${petal(s, s * 0.34)}" fill="none" stroke="INK" stroke-width="1.2" transform="rotate(180)"/>` +
    `</g>`
  );
}

// Stroke paisley with hatch fill.
function paisleyFine(cx, cy, s, rot, id) {
  const drop = `M0 ${F(s)} C${F(-s * 0.85)} ${F(s * 0.9)} ${F(-s * 0.95)} ${F(-s * 0.1)} ${F(-s * 0.35)} ${F(-s * 0.62)} C${F(-s * 0.05)} ${F(-s * 0.85)} ${F(s * 0.35)} ${F(-s * 0.85)} ${F(s * 0.5)} ${F(-s * 0.5)} C${F(s * 0.72)} ${F(-s * 0.05)} ${F(s * 0.6)} ${F(s * 0.62)} 0 ${F(s)} Z`;
  const curl = `M${F(s * 0.18)} ${F(-s * 0.78)} C${F(s * 0.5)} ${F(-s * 1.05)} ${F(s * 0.95)} ${F(-s * 0.9)} ${F(s * 0.98)} ${F(-s * 0.5)} C${F(s * 0.85)} ${F(-s * 0.72)} ${F(s * 0.55)} ${F(-s * 0.82)} ${F(s * 0.34)} ${F(-s * 0.62)} Z`;
  let hatch = "";
  for (let d = -s; d < s * 1.4; d += s * 0.17) {
    hatch += `<line x1="${F(-s)}" y1="${F(d)}" x2="${F(s)}" y2="${F(d - s * 0.7)}" stroke="INK" stroke-width="1"/>`;
  }
  return (
    `<g transform="translate(${cx} ${cy}) rotate(${rot})">` +
    `<clipPath id="${id}"><path d="${drop}" transform="scale(0.78)"/></clipPath>` +
    `<path d="${curl}" fill="INK"/>` +
    `<path d="${drop}" fill="none" stroke="INK" stroke-width="2.2"/>` +
    `<g clip-path="url(#${id})" opacity="0.85">${hatch}</g>` +
    `<circle cx="${F(-s * 0.02)}" cy="${F(s * 0.1)}" r="${F(s * 0.26)}" fill="none" stroke="INK" stroke-width="1.6"/>` +
    `<circle cx="${F(-s * 0.02)}" cy="${F(s * 0.1)}" r="${F(s * 0.12)}" fill="INK2"/>` +
    `</g>`
  );
}

// Fine peacock for traditional designs.
function peacockFine(cx, cy, s) {
  let g = `<g transform="translate(${cx} ${cy}) scale(${s})">`;
  g += `<path d="M-2 40 C-26 37 -36 15 -28 -6 C-22 -21 -7 -28 4 -25 C19 -20 27 -3 23 16 C20 32 11 41 -2 40 Z" fill="none" stroke="INK" stroke-width="2.4"/>`;
  g += `<path d="M-9 -22 C-24 -33 -28 -54 -18 -66 C-10 -75 3 -74 7 -65" fill="none" stroke="INK" stroke-width="6" stroke-linecap="round"/>`;
  g += `<circle cx="-4" cy="-67" r="7.5" fill="INK"/>`;
  g += `<path d="M-11 -70 L-20 -66 L-11 -63 Z" fill="INK2"/>`;
  for (const dx of [-5, 0, 5]) {
    g += `<circle cx="${-4 + dx}" cy="-82" r="1.8" fill="INK"/>`;
  }
  for (let i = -2; i <= 2; i++) {
    const deg = i * 21;
    g += `<g transform="rotate(${deg})"><path d="M0 -6 Q${i * 4} -50 ${i * 2.4} -92" fill="none" stroke="INK" stroke-width="1.8"/><g transform="translate(${i * 2.4} -92)"><path d="${petal(30, 11)}" fill="none" stroke="INK" stroke-width="1.6"/><circle cx="0" cy="-14" r="4" fill="INK2"/><circle cx="0" cy="-14" r="1.6" fill="INK"/></g></g>`;
  }
  g += `<path d="M-14 8 C-4 -2 10 -2 18 8" fill="none" stroke="INK" stroke-width="1.4"/>`;
  g += `</g>`;
  return g;
}

// Scalloped wrist band with hanging drops.
function wristBand(y, withDrops = true) {
  let g = `<path d="M240 ${y} Q305 ${y + 10} 372 ${y - 2}" fill="none" stroke="INK" stroke-width="2.4"/>`;
  g += `<path d="M240 ${y + 10} Q305 ${y + 20} 372 ${y + 8}" fill="none" stroke="INK" stroke-width="1.4"/>`;
  for (let i = 0; i < 6; i++) {
    const x = 252 + i * 22;
    const yy = y + 6 + Math.sin((x - 240) / 132 * Math.PI) * 8;
    g += `<circle cx="${x}" cy="${F(yy + 8)}" r="2.2" fill="INK"/>`;
    if (withDrops && i % 2 === 0) {
      g += `<line x1="${x}" y1="${F(yy + 12)}" x2="${x}" y2="${F(yy + 24)}" stroke="INK" stroke-width="1.4"/>`;
      g += `<g transform="translate(${x} ${F(yy + 36)})"><path d="${petal(14, 5)}" fill="INK"/></g>`;
    }
  }
  return g;
}

/* ── Per-style pattern painters ───────────────────────────────── */

function bridalPattern(rand, v) {
  let g = "";
  for (const f of FINGERS) {
    g += capTip(f, 40);
    g += ladder(f, -(f.len - f.w - 52), -14, rand);
  }
  g += capTip(THUMB, 34);
  g += fingerGroup(THUMB, `<circle cx="0" cy="${F(-(THUMB.len - THUMB.w - 46))}" r="3" fill="INK"/>`);
  g += mandalaFine(303, 505, 88, [12, 14, 12][v]);
  // petal fringe hugging the mandala + side leaf columns for full coverage
  g += ringN(303, 505, 94, 24, (x, y, deg) =>
    `<g transform="translate(${x} ${y}) rotate(${F(deg)})"><path d="${petal(13, 4.8)}" fill="INK"/></g>`);
  for (const [sx, dir] of [[201, -1], [409, 1]]) {
    for (let y = 448; y <= 584; y += 26) {
      g += `<g transform="translate(${sx} ${y}) rotate(${dir * 90})"><path d="${petal(16, 6)}" fill="INK"/></g>`;
      g += `<circle cx="${sx}" cy="${F(y + 13)}" r="1.8" fill="INK"/>`;
    }
  }
  // scalloped knuckle line above the mandala
  g += `<path d="M226 434 Q262 420 303 420 Q346 420 396 436" fill="none" stroke="INK" stroke-width="1.8"/>`;
  for (let i = 0; i < 7; i++) {
    const x = 238 + i * 22;
    g += `<circle cx="${x}" cy="${F(428 - Math.sin((i / 6) * Math.PI) * 6)}" r="1.8" fill="INK"/>`;
  }
  g += jaal(303, 610, 126, 46, 15, `jaalA${v}`);
  g += wristBand(658);
  g += jaal(304, 706, 122, 58, 16, `jaalB${v}`);
  g += `<g transform="translate(240 706) rotate(-90)"><path d="${petal(26, 9)}" fill="INK"/></g>`;
  g += `<g transform="translate(368 706) rotate(90)"><path d="${petal(26, 9)}" fill="INK"/></g>`;
  return g;
}

function arabicPattern(rand, v) {
  let g = "";
  // bold diagonal vine: index fingertip → back of hand → opposite wrist → forearm
  g += capTip(FINGERS[0], 36);
  g += fingerVine(FINGERS[0], -(FINGERS[0].len - 60), -10);
  const path = [
    [228, 420], [258, 462], [300, 498], [346, 540], [372, 588], [352, 648], [318, 700], [300, 748],
  ];
  let d = `M${path[0][0]} ${path[0][1]}`;
  for (let i = 1; i < path.length; i++) {
    const [px, py] = path[i - 1];
    const [x, y] = path[i];
    d += ` Q${F((px + x) / 2 + (i % 2 ? 16 : -16))} ${F((py + y) / 2)} ${x} ${y}`;
  }
  g += `<path d="${d}" fill="none" stroke="INK" stroke-width="3.4"/>`;
  g += `<path d="${d}" fill="none" stroke="INK" stroke-width="1" transform="translate(7 -4)" opacity="0.7"/>`;
  g += rose(258, 462, 21);
  g += rose(346, 540, 26);
  g += rose(318, 700, 22);
  const leafSpots = [
    [238, 438, -40], [288, 482, 40], [326, 516, -45], [368, 566, 50], [364, 620, -50], [336, 672, 45], [306, 726, -40],
  ];
  for (const [x, y, a] of leafSpots) g += leafPair(x, y, a, 24 + rand() * 6);
  for (const [x, y] of [[282, 452], [318, 560], [340, 626], [296, 690]]) {
    g += `<circle cx="${x}" cy="${y}" r="2.2" fill="INK"/>`;
  }
  return g;
}

function indoArabicPattern(rand, v) {
  let g = "";
  g += capTip(FINGERS[1], 38);
  g += capTip(FINGERS[3], 30);
  g += fingerVine(FINGERS[0], -(FINGERS[0].len - 24), -10);
  g += fingerVine(FINGERS[2], -(FINGERS[2].len - 24), -10);
  g += ladder(FINGERS[1], -(FINGERS[1].len - FINGERS[1].w - 50), -14, rand);
  g += ladder(FINGERS[3], -(FINGERS[3].len - FINGERS[3].w - 42), -14, rand);
  g += mandalaFine(300, 490, 80, 12);
  g += paisleyFine(258, 606, 44, -18, `ipA${v}`);
  g += paisleyFine(352, 610, 36, 156, `ipB${v}`);
  g += wristBand(664);
  g += `<path d="M262 700 C282 686 322 686 344 700" fill="none" stroke="INK" stroke-width="2"/>`;
  g += rose(303, 722, 20);
  return g;
}

function traditionalPattern(rand, v) {
  let g = "";
  for (const f of FINGERS) {
    g += capTip(f, 30);
    g += fingerGroup(
      f,
      `<circle cx="0" cy="${F(-(f.len - f.w - 42))}" r="4" fill="none" stroke="INK" stroke-width="1.6"/>` +
        `<circle cx="0" cy="${F(-(f.len - f.w - 42))}" r="1.6" fill="INK"/>` +
        `<path d="M${-f.w * 0.7} ${F(-f.len * 0.4)} L0 ${F(-f.len * 0.4 - 8)} L${f.w * 0.7} ${F(-f.len * 0.4)}" fill="none" stroke="INK" stroke-width="1.6"/>`
    );
  }
  g += peacockFine(300, 512, 1.02);
  g += `<circle cx="300" cy="500" r="104" fill="none" stroke="INK" stroke-width="1.6" stroke-dasharray="1 7"/>`;
  g += paisleyFine(238, 600, 34, -24, `trA${v}`);
  g += paisleyFine(366, 596, 34, 150, `trB${v}`);
  g += wristBand(660);
  // checker band on forearm
  const y0 = 690;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 3; j++) {
      if ((i + j) % 2 === 0) {
        g += `<rect x="${252 + i * 13}" y="${y0 + j * 13}" width="13" height="13" fill="INK" opacity="0.9"/>`;
      }
    }
  }
  g += `<rect x="252" y="${y0}" width="104" height="39" fill="none" stroke="INK" stroke-width="1.6"/>`;
  return g;
}

function minimalPattern(rand, v) {
  let g = "";
  g += capTip(FINGERS[1], 26);
  g += capTip(FINGERS[2], 22);
  g += fingerGroup(FINGERS[0], `<circle cx="0" cy="${F(-FINGERS[0].len * 0.55)}" r="2.4" fill="INK"/><circle cx="0" cy="${F(-FINGERS[0].len * 0.55 + 14)}" r="1.6" fill="INK"/>`);
  g += fingerGroup(FINGERS[3], `<circle cx="0" cy="${F(-FINGERS[3].len * 0.5)}" r="2" fill="INK"/>`);
  g += `<circle cx="300" cy="500" r="46" fill="none" stroke="INK" stroke-width="1.8"/>`;
  g += `<circle cx="300" cy="500" r="53" fill="none" stroke="INK" stroke-width="0.9" stroke-dasharray="2 6"/>`;
  g += ringN(300, 500, 26, 8, (x, y, deg) =>
    `<g transform="translate(${x} ${y}) rotate(${F(deg)})"><path d="${petal(16, 5.5)}" fill="none" stroke="INK" stroke-width="1.4"/></g>`);
  g += `<circle cx="300" cy="500" r="5" fill="INK"/>`;
  g += dotRingP(300, 500, 38, 8, 1.4, 22.5);
  // delicate bracelet chain
  g += `<path d="M246 648 Q305 660 370 646" fill="none" stroke="INK" stroke-width="1.6"/>`;
  for (let i = 0; i < 5; i++) {
    const x = 258 + i * 24;
    g += `<circle cx="${x}" cy="${F(652 + Math.sin(i * 1.1) * 3)}" r="1.8" fill="INK"/>`;
  }
  g += `<line x1="305" y1="658" x2="305" y2="672" stroke="INK" stroke-width="1.2"/>`;
  g += `<circle cx="305" cy="677" r="2.4" fill="INK"/>`;
  return g;
}

function festivePattern(rand, v) {
  let g = "";
  g += capTip(FINGERS[1], 34);
  for (const f of [FINGERS[0], FINGERS[2], FINGERS[3]]) {
    g += fingerGroup(
      f,
      `<g transform="translate(0 ${F(-(f.len - f.w - 20))})"><path d="${petal(20, 7)}" fill="INK"/></g>` +
        `<circle cx="0" cy="${F(-(f.len - f.w - 34))}" r="2" fill="INK"/>`
    );
  }
  // flower chain across the knuckle line
  const chain = [[232, 452], [300, 438], [364, 452]];
  for (const [x, y] of chain) g += rose(x, y, 17);
  g += `<path d="M247 452 Q268 462 285 444 M315 444 Q334 462 350 452" fill="none" stroke="INK" stroke-width="1.8"/>`;
  g += mandalaFine(302, 548, 64, 10);
  // hanging drop from mandala
  g += `<line x1="302" y1="614" x2="302" y2="636" stroke="INK" stroke-width="1.8"/>`;
  g += `<g transform="translate(302 650)"><path d="${petal(18, 7)}" fill="INK"/></g>`;
  g += wristBand(668, true);
  return g;
}

const STYLES = [
  { slug: "bridal", painter: bridalPattern, nails: false, deep: true },
  { slug: "arabic", painter: arabicPattern, nails: true, deep: false },
  { slug: "indo-arabic", painter: indoArabicPattern, nails: true, deep: false },
  { slug: "traditional", painter: traditionalPattern, nails: false, deep: true },
  { slug: "minimal", painter: minimalPattern, nails: true, deep: false },
  { slug: "festive", painter: festivePattern, nails: true, deep: false },
];

/* ── Scene assembly ───────────────────────────────────────────── */

const SKINS = [
  { base: "#e8b98e", shade: "#c68f63", light: "#f6d7b4", nail: "#efc4a4" },
  { base: "#dcaa7f", shade: "#b3854f", light: "#efc9a2", nail: "#e6b795" },
  { base: "#f0c69f", shade: "#cf9c6d", light: "#f9ddc0", nail: "#f6d2b2" },
];
const BGS = [
  { top: "#fbf1e3", bot: "#f3d9c2", bokeh: "#d99a4e" },
  { top: "#fdf4ea", bot: "#eec9c2", bokeh: "#c96a6a" },
  { top: "#faf0dd", bot: "#e8d3ae", bokeh: "#b98a3a" },
];

function designSvg(style, v) {
  const rand = rng(style.slug.length * 131 + v * 37 + 7);
  const skin = SKINS[v % 3];
  const bg = BGS[v % 3];
  const id = `${style.slug}${v}`;
  const crisp = style.deep ? "#5f2410" : "#6e2c10";
  const stain = "#c96f33";

  const art = style.painter(rand, v);
  const mirror = v === 1 ? `transform="translate(${W} 0) scale(-1 1)"` : "";

  let bokeh = "";
  for (let i = 0; i < 7; i++) {
    bokeh += `<circle cx="${F(rand() * W)}" cy="${F(rand() * 260)}" r="${F(18 + rand() * 40)}" fill="${bg.bokeh}" opacity="${F(0.05 + rand() * 0.08)}" filter="url(#blur12)"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg.top}"/><stop offset="100%" stop-color="${bg.bot}"/>
    </linearGradient>
    <radialGradient id="vin${id}" cx="0.5" cy="0.42" r="0.75">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#3a1c08" stop-opacity="0.16"/>
    </radialGradient>
    <radialGradient id="skin${id.replace(/-/g, "")}x" cx="0.46" cy="0.4" r="0.9">
      <stop offset="0%" stop-color="${skin.light}"/><stop offset="55%" stop-color="${skin.base}"/><stop offset="100%" stop-color="${skin.shade}"/>
    </radialGradient>
    <radialGradient id="nail${id.replace(/-/g, "")}x" cx="0.4" cy="0.35" r="0.9">
      <stop offset="0%" stop-color="#fbe9d8"/><stop offset="100%" stop-color="${skin.nail}"/>
    </radialGradient>
    <clipPath id="hand${id.replace(/-/g, "")}x">${silhouetteClip()}</clipPath>
    <filter id="blur1"><feGaussianBlur stdDeviation="1"/></filter>
    <filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="blur12" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="blur16" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="stainF" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>
    <filter id="grainF"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.4 0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0.05 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg${id})"/>
  ${bokeh}
  <g ${mirror}>
    ${skinLayers(`${id.replace(/-/g, "")}x`, skin.base, skin.shade, skin.light, style.nails)}
    <g clip-path="url(#hand${id.replace(/-/g, "")}x)">
      <g filter="url(#stainF)" opacity="0.5">${art.replaceAll("INK2", stain).replaceAll("INK", stain)}</g>
      ${art.replaceAll("INK2", "#a3541e").replaceAll("INK", crisp)}
    </g>
  </g>
  <rect width="${W}" height="${H}" fill="url(#vin${id})"/>
  <rect width="${W}" height="${H}" filter="url(#grainF)" opacity="0.6"/>
</svg>`;
}

for (const style of STYLES) {
  for (let v = 0; v < 3; v++) {
    writeFileSync(join(outDir, `design-${style.slug}-${v + 1}.svg`), designSvg(style, v));
  }
}
console.log("Wrote 18 realistic design images (design-<style>-<n>.svg) to public/art/");
