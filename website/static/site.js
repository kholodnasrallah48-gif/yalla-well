// Website behaviour. With GSAP loaded and motion allowed, the page runs the full motion layer (smooth scroll, pinned
// scenes, scroll-linked phone, word reveals, tilt). Otherwise it falls back to simple reveals, so the page still works.
(() => {
  const doc = document.documentElement;
  // The safety timer in <head> removes "js" if this script was slow to arrive; then the page is already visible.
  const late = !doc.classList.contains('js');
  doc.classList.add('ready');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rtl = doc.dir === 'rtl';
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motion = !!(window.gsap && window.ScrollTrigger) && !still && !late;
  if (!motion) doc.classList.remove('motion');
  let lenis = null;

  // ---------- phone menu ----------
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  if (btn && nav) {
    const ICON = (d) => `<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="${d}"/></svg>`;
    const set = (open) => {
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? btn.dataset.close : btn.dataset.open);
      btn.innerHTML = ICON(open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16');
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); } });
    window.matchMedia('(min-width: 921px)').addEventListener('change', (m) => { if (m.matches) set(false); });
  }

  // ---------- contact form: compose an email to the address on the form ----------
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
      const body = `${v('message')}\n\n${v('name')}\n${v('email')}`;
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(`${v('topic')} · Yalla Well`)}&body=${encodeURIComponent(body)}`;
    });
  }

  // ---------- jump bar: mark the section in view ----------
  const jump = document.querySelector('.jump');
  if (jump && 'IntersectionObserver' in window) {
    const links = new Map([...jump.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a]));
    const jo = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a, id) => {
          a.classList.toggle('is-on', id === e.target.id);
          if (id === e.target.id) jump.scrollTo({ left: a.offsetLeft - jump.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
        });
      }
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach((_, id) => { const sec = document.getElementById(id); if (sec) jo.observe(sec); });
  }

  /** Wraps each word of an element in spans, keeping inner elements such as <em>. */
  function splitWords(el, mask) {
    const words = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 1) { walk(n); return; }
        if (n.nodeType !== 3) return;
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const outer = document.createElement('span');
          if (mask) {
            outer.className = 'w';
            const inner = document.createElement('span');
            inner.className = 'wi';
            inner.textContent = part;
            outer.appendChild(inner);
            words.push(inner);
          } else {
            outer.className = 'sw';
            outer.textContent = part;
            words.push(outer);
          }
          frag.appendChild(outer);
        });
        n.replaceWith(frag);
      });
    };
    walk(el);
    return words;
  }

  if (motion) runMotion(); else runBasic();

  // ---------- without the motion layer ----------
  function runBasic() {
    const countUp = (el) => {
      const end = Number(el.dataset.count);
      if (still || !end) return;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1400);
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
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
    // Story: the sticky phone shows the screen of the step in the middle of the window.
    const steps = [...document.querySelectorAll('.story-steps .step')];
    const screens = [...document.querySelectorAll('.story .screen')];
    if (steps.length && screens.length && 'IntersectionObserver' in window) {
      const so = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = steps.indexOf(e.target);
          steps.forEach((s, j) => s.classList.toggle('is-on', j === i));
          screens.forEach((s, j) => s.classList.toggle('is-on', j === i));
        }
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach((s) => so.observe(s));
    }
  }

  // ---------- the motion layer ----------
  function runMotion() {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    const s = rtl ? -1 : 1; // flips horizontal motion for Arabic

    // Smooth scrolling, driven by GSAP's ticker so pinned scenes stay in sync.
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href*="#"]');
        if (!a) return;
        const url = new URL(a.href, location.href);
        if (url.pathname !== location.pathname || !url.hash) return;
        const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -(target.closest('.page-hero') ? 0 : 110), duration: 1.4 });
        history.replaceState(null, '', url.hash);
      });
    }

    // Header slides away while scrolling down and comes back on the way up.
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => doc.classList.toggle('hdr-hidden', self.direction === 1 && self.scroll() > 360 && !document.body.classList.contains('menu-open')),
    });

    // Opening scene: headline words rise, the phone lifts in, the cards pop out.
    const hero = document.querySelector('.hero');
    const heroWords = hero ? (() => { const h = hero.querySelector('[data-split]'); const w = splitWords(h, true); h.classList.add('is-split'); return w; })() : [];
    if (hero) {
      const [pill, h1, lead, storesBox] = hero.querySelectorAll('.hero-text > *');
      const wrapPhone = hero.querySelector('.hero-phone');
      const floats = [...hero.querySelectorAll('.float')];
      gsap.set([pill, h1, lead, storesBox], { opacity: 1, y: 0 });
      gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.05 })
        .from(pill, { y: 24, opacity: 0, duration: 1.1 })
        .from(heroWords, { yPercent: 120, rotate: 5 * s, duration: 1.4, stagger: 0.07 }, 0.08)
        .from(lead, { y: 26, opacity: 0, duration: 1.3 }, 0.45)
        .from(storesBox.querySelectorAll('.store'), { y: 26, opacity: 0, duration: 1.2, stagger: 0.08 }, 0.6)
        .fromTo('.hero-stage', { opacity: 0, y: 160 }, { opacity: 1, y: 0, duration: 2 }, 0.35)
        .fromTo(wrapPhone, { rotateX: 42, scale: 0.8 }, { rotateX: 16, scale: 0.92, duration: 2.2 }, 0.35)
        .fromTo(floats, { opacity: 0, scale: 0.5, y: 50 }, { opacity: 1, scale: 1, y: 0, duration: 1.3, ease: 'back.out(1.7)', stagger: 0.16 }, 1.25)
        .add(() => floats.forEach((f, i) => gsap.to(f, { yPercent: -16, duration: 3 + i * 0.8, ease: 'sine.inOut', yoyo: true, repeat: -1 })));
    }

    // Inner pages: the heading rises word by word.
    const pageHero = document.querySelector('.page-hero .wrap');
    if (pageHero) {
      const h = pageHero.querySelector('[data-split]');
      const words = splitWords(h, true);
      gsap.set(pageHero, { opacity: 1, y: 0 });
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
        .from(pageHero.querySelector('.kicker'), { y: 20, opacity: 0, duration: 1 })
        .from(words, { yPercent: 120, rotate: 4 * s, duration: 1.3, stagger: 0.06 }, 0.05);
      const lead = pageHero.querySelector('.lead');
      if (lead) tl.from(lead, { y: 24, opacity: 0, duration: 1.2 }, 0.4);
      const jumps = document.querySelectorAll('.jump a');
      if (jumps.length) tl.from(jumps, { y: 16, opacity: 0, duration: 0.9, stagger: 0.05 }, 0.55);
    }

    const sayEl = document.querySelector('[data-say]');
    const sayWords = sayEl ? splitWords(sayEl, false) : [];

    // FAQ answers open and close smoothly.
    document.querySelectorAll('details.qa').forEach((d) => {
      const body = d.querySelector('.qa-a');
      d.querySelector('summary').addEventListener('click', (e) => {
        e.preventDefault();
        if (d.open) {
          d.classList.add('is-closing');
          gsap.to(body, { height: 0, opacity: 0, duration: 0.45, ease: 'power3.inOut', overflow: 'hidden',
            onComplete: () => { d.open = false; d.classList.remove('is-closing'); gsap.set(body, { clearProps: 'all' }); ScrollTrigger.refresh(); } });
        } else {
          d.open = true;
          gsap.fromTo(body, { height: 0, opacity: 0, overflow: 'hidden' }, { height: 'auto', opacity: 1, duration: 0.6, ease: 'expo.out',
            onComplete: () => { gsap.set(body, { clearProps: 'all' }); ScrollTrigger.refresh(); } });
        }
      });
    });

    // Cards lean toward the pointer and light up under it; buttons pull gently toward it.
    if (fine) {
      document.querySelectorAll('.tile, .dl-card, .how li, .c-card, .howto-col').forEach((el) => {
        gsap.set(el, { transformPerspective: 900 });
        const rx = gsap.quickTo(el, 'rotateX', { duration: 0.7, ease: 'power3.out' });
        const ry = gsap.quickTo(el, 'rotateY', { duration: 0.7, ease: 'power3.out' });
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          rx((0.5 - py) * 7);
          ry((px - 0.5) * 9);
          el.style.setProperty('--mx', `${px * 100}%`);
          el.style.setProperty('--my', `${py * 100}%`);
        });
        el.addEventListener('pointerleave', () => { rx(0); ry(0); });
      });
      document.querySelectorAll('.btn-primary, a.store, .btn-ghost, .social, .lang').forEach((el) => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.22);
          yTo((e.clientY - r.top - r.height / 2) * 0.32);
        });
        el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
      });
    }

    // Scroll scenes. Built inside matchMedia so they rebuild cleanly when the layout switches between phone and desktop.
    // Pinned scenes are created first, top to bottom, so everything below them measures with their extra scroll.
    const mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 921px)', mob: '(max-width: 920px)' }, (c) => {
      const { desk } = c.conditions;

      // Hero: while scrolling, the text drifts up, the phone straightens and grows, the cards spread out.
      if (hero) {
        const wrapPhone = hero.querySelector('.hero-phone');
        const toCenter = () => Math.max(240, wrapPhone.getBoundingClientRect().top + window.scrollY + wrapPhone.offsetHeight / 2 - window.innerHeight / 2);
        gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: hero, start: 'top top', end: () => `+=${toCenter()}`, scrub: 0.7, invalidateOnRefresh: true } })
          .to(hero.querySelector('.hero-text'), { y: -120, opacity: 0.1 }, 0)
          .fromTo(hero.querySelector('.phone-hero'), { rotateX: 0, scale: 1 }, { rotateX: -16, scale: desk ? 1.14 : 1.06 }, 0)
          .to(hero.querySelector('.float-a'), { x: -70, rotate: -6 }, 0)
          .to(hero.querySelector('.float-b'), { x: 70, rotate: 6 }, 0)
          .fromTo(hero.querySelector('.glow'), { scale: 1, opacity: 1 }, { scale: 1.45, opacity: 0.75 }, 0);
      }

      // Statement: pinned while its words light up one after another.
      if (sayEl) {
        gsap.timeline({ scrollTrigger: { trigger: sayEl.closest('.statement'), start: 'top top', end: () => `+=${window.innerHeight * 1.3}`, pin: true, scrub: 0.6 } })
          .fromTo(sayEl, { scale: 0.96 }, { scale: 1, duration: 1, ease: 'none' }, 0)
          .to(sayWords, { opacity: 1, duration: 0.25, stagger: 0.75 / sayWords.length, ease: 'none' }, 0);
      }

      // Story (desktop): pinned; the text swaps step by step and the phone wipes to the next screen.
      const story = document.querySelector('.story');
      if (story && desk) {
        const steps = [...story.querySelectorAll('.step')];
        const screens = [...story.querySelectorAll('.screen')];
        const navs = [...story.querySelectorAll('.sn')];
        const dots = [...story.querySelectorAll('.story-dots i')];
        const ph = story.querySelector('.phone-sticky');
        const n = steps.length;
        // Start positions in percent only, so the CSS offset (there to avoid a flash before this runs) doesn't add up.
        gsap.set(screens, { x: 0, xPercent: (i) => (i ? 100 * s : 0) });
        gsap.fromTo(ph, { y: 140, rotateX: 22, scale: 0.88 }, { y: 0, rotateX: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: story, start: 'top bottom', end: 'top top', scrub: 0.7 } });
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: story, start: 'top top', end: () => `+=${window.innerHeight * (n - 0.3)}`, pin: true, scrub: 0.6,
            onUpdate: (self) => {
              const idx = Math.min(n - 1, Math.floor(self.progress * n));
              navs.forEach((el, i) => el.classList.toggle('is-on', i === idx));
              dots.forEach((el, i) => el.classList.toggle('is-on', i === idx));
            },
          },
        });
        steps.forEach((step, i) => {
          tl.fromTo(navs[i].querySelector('u'), { scaleX: 0 }, { scaleX: 1, duration: 1 }, i);
          if (i === n - 1) return;
          // The next screen swipes in from the side (from the left in Arabic), pushing the current one away.
          const at = i + 0.72;
          tl.to(step, { autoAlpha: 0, x: -70 * s, duration: 0.22, ease: 'power2.in' }, at)
            .fromTo(steps[i + 1], { autoAlpha: 0, x: 70 * s }, { autoAlpha: 1, x: 0, duration: 0.26, ease: 'power2.out' }, at + 0.18)
            .fromTo(screens[i + 1], { xPercent: 100 * s }, { xPercent: 0, duration: 0.42, ease: 'power3.inOut' }, at)
            .to(screens[i], { xPercent: -35 * s, filter: 'brightness(0.35)', duration: 0.42, ease: 'power3.inOut' }, at)
            .to(ph, { rotateY: -7 * s, duration: 0.21, ease: 'sine.inOut' }, at)
            .to(ph, { rotateY: 0, duration: 0.21, ease: 'sine.inOut' }, at + 0.21);
        });
      }

      // Gallery: pinned while the row of screens travels sideways; each phone turns as it passes the middle.
      const gal = document.querySelector('.gallery');
      if (gal) {
        const track = gal.querySelector('.gal-track');
        const vp = gal.querySelector('.gal-viewport');
        const dist = () => Math.max(0, track.scrollWidth - vp.clientWidth);
        const move = gsap.to(track, {
          x: () => -s * dist(), ease: 'none',
          scrollTrigger: { trigger: gal, start: 'top top', end: () => `+=${dist() * 1.1}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
        });
        gal.querySelectorAll('.gal-item').forEach((item) => {
          const ph = item.querySelector('.phone');
          gsap.set(ph, { transformPerspective: 1200 });
          gsap.timeline({ scrollTrigger: { trigger: item, containerAnimation: move, start: rtl ? 'right left' : 'left right', end: rtl ? 'left right' : 'right left', scrub: true } })
            .fromTo(ph, { rotateY: -26 * s, scale: 0.86 }, { rotateY: 0, scale: 1, ease: 'power1.out', duration: 1 })
            .to(ph, { rotateY: 26 * s, scale: 0.86, ease: 'power1.in', duration: 1 });
        });
      }

      // Story (phone): each phone screen rises and straightens as it scrolls in.
      if (story && !desk) {
        // Each phone swipes in from the side, alternating sides, as it scrolls in.
        story.querySelectorAll('.phone-inline').forEach((p, i) => {
          const side = (i % 2 ? -1 : 1) * s;
          gsap.fromTo(p,
            { xPercent: 115 * side, rotateY: -28 * side, scale: 0.9, transformPerspective: 1100 },
            { xPercent: 0, rotateY: 0, scale: 1, ease: 'power1.out', scrollTrigger: { trigger: p, start: 'top bottom', end: 'top 40%', scrub: 0.6 } });
        });
        story.querySelectorAll('.step').forEach((step) => gsap.from(step.querySelectorAll('.kicker, .h2, .lead, .ticks li'),
          { opacity: 0, y: 40, duration: 1.1, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: step, start: 'top 82%', once: true } }));
      }

      // Feature pages: each phone swings in from the side as its section arrives.
      document.querySelectorAll('.feature').forEach((f) => {
        const p = f.querySelector('.feature-media .phone');
        const dir = (f.classList.contains('is-flip') ? -1 : 1) * s;
        gsap.fromTo(p, { rotateY: 30 * dir, rotateX: 8, y: 120, scale: 0.84 },
          { rotateY: 0, rotateX: 0, y: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'center 55%', scrub: 0.7 } });
        gsap.set(f.querySelectorAll('.reveal'), { opacity: 1, y: 0 });
        f.querySelectorAll('.feature-text').forEach((t) => {
          gsap.from(t.querySelectorAll('.kicker, .h2, .lead, .h3, .ticks li'), { opacity: 0, y: 36, duration: 1.1, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: t, start: 'top 80%', once: true } });
        });
      });

      // Numbers count up as they arrive.
      const stats = [...document.querySelectorAll('.stat')];
      if (stats.length) {
        ScrollTrigger.create({
          trigger: '.stats', start: 'top 85%', once: true,
          onEnter: () => {
            gsap.fromTo(stats, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.08 });
            stats.forEach((st) => {
              const num = st.querySelector('[data-count]');
              const o = { v: 0 };
              gsap.to(o, { v: Number(num.dataset.count), duration: 1.8, ease: 'power3.out', onUpdate: () => { num.textContent = String(Math.round(o.v)); } });
            });
          },
        });
      }

      // How it works: the line draws across and the outlined numbers fill in.
      const how = document.querySelector('.how');
      if (how) {
        const line = document.querySelector('.how-line span');
        if (line) gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: how, start: 'top 85%', end: 'bottom 55%', scrub: 0.6 } });
        gsap.to(how.querySelectorAll('.how-n'), { color: '#19E68C', duration: 0.8, stagger: 0.25, ease: 'power2.out', scrollTrigger: { trigger: how, start: 'top 60%', once: true } });
      }

      // Download panel: grows into place, and the champ keeps cheering.
      const cta = document.querySelector('.cta');
      if (cta) {
        gsap.fromTo(cta, { opacity: 0.2, scale: 0.9, y: 80 }, { opacity: 1, scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: cta, start: 'top bottom', end: 'top 45%', scrub: 0.7 } });
        const champ = cta.querySelector('.cta-champ');
        if (champ) {
          gsap.timeline({ repeat: -1, repeatDelay: 1.4, scrollTrigger: { trigger: cta, start: 'top 80%', toggleActions: 'play pause resume pause' } })
            .to(champ, { y: -16, scaleY: 1.06, duration: 0.32, ease: 'power2.out', transformOrigin: '50% 100%' })
            .to(champ, { y: 0, scaleY: 1, duration: 0.5, ease: 'bounce.out' });
        }
      }

      // About: the champ draws itself, then floats.
      const about = document.querySelector('.about-champ');
      if (about) {
        const lines = [...about.querySelectorAll('path:not(.spark)')];
        lines.forEach((p) => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); });
        gsap.timeline({ scrollTrigger: { trigger: about, start: 'top 75%', once: true } })
          .to(lines, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.25 })
          .from(about.querySelector('circle'), { scale: 0, transformOrigin: '50% 50%', duration: 0.7, ease: 'back.out(2.5)' }, '-=0.3')
          .from(about.querySelector('.spark'), { opacity: 0, duration: 0.5 }, '-=0.2')
          .add(() => gsap.to(about, { y: -14, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      }

      // Everything else marked .reveal fades up in small groups; cards also tip forward.
      const skip = (el) => el.closest('.hero, .page-hero, .feature, .cta-band') || el.classList.contains('stat');
      const items = gsap.utils.toArray('.reveal').filter((el) => !skip(el));
      ScrollTrigger.batch(items, {
        start: 'top 88%', once: true,
        onEnter: (els) => els.forEach((el, i) => {
          const card = el.matches('.tile, .dl-card, .how li, .c-card, .howto-col, .qa-group, .form');
          gsap.fromTo(el, card ? { opacity: 0, y: 70, rotateX: -16, transformPerspective: 900, transformOrigin: '50% 100%' } : { opacity: 0, y: 50 },
            { opacity: 1, y: 0, rotateX: 0, duration: 1.3, ease: 'expo.out', delay: i * 0.09, overwrite: 'auto' });
        }),
      });
      ScrollTrigger.sort();
    });

    // Measurements change once fonts and images are in.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
