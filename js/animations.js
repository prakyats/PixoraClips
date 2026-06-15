/**
 * animations.js - Core GSAP + ScrollTrigger + SplitType motion design
 */

export function initAnimations() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const SplitType = window.SplitType;

  if (!gsap) {
    console.warn('GSAP is not loaded. Skipping animations.');
    return;
  }

  // Register ScrollTrigger plugin if available
  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    console.log('Reduced motion requested. GSAP animations bypassed.');
    // Set opacity to 1 immediately for all reveal elements
    gsap.set('[data-reveal], .reveal', { opacity: 1, y: 0, scale: 1 });
    return;
  }

  // ============ HERO ANIMATIONS ============ */
  try {
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // 1. Fade-in eyebrow
    const heroEyebrow = document.querySelector('.hero .eyebrow');
    if (heroEyebrow) {
      heroTl.from(heroEyebrow, {
        opacity: 0,
        y: -20,
        duration: 0.6
      });
    }

    // 2. Split headline by lines
    const headline = document.querySelector('.hero h1');
    if (headline && SplitType) {
      const splitText = new SplitType(headline, { types: 'lines', tagName: 'span' });
      
      // Wrap lines in an overflow-hidden wrapper for clip-path reveal effect
      splitText.lines.forEach(line => {
        const wrap = document.createElement('span');
        wrap.className = 'split-line';
        line.parentNode.insertBefore(wrap, line);
        wrap.appendChild(line);
      });

      // Animate lines upward
      heroTl.from(splitText.lines, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
      }, '-=0.3');
    } else if (headline) {
      // Fallback if SplitType fails
      heroTl.from(headline, {
        opacity: 0,
        y: 40,
        duration: 0.8
      }, '-=0.3');
    }

    // 3. Fade-in subheading
    const heroSub = document.querySelector('.hero #hero-subheading');
    if (heroSub) {
      heroTl.from(heroSub, {
        opacity: 0,
        y: 20,
        duration: 0.6
      }); // Start exactly after headline finishes
    }

    // 4. Sequential CTA buttons reveal
    const heroActions = document.querySelector('.hero-actions');
    if (heroActions) {
      const buttons = heroActions.querySelectorAll('.btn');
      heroTl.from(buttons, {
        opacity: 0,
        y: 15,
        scale: 0.95,
        duration: 0.5,
        stagger: 0.15
      }, '+=0.15'); // Delay 0.15 seconds after subheading completes
    }

    // 5. Fade-in credibility strip
    const credStrip = document.querySelector('.credibility-strip');
    if (credStrip) {
      heroTl.from(credStrip, {
        opacity: 0,
        y: 20,
        duration: 0.6
      }, '-=0.2');
    }
  } catch (err) {
    console.error('Hero intro animation failed:', err);
  }

  // ============ SCROLL REVEAL ANIMATIONS ============ */
  if (ScrollTrigger) {
    try {
      // 1. Generic fade-up reveals for section contents
      const revealElements = document.querySelectorAll('[data-reveal]');
      revealElements.forEach(el => {
        const delay = parseFloat(el.getAttribute('data-reveal-delay')) || 0;
        
        gsap.fromTo(el, 
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: delay,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%', // Trigger when top of element reaches 85% viewport height
              toggleActions: 'play none none none',
            }
          }
        );
      });

      // 2. Staggered reveal for grid card elements
      const staggerGrids = document.querySelectorAll('[data-stagger-grid]');
      staggerGrids.forEach(grid => {
        const cards = grid.children;
        if (cards.length === 0) return;

        gsap.from(cards, {
          opacity: 0,
          y: 50,
          duration: 0.7,
          stagger: 0.12, // Max stagger delay in budget
          ease: 'power2.out',
          scrollTrigger: {
            trigger: grid,
            start: 'top 82%',
            toggleActions: 'play none none none',
          }
        });
      });

      // 3. Subtle Parallax for Background Rings / Glows
      const parallaxRings = document.querySelectorAll('[data-parallax-rings]');
      parallaxRings.forEach(ring => {
        gsap.to(ring, {
          y: -60, // Within 80px parallax movement budget
          ease: 'none',
          scrollTrigger: {
            trigger: ring.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      });

      // 4. Subtle Parallax for About text
      const aboutText = document.querySelector('.about-text');
      if (aboutText) {
        gsap.from(aboutText, {
          y: 30,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: aboutText,
            start: 'top 90%',
            end: 'bottom 40%',
            scrub: 1
          }
        });
      }
    } catch (err) {
      console.error('Scroll reveal animation configuration failed:', err);
    }
  }
}
