/**
 * portfolio.js - Dynamically loads portfolio, services, and client brands from JSON layers
 */

// Icon map for core services
const SERVICE_ICONS = {
  strategy: `
    <svg class="icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="2"/>
      <circle cx="24" cy="24" r="10" stroke="currentColor" stroke-width="2"/>
      <circle cx="24" cy="24" r="4" fill="currentColor"/>
    </svg>
  `,
  reels: `
    <svg class="icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="6" y="9" width="28" height="30" rx="2" stroke="currentColor" stroke-width="2"/>
      <path d="M34 19L42 14V34L34 29" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M16 18L24 24L16 30V18Z" fill="currentColor"/>
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
  const videoGrid = document.getElementById('videoGrid');
  const servicesGrid = document.getElementById('servicesGrid');
  const clientMarquee = document.getElementById('clientMarquee');

  // Fetch all data sources in parallel — avoids serial round-trip stalls
  const [portfolioResult, servicesResult, clientsResult] = await Promise.allSettled([
    videoGrid    ? fetch('/data/portfolio.json').then(r => { if (!r.ok) throw new Error('portfolio'); return r.json(); }) : Promise.resolve(null),
    servicesGrid ? fetch('/data/services.json').then(r => { if (!r.ok) throw new Error('services');  return r.json(); }) : Promise.resolve(null),
    clientMarquee ? fetch('/data/clients.json').then(r => { if (!r.ok) throw new Error('clients');   return r.json(); }) : Promise.resolve(null),
  ]);

  // 1. Render Portfolio Projects
  if (videoGrid) {
    if (portfolioResult.status === 'fulfilled' && portfolioResult.value) {
      const projects = portfolioResult.value;
      videoGrid.innerHTML = '';
      projects.forEach(project => {
        if (project.type !== 'video') return;
        const card = createProjectCard(project);
        videoGrid.appendChild(card);
      });
      attachCardEvents();
      initLazyLoading();
    } else {
      console.error('Error rendering portfolio:', portfolioResult.reason);
      videoGrid.innerHTML = '<p style="color:var(--accent-red); grid-column: 1/-1; text-align:center;">Failed to load portfolio items.</p>';
    }
  }

  // 2. Render Services
  if (servicesGrid) {
    if (servicesResult.status === 'fulfilled' && servicesResult.value) {
      const services = servicesResult.value;
      servicesGrid.innerHTML = '';
      services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.setAttribute('data-tilt', '');
        const iconSvg = SERVICE_ICONS[service.icon] || '';
        serviceCard.innerHTML = `
          <span class="service-num">${service.num}</span>
          ${iconSvg}
          <h3>${service.title}</h3>
          <p>${service.description}</p>
        `;
        servicesGrid.appendChild(serviceCard);
      });
    } else {
      console.error('Error rendering services:', servicesResult.reason);
    }
  }

  // 3. Render Client Marquee
  if (clientMarquee) {
    if (clientsResult.status === 'fulfilled' && clientsResult.value) {
      const clients = clientsResult.value;
      clientMarquee.innerHTML = '';
      // Fetch all SVGs inline concurrently
      const clientCards = await Promise.all(clients.map(async (client) => {
        const clientSpan = document.createElement('span');
        clientSpan.className = 'client';
        clientSpan.setAttribute('aria-label', client.name);
        clientSpan.setAttribute('role', 'img');
        try {
          const svgRes = await fetch(client.logo);
          if (svgRes.ok) {
            const svgText = await svgRes.text();
            clientSpan.insertAdjacentHTML('afterbegin', svgText);
          }
        } catch (svgErr) {
          console.warn(`Could not inline logo for ${client.name}:`, svgErr);
        }
        return clientSpan;
      }));
      clientCards.forEach(c => clientMarquee.appendChild(c));
      // Duplicate list for seamless infinite marquee loop
      clientCards.forEach(c => {
        const clone = c.cloneNode(true);
        clientMarquee.appendChild(clone);
      });
    } else {
      console.error('Error rendering client marquee:', clientsResult.reason);
    }
  }
}

// Helper to parse Cloudinary URLs and generate responsive srcset variants
function getCloudinaryResponsiveSrcset(url) {
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?:[^/]+\/)*(v\d+\/)?(.+)$/);
  if (!match) return null;
  const prefix = match[1];
  const version = match[2] || '';
  const publicIdWithExt = match[3];

  const sizes = [400, 800, 1200];
  const srcsetString = sizes.map(w => `${prefix}f_auto,q_auto,w_${w}/${version}${publicIdWithExt} ${w}w`).join(', ');
  const fallbackSrc = `${prefix}f_auto,q_auto,w_800/${version}${publicIdWithExt}`;

  return { srcset: srcsetString, src: fallbackSrc };
}

// Helper to automatically generate WebP poster frame from video source URL
export function getCloudinaryVideoPoster(url) {
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(?:[^/]+\/)*(v\d+\/)?(.+)\.[^.]+$/);
  if (!match) return url;
  const prefix = match[1];
  const version = match[2] || '';
  const publicId = match[3];
  return `${prefix.replace('video/upload', 'image/upload')}f_webp,q_auto,w_720/${version}${publicId}.webp`;
}

// Helper to apply secure transformations to Cloudinary videos
export function getCloudinaryVideoUrl(url) {
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(?:[^/]+\/)*(v\d+\/)?(.+)$/);
  if (!match) return url;
  const prefix = match[1];
  const version = match[2] || '';
  const publicIdWithExt = match[3];
  return `${prefix}f_auto,q_auto,w_720,vc_auto/${version}${publicIdWithExt}`;
}

function createProjectCard(project) {
  const isVideo = project.type === 'video';
  const card = document.createElement('div');
  const source = project.source || 'cloudinary';

  card.className = `portfolio-card ${source}-card ${isVideo ? 'video-aspect' : 'photo-aspect'}`;
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');

  // Set accessibility labels
  if (source === 'instagram') {
    card.setAttribute('aria-label', `View ${project.title} on Instagram`);
  } else {
    card.setAttribute('aria-label', `Open ${project.title} ${isVideo ? 'video' : 'photo'}`);
  }

  card.dataset.id = project.id;
  card.dataset.type = project.type;
  card.dataset.source = source;
  card.dataset.title = project.title;
  card.dataset.cat = project.category;

  // Resolve image paths and responsive rules
  let imgSrc = '';
  let srcsetAttr = '';
  const baseImg = project.thumbnail;

  const isCloudinary = source === 'cloudinary';
  const isCloudinaryUrl = baseImg.startsWith('http') && baseImg.includes('cloudinary.com');

  if (isCloudinary && isCloudinaryUrl) {
    const cloudinaryData = getCloudinaryResponsiveSrcset(baseImg);
    if (cloudinaryData) {
      imgSrc = cloudinaryData.src;
      srcsetAttr = cloudinaryData.srcset;
    } else {
      imgSrc = baseImg;
    }
  } else {
    const hasExtension = /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(baseImg) || baseImg.startsWith('http') || baseImg.startsWith('//');
    imgSrc = hasExtension ? baseImg : `${baseImg}-800.webp`;
    srcsetAttr = hasExtension ? `${baseImg}` : `${baseImg}-400.webp 400w, ${baseImg}-800.webp 800w, ${baseImg}-1200.webp 1200w`;
  }

  if (source === 'instagram') {
    card.dataset.url = project.url;
  } else {
    if (isVideo) {
      card.dataset.video = project.video;
    } else {
      // For photos, use 1600px optimized size for lightbox
      if (isCloudinaryUrl) {
        card.dataset.hires = baseImg.replace(/\/image\/upload\/(?:[^/]+\/)?/, '/image/upload/f_auto,q_auto,w_1600/');
      } else {
        const hasExtension = /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(baseImg) || baseImg.startsWith('http');
        card.dataset.hires = hasExtension ? baseImg : `${project.thumbnail}-1200.webp`;
      }
    }
  }

  const widthAttr = isVideo ? "360" : "450";
  const heightAttr = isVideo ? "640" : "600";

  let cardHtml = `
    <div class="thumb-wrapper">
      <img 
        data-src="${imgSrc}" 
        ${srcsetAttr ? `data-srcset="${srcsetAttr}"` : ''} 
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
        loading="lazy" 
        decoding="async" 
        width="${widthAttr}" 
        height="${heightAttr}" 
        alt="${project.title}" 
        class="thumb lazy-thumb"
      >
    </div>
  `;

  // Draw appropriate overlay button/badge based on type
  if (source === 'instagram') {
    cardHtml += `
      <div class="instagram-btn" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        <span>View on Instagram</span>
      </div>
    `;
  } else if (isVideo) {
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
        </div>
      </div>
    </div>
  `;

  card.innerHTML = cardHtml;
  return card;
}

function initLazyLoading() {
  const lazyImages = document.querySelectorAll('.lazy-thumb');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '100px 0px',
      threshold: 0.01
    });

    lazyImages.forEach(img => observer.observe(img));
  } else {
    // Fallback if IntersectionObserver is unsupported
    lazyImages.forEach(img => {
      if (img.dataset.src) img.src = img.dataset.src;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.classList.add('loaded');
    });
  }
}

function handleCardAction(card) {
  const source = card.dataset.source;
  if (source === 'instagram') {
    const url = card.dataset.url;
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    if (window.openLightbox) {
      window.openLightbox(card);
    }
  }
}

function attachCardEvents() {
  const cards = document.querySelectorAll('.portfolio-card');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      handleCardAction(card);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardAction(card);
      }
    });
  });
}
