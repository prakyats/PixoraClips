/**
 * portfolio.js - Dynamically loads portfolio, services, and client brands from JSON layers
 */

// Icon map for core services
const SERVICE_ICONS = {
  reels: `
    <svg class="icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="6" y="9" width="28" height="30" rx="2" stroke="currentColor" stroke-width="2"/>
      <path d="M34 19L42 14V34L34 29" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M16 18L24 24L16 30V18Z" fill="currentColor"/>
    </svg>
  `,
  drone: `
    <svg class="icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="24" cy="24" r="6" stroke="currentColor" stroke-width="2"/>
      <path d="M24 18V8M24 30V40M30 24H40M18 24H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="24" cy="8" r="3" stroke="currentColor" stroke-width="2"/>
      <circle cx="24" cy="40" r="3" stroke="currentColor" stroke-width="2"/>
      <circle cx="40" cy="24" r="3" stroke="currentColor" stroke-width="2"/>
      <circle cx="8" cy="24" r="3" stroke="currentColor" stroke-width="2"/>
    </svg>
  `,
  product: `
    <svg class="icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="12" width="40" height="28" rx="2" stroke="currentColor" stroke-width="2"/>
      <circle cx="24" cy="26" r="8" stroke="currentColor" stroke-width="2"/>
      <path d="M16 12L19 7H29L32 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `,
  event: `
    <svg class="icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="6" y="8" width="36" height="34" rx="2" stroke="currentColor" stroke-width="2"/>
      <path d="M6 18H42" stroke="currentColor" stroke-width="2"/>
      <path d="M14 4V12M34 4V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="16" cy="28" r="2" fill="currentColor"/>
      <circle cx="24" cy="28" r="2" fill="currentColor"/>
      <circle cx="32" cy="28" r="2" fill="currentColor"/>
    </svg>
  `,
  social: `
    <svg class="icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 8H32C34.2 8 36 9.8 36 12V24C36 26.2 34.2 28 32 28H22L14 36V28H8C5.8 28 4 26.2 4 24V12C4 9.8 5.8 8 8 8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M44 18V32C44 34.2 42.2 36 40 36H38V44L30 36" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `,
  ads: `
    <svg class="icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 28L18 22L28 26L42 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M32 12H42V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6 36H42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `
};

export async function initPortfolio() {
  // 1. Load Portfolio Projects
  const videoGrid = document.getElementById('videoGrid');
  const photoGrid = document.getElementById('photoGrid');

  if (videoGrid && photoGrid) {
    try {
      const response = await fetch('/data/portfolio.json');
      if (!response.ok) throw new Error('Failed to fetch portfolio data');

      const projects = await response.json();

      // Clear static placeholders
      videoGrid.innerHTML = '';
      photoGrid.innerHTML = '';

      projects.forEach(project => {
        const card = createProjectCard(project);
        if (project.type === 'video') {
          videoGrid.appendChild(card);
        } else if (project.type === 'photo') {
          photoGrid.appendChild(card);
        }
      });

      attachCardEvents();
    } catch (err) {
      console.error('Error rendering portfolio:', err);
      videoGrid.innerHTML = '<p style="color:var(--accent-red); grid-column: 1/-1; text-align:center;">Failed to load portfolio items.</p>';
    }
  }

  // 2. Load Services
  const servicesGrid = document.getElementById('servicesGrid');
  if (servicesGrid) {
    try {
      const response = await fetch('/data/services.json');
      if (!response.ok) throw new Error('Failed to fetch services data');

      const services = await response.json();
      servicesGrid.innerHTML = '';

      services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        
        const iconSvg = SERVICE_ICONS[service.icon] || '';
        
        serviceCard.innerHTML = `
          <span class="service-num">${service.num}</span>
          ${iconSvg}
          <h3>${service.title}</h3>
          <p>${service.description}</p>
        `;
        
        servicesGrid.appendChild(serviceCard);
      });
    } catch (err) {
      console.error('Error rendering services:', err);
    }
  }

  // 3. Load Client Marquee
  const clientMarquee = document.getElementById('clientMarquee');
  if (clientMarquee) {
    try {
      const response = await fetch('/data/clients.json');
      if (!response.ok) throw new Error('Failed to fetch clients data');

      const clients = await response.json();
      clientMarquee.innerHTML = '';

      // We need to render the brand SVGs inlined
      const clientCards = [];

      for (const client of clients) {
        const clientSpan = document.createElement('span');
        clientSpan.className = 'client';
        clientSpan.textContent = client.name + ' ';

        // Fetch SVG inline
        try {
          const svgRes = await fetch(client.logo);
          if (svgRes.ok) {
            const svgText = await svgRes.text();
            clientSpan.insertAdjacentHTML('afterbegin', svgText);
          }
        } catch (svgErr) {
          console.warn(`Could not inline logo for ${client.name}:`, svgErr);
        }

        clientCards.push(clientSpan);
      }

      // Append original list
      clientCards.forEach(c => clientMarquee.appendChild(c));

      // Duplicate list for seamless infinite marquee loop
      clientCards.forEach(c => {
        const clone = c.cloneNode(true);
        clientMarquee.appendChild(clone);
      });

    } catch (err) {
      console.error('Error rendering client marquee:', err);
    }
  }
}

function createProjectCard(project) {
  const isVideo = project.type === 'video';
  const card = document.createElement('div');
  
  card.className = `portfolio-card ${isVideo ? 'video-aspect' : 'photo-aspect'}`;
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `${isVideo ? 'Play' : 'View'} ${project.title} project`);
  
  card.dataset.type = project.type;
  card.dataset.title = project.title;
  card.dataset.cat = project.category;
  
  if (isVideo) {
    card.dataset.video = project.video;
    if (project.video.includes('instagram.com') || project.video.includes('drive.google.com')) {
      card.dataset.embed = 'true';
    }
  } else {
    card.dataset.hires = `${project.thumbnail}-1200.webp`;
  }

  const baseImg = project.thumbnail;
  const srcset = `${baseImg}-400.webp 400w, ${baseImg}-800.webp 800w, ${baseImg}-1200.webp 1200w`;
  
  const widthAttr = isVideo ? "360" : "450";
  const heightAttr = isVideo ? "640" : "600";
  
  let cardHtml = `
    <div class="thumb-wrapper">
      <img 
        src="${baseImg}-800.webp" 
        srcset="${srcset}" 
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
        loading="lazy" 
        decoding="async" 
        width="${widthAttr}" 
        height="${heightAttr}" 
        alt="${project.title}" 
        class="thumb"
      >
    </div>
  `;

  if (isVideo) {
    cardHtml += `
      <div class="play-btn" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8V4z"/></svg>
      </div>
    `;
  }

  const servicesString = project.services.join(' + ');

  cardHtml += `
    <div class="overlay">
      <div class="card-details">
        <div class="cat">${project.category}</div>
        <div class="label">${project.title}</div>
        <div class="objective">
          <p style="color: var(--accent-red); margin-bottom: 4px; font-weight: 600; font-size: 0.7rem;">${servicesString}</p>
          ${project.objective}
        </div>
      </div>
    </div>
  `;

  card.innerHTML = cardHtml;
  return card;
}

function attachCardEvents() {
  const cards = document.querySelectorAll('.portfolio-card');
  
  cards.forEach(card => {
    card.addEventListener('click', () => {
      if (window.openLightbox) {
        window.openLightbox(card);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (window.openLightbox) {
          window.openLightbox(card);
        }
      }
    });
  });
}
