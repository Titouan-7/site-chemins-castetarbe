/**
 * fetch-legacy-images.js
 * Télécharge les images encore hébergées sur lescheminsdecastetarbe.fr
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'images', 'legacy');

/** @type {Array<{ url: string, name: string }>} */
const LEGACY_IMAGES = [
  {
    url: 'https://www.lescheminsdecastetarbe.fr/wp-content/uploads/2019/04/cropped-859380_1001699109872304_6259550869053024242_o.jpg',
    name: 'hero.jpg'
  },
  {
    url: 'https://www.lescheminsdecastetarbe.fr/wp-content/uploads/2019/04/IMG_20190410_093542-1024x768.jpg',
    name: 'apropos.jpg'
  },
  {
    url: 'https://www.lescheminsdecastetarbe.fr/wp-content/uploads/2022/01/carte-des-chemins-Castetarbe.png',
    name: 'plan-chemins-castetarbe.png'
  },
  {
    url: 'https://www.lescheminsdecastetarbe.fr/wp-content/uploads/2019/04/85-km-1024x640.png',
    name: 'plan-8-5km.png'
  }
];

/**
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
function download(url) {
  return new Promise(function (resolve, reject) {
    var client = url.startsWith('https') ? https : http;

    client.get(url, function (response) {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        download(response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error('HTTP ' + response.statusCode + ' pour ' + url));
        return;
      }

      var chunks = [];
      response.on('data', function (chunk) { chunks.push(chunk); });
      response.on('end', function () { resolve(Buffer.concat(chunks)); });
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Téléchargement des images legacy…\n');

  for (var i = 0; i < LEGACY_IMAGES.length; i++) {
    var item = LEGACY_IMAGES[i];
    var dest = path.join(OUT_DIR, item.name);

    try {
      var data = await download(item.url);
      fs.writeFileSync(dest, data);
      console.log('OK  ' + item.name + ' (' + (data.length / 1024).toFixed(1) + ' KB)');
    } catch (err) {
      console.error('ERR ' + item.name + ' : ' + err.message);
    }
  }

  console.log('\nTerminé. Lancez npm run images pour optimiser images/legacy/.');
}

main();
