import { deflateSync } from 'zlib';
import { mkdirSync, writeFileSync } from 'fs';

const crcTable = new Uint32Array(256).map((_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function setPixel(pixels, size, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const offset = (y * size + x) * 4;
  pixels[offset] = r;
  pixels[offset + 1] = g;
  pixels[offset + 2] = b;
  pixels[offset + 3] = a;
}

function generateIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const center = (size - 1) / 2;
  const radius = size * 0.47;
  const stem = Math.max(2, Math.round(size * 0.15));
  const bar = Math.max(2, Math.round(size * 0.14));
  const left = Math.round(size * 0.31);
  const right = Math.round(size * 0.62);
  const top = Math.round(size * 0.23);
  const bottom = Math.round(size * 0.76);
  const mid = Math.round(size * 0.5);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - center;
      const dy = y - center;
      const inside = Math.sqrt(dx * dx + dy * dy) <= radius;
      if (inside) setPixel(pixels, size, x, y, 36, 107, 80, 255);
    }
  }

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x < left + stem; x += 1) setPixel(pixels, size, x, y, 255, 255, 255);
    for (let x = right; x < right + stem; x += 1) setPixel(pixels, size, x, y, 255, 255, 255);
  }
  for (let y = mid - Math.floor(bar / 2); y <= mid + Math.floor(bar / 2); y += 1) {
    for (let x = left; x < right + stem; x += 1) setPixel(pixels, size, x, y, 255, 255, 255);
  }

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
[16, 48, 128].forEach((size) => {
  writeFileSync(`public/icons/icon${size}.png`, generateIcon(size));
});
