(function () {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navList = document.querySelector('[data-nav-list]');

  if (navToggle && navList) {
    navToggle.addEventListener('click', function () {
      const isOpen = navList.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navList.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navList.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('[data-current-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  const lightbox = document.querySelector('[data-lightbox]');
  if (lightbox) {
    const lightboxImage = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('button');

    document.querySelectorAll('.js-lightbox').forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        const src = trigger.getAttribute('href');
        const alt = trigger.querySelector('img')?.getAttribute('alt') || 'Project photo';
        lightboxImage.src = src;
        lightboxImage.alt = alt;
        lightbox.classList.add('open');
      });
    });

    function closeLightbox() {
      lightbox.classList.remove('open');
      lightboxImage.src = '';
    }

    closeBtn?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeLightbox();
      }
    });
  }

  const form = document.getElementById('contactForm');
  if (form) {
    const status = document.getElementById('formStatus');

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      status.textContent = 'Submitting...';
      status.className = 'status';

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Unable to submit form right now.');
        }

        form.reset();
        status.textContent = 'Thanks! Your request has been received. We will contact you soon.';
        status.classList.add('success');
      } catch (error) {
        status.textContent = error.message || 'Submission failed. Please call us directly.';
        status.classList.add('error');
      }
    });
  }
})();
