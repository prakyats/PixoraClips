/**
 * main.js - Entry point for Pixora Clips
 */

import { initNavigation } from './navigation.js';
import { initAnimations } from './animations.js';
import { initTabs } from './tabs.js';
import { initLightbox } from './lightbox.js';
import { initPortfolio } from './portfolio.js';

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

      // Connect Lenis to requestAnimationFrame loop
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      // Connect Lenis scroll events to GSAP ScrollTrigger
      if (window.ScrollTrigger) {
        lenis.on('scroll', window.ScrollTrigger.update);
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
