/**
 * images.js — Helpers pour <picture> et lightbox à partir du manifeste d'optimisation
 */

'use strict';

var CARD_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px';
var HERO_SIZES = '100vw';
var CONTENT_SIZES = '(max-width: 768px) 100vw, 50vw';

/**
 * Normalise une clé ou un chemin (slashes avant).
 * @param {string} path
 * @returns {string}
 */
function normalizePath(path) {
  return String(path).replace(/\\/g, '/');
}

/**
 * @param {string} sourcePath — ex. images/chemins/Pachera/Pachera-01.jpg
 * @returns {object|null}
 */
function getManifestEntry(sourcePath) {
  if (!window.IMAGE_MANIFEST) return null;

  var normalized = normalizePath(sourcePath);

  var posterMap = {
    'images/affiche-castetarbe-en-fete.jpg': 'posters/affiche-castetarbe-en-fete.jpg'
  };

  if (posterMap[normalized]) {
    return window.IMAGE_MANIFEST[posterMap[normalized]] || null;
  }

  var key = normalized.replace(/^images\//, '');

  if (window.IMAGE_MANIFEST[key]) {
    return window.IMAGE_MANIFEST[key];
  }

  return null;
}

/**
 * @param {object} entry
 * @returns {string}
 */
function buildWebpSrcset(entry) {
  if (!entry || !entry.webp || !entry.webp.length) return '';
  return entry.webp.map(function (path, index) {
    return normalizePath(path) + ' ' + entry.widths[index] + 'w';
  }).join(', ');
}

/**
 * @param {object} entry
 * @returns {string}
 */
function getFallbackJpg(entry) {
  if (!entry || !entry.jpg) return '';
  return normalizePath(entry.jpg);
}

/**
 * @param {object} entry
 * @returns {string}
 */
function getLargestWebp(entry) {
  if (!entry || !entry.webp || !entry.webp.length) return getFallbackJpg(entry);
  return normalizePath(entry.webp[entry.webp.length - 1]);
}

/**
 * Construit le HTML d'un élément <picture>.
 * @param {string} sourcePath
 * @param {object} options
 * @returns {string}
 */
function buildPictureHTML(sourcePath, options) {
  var opts = options || {};
  var entry = getManifestEntry(sourcePath);
  var alt = opts.alt || '';
  var sizes = opts.sizes || CARD_SIZES;
  var loading = opts.loading || 'lazy';
  var imgClass = opts.className ? ' class="' + opts.className + '"' : '';
  var fetchpriority = opts.fetchpriority ? ' fetchpriority="' + opts.fetchpriority + '"' : '';
  var width = entry ? entry.sourceWidth : (opts.width || 800);
  var height = entry ? entry.sourceHeight : (opts.height || 600);
  var srcset = buildWebpSrcset(entry);
  var jpg = getFallbackJpg(entry) || normalizePath(sourcePath);

  var html = '<picture>';

  if (srcset) {
    html += '<source type="image/webp" srcset="' + srcset + '" sizes="' + sizes + '">';
  }

  html += '<img src="' + jpg + '" alt="' + alt + '" width="' + width + '" height="' + height + '"';
  html += ' loading="' + loading + '"' + fetchpriority + imgClass + '>';
  html += '</picture>';

  return html;
}

/**
 * URL lightbox — plus grande variante disponible.
 * @param {string} sourcePath
 * @returns {string}
 */
function getLightboxUrl(sourcePath) {
  var entry = getManifestEntry(sourcePath);
  if (entry) {
    return getLargestWebp(entry) || getFallbackJpg(entry);
  }
  return normalizePath(sourcePath);
}

window.Images = {
  CARD_SIZES: CARD_SIZES,
  HERO_SIZES: HERO_SIZES,
  CONTENT_SIZES: CONTENT_SIZES,
  normalizePath: normalizePath,
  getManifestEntry: getManifestEntry,
  buildWebpSrcset: buildWebpSrcset,
  getFallbackJpg: getFallbackJpg,
  getLargestWebp: getLargestWebp,
  buildPictureHTML: buildPictureHTML,
  getLightboxUrl: getLightboxUrl
};
