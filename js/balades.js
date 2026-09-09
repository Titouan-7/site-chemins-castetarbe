/**
 * balades.js — Cartes Leaflet des parcours + modale itinéraire grand tour
 */

'use strict';

/** Parcours préconçus : slug, nom, chemins traversés (identifiants TRAIL_TRACKS / trails.js) */
var BALADES = {
  barricots: {
    slug: 'barricots',
    nom: 'La boucle des Barricots',
    trails: ['ecole', 'touzaa', 'barricots', 'larroque', 'touya', 'ecole'],
    gpxFile: 'boucle-barricots.gpx',
    difficulty: 'easy',
    difficultyLabel: 'Facile'
  },
  '8-5km': {
    slug: '8-5km',
    nom: 'La 8,5 km',
    trails: ['peyraube', 'brana', 'lalanne', 'des-cretes', 'barricots', 'larroque', 'touya', 'ecole'],
    gpxFile: '8-5km.gpx',
    difficulty: 'medium',
    difficultyLabel: 'Moyen'
  },
  'grand-tour': {
    slug: 'grand-tour',
    nom: 'Le tour de Castétarbe (le grand tour)',
    trails: [],
    gpxFile: 'grand-tour.gpx',
    difficulty: 'medium',
    difficultyLabel: 'Moyen',
    useGrandTour: true
  }
};

var TRAILS_JS_IDS = typeof TRAILS !== 'undefined' ? Object.keys(TRAILS) : [];

function warnMissingTrails(balade) {
  balade.trails.forEach(function (trailId) {
    var inTracks = typeof TRAIL_TRACKS !== 'undefined' && TRAIL_TRACKS[trailId];
    var inTrailsJs = TRAILS_JS_IDS.indexOf(trailId) !== -1;
    if (!inTracks) {
      console.warn('[balades] Tracé GPS manquant pour « ' + trailId + ' » (' + balade.nom + ')');
    } else if (!inTrailsJs && ['ecole', 'touzaa', 'larroque', 'peyraube', 'brana', 'mounicq'].indexOf(trailId) === -1) {
      /* IDs géographiques sans fiche trails.js — normal */
    } else if (!inTrailsJs) {
      console.warn('[balades] Chemin « ' + trailId + ' » absent de trails.js (' + balade.nom + ')');
    }
  });
}

function formatKm(km) {
  return String(km).replace('.', ',') + ' km';
}

function updateBaladeBadges(card, slug) {
  if (!window.TrailMap || slug !== 'barricots') return;

  var track = window.TrailMap.getBaladeTrack(slug);
  if (!track || track.length < 2) return;

  var km = window.TrailMap.trackDistanceKm(track);
  var duration = window.TrailMap.estimateDuration(track);
  var distanceBadge = card.querySelector('.balade-badge--distance');
  var durationBadge = card.querySelector('.balade-badge--duration');

  if (distanceBadge) distanceBadge.textContent = formatKm(km);
  if (durationBadge) durationBadge.textContent = duration;
}

function initBaladeMaps() {
  if (typeof L === 'undefined' || !window.TrailMap) return;

  document.querySelectorAll('.balade-card[data-balade]').forEach(function (card) {
    var slug = card.getAttribute('data-balade');
    var balade = BALADES[slug];
    if (!balade) return;

    warnMissingTrails(balade);

    var mapId = 'balade-map-' + slug;
    if (document.getElementById(mapId)) {
      window.TrailMap.createMiniMap(mapId, slug);
    }

    updateBaladeBadges(card, slug);

    var expandBtn = card.querySelector('.balade-map__expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', function () {
        window.TrailMap.highlightBalade(slug);
      });
    }
  });
}

/* ── Modale itinéraire grand tour ─────────────────────────────── */

var itineraryModal = document.getElementById('itinerary-modal');
var itineraryModalClose = document.getElementById('itinerary-modal-close');
var itineraryModalBackdrop = document.getElementById('itinerary-modal-backdrop');
var itineraryOpenBtn = document.getElementById('open-grand-tour-itinerary');
var itineraryLastFocused = null;

function onItineraryKeydown(event) {
  if (!itineraryModal || !itineraryModal.classList.contains('trail-modal--open')) return;
  var dialog = itineraryModal.querySelector('.trail-modal__dialog');
  if (window.A11y && dialog) {
    window.A11y.handleFocusTrap(event, dialog);
  }
}

function openItineraryModal() {
  if (!itineraryModal) return;
  itineraryLastFocused = document.activeElement;
  itineraryModal.classList.add('trail-modal--open');
  itineraryModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  itineraryModalClose.focus();
  itineraryModal.addEventListener('keydown', onItineraryKeydown);
}

function closeItineraryModal() {
  if (!itineraryModal) return;
  itineraryModal.classList.remove('trail-modal--open');
  itineraryModal.setAttribute('aria-hidden', 'true');
  itineraryModal.removeEventListener('keydown', onItineraryKeydown);
  document.body.style.overflow = '';
  if (itineraryLastFocused) {
    itineraryLastFocused.focus();
    itineraryLastFocused = null;
  }
}

if (itineraryOpenBtn) {
  itineraryOpenBtn.addEventListener('click', openItineraryModal);
}
if (itineraryModalClose) {
  itineraryModalClose.addEventListener('click', closeItineraryModal);
}
if (itineraryModalBackdrop) {
  itineraryModalBackdrop.addEventListener('click', closeItineraryModal);
}

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape' || !itineraryModal || !itineraryModal.classList.contains('trail-modal--open')) {
    return;
  }
  var lightboxEl = document.getElementById('lightbox');
  if (lightboxEl && lightboxEl.classList.contains('lightbox--open')) return;
  closeItineraryModal();
});

document.addEventListener('DOMContentLoaded', function () {
  initBaladeMaps();
});

window.BALADES = BALADES;
