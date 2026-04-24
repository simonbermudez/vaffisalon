(function () {
  'use strict';

  // ===== Mobile nav toggle =====
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close mobile nav on link tap
    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on resize above breakpoint
    window.addEventListener('resize', () => {
      if (window.innerWidth > 720) {
        links.classList.remove('is-open');
        toggle.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
  }

  // ===== Show mobile-only Book Now inside mobile menu =====
  const mobileCta = document.querySelector('.nav-cta-mobile');
  function toggleMobileCta() {
    if (!mobileCta) return;
    mobileCta.style.display = window.innerWidth <= 720 ? 'inline-flex' : 'none';
  }
  toggleMobileCta();
  window.addEventListener('resize', toggleMobileCta);

  // ===== Reveal on scroll =====
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // ===== Footer year =====
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // ===== Highlight today's hours =====
  const hoursList = document.getElementById('hoursList');
  if (hoursList) {
    const today = new Date().getDay();
    const todayItem = hoursList.querySelector(`li[data-day="${today}"]`);
    if (todayItem) todayItem.classList.add('today');
  }

  // ===== Instagram feed (loaded from images/instagram/posts.json) =====
  const igGrid = document.getElementById('igGrid');
  const igUpdated = document.getElementById('igUpdated');

  function formatRelative(iso) {
    if (!iso) return 'recently';
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    const mins = Math.round(diff / 60000);
    const hours = Math.round(mins / 60);
    const days = Math.round(hours / 24);
    if (mins < 60) return `updated ${mins} min ago`;
    if (hours < 24) return `updated ${hours}h ago`;
    if (days < 7) return `updated ${days}d ago`;
    return `updated ${new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  function renderIG(data) {
    if (!igGrid) return;
    const posts = (data && data.posts) || [];
    if (!posts.length) {
      igGrid.innerHTML = '<p class="ig-empty">No posts to show yet — follow <a href="https://www.instagram.com/vaffisalon" target="_blank" rel="noopener">@vaffisalon</a> on Instagram.</p>';
      return;
    }
    if (igUpdated) igUpdated.textContent = formatRelative(data.updated_at);

    igGrid.innerHTML = posts.map((p) => {
      const caption = p.short || p.caption || '';
      const safeCaption = caption.replace(/[<>&"']/g, (c) => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;' }[c]));
      const href = p.url || '#';
      const badge = p.is_video
        ? '<span class="ig-card__badge" aria-label="Video"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>'
        : '';
      return `
        <a class="ig-card reveal" href="${href}" target="_blank" rel="noopener" aria-label="Open on Instagram">
          ${badge}
          <img src="images/instagram/${p.file}" alt="${safeCaption}" width="640" height="640" loading="lazy" />
          <div class="ig-card__overlay">
            <div class="ig-card__caption">${safeCaption}</div>
            <div class="ig-card__cta">View on Instagram →</div>
          </div>
        </a>`;
    }).join('');

    // re-attach reveal observer for newly inserted nodes
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      igGrid.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    }
  }

  if (igGrid) {
    fetch('images/instagram/posts.json', { cache: 'no-cache' })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then(renderIG)
      .catch(() => {
        igGrid.innerHTML = '<p class="ig-empty">Couldn\u2019t load the latest posts. Visit <a href="https://www.instagram.com/vaffisalon" target="_blank" rel="noopener">@vaffisalon</a> directly.</p>';
      });
  }

  // ===== Lightbox (legacy gallery-item only) =====
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  if (galleryItems.length && lightbox && lightboxImg) {
    galleryItems.forEach((item) => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (!img) return;
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || '';
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      lightboxImg.src = '';
      document.body.style.overflow = '';
    };

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
    });
  }

  // ===== Contact form (simulated submit) =====
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  if (form && status) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        status.style.display = 'block';
        status.style.color = '#b85a5a';
        status.textContent = 'Please fill in your name, email, and message.';
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      setTimeout(() => {
        status.style.display = 'block';
        status.style.color = 'var(--gold-deep)';
        status.textContent = 'Thank you — we\u2019ll be in touch shortly.';
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }, 900);
    });
  }

  // ===== Header shadow on scroll =====
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 12) {
        header.style.boxShadow = '0 2px 18px rgba(43,36,32,0.08)';
      } else {
        header.style.boxShadow = 'none';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
