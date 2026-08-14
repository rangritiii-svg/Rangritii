// Generates PWA PNG icons (192/512/180) with pure Node — no dependencies.
// Draws the Rangritii mark: maroon rounded square, marigold mandala flower, cream bindi.
// The 180px apple-touch-icon is full-bleed (iOS rounds corners itself).
// Run: node scripts/generate-icons.mjs  (output: public/icons/*.png)
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const MAROON = [139, 30, 63, 255];
const GOLD = [201, 151, 63, 255];
const CREAM = [253, 251, 247, 255];

function makeIcon(size, fullBleed = false) {
  const px = new Uint8Array(size * size * 4);
  const c = size / 2;
  const r = size * 0.22; // corner radius
  const flowerR = size * 0.335; // 8-petal mandala rose
  const heartR = size * 0.155; // inner deep-maroon rose
  const bindi = size * 0.062;
  const dotRingR = size * 0.425;
  const dotR = size * 0.024;
  const DEEP = [92, 16, 39, 255];

  // precompute the 12 dot-ring centers
  const dots = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return [c + dotRingR * Math.cos(a), c + dotRingR * Math.sin(a)];
  });

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (!fullBleed) {
        // rounded-rect test → transparent corner
        const dx = Math.max(Math.abs(x - c) - (c - r), 0);
        const dy = Math.max(Math.abs(y - c) - (c - r), 0);
        if (dx * dx + dy * dy > r * r) continue;
      }
      let col = MAROON;
      const dist = Math.hypot(x - c, y - c);
      const theta = Math.atan2(y - c, x - c);
      // gold rose: r(θ) with 8 lobes
      if (dist < flowerR * (0.6 + 0.4 * Math.cos(8 * theta))) col = GOLD;
      // deep inner rose, offset half a petal
      if (dist < heartR * (0.62 + 0.38 * Math.cos(8 * theta + Math.PI))) col = DEEP;
      // cream bindi centre
      if (dist < bindi) col = CREAM;
      // cream dot ring
      for (const [dx2, dy2] of dots) {
        if (Math.hypot(x - dx2, y - dy2) < dotR) { col = CREAM; break; }
      }
      px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2]; px[i + 3] = col[3];
    }
  }
  return encodePng(size, size, px);
}

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let cc = n;
      for (let k = 0; k < 8; k++) cc = cc & 1 ? 0xedb88320 ^ (cc >>> 1) : cc >>> 1;
      table[n] = cc;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512, 180]) {
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  writeFileSync(join(outDir, name), makeIcon(size, size === 180));
  console.log(`Wrote public/icons/${name}`);
}
