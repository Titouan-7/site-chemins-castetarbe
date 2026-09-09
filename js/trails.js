/**
 * trails.js — Données des sentiers + modale de fiche détaillée
 */

'use strict';

/** Galerie locale : images/chemins/<dossier>/<dossier>-01.jpg … */
function localPhotos(folder, count) {
  var photos = [];
  var total = count || 5;

  for (var i = 1; i <= total; i++) {
    var num = i < 10 ? '0' + i : String(i);
    photos.push({
      img: 'images/chemins/' + folder + '/' + folder + '-' + num + '.jpg',
      legend: ''
    });
  }

  return photos;
}

function trailThumb(folder, num) {
  var suffix = num || '01';
  return 'images/chemins/' + folder + '/' + folder + '-' + suffix + '.jpg';
}

/* ── Données de chaque chemin ─────────────────────────────────── */

var TRAILS = {
  pachera: {
    title: 'Le chemin Pachera',
    description: 'Il permet de remonter vers le chemin de Tâche depuis le chemin Cametot en évitant la route. On peut ensuite enchaîner avec le chemin Peyraube.',
    depart: 'côté chemin Cametot.',
    thumb: trailThumb('Pachera'),
    enChantier: false,
    etapes: localPhotos('Pachera', 1)
  },

  jacob: {
    title: 'Le chemin Jacob',
    description: 'Il fait le lien avec d\'autres chemins sans passer par la route. Des panneaux en bois indiquent la voie dans les deux sens.',
    depart: 'chemin Mesplé ou chemin de l\'école.',
    thumb: trailThumb('Jacob'),
    enChantier: false,
    etapes: localPhotos('Jacob')
  },

  barricots: {
    title: 'Le chemin des Barricots',
    description: 'Dix mois de travail pour redonner vie à ce chemin, qui relie le chemin Larroque au chemin Touzaa. Il alterne les passages à découvert au milieu des champs de maïs et une sente sous une voûte de châtaigniers.',
    depart: 'côté Larroque (chemin de Haurou) ou côté Touzaa (petit sentier au milieu des bambous).',
    thumb: trailThumb('Barricots'),
    enChantier: false,
    etapes: localPhotos('Barricots')
  },

  touya: {
    title: 'Le chemin de Touya',
    description: 'Le tout premier chemin nettoyé par l\'association. Il part de l\'école de Castétarbe pour rejoindre le chemin Pouyanne, avec une bifurcation possible vers le chemin de Menain à mi-parcours.',
    depart: 'école de Castétarbe.',
    thumb: trailThumb('Menain-Touya'),
    enChantier: false,
    etapes: localPhotos('Menain-Touya')
  },

  menain: {
    title: 'Le chemin de Menain',
    description: 'Il rejoint le chemin de Touya dans la forêt, depuis le chemin Ménain goudronné.',
    depart: 'chemin Ménain goudronné.',
    thumb: trailThumb('Menain-Touya', '02'),
    enChantier: false,
    etapes: localPhotos('Menain-Touya')
  },

  justine: {
    title: 'Le chemin de Justine',
    description: 'Actuellement en chantier, il reliera la route vieille au chemin Pouyanne. À mi-chemin, il sera possible de remonter vers le chemin de Tâche via le chemin Peyraube.',
    depart: 'route vieille (à venir).',
    thumb: trailThumb('Justine-Peyraube'),
    enChantier: true,
    etapes: localPhotos('Justine-Peyraube')
  },

  beller: {
    title: 'Le chemin Beller',
    description: 'On l\'atteint en remontant le long d\'un champ, juste après le petit lac ; il permet de bifurquer pour redescendre vers le chemin du Brana.',
    depart: 'à compléter.',
    thumb: trailThumb('Beller'),
    enChantier: false,
    etapes: localPhotos('Beller')
  },

  'des-cretes': {
    title: 'Le chemin des crêtes',
    description: 'Le chemin de crête du Barat du Rey, point culminant du secteur (~169 m), avec une vue imprenable sur les Pyrénées.',
    depart: 'à compléter.',
    thumb: trailThumb('des-cretes'),
    enChantier: false,
    etapes: localPhotos('des-cretes')
  },

  'du-lac': {
    title: 'Le chemin du lac',
    description: 'Un chemin de terre qui descend jusqu\'à un petit lac, que l\'on contourne par la droite avant de poursuivre.',
    depart: 'à compléter.',
    thumb: trailThumb('du-lac'),
    enChantier: false,
    etapes: localPhotos('du-lac')
  },

  lalanne: {
    title: 'Le chemin Lalanne',
    description: 'Depuis la route, il s\'enfonce dans le bois puis grimpe pour rejoindre les hauteurs, en direction de la crête du Barat du Rey.',
    depart: 'à compléter.',
    thumb: trailThumb('Lalanne'),
    enChantier: false,
    etapes: localPhotos('Lalanne')
  },

  lasserre: {
    title: 'Le chemin Lasserre',
    description: 'à compléter.',
    depart: 'à compléter.',
    thumb: trailThumb('Lasserre'),
    enChantier: false,
    etapes: localPhotos('Lasserre')
  }
};


