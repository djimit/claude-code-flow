const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const sharp = require('sharp');

test('archived dependency locks contain no unused vulnerable ZIP installer', () => {
  for (const file of ['package-lock.json', 'pnpm-lock.yaml']) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /extract-zip/);
  }
});

test('patched native image library preserves SVG decoding and PNG encoding', async () => {
  assert.equal(sharp.versions.sharp, '0.35.5');
  assert.equal(sharp.versions.rsvg, '2.63.2');
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="3"><rect width="2" height="3" fill="red"/></svg>');
  const png = await sharp(svg).png().toBuffer();
  const metadata = await sharp(png).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 2);
  assert.equal(metadata.height, 3);
});
