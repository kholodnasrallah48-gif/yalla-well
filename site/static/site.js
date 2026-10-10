// Small enhancements: the phone menu, reveal on scroll, count-up numbers, the scrolling phone story, the hero tilt,
// the active section in the jump bar, and the contact form (opens the email app with the message ready).
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Phone menu
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  if (btn && nav) {
    const set = (open) => {
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? btn.dataset.close : btn.dataset.open);
      btn.innerHTML = open
        ? '<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
        : '<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); } });
    window.matchMedia('(min-width: 921px)').addEventListener('change', (m) => { if (m.matches) set(false); });
  }

  // Count-up numbers
  const countUp = (el) => {
    const end = Number(el.dataset.count);
    if (still || !end) return;
    const t0 = performance.now();
    const dur = 1400;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  };

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !still) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        e.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  // Scrolling story: the sticky phone shows the screen of the step in the middle of the window
  const img = document.getElementById('story-img');
  const steps = [...document.querySelectorAll('.story-steps .step')];
  if (img && steps.length && 'IntersectionObserver' in window) {
    steps.forEach((s) => { const pre = new Image(); pre.src = s.dataset.img; });
    let current = steps[0];
    const show = (step) => {
      if (step === current) return;
      current = step;
      steps.forEach((s) => s.classList.toggle('is-on', s === step));
      const src = step.dataset.img;
      if (still) { img.src = src; return; }
      img.loading = 'eager';
      img.classList.add('is-swapping');
      setTimeout(() => {
        img.src = src;
        const done = () => img.classList.remove('is-swapping');
        if (img.complete) requestAnimationFrame(done);
        else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
      }, 180);
    };
    const so = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) show(e.target);
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => so.observe(s));
  }

  // Hero: the phone starts tilted back and straightens as the page scrolls
  const hero = document.querySelector('.phone-hero');
  if (hero && !still) {
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.45)));
      hero.style.setProperty('--hp', p.toFixed(3));
    };
    update();
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  }

  // Jump bar: mark the section in view
  const jump = document.querySelector('.jump');
  if (jump && 'IntersectionObserver' in window) {
    const links = new Map([...jump.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a]));
    const jo = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a, id) => {
          a.classList.toggle('is-on', id === e.target.id);
          if (id === e.target.id) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        });
      }
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach((_, id) => { const sec = document.getElementById(id); if (sec) jo.observe(sec); });
  }

  // Contact form: compose an email to the address on the form
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const to = form.dataset.email;
      if (!to) return;
      let bad = null;
      form.querySelectorAll('[required]').forEach((f) => {
        const ok = f.value.trim() && (f.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
        f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !bad) bad = f;
      });
      const note = document.getElementById('form-note');
      if (bad) {
        bad.focus();
        if (note) note.textContent = doc.lang === 'en' ? 'Please fill in your name, a valid email and your message.' : 'محتاجين الاسم وإيميل صح والرسالة.';
        return;
      }
      const v = (n) => form.elements[n].value.trim();
      const subject = `${v('topic')} · Yalla Well`;
      const body = `${v('message')}\n\n${v('name')}\n${v('email')}`;
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
