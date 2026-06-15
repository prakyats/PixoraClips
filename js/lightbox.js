/**
 * lightbox.js - Accessible Lightbox dialog for image & video previewing
 */

export function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxFrame = document.getElementById('lightboxFrame');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  if (!lightbox || !lightboxFrame || !lightboxCaption || !lightboxClose) return;

  let lastFocusedElement = null;

  // 1. Trap Keyboard Focus inside Lightbox
  const focusableElementsString = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  function trapFocus(e) {
    if (e.key !== 'Tab') return;

    const focusableElements = lightbox.querySelectorAll(focusableElementsString);
    if (focusableElements.length === 0) return;

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) { // Shift + Tab
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        e.preventDefault();
      }
    } else { // Tab
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus();
        e.preventDefault();
      }
    }
  }

  // 2. Open Lightbox Handler
  window.openLightbox = function(card) {
    lastFocusedElement = document.activeElement;
    
    const title = card.dataset.title || '';
    const cat = card.dataset.cat || '';
    const type = card.dataset.type; // 'video' or 'photo'
    const videoUrl = card.dataset.video;
    const isEmbed = card.dataset.embed === 'true';

    // Clear previous contents
    lightboxFrame.innerHTML = '';
    lightboxFrame.className = 'lightbox-frame ' + type;

    // Stop Lenis scroll when lightbox is active
    if (window.lenisInstance) window.lenisInstance.stop();
    document.body.style.overflow = 'hidden';

    // Render Media based on type
    if (type === 'video') {
      if (isEmbed) {
        // Embed handling (Instagram / Google Drive)
        const iframe = document.createElement('iframe');
        iframe.src = videoUrl;
        iframe.title = title;
        iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');
        iframe.setAttribute('allowfullscreen', 'true');
        lightboxFrame.appendChild(iframe);
      } else {
        // Standard Local HTML5 Video Player
        const video = document.createElement('video');
        video.src = videoUrl;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.loop = true;
        // Optimization: preload none on cards, load only on open
        video.preload = 'auto';
        lightboxFrame.appendChild(video);
      }
    } else {
      // Photo viewer (gets high-res image from dataset)
      const hiResUrl = card.dataset.hires;
      const img = document.createElement('img');
      img.src = hiResUrl;
      img.alt = title;
      img.decoding = 'async';
      lightboxFrame.appendChild(img);
    }

    // Set caption
    lightboxCaption.textContent = cat ? `${title} — ${cat}` : title;

    // Show modal
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    lightboxClose.focus();

    // Attach keyboard event listeners
    document.addEventListener('keydown', trapFocus);
  };

  // 3. Close Lightbox Handler
  function closeLightbox() {
    if (!lightbox.classList.contains('open')) return;

    // Hide modal
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');

    // Clean up contents to stop video playbacks and conserve resources
    lightboxFrame.innerHTML = '';

    // Restore scroll
    if (window.lenisInstance) window.lenisInstance.start();
    document.body.style.overflow = '';

    // Remove keyboard focus trap
    document.remove('keydown', trapFocus);

    // Return focus to previously active element
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }

  // Event Listeners for Closing
  lightboxClose.addEventListener('click', closeLightbox);
  
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
    }
  });
}
