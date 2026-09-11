const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const iconDir = __dirname;

function writePNG(width, height, pixelFn) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  const rawData = Buffer.alloc((1 + width * 4) * height);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      rawData[pos++] = r; rawData[pos++] = g; rawData[pos++] = b; rawData[pos++] = a;
    }
  }
  const idat = zlib.deflateSync(rawData);

  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })();

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF);
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type, 'ascii');
    const content = Buffer.concat([typeB, data]);
    const crcB = Buffer.alloc(4);
    crcB.writeUInt32BE(crc32(content) >>> 0);
    return Buffer.concat([len, typeB, data, crcB]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function drawIcon(size) {
  const cx = size / 2;
  const cy = size / 2;
  const bgRadius = size * 0.22;
  const dotR     = size * 0.14;
  const r1       = size * 0.27;
  const w1       = size * 0.055;
  const r2       = size * 0.40;
  const w2       = size * 0.035;
  const showR2   = size > 16;

  return writePNG(size, size, (x, y) => {
    const dx   = x - cx + 0.5;
    const dy   = y - cy + 0.5;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Rounded rect clip
    const rx   = Math.abs(x - cx + 0.5);
    const ry   = Math.abs(y - cy + 0.5);
    const half = size / 2;
    const br   = bgRadius;

    let inside = false;
    if (rx <= half - br) {
      inside = ry <= half;
    } else if (ry <= half - br) {
      inside = rx <= half;
    } else {
      const cdx = rx - (half - br);
      const cdy = ry - (half - br);
      inside = Math.sqrt(cdx * cdx + cdy * cdy) <= br;
    }
    if (!inside) return [0, 0, 0, 0];

    // Base: #1d61ea
    let R = 0x1d, G = 0x61, B = 0xea;

    function blend(sr, sg, sb, sa) {
      const fa = sa / 255;
      R = Math.round(sr * fa + R * (1 - fa));
      G = Math.round(sg * fa + G * (1 - fa));
      B = Math.round(sb * fa + B * (1 - fa));
    }

    // Outer ring
    if (showR2) {
      const od = Math.abs(dist - r2);
      if (od <= w2 + 1) {
        blend(255, 255, 255, Math.max(0, 1 - od / w2) * 0.38 * 255);
      }
    }

    // Inner ring
    const id = Math.abs(dist - r1);
    if (id <= w1 + 1) {
      blend(255, 255, 255, Math.max(0, 1 - id / w1) * 255);
    }

    // Center dot
    if (dist <= dotR) {
      blend(255, 255, 255, Math.min(255, (dotR - dist + 0.5) * 255));
    }

    return [R, G, B, 255];
  });
}

for (const size of [16, 48, 128]) {
  const png  = drawIcon(size);
  const outP = iconDir + '\\icon' + size + '.png';
  fs.writeFileSync(outP, png);
  console.log('Generated: icon' + size + '.png (' + png.length + ' bytes)');
}
console.log('All done!');
