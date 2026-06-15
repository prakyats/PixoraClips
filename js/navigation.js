/**
 * navigation.js - Handles navigation bar behavior (sticky state, scroll spy, mobile drawer)
 */

export function initNavigation() {
  const nav = document.getElementById('nav');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const body = document.body;

  if (!nav || !menuToggle || !navLinks) return;

  // 1. Sticky Nav on Scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  // 2. Mobile Menu Toggle with Scroll Locking
  let isMenuOpen = false;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    navLinks.classList.toggle('open', isMenuOpen);
    menuToggle.classList.toggle('active', isMenuOpen);
    menuToggle.setAttribute('aria-expanded', isMenuOpen);

    if (isMenuOpen) {
      body.style.overflow = 'hidden';
      if (window.lenisInstance) window.lenisInstance.stop();
    } else {
      body.style.overflow = '';
      if (window.lenisInstance) window.lenisInstance.start();
    }
  }

  function closeMenu() {
    if (!isMenuOpen) return;
    isMenuOpen = false;
    navLinks.classList.remove('open');
    menuToggle.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', false);
    body.style.overflow = '';
    if (window.lenisInstance) window.lenisInstance.start();
  }

  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close menu when clicking navigation links
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close menu when clicking outside the menu drawer
  document.addEventListener('click', (e) => {
    if (isMenuOpen && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
      closeMenu();
    }
  });

  // Close menu with ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });

  // 3. Scroll Spy (Highlighting Active Navigation Section)
  const sections = document.querySelectorAll('main > section');
  const navAnchors = navLinks.querySelectorAll('a');

  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -60% 0px', // Trigger when section occupies core viewport
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navAnchors.forEach(anchor => {
          const href = anchor.getAttribute('href');
          if (href === `#${id}`) {
            anchor.classList.add('active');
            anchor.setAttribute('aria-current', 'page');
          } else {
            anchor.classList.remove('active');
            anchor.removeAttribute('aria-current');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    if (section.id) {
      observer.observe(section);
    }
  });
}
