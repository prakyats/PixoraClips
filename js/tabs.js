/**
 * tabs.js - Handles portfolio category tab switching with ARIA support
 */

export function initTabs() {
  const tabList = document.querySelector('[role="tablist"]');
  if (!tabList) return;

  const tabs = tabList.querySelectorAll('[role="tab"]');
  const panels = document.querySelectorAll('[role="tabpanel"]');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab);
    });

    // Keyboard navigation (Arrow keys)
    tab.addEventListener('keydown', (e) => {
      const index = Array.from(tabs).indexOf(tab);
      let targetTab = null;

      if (e.key === 'ArrowRight') {
        targetTab = tabs[index + 1] || tabs[0];
      } else if (e.key === 'ArrowLeft') {
        targetTab = tabs[index - 1] || tabs[tabs.length - 1];
      }

      if (targetTab) {
        targetTab.focus();
        switchTab(targetTab);
        e.preventDefault();
      }
    });
  });

  function switchTab(activeTab) {
    const targetPanelId = activeTab.getAttribute('aria-controls');

    // 1. Update Tabs Selected State
    tabs.forEach(tab => {
      const isActive = tab === activeTab;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive.toString());
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    // 2. Toggle Tab Panels Visibility
    panels.forEach(panel => {
      const isTarget = panel.getAttribute('id') === targetPanelId;
      panel.classList.toggle('active', isTarget);
      
      if (isTarget) {
        panel.removeAttribute('hidden');
        
        // Trigger subtle card stagger fade-in on tab switch
        const cards = panel.querySelectorAll('.portfolio-card');
        const gsap = window.gsap;
        if (gsap && cards.length > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap.fromTo(cards, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
          );
        }
      } else {
        panel.setAttribute('hidden', 'true');
      }
    });
  }
}
