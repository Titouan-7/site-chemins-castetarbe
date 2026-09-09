/**
 * map.js — Carte Leaflet principale + API partagée pour les balades
 */

'use strict';

var TrailMap = (function () {
  var mainMap = null;
  var mainHighlight = null;
  var mainStartMarker = null;
  var defaultTrack = null;

  function haversineKm(a, b) {
    var R = 6371000;
    var toRad = function (d) { return (d * Math.PI) / 180; };
    var dLat = toRad(b[0] - a[0]);
    var dLng = toRad(b[1] - a[1]);
    var h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return (2 * R * Math.asin(Math.sqrt(h))) / 1000;
  }

  function trackDistanceKm(points) {
    var total = 0;
    for (var i = 1; i < points.length; i++) {
      total += haversineKm(points[i - 1], points[i]);
    }
    return Math.round(total * 10) / 10;
  }

  function estimateDuration(points) {
    var hours = trackDistanceKm(points) / 4;
    var totalMin = Math.round(hours * 60);
    if (totalMin < 60) return '≈ ' + totalMin + ' min';
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    if (m === 0) return '≈ ' + h + ' h';
    return '≈ ' + h + ' h ' + m;
  }

  function fixLeafletIcons() {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });
  }

  function createBaseLayer(map) {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
  }

  function greenStartIcon() {
    return L.divIcon({
      className: 'balade-start-marker',
      html: '<span aria-hidden="true"></span>',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  }

  function drawGrayTrails(map) {
    var layers = [];
    if (typeof TRAIL_TRACKS === 'undefined') return layers;

    Object.keys(TRAIL_TRACKS).forEach(function (id) {
      var pts = TRAIL_TRACKS[id];
      if (!pts || pts.length < 2) return;
      layers.push(
        L.polyline(pts, {
          color: '#c8c4bc',
          weight: 2,
          opacity: 0.85
        }).addTo(map)
      );
    });
    return layers;
  }

  function getBaladeTrack(slug) {
    if (slug === 'grand-tour' && typeof grandTourTrack !== 'undefined' && grandTourTrack.length) {
      return grandTourTrack;
    }
    if (typeof BALADE_TRACKS !== 'undefined' && BALADE_TRACKS[slug]) {
      return BALADE_TRACKS[slug];
    }
    return [];
  }

  function getBaladeDepart(slug) {
    if (slug === 'grand-tour' && typeof grandTourStart !== 'undefined') {
      return grandTourStart;
    }
    if (typeof TRAIL_ANCHORS !== 'undefined' && TRAIL_ANCHORS.ecole) {
      return TRAIL_ANCHORS.ecole;
    }
    var track = getBaladeTrack(slug);
    return track.length ? track[0] : null;
  }

  function drawBaladeOnMap(map, slug, options) {
    options = options || {};
    var track = getBaladeTrack(slug);
    if (!track || track.length < 2) return null;

    var line = L.polyline(track, {
      color: '#c0392b',
      weight: options.weight || 5,
      opacity: 0.92
    }).addTo(map);

    var depart = getBaladeDepart(slug);
    var marker = null;
    if (depart) {
      marker = L.marker(depart, { icon: greenStartIcon() })
        .addTo(map)
        .bindPopup('Départ');
    }

    map.fitBounds(line.getBounds(), { padding: options.padding || [20, 20] });

    return { line: line, marker: marker, track: track };
  }

  function createMiniMap(containerId, slug) {
    var el = document.getElementById(containerId);
    if (!el || typeof L === 'undefined') return null;

    el.classList.add('balade-map--ready');

    var map = L.map(containerId, {
      scrollWheelZoom: false,
      attributionControl: false,
      zoomControl: false
    });

    createBaseLayer(map);
    drawGrayTrails(map);
    drawBaladeOnMap(map, slug, { padding: [20, 20] });

    return map;
  }

  function clearMainHighlight() {
    if (mainHighlight) {
      mainMap.removeLayer(mainHighlight.line);
      if (mainHighlight.marker) mainMap.removeLayer(mainHighlight.marker);
      mainHighlight = null;
    }
    if (defaultTrack) {
      defaultTrack.setStyle({ opacity: 0.85, weight: 4 });
    }
  }

  function highlightBalade(slug) {
    if (!mainMap) return;

    clearMainHighlight();

    if (defaultTrack) {
      defaultTrack.setStyle({ opacity: 0.25, weight: 3 });
    }

    mainHighlight = drawBaladeOnMap(mainMap, slug, { padding: [48, 48], weight: 6 });

    var carte = document.getElementById('carte');
    if (carte) {
      carte.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function initMainMap() {
    var mapEl = document.getElementById('trail-map');
    if (!mapEl || typeof L === 'undefined') {
      if (mapEl) {
        mapEl.innerHTML =
          '<p class="map-fallback" role="status">' +
          'La carte interactive n\'a pas pu se charger. Vérifiez votre connexion ou réessayez plus tard.' +
          '</p>';
      }
      return;
    }

    fixLeafletIcons();

    mainMap = L.map('trail-map', { scrollWheelZoom: true });
    createBaseLayer(mainMap);

    if (typeof grandTourTrack !== 'undefined' && grandTourTrack.length) {
      defaultTrack = L.polyline(grandTourTrack, {
        color: '#c0392b',
        weight: 4,
        opacity: 0.85
      }).addTo(mainMap);
      mainMap.fitBounds(defaultTrack.getBounds(), { padding: [48, 48] });
    }

    if (typeof grandTourStart !== 'undefined') {
      L.marker(grandTourStart)
        .addTo(mainMap)
        .bindPopup('Salle Piquemal — parking et départ');
    }

    if (typeof grandTourWaypoints !== 'undefined') {
      grandTourWaypoints.forEach(function (waypoint) {
        if (waypoint.name !== 'Point de vue du Barat') return;
        var coords = waypoint.coord || waypoint.coords || [waypoint.lat, waypoint.lng];
        L.marker(coords)
          .addTo(mainMap)
          .bindPopup('Point de vue sur les Pyrénées');
      });
    }

    var coordsEl = document.getElementById('map-coords');
    mainMap.on('click', function (event) {
      if (!coordsEl) return;
      coordsEl.textContent =
        event.latlng.lat.toFixed(6) + ', ' + event.latlng.lng.toFixed(6);
      coordsEl.classList.add('map-coords--visible');
    });
  }

  return {
    initMainMap: initMainMap,
    createMiniMap: createMiniMap,
    highlightBalade: highlightBalade,
    trackDistanceKm: trackDistanceKm,
    estimateDuration: estimateDuration,
    getBaladeTrack: getBaladeTrack
  };
})();

document.addEventListener('DOMContentLoaded', function () {
  TrailMap.initMainMap();
});

window.TrailMap = TrailMap;
