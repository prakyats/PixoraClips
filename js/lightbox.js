/**
 * lightbox.js - Accessible Lightbox for Cloudinary video & image previewing.
 * Instagram items are handled externally (new tab) via portfolio.js.
 */

import { getCloudinaryVideoUrl, getCloudinaryVideoPoster } from './portfolio.js';

export function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxInner = lightbox?.querySelector('.lightbox-inner');
  const lightboxFrame = document.getElementById('lightboxFrame');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  if (!lightbox || !lightboxFrame || !lightboxCaption || !lightboxClose) return;

  let lastFocusedElement = null;
  let savedScrollY = 0;

  // 1. Focus Trap
  const focusableQuery = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(lightbox.querySelectorAll(focusableQuery));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { last.focus(); e.preventDefault(); }
    } else {
      if (document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  }

  // 2. Scroll-width compensation helper
  function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }

  // 3. Open Lightbox
  window.openLightbox = function(card) {
    const source = card.dataset.source;
    // Guard: only open lightbox for Cloudinary assets
    if (source === 'instagram') return;

    lastFocusedElement = document.activeElement;
    savedScrollY = window.scrollY;

    const title   = card.dataset.title || '';
    const cat     = card.dataset.cat   || '';
    const type    = card.dataset.type;          // 'video' | 'photo'
    const videoUrl = card.dataset.video;

    // Clear previous
    lightboxFrame.innerHTML = '';
    lightboxFrame.className = `lightbox-frame ${type}`;

    // Lock body scroll, compensate for scrollbar width to prevent layout shift
    const scrollbarWidth = getScrollbarWidth();
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = 'hidden';
    if (window.lenisInstance) window.lenisInstance.stop();

    // Render media
    if (type === 'video' && videoUrl) {
      const transformedUrl = getCloudinaryVideoUrl(videoUrl);
      const posterUrl      = getCloudinaryVideoPoster(videoUrl);

      const video = document.createElement('video');
      video.src           = transformedUrl;
      video.poster        = posterUrl;
      video.controls      = true;
      video.autoplay      = true;
      video.playsInline   = true;
      video.loop          = false;
      video.preload       = 'none';
      video.setAttribute('controlsList', 'nodownload noplaybackrate');
      video.setAttribute('disablePictureInPicture', '');
      // Deter casual right-click download
      video.addEventListener('contextmenu', e => e.preventDefault());
      lightboxFrame.appendChild(video);

    } else if (type === 'photo') {
      const hiResUrl = card.dataset.hires;
      const img      = document.createElement('img');
      img.src        = hiResUrl;
      img.alt        = title;
      img.decoding   = 'async';
      // No right-click save for photo
      img.addEventListener('contextmenu', e => e.preventDefault());
      lightboxFrame.appendChild(img);
    }

    // Caption
    lightboxCaption.textContent = cat ? `${title} — ${cat}` : title;

    // Show modal with scale animation trigger
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    if (lightboxInner) {
      lightboxInner.style.transform = 'scale(0.95)';
      lightboxInner.style.opacity   = '0';
      // Let the DOM paint the initial state before transitioning
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          lightboxInner.style.transition = 'transform 250ms cubic-bezier(0.16,1,0.3,1), opacity 250ms ease';
          lightboxInner.style.transform  = 'scale(1)';
          lightboxInner.style.opacity    = '1';
        });
      });
    }
    lightboxClose.focus();

    // Keyboard listeners
    document.addEventListener('keydown', trapFocus);
  };

  // 4. Close Lightbox
  function closeLightbox() {
    if (!lightbox.classList.contains('open')) return;

    // Animate out
    if (lightboxInner) {
      lightboxInner.style.transition = 'transform 200ms ease, opacity 200ms ease';
      lightboxInner.style.transform  = 'scale(0.95)';
      lightboxInner.style.opacity    = '0';
    }

    setTimeout(() => {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');

      // Destroy video to stop playback & free resources
      const video = lightboxFrame.querySelector('video');
      if (video) { video.pause(); video.src = ''; }
      lightboxFrame.innerHTML = '';

      // Reset inner state
      if (lightboxInner) {
        lightboxInner.style.transition = '';
        lightboxInner.style.transform  = '';
        lightboxInner.style.opacity    = '';
      }

      // Restore scroll — remove padding-right first to prevent flicker
      document.body.style.paddingRight = '';
      document.body.style.overflow     = '';
      if (window.lenisInstance) window.lenisInstance.start();

      // Restore focus
      if (lastFocusedElement) lastFocusedElement.focus();
    }, 200);

    // Remove keyboard focus trap (fixed bug: was document.remove)
    document.removeEventListener('keydown', trapFocus);
  }

  // 5. Event listeners
  lightboxClose.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });
}
