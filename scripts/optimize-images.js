/**
 * optimize-images.js
 * Génère des variantes WebP + JPG fallback sans upscale.
 * Sources : images/chemins/, affiches et (optionnel) images/legacy/
 */

'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const CHEMINS_SRC = path.join(ROOT, 'images', 'chemins');
const CHEMINS_OUT = path.join(ROOT, 'images', 'chemins-opt');
const LEGACY_SRC = path.join(ROOT, 'images', 'legacy');
const LEGACY_OUT = path.join(ROOT, 'images', 'legacy-opt');
const MANIFEST_PATH = path.join(ROOT, 'images', 'image-manifest.json');

const CHEMIN_TARGETS = [480, 800, 1200];
const POSTER_TARGETS = [600, 1200];
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png']);

const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

/** @type {Array<object>} */
const reportRows = [];
/** @type {Record<string, object>} */
const manifest = {};

/**
 * Cibles WebP selon la largeur source (jamais d'upscale).
 * @param {number} sourceWidth
 * @param {number[]} targets
 * @returns {number[]}
 */
function pickWidths(sourceWidth, targets) {
  const valid = targets.filter(function (target) {
    return sourceWidth >= target;
  });

  if (valid.length === 0) {
    return [sourceWidth];
  }

  return valid;
}

/**
 * @param {string} filePath
 * @returns {Promise<{ width: number, height: number }>}
 */
async function readMeta(filePath) {
  const meta = await sharp(filePath).metadata();
  return {
    width: meta.width || 0,
    height: meta.height || 0
  };
}

/**
 * @param {string} srcPath
 * @param {string} destPath
 * @param {number} width
 * @param {'webp'|'jpeg'} format
 */
async function writeVariant(srcPath, destPath, width, format) {
  let pipeline = sharp(srcPath).rotate().resize({
    width: width,
    withoutEnlargement: true,
    fit: 'inside'
  }).sharpen({ sigma: 0.5 });

  if (format === 'webp') {
    pipeline = pipeline.webp({ quality: 84, effort: 6 });
  } else {
    pipeline = pipeline.jpeg({
      quality: 85,
      progressive: true,
      mozjpeg: true
    });
  }

  await pipeline.toFile(destPath);
}

/**
 * @param {string} srcPath
 * @param {string} outDir
 * @param {number[]} targets
 * @param {string} manifestKey
 */
async function processImage(srcPath, outDir, targets, manifestKey) {
  const meta = await readMeta(srcPath);
  const sourceWidth = meta.width;
  const sourceHeight = meta.height;
  const sourceSize = fs.statSync(srcPath).size;
  const ext = path.extname(srcPath);
  const baseName = path.basename(srcPath, ext);
  const widths = pickWidths(sourceWidth, targets);

  fs.mkdirSync(outDir, { recursive: true });

  const generated = [];
  let outputTotal = 0;

  for (var i = 0; i < widths.length; i++) {
    var w = widths[i];
    var webpPath = path.join(outDir, baseName + '-' + w + '.webp');
    await writeVariant(srcPath, webpPath, w, 'webp');
    generated.push(w + 'w webp');
    outputTotal += fs.statSync(webpPath).size;
  }

  var largest = widths[widths.length - 1];
  var jpgPath = path.join(outDir, baseName + '-' + largest + '.jpg');
  await writeVariant(srcPath, jpgPath, largest, 'jpeg');
  generated.push(largest + 'w jpg');
  outputTotal += fs.statSync(jpgPath).size;

  var relKey = manifestKey || path.relative(ROOT, srcPath).replace(/\\/g, '/');
  manifest[relKey] = {
    sourceWidth: sourceWidth,
    sourceHeight: sourceHeight,
    widths: widths,
    webp: widths.map(function (w) {
      return path.relative(ROOT, path.join(outDir, baseName + '-' + w + '.webp')).replace(/\\/g, '/');
    }),
    jpg: path.relative(ROOT, jpgPath).replace(/\\/g, '/')
  };

  reportRows.push({
    file: path.relative(ROOT, srcPath),
    sourceWidth: sourceWidth,
    variants: generated.join(', '),
    before: sourceSize,
    after: outputTotal,
    lowRes: sourceWidth < 800
  });
}

/**
 * Parcourt récursivement un dossier source.
 * @param {string} srcDir
 * @param {string} outDir
 * @param {number[]} targets
 */
async function processDirectory(srcDir, outDir, targets) {
  if (!fs.existsSync(srcDir)) {
    console.warn('Dossier absent : ' + srcDir);
    return;
  }

  var entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var srcPath = path.join(srcDir, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(srcPath, path.join(outDir, entry.name), targets);
      continue;
    }

    var ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;

    await processImage(srcPath, path.join(outDir, path.dirname(entry.name) === '.' ? '' : path.basename(srcDir) === path.basename(outDir) ? entry.name : ''), targets, null);
  }
}

