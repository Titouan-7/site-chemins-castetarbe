'use strict';

const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'images', 'logo.png');
const OUT = path.join(ROOT, 'favicon.ico');

async function main() {
  var sizes = [16, 32, 48];
  var pngBuffers = await Promise.all(
    sizes.map(function (size) {
      return sharp(SRC)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    })
  );

  var ico = await toIco(pngBuffers);
  require('fs').writeFileSync(OUT, ico);
  console.log('Généré : favicon.ico (' + sizes.join(', ') + ' px)');
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