/* ── Modale ───────────────────────────────────────────────────── */

var modal         = document.getElementById('trail-modal');
var modalContent  = document.getElementById('trail-modal-content');
var modalClose    = document.getElementById('trail-modal-close');
var modalBackdrop = document.getElementById('trail-modal-backdrop');
var lastFocused   = null;

function buildTrailHTML(trail) {
  var html = '';

  html += '<h2 class="trail-modal__title" id="trail-modal-title">' + trail.title + '</h2>';

  if (trail.enChantier) {
    html += '<span class="trail-modal__badge">En chantier</span>';
  }

  html += '<p class="trail-modal__desc">' + trail.description + '</p>';
  html += '<p class="trail-modal__depart"><strong>Départ :</strong> ' + trail.depart + '</p>';

  if (trail.etapes && trail.etapes.length > 0) {
    html += '<h3 class="trail-modal__subtitle">Photos</h3>';
    html += '<div class="trail-modal__gallery">';

    trail.etapes.forEach(function (etape, index) {
      var lightboxUrl = window.Images.getLightboxUrl(etape.img);
      html += '<button type="button" class="trail-modal__photo-btn" data-lightbox="' + lightboxUrl + '"';
      html += ' aria-label="Agrandir la photo ' + (index + 1) + ' du ' + trail.title + '">';
      html += window.Images.buildPictureHTML(etape.img, {
        alt: trail.title + ' — photo ' + (index + 1),
        sizes: '(max-width: 640px) 100vw, 50vw'
      });
      html += '</button>';
    });

    html += '</div>';
  }

  return html;
}

function onModalKeydown(event) {
  if (!modal.classList.contains('trail-modal--open')) return;

  var dialog = modal.querySelector('.trail-modal__dialog');
  if (window.A11y && dialog) {
    window.A11y.handleFocusTrap(event, dialog);
  }
}

function openTrailModal(trailId) {
  var trail = TRAILS[trailId];
  if (!trail) return;

  lastFocused = document.activeElement;
  modalContent.innerHTML = buildTrailHTML(trail);
  modal.classList.add('trail-modal--open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  modalClose.focus();
  modal.addEventListener('keydown', onModalKeydown);
}

window.openTrailModal = openTrailModal;

function closeTrailModal() {
  modal.classList.remove('trail-modal--open');
  modal.setAttribute('aria-hidden', 'true');
  modalContent.innerHTML = '';
  modal.removeEventListener('keydown', onModalKeydown);
  document.body.style.overflow = '';

  if (lastFocused) {
    lastFocused.focus();
    lastFocused = null;
  }
}

document.querySelectorAll('.trail-card--clickable').forEach(function (card) {
  card.addEventListener('click', function (event) {
    if (event.target.closest('[data-lightbox]')) return;
    openTrailModal(card.getAttribute('data-trail'));
  });

  card.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openTrailModal(card.getAttribute('data-trail'));
    }
  });
});

modalClose.addEventListener('click', closeTrailModal);
modalBackdrop.addEventListener('click', closeTrailModal);

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape' || !modal.classList.contains('trail-modal--open')) return;

  var lightboxEl = document.getElementById('lightbox');
  if (lightboxEl && lightboxEl.classList.contains('lightbox--open')) return;

  closeTrailModal();
});
