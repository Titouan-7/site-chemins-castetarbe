'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const FONTS = path.join(ROOT, 'fonts');

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Source+Sans+3:wght@300;400;500;600&display=swap';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function fetch(url, headers) {
  return new Promise(function (resolve, reject) {
    https
      .get(url, { headers: headers || {} }, function (res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          var loc = res.headers.location.startsWith('http')
            ? res.headers.location
            : 'https://fonts.googleapis.com' + res.headers.location;
          fetch(loc, headers).then(resolve).catch(reject);
          return;
        }
        var chunks = [];
        res.on('data', function (c) { chunks.push(c); });
        res.on('end', function () { resolve(Buffer.concat(chunks)); });
      })
      .on('error', reject);
  });
}

function fontFilename(family, weight, ext) {
  var slug = family.toLowerCase().replace(/\s+/g, '-');
  return slug + '-' + weight + '.' + ext;
}

async function main() {
  fs.mkdirSync(FONTS, { recursive: true });

  var css = (
    await fetch(CSS_URL, {
      'User-Agent': UA,
      Accept: 'text/css,*/*;q=0.1'
    })
  ).toString('utf8');

  if (css.indexOf('.woff2') === -1) {
    throw new Error('Google Fonts n\'a pas renvoyé de woff2 — vérifiez le User-Agent.');
  }

  var faceBlocks = css.match(/@font-face\s*\{[^}]+\}/g) || [];
  var faceRules = [];

  for (var i = 0; i < faceBlocks.length; i++) {
    var block = faceBlocks[i];
    var family = (block.match(/font-family:\s*'([^']+)'/) || [])[1];
    var weight = (block.match(/font-weight:\s*(\d+)/) || [])[1];
    var url = (block.match(/url\((https:[^)]+)\)/) || [])[1];
    if (!family || !weight || !url) continue;

    var ext = url.indexOf('.woff2') !== -1 ? 'woff2' : 'ttf';
    var file = fontFilename(family, weight, ext);
    var dest = path.join(FONTS, file);
    var buf = await fetch(url);
    fs.writeFileSync(dest, buf);
    console.log('OK', file);

    faceRules.push(
      "@font-face {\n" +
      "  font-family: '" + family + "';\n" +
      "  font-style: normal;\n" +
      "  font-weight: " + weight + ";\n" +
      "  font-display: swap;\n" +
      "  src: url('../fonts/" + file + "') format('" + (ext === 'woff2' ? 'woff2' : 'truetype') + "');\n" +
      '}'
    );
  }

  fs.writeFileSync(path.join(FONTS, '_faces.css'), faceRules.join('\n\n') + '\n');
  console.log('Écrit fonts/_faces.css (' + faceRules.length + ' @font-face)');
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
