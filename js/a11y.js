/**
 * a11y.js — Focus trap pour modales et retour du focus (lightbox)
 */

'use strict';

var lightboxLastFocused = null;

/**
 * Éléments focusables dans un conteneur.
 * @param {Element} container
 * @returns {Element[]}
 */
function getFocusableElements(container) {
  return Array.prototype.slice.call(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(function (el) {
    return el.offsetParent !== null || el === document.activeElement;
  });
}

/**
 * Piège le focus Tab / Shift+Tab dans une modale ouverte.
 * @param {KeyboardEvent} event
 * @param {Element} dialogEl — .trail-modal__dialog ou équivalent
 */
function handleFocusTrap(event, dialogEl) {
  if (event.key !== 'Tab' || !dialogEl) return;

  var focusable = getFocusableElements(dialogEl);
  if (!focusable.length) return;

  var first = focusable[0];
  var last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * @param {Element|null} el
 */
function rememberLightboxTrigger(el) {
  lightboxLastFocused = el;
}

/**
 * Restaure le focus après fermeture de la lightbox.
 */
function restoreLightboxFocus() {
  if (lightboxLastFocused && typeof lightboxLastFocused.focus === 'function') {
    lightboxLastFocused.focus();
  }
  lightboxLastFocused = null;
}

window.A11y = {
  getFocusableElements: getFocusableElements,
  handleFocusTrap: handleFocusTrap,
  rememberLightboxTrigger: rememberLightboxTrigger,
  restoreLightboxFocus: restoreLightboxFocus
};
