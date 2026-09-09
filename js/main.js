/**

 * main.js — Script principal du site Les Sentiers du Village

 */



'use strict';



/**
 * ID Formspree — créez un formulaire sur https://formspree.io, puis récupérez l’identifiant
 * dans Settings → « Form endpoint » (partie finale de l’URL, ex. …/f/mqabcde → mqabcde).
 */
var FORMSPREE_ID = 'XXXXXXXX';

function isFormspreeConfigured(id) {
  if (!id || typeof id !== 'string') return false;
  id = id.trim();
  return id !== '' && id !== 'XXXXXXXX';
}



/* =============================================================

   1. MENU MOBILE

   ============================================================= */



const navToggle = document.getElementById('nav-toggle');

const nav       = document.getElementById('nav');



function toggleMenu() {

  const isOpen = nav.classList.toggle('nav--open');

  navToggle.classList.toggle('nav-toggle--open', isOpen);

  navToggle.setAttribute('aria-expanded', isOpen);

  navToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');

}



navToggle.addEventListener('click', toggleMenu);



nav.querySelectorAll('.nav__link').forEach(function (link) {

  link.addEventListener('click', function () {

    nav.classList.remove('nav--open');

    navToggle.classList.remove('nav-toggle--open');

    navToggle.setAttribute('aria-expanded', 'false');

  });

});





/* =============================================================

   2. HEADER AU DÉFILEMENT

   ============================================================= */



const header = document.getElementById('header');



window.addEventListener('scroll', function () {

  header.classList.toggle('header--scrolled', window.scrollY > 60);

}, { passive: true });





/* =============================================================

   3. SCROLL REVEAL

   ============================================================= */



const revealElements = document.querySelectorAll('.reveal');



const revealObserver = new IntersectionObserver(

  function (entries) {

    entries.forEach(function (entry) {

      if (entry.isIntersecting) {

        entry.target.classList.add('visible');

        revealObserver.unobserve(entry.target);

      }

    });

  },

  {

    threshold: 0.15,

    rootMargin: '0px 0px -40px 0px'

  }

);



revealElements.forEach(function (el) {

  revealObserver.observe(el);

});





/* =============================================================

   4. FORMULAIRE DE CONTACT — Formspree

   ============================================================= */



const contactForm  = document.getElementById('contact-form');
const formFeedback = document.getElementById('form-feedback');
const submitBtn    = contactForm ? contactForm.querySelector('button[type="submit"]') : null;

if (contactForm && isFormspreeConfigured(FORMSPREE_ID)) {
  contactForm.action = 'https://formspree.io/f/' + FORMSPREE_ID;
}

if (contactForm && formFeedback && submitBtn) {

contactForm.addEventListener('submit', function (event) {

  event.preventDefault();



  if (!isFormspreeConfigured(FORMSPREE_ID)) {

    showFeedback('Formulaire non configuré', 'error');

    return;

  }



  const name    = contactForm.name.value.trim();

  const email   = contactForm.email.value.trim();

  const message = contactForm.message.value.trim();



  formFeedback.textContent = '';

  formFeedback.className = 'form-feedback';



  if (!name || !email || !message) {

    showFeedback('Veuillez remplir tous les champs.', 'error');

    return;

  }



  if (!isValidEmail(email)) {

    showFeedback('Adresse email invalide.', 'error');

    return;

  }



  submitBtn.disabled = true;

  submitBtn.setAttribute('aria-busy', 'true');



  fetch(contactForm.action, {

    method: 'POST',

    body: new FormData(contactForm),

    headers: { Accept: 'application/json' }

  })

    .then(function (response) {

      if (response.ok) {

        showFeedback('Merci ! Votre message a bien été envoyé.', 'success');

        contactForm.reset();

        return;

      }



      return response.json().then(function (data) {

        var msg = 'Une erreur est survenue. Veuillez réessayer ou nous écrire directement par email.';



        if (data.errors && data.errors.length) {

          msg = data.errors.map(function (err) { return err.message; }).join(' ');

        } else if (data.error) {

          msg = data.error;

        }



        showFeedback(msg, 'error');

      });

    })

    .catch(function () {

      showFeedback('Une erreur est survenue. Veuillez réessayer ou nous écrire directement par email.', 'error');

    })

    .finally(function () {

      submitBtn.disabled = false;

      submitBtn.removeAttribute('aria-busy');

    });

});

}



function showFeedback(message, type) {

  formFeedback.textContent = message;

  formFeedback.classList.add('form-feedback--' + type);

}



function isValidEmail(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}





/* =============================================================

   5. LIGHTBOX

   ============================================================= */



var lightbox         = document.getElementById('lightbox');

var lightboxImg      = document.getElementById('lightbox-img');

var lightboxClose    = document.getElementById('lightbox-close');

var lightboxBackdrop = document.getElementById('lightbox-backdrop');



function openLightbox(src, alt, triggerEl) {

  if (window.A11y) {

    window.A11y.rememberLightboxTrigger(triggerEl || document.activeElement);

  }



  lightboxImg.src = src;

  lightboxImg.alt = alt || '';

  lightbox.classList.add('lightbox--open');

  lightbox.setAttribute('aria-hidden', 'false');

  document.body.style.overflow = 'hidden';

  lightboxClose.focus();

}



function closeLightbox() {

  lightbox.classList.remove('lightbox--open');

  lightbox.setAttribute('aria-hidden', 'true');

  lightboxImg.src = '';

  lightboxImg.alt = '';



  var trailModal = document.getElementById('trail-modal');

  var itineraryModal = document.getElementById('itinerary-modal');

  var modalOpen = (trailModal && trailModal.classList.contains('trail-modal--open')) ||

    (itineraryModal && itineraryModal.classList.contains('trail-modal--open'));



  if (!modalOpen) {

    document.body.style.overflow = '';

  }



  if (window.A11y) {

    window.A11y.restoreLightboxFocus();

  }

}



document.addEventListener('click', function (event) {

  var trigger = event.target.closest('[data-lightbox]');

  if (!trigger) return;



  event.preventDefault();

  event.stopPropagation();



  var img = trigger.querySelector('img');

  openLightbox(trigger.getAttribute('data-lightbox'), img ? img.alt : '', trigger);

});



if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);



document.addEventListener('keydown', function (event) {

  if (event.key === 'Escape' && lightbox && lightbox.classList.contains('lightbox--open')) {

    event.stopPropagation();

    closeLightbox();

    return;

  }



  if (lightbox && lightbox.classList.contains('lightbox--open') && window.A11y) {

    window.A11y.handleFocusTrap(event, lightbox.querySelector('.lightbox__dialog') || lightbox);

  }

});



/* Focus trap lightbox — le conteneur est la lightbox elle-même */

if (lightbox) {

  lightbox.addEventListener('keydown', function (event) {

    if (!lightbox.classList.contains('lightbox--open') || !window.A11y) return;

    window.A11y.handleFocusTrap(event, lightbox);

  });

}