/** Chemins récursif avec préservation de l'arborescence */
async function processCheminsTree() {
  if (!fs.existsSync(CHEMINS_SRC)) return;

  async function walk(relativeDir) {
    var currentSrc = path.join(CHEMINS_SRC, relativeDir);
    var currentOut = path.join(CHEMINS_OUT, relativeDir);
    var entries = fs.readdirSync(currentSrc, { withFileTypes: true });

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var rel = path.join(relativeDir, entry.name);

      if (entry.isDirectory()) {
        await walk(rel);
        continue;
      }

      var ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXT.has(ext)) continue;

      var srcPath = path.join(CHEMINS_SRC, rel);
      var outDir = path.join(CHEMINS_OUT, path.dirname(rel));
      var manifestKey = 'chemins/' + rel.replace(/\\/g, '/');
      await processImage(srcPath, outDir, CHEMIN_TARGETS, manifestKey);
    }
  }

  await walk('');
}

/** Affiches à la racine de images/ */
async function processPosters() {
  var imagesDir = path.join(ROOT, 'images');
  var postersOut = path.join(ROOT, 'images', 'posters-opt');
  var oldAffiche = path.join(imagesDir, '702612740_1390186716468098_5944499274401343429_n.jpg');
  var newAffiche = path.join(imagesDir, 'affiche-castetarbe-en-fete.jpg');

  if (fs.existsSync(oldAffiche) && !fs.existsSync(newAffiche)) {
    fs.copyFileSync(oldAffiche, newAffiche);
    console.log('Renommé : affiche-castetarbe-en-fete.jpg');
  }

  var posters = [
    { src: newAffiche, key: 'posters/affiche-castetarbe-en-fete.jpg' }
  ];

  for (var i = 0; i < posters.length; i++) {
    if (!fs.existsSync(posters[i].src)) {
      console.warn('Affiche absente : ' + posters[i].src);
      continue;
    }
    await processImage(posters[i].src, postersOut, POSTER_TARGETS, posters[i].key);
  }
}

/** Legacy (après fetch-legacy-images.js) */
async function processLegacy() {
  if (!fs.existsSync(LEGACY_SRC)) return;

  var files = fs.readdirSync(LEGACY_SRC);
  for (var i = 0; i < files.length; i++) {
    var name = files[i];
    var ext = path.extname(name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;

    var srcPath = path.join(LEGACY_SRC, name);
    var meta = await readMeta(srcPath);
    var targets = meta.width >= 600 ? [480, 800, 1200] : CHEMIN_TARGETS;
    if (name.startsWith('plan-') || name.startsWith('hero') || name.startsWith('apropos')) {
      targets = meta.width >= 1200 ? [600, 800, 1200] : pickWidths(meta.width, [600, 800, 1200]);
    }

    await processImage(srcPath, LEGACY_OUT, targets.filter(function (t, idx, arr) {
      return arr.indexOf(t) === idx;
    }), 'legacy/' + name);
  }
}

function printReport() {
  console.log('\n' + BOLD + 'Rapport d\'optimisation' + RESET);
  console.log('─'.repeat(100));
  console.log(
    pad('Fichier', 48) +
    pad('Source', 8) +
    pad('Variantes', 28) +
    pad('Avant', 10) +
    pad('Après', 10)
  );
  console.log('─'.repeat(100));

  var totalBefore = 0;
  var totalAfter = 0;

  reportRows.forEach(function (row) {
    totalBefore += row.before;
    totalAfter += row.after;
    var line =
      pad(row.file, 48) +
      pad(String(row.sourceWidth) + 'px', 8) +
      pad(row.variants, 28) +
      pad(formatBytes(row.before), 10) +
      pad(formatBytes(row.after), 10);

    if (row.lowRes) {
      console.log(RED + line + RESET);
    } else {
      console.log(line);
    }
  });

  console.log('─'.repeat(100));
  console.log(
    pad('TOTAL', 48) +
    pad('', 8) +
    pad('', 28) +
    pad(formatBytes(totalBefore), 10) +
    pad(formatBytes(totalAfter), 10)
  );

  var lowCount = reportRows.filter(function (r) { return r.lowRes; }).length;
  if (lowCount > 0) {
    console.log('\n' + RED + lowCount + ' fichier(s) source < 800 px de large (affichés en rouge).' + RESET);
  }
}

function pad(str, len) {
  return String(str).padEnd(len).slice(0, len);
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function main() {
  console.log('Optimisation des images (sans upscale)…\n');

  if (fs.existsSync(CHEMINS_OUT)) {
    fs.rmSync(CHEMINS_OUT, { recursive: true, force: true });
  }

  await processCheminsTree();
  await processPosters();

  if (fs.existsSync(LEGACY_SRC)) {
    if (fs.existsSync(LEGACY_OUT)) {
      fs.rmSync(LEGACY_OUT, { recursive: true, force: true });
    }
    await processLegacy();
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  fs.writeFileSync(
    path.join(ROOT, 'js', 'image-manifest.js'),
    'window.IMAGE_MANIFEST = ' + JSON.stringify(manifest) + ';\n',
    'utf8'
  );
  console.log('\nManifeste : ' + path.relative(ROOT, MANIFEST_PATH));

  printReport();
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
