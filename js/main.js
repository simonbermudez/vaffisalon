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

  // ===== Gallery lightbox =====
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
