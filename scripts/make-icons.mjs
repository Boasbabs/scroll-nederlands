// Draws the toolbar icon (Dutch-orange rounded tile with a white speech bubble) as PNGs.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (const byte of buf) {
    c = (crc ^ byte) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function insideRoundedRect(x, y, x0, y0, x1, y1, r) {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function coverage(size, test) {
  // 4x4 supersampling for smooth edges.
  return (px, py) => {
    let hits = 0;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (test((px + (i + 0.5) / 4) / size, (py + (j + 0.5) / 4) / size)) hits++;
    return hits / 16;
  };
}

function icon(size) {
  const tile = coverage(size, (x, y) => insideRoundedRect(x, y, 0.02, 0.02, 0.98, 0.98, 0.22));
  const bubble = coverage(size, (x, y) => insideRoundedRect(x, y, 0.2, 0.22, 0.8, 0.66, 0.12) || (x > 0.3 && x < 0.46 && y > 0.6 && y < 0.8 && x - 0.3 < (0.8 - y) * 0.9));
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = [0];
    for (let x = 0; x < size; x++) {
      const t = tile(x, y);
      const b = bubble(x, y) * t;
      const r = Math.round(232 * (1 - b) + 255 * b);
      const g = Math.round(101 * (1 - b) + 255 * b);
      const bl = Math.round(12 * (1 - b) + 255 * b);
      row.push(r, g, bl, Math.round(255 * t));
    }
    rows.push(Buffer.from(row));
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [16, 32, 48, 128]) writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), icon(size));
console.log('icons written');
