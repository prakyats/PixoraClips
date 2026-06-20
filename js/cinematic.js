/**
 * cinematic.js — Immersive scroll & interaction layer for Pixora Clips
 *
 * Adds, on top of the existing animations.js scroll-reveal system:
 *  - Cinematic letterbox load-in
 *  - Scroll progress indicator
 *  - Custom magnetic cursor (desktop only)
 *  - Magnetic buttons
 *  - Hero Ken Burns + cursor-follow glow
 *  - 3D tilt + sheen sweep on cards
 *  - Heading mask-wipe reveal
 *  - Scatter-in grid assembly
 *  - Portfolio directional scroll reveal
 *  - Marquee depth (counter-scrolling back layer)
 *  - Pinned scrub transition between Hero and Social Proof
 *
 * Every effect is gated behind prefers-reduced-motion and gracefully
 * no-ops if GSAP/ScrollTrigger are unavailable.
 */

export function initCinematic() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  initLetterboxIntro();
  initScrollProgress();

  if (!isCoarsePointer && !prefersReducedMotion) {
    initCustomCursor();
  }

  initMagneticButtons(isCoarsePointer, prefersReducedMotion);
  initHeroCursorGlow(isCoarsePointer, prefersReducedMotion);

  if (prefersReducedMotion) {
    // Reduced motion: skip all scroll-driven / decorative motion below.
    return;
  }

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  initTilt(isCoarsePointer);
  initMarqueeDepth();

  if (gsap && ScrollTrigger) {
    initHeadingMaskWipe(gsap, ScrollTrigger);
    initScatterGrids(gsap, ScrollTrigger);
    initPortfolioDirectionalReveal(gsap, ScrollTrigger);
    initPinnedHeroTransition(gsap, ScrollTrigger);
  }
}

/* ============ 1. CINEMATIC LETTERBOX LOAD-IN ============ */
function initLetterboxIntro() {
  // Bars start closed (covering top/bottom 14vh), then retract shortly after load.
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.body.classList.add('letterbox-open');
    }, 250);
  });
}

/* ============ 2. SCROLL PROGRESS INDICATOR ============ */
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;

  let rafPending = false;

  function update() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    rafPending = false;
  }

  function onScroll() {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ============ 3. CUSTOM MAGNETIC CURSOR ============ */
function initCustomCursor() {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  // Replace the small dot with an inline camera SVG so the cursor matches
  // the Pixora brand. SVG uses `currentColor` so it follows CSS `color`.
  if (!dot.querySelector('svg')) {
    dot.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20 7h-3.2l-1.6-2H8.8L7.2 7H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM12 18a4 4 0 110-8 4 4 0 010 8zM12 10a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    `;
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let activated = false;
  let dotScale = 1;
  let ringRafId = null;

  function onMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!activated) {
      activated = true;
      // Promote cursor elements to their own compositor layer once
      dot.style.willChange = 'transform';
      ring.style.willChange = 'transform';
      document.body.classList.add('cursor-ready');
    }
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%) scale(${dotScale})`;
    // Restart ring loop if it went idle
    if (!ringRafId) {
      ringRafId = requestAnimationFrame(loop);
    }
  }
  window.addEventListener('mousemove', onMove, { passive: true });

  function loop() {
    const dx = mouseX - ringX;
    const dy = mouseY - ringY;
    ringX += dx * 0.18;
    ringY += dy * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    // Sleep when the ring has converged (< 0.3px away)
    if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) {
      ringRafId = requestAnimationFrame(loop);
    } else {
      ringRafId = null;
    }
  }

  const hoverTargets = 'a, button, [data-tilt], .portfolio-card, .tab-btn';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      ring.classList.add('hovering');
      dot.classList.add('hovering');
      dotScale = 1.06;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%) scale(${dotScale})`;
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      ring.classList.remove('hovering');
      dot.classList.remove('hovering');
      dotScale = 1;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%) scale(${dotScale})`;
    }
  });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  });
}

/* ============ 4. MAGNETIC BUTTONS ============ */
function initMagneticButtons(isCoarsePointer, prefersReducedMotion) {
  if (isCoarsePointer || prefersReducedMotion) return;

  const buttons = document.querySelectorAll('[data-magnetic]');
  const gsap = window.gsap;

  buttons.forEach((btn) => {
    let bounds;

    btn.addEventListener('mouseenter', () => {
      bounds = btn.getBoundingClientRect();
    });

    btn.addEventListener('mousemove', (e) => {
      if (!bounds) bounds = btn.getBoundingClientRect();
      const relX = e.clientX - bounds.left - bounds.width / 2;
      const relY = e.clientY - bounds.top - bounds.height / 2;
      const strength = 0.35;

      if (gsap) {
        gsap.to(btn, {
          x: relX * strength,
          y: relY * strength,
          duration: 0.4,
          ease: 'power2.out',
        });
      } else {
        btn.style.transform = `translate(${relX * strength}px, ${relY * strength}px)`;
      }
    });

    btn.addEventListener('mouseleave', () => {
      if (gsap) {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      } else {
        btn.style.transform = 'translate(0, 0)';
      }
    });
  });
}

