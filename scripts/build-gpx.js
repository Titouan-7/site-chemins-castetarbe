/**
 * build-gpx.js — Génère parcours/*.gpx et js/trail-tracks.js depuis grand-tour.gpx
 * Usage : npm run build-gpx
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GPX_PATH = path.join(ROOT, 'parcours', 'grand-tour.gpx');
const OUT_DIR = path.join(ROOT, 'parcours');
const JS_OUT = path.join(ROOT, 'js', 'trail-tracks.js');

function parseGpxTrack(gpxText) {
  const points = [];
  const re = /<trkpt lat="([^"]+)" lon="([^"]+)"/g;
  let m;
  while ((m = re.exec(gpxText))) {
    points.push([parseFloat(m[1]), parseFloat(m[2])]);
  }
  return points;
}

function haversine(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function trackDistanceKm(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversine(pts[i - 1], pts[i]);
  return Math.round((d / 1000) * 10) / 10;
}

function nearestIndex(track, coord) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < track.length; i++) {
    const d = haversine(track[i], coord);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function sliceDirected(track, fromIdx, toIdx) {
  if (fromIdx === toIdx) return [track[fromIdx]];
  if (fromIdx < toIdx) return track.slice(fromIdx, toIdx + 1);
  return track.slice(toIdx, fromIdx + 1).reverse();
}

function concatTracks(segments) {
  const out = [];
  segments.forEach(function (seg) {
    if (!seg || !seg.length) return;
    if (!out.length) {
      out.push.apply(out, seg);
      return;
    }
    if (haversine(out[out.length - 1], seg[0]) < 25) {
      out.push.apply(out, seg.slice(1));
    } else {
      out.push.apply(out, seg);
    }
  });
  return out;
}

function buildRoute(track, idx, trailIds) {
  const segs = [];
  for (let i = 0; i < trailIds.length - 1; i++) {
    const from = idx[trailIds[i]];
    const to = idx[trailIds[i + 1]];
    if (from === undefined || to === undefined) continue;
    segs.push(sliceDirected(track, from, to));
  }
  return concatTracks(segs);
}

function toGpx(name, points) {
  var lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="Au bout du chemin" xmlns="http://www.topografix.com/GPX/1/1">',
    '  <trk>',
    '    <name>' + name + '</name>',
    '    <trkseg>'
  ];
  points.forEach(function (pt) {
    lines.push('      <trkpt lat="' + pt[0] + '" lon="' + pt[1] + '"></trkpt>');
  });
  lines.push('    </trkseg>', '  </trk>', '</gpx>');
  return lines.join('\n');
}

const grandTourTrack = parseGpxTrack(fs.readFileSync(GPX_PATH, 'utf8'));

/** Ancres GPS — identifiants partagés avec trails.js quand applicable */
const TRAIL_ANCHORS = {
  parking: [43.494091, -0.81047],
  ecole: [43.49885, -0.81035],
  touya: [43.498773, -0.810152],
  larroque: [43.498932, -0.813702],
  touzaa: [43.5018, -0.8175],
  barricots: [43.504131, -0.820153],
  peyraube: [43.498696, -0.80309],
  brana: [43.506512, -0.799319],
  lalanne: [43.50711, -0.797887],
  'des-cretes': [43.51588, -0.790988],
  mounicq: [43.513948, -0.815235],
  jacob: [43.4975, -0.8098],
  menain: [43.4992, -0.8085],
  pachera: [43.4978, -0.8055],
  beller: [43.5045, -0.8012],
  'du-lac': [43.5038, -0.8025]
};

const idx = {};
Object.keys(TRAIL_ANCHORS).forEach(function (id) {
  idx[id] = nearestIndex(grandTourTrack, TRAIL_ANCHORS[id]);
});

/** Tracés affichables individuellement (fond gris des mini-cartes) */
const TRAIL_DISPLAY = {
  ecole: buildRoute(grandTourTrack, idx, ['touya', 'ecole']),
  touya: buildRoute(grandTourTrack, idx, ['ecole', 'touya']),
  larroque: buildRoute(grandTourTrack, idx, ['touya', 'larroque']),
  touzaa: buildRoute(grandTourTrack, idx, ['larroque', 'touzaa']),
  barricots: buildRoute(grandTourTrack, idx, ['touzaa', 'barricots', 'larroque']),
  peyraube: buildRoute(grandTourTrack, idx, ['ecole', 'peyraube']),
  brana: buildRoute(grandTourTrack, idx, ['peyraube', 'brana']),
  lalanne: buildRoute(grandTourTrack, idx, ['brana', 'lalanne']),
  'des-cretes': buildRoute(grandTourTrack, idx, ['lalanne', 'des-cretes']),
  jacob: buildRoute(grandTourTrack, idx, ['ecole', 'peyraube']),
  menain: buildRoute(grandTourTrack, idx, ['barricots', 'touya']),
  mounicq: buildRoute(grandTourTrack, idx, ['des-cretes', 'mounicq']),
  pachera: buildRoute(grandTourTrack, idx, ['peyraube', 'brana']).slice(0, 25),
  beller: buildRoute(grandTourTrack, idx, ['brana', 'lalanne']).slice(0, 20),
  'du-lac': buildRoute(grandTourTrack, idx, ['peyraube', 'brana']).slice(10, 35)
};

const BALADE_ROUTES = {
  barricots: ['ecole', 'touzaa', 'barricots', 'larroque', 'touya', 'ecole'],
  '8-5km': ['peyraube', 'brana', 'lalanne', 'des-cretes', 'barricots', 'larroque', 'touya', 'ecole'],
  'grand-tour': null
};

const BALADE_TRACKS = {
  barricots: buildRoute(grandTourTrack, idx, BALADE_ROUTES.barricots),
  '8-5km': buildRoute(grandTourTrack, idx, BALADE_ROUTES['8-5km']),
  'grand-tour': grandTourTrack
};

fs.writeFileSync(
  path.join(OUT_DIR, 'boucle-barricots.gpx'),
  toGpx('La boucle des Barricots', BALADE_TRACKS.barricots)
);
fs.writeFileSync(
  path.join(OUT_DIR, '8-5km.gpx'),
  toGpx('La 8,5 km', BALADE_TRACKS['8-5km'])
);

const jsPayload = {
  TRAIL_ANCHORS: TRAIL_ANCHORS,
  TRAIL_TRACKS: TRAIL_DISPLAY,
  BALADE_TRACKS: BALADE_TRACKS,
  BALADE_ROUTES: BALADE_ROUTES,
  BALADE_DISTANCES_KM: {
    barricots: trackDistanceKm(BALADE_TRACKS.barricots),
    '8-5km': trackDistanceKm(BALADE_TRACKS['8-5km']),
    'grand-tour': trackDistanceKm(BALADE_TRACKS['grand-tour'])
  }
};

const js =
  '/**\n * trail-tracks.js — Tronçons GPS (généré par scripts/build-gpx.js)\n */\n\n' +
  '\'use strict\';\n\n' +
  Object.keys(jsPayload)
    .map(function (key) {
      return 'var ' + key + ' = ' + JSON.stringify(jsPayload[key]) + ';';
    })
    .join('\n\n') +
  '\n';

fs.writeFileSync(JS_OUT, js);

console.log('Généré : js/trail-tracks.js');
console.log('Distances :', jsPayload.BALADE_DISTANCES_KM);
