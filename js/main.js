/**
 * main.js - Entry point for Pixora Clips
 */

// ── CRITICAL: disable browser scroll-position restoration ──────────────────
// Chrome/Firefox remember the scroll position across refreshes and restore it
// AFTER JavaScript runs. GSAP ScrollTrigger initialises at scrollY = 0, sets
// its scrub positions, then the browser silently jumps the scroll — leaving the
// hero dark overlay at full opacity and heroContent invisible.
// Forcing scrollY = 0 before anything else guarantees a clean slate every time.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
// ──────────────────────────────────────────────────────────────────────────────

import { initNavigation } from './navigation.js';
import { initAnimations } from './animations.js';
import { initTabs } from './tabs.js';
import { initLightbox } from './lightbox.js';
import { initPortfolio } from './portfolio.js';
import { initCinematic } from './cinematic.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Content Rendering
  await initPortfolio();

  // 2. Initialize Navigation Logic
  initNavigation();

  // 3. Initialize Tab switching
  initTabs();

  // 4. Initialize Lightbox modal
  initLightbox();

  // 5. Initialize Lenis (Smooth Scroll) & GSAP animations
  initSmoothScrollAndAnimations();

  // 6. Initialize the immersive cinematic interaction layer
  initCinematic();
});

function initSmoothScrollAndAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  const shouldDisableLenis = prefersReducedMotion || isMobile;

  if (!shouldDisableLenis && window.Lenis) {
    try {
      const lenis = new window.Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Expo ease-out
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      if (window.gsap) {
        // Drive Lenis inside GSAP's ticker so both always advance on the same frame.
        // This eliminates the one-frame desync between Lenis scroll position and
        // GSAP ScrollTrigger scrub updates that causes jitter on reverse scroll.
        window.gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });

        // Prevent GSAP from "catching up" accumulated time in a large jump after
        // the tab is hidden/unhidden — that causes a visible position snap.
        window.gsap.ticker.lagSmoothing(0);

        // Still emit scroll events so ScrollTrigger.update() fires every frame.
        if (window.ScrollTrigger) {
          lenis.on('scroll', window.ScrollTrigger.update);
        }
      } else {
        // GSAP not available — fall back to standalone rAF loop.
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }

      // Expose globally for lightbox lock purposes
      window.lenisInstance = lenis;
    } catch (err) {
      console.warn('Lenis smooth scroll failed to initialize:', err);
    }
  } else {
    console.log('Lenis smooth scroll bypassed based on device/motion settings.');
  }

  // 6. Initialize GSAP ScrollTrigger & SplitType Animations
  initAnimations();
}