/* ============ 5. HERO CURSOR-FOLLOW GLOW ============ */
function initHeroCursorGlow(isCoarsePointer, prefersReducedMotion) {
  if (isCoarsePointer || prefersReducedMotion) return;

  const hero = document.getElementById('top');
  const glow = document.getElementById('heroCursorGlow');
  if (!hero || !glow) return;

  const gsap = window.gsap;
  let raf = null;
  let targetX = 0;
  let targetY = 0;
  let curX = 0;
  let curY = 0;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    glow.classList.add('active');

    if (!raf) {
      raf = requestAnimationFrame(animateGlow);
    }
  });

  hero.addEventListener('mouseleave', () => {
    glow.classList.remove('active');
  });

  function animateGlow() {
    curX += (targetX - curX) * 0.12;
    curY += (targetY - curY) * 0.12;
    if (gsap) {
      gsap.set(glow, { x: curX, y: curY });
    } else {
      glow.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
    }

    if (Math.abs(targetX - curX) > 0.5 || Math.abs(targetY - curY) > 0.5) {
      raf = requestAnimationFrame(animateGlow);
    } else {
      raf = null;
    }
  }
}

/* ============ 6. 3D TILT + SHEEN ============ */
function initTilt(isCoarsePointer) {
  if (isCoarsePointer) return;

  const gsap = window.gsap;
  const cards = document.querySelectorAll('[data-tilt]');

  cards.forEach((card) => {
    let bounds;
    let sheenTimeout;

    card.addEventListener('mouseenter', () => {
      bounds = card.getBoundingClientRect();
      card.classList.add('sheen-active');
      clearTimeout(sheenTimeout);
      sheenTimeout = setTimeout(() => card.classList.remove('sheen-active'), 900);
    });

    card.addEventListener('mousemove', (e) => {
      if (!bounds) bounds = card.getBoundingClientRect();
      const relX = (e.clientX - bounds.left) / bounds.width - 0.5;
      const relY = (e.clientY - bounds.top) / bounds.height - 0.5;

      const rotateY = relX * 10; // max ~10deg
      const rotateX = relY * -10;

      if (gsap) {
        gsap.to(card, {
          rotateX,
          rotateY,
          transformPerspective: 800,
          duration: 0.4,
          ease: 'power2.out',
        });
      } else {
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      if (gsap) {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
      } else {
        card.style.transform = 'none';
      }
    });
  });
}

/* ============ 7. HEADING MASK-WIPE REVEAL ============ */
function initHeadingMaskWipe(gsap, ScrollTrigger) {
  const headings = document.querySelectorAll('.section-head h2');

  headings.forEach((heading) => {
    // Wrap existing text in a masked span so we can translate it up from below.
    const text = heading.textContent;
    heading.innerHTML = `<span class="heading-mask-line"><span>${text}</span></span>`;
    const inner = heading.querySelector('.heading-mask-line > span');

    gsap.fromTo(
      inner,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 0.9,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: heading,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

/* ============ 8. SCATTER-IN GRID ASSEMBLY ============ */
function initScatterGrids(gsap, ScrollTrigger) {
  const grids = document.querySelectorAll('[data-scatter-in]');

  grids.forEach((grid) => {
    const items = grid.children;
    if (!items.length) return;

    const offsets = [
      { x: -60, y: 40, rotate: -6 },
      { x: 60, y: -30, rotate: 5 },
      { x: -40, y: -50, rotate: 4 },
      { x: 50, y: 50, rotate: -5 },
    ];

    Array.from(items).forEach((item, i) => {
      const offset = offsets[i % offsets.length];
      gsap.fromTo(
        item,
        {
          opacity: 0,
          x: offset.x,
          y: offset.y,
          rotate: offset.rotate,
          scale: 0.92,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          delay: i * 0.08,
          scrollTrigger: {
            trigger: grid,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
  });
}

/* ============ 9. PORTFOLIO DIRECTIONAL SCROLL REVEAL ============ */
function initPortfolioDirectionalReveal(gsap, ScrollTrigger) {
  const grid = document.querySelector('[data-portfolio-reveal]');
  if (!grid) return;

  // Portfolio is populated asynchronously by portfolio.js; cinematic.js is
  // invoked after that population completes (see main.js ordering), so the
  // cards should already exist. Re-query defensively in case of late paint.
  function applyReveal() {
    const cards = grid.querySelectorAll('.portfolio-card');
    if (!cards.length) return false;

    cards.forEach((card, i) => {
      const fromLeft = i % 2 === 0;
      gsap.fromTo(
        card,
        {
          opacity: 0,
          x: fromLeft ? -50 : 50,
          y: 30,
          rotate: fromLeft ? -3 : 3,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          rotate: 0,
          duration: 0.75,
          ease: 'power3.out',
          delay: (i % 4) * 0.08,
          scrollTrigger: {
            trigger: card,
            start: 'top 92%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
    return true;
  }

  if (!applyReveal()) {
    // Retry briefly in case portfolio.json hasn't finished rendering yet.
    const observer = new MutationObserver(() => {
      if (applyReveal()) observer.disconnect();
    });
    observer.observe(grid, { childList: true });
  }
}

/* ============ 10. MARQUEE DEPTH LAYER ============ */
function initMarqueeDepth() {
  const marquee = document.querySelector('.marquee');
  const track = document.getElementById('clientMarquee');
  if (!marquee || !track) return;

  function buildBackLayer() {
    if (marquee.querySelector('.marquee-track-back')) return;

    const names = Array.from(track.querySelectorAll('.client'))
      .map((el) => el.textContent.trim())
      .filter(Boolean);
    if (!names.length) return;

    const backTrack = document.createElement('div');
    backTrack.className = 'marquee-track-back';
    backTrack.setAttribute('aria-hidden', 'true');

    const doubled = [...names, ...names];
    doubled.forEach((name) => {
      const span = document.createElement('span');
      span.textContent = name;
      backTrack.appendChild(span);
    });

    marquee.insertBefore(backTrack, marquee.firstChild);
  }

  if (track.children.length) {
    buildBackLayer();
  } else {
    const observer = new MutationObserver(() => {
      if (track.children.length) {
        buildBackLayer();
        observer.disconnect();
      }
    });
    observer.observe(track, { childList: true });
  }
}

/* ============ 11. PINNED HERO → SOCIAL PROOF TRANSITION ============ */
function initPinnedHeroTransition(gsap, ScrollTrigger) {
  if (window.innerWidth < 768) return;

  const hero = document.getElementById('top');
  if (!hero) return;

  const heroContent = hero.querySelector('.hero-content');
  if (!heroContent) return;

  // ── Dark overlay ────────────────────────────────────────────────────────
  // z-index: 0 keeps it BELOW hero-content (z-index: 2) and hero-blur-overlay (z-index: 1).
  // Insert it as the first child so it's naturally behind everything else.
  let darkOverlay = hero.querySelector('.hero-dark-overlay');
  if (!darkOverlay) {
    darkOverlay = document.createElement('div');
    darkOverlay.className = 'hero-dark-overlay';
    darkOverlay.setAttribute('aria-hidden', 'true');
    darkOverlay.style.cssText =
      'position:absolute;inset:0;background:#000;opacity:0;' +
      'pointer-events:none;z-index:0;will-change:opacity;';
    // Insert FIRST so it sits behind all hero children in the stacking order.
    hero.insertBefore(darkOverlay, hero.firstChild);
  }

  // ── Direct scroll listener ───────────────────────────────────────────────
  // Unlike GSAP scrub, this recalculates the EXACT correct state on every
  // frame AND on init — no dependency on scroll position at GSAP init time.
  // This is immune to browser scroll restoration timing issues.

  function applyHeroProgress() {
    const heroHeight = hero.offsetHeight;
    if (!heroHeight) return;

    // progress: 0 = at very top, 1 = hero has fully scrolled past viewport top
    const progress = Math.min(1, Math.max(0, window.scrollY / heroHeight));

    // Use GSAP set (compositor-only, no tween overhead)
    gsap.set(heroContent, {
      opacity: 1 - progress,
      y: -60 * progress,
      scale: 1 - 0.04 * progress,
    });
    gsap.set(darkOverlay, { opacity: 0.45 * progress });
  }

  // Apply immediately — correct state no matter where scroll is at load time.
  applyHeroProgress();

  // Throttle to one update per animation frame.
  let rafPending = false;
  function onScroll() {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(() => {
        applyHeroProgress();
        rafPending = false;
      });
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', applyHeroProgress);
}
