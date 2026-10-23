// Website behaviour. With GSAP loaded and motion allowed, the page runs the full motion layer (smooth scroll, pinned
// scenes, scroll-linked phone, word reveals, tilt). Otherwise it falls back to simple reveals, so the page still works.
(() => {
  const doc = document.documentElement;
  // The safety timer in <head> removes "js" if this script was slow to arrive; then the page is already visible.
  const late = !doc.classList.contains('js');
  doc.classList.add('ready');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rtl = doc.dir === 'rtl';
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
        if (note) note.textContent = doc.lang === 'en' ? 'Please fill in your name, a valid email and your message.' : 'محتاجين الاسم، وإيميل صحيح، والرسالة.';
        return;
      }
      const v = (n) => form.elements[n].value.trim();
      const body = `${v('message')}\n\n${v('name')}\n${v('email')}`;
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(`${v('topic')} · Yalla Well`)}&body=${encodeURIComponent(body)}`;
    });
  }


  // ---------- waitlist: send to our Google Sheet, then on to the WhatsApp channel ----------
  const join = document.getElementById('join-form');
  if (join) {
    const en = doc.lang === 'en';
    const note = document.getElementById('join-note');
    const params = new URLSearchParams(location.search);
    join.addEventListener('change', (e) => {
      e.target.setAttribute('aria-invalid', 'false');
      const set = e.target.closest('fieldset'); if (set) set.setAttribute('aria-invalid', 'false');
    });
    join.addEventListener('input', (e) => e.target.setAttribute('aria-invalid', 'false'));
    join.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = join.dataset.endpoint;
      if (!url) return;
      let bad = null;
      const mark = (el, ok) => { el.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok && !bad) bad = el; };
      const f = join.elements;
      mark(f.name, !!f.name.value.trim());
      mark(f.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim()));
      const dev = join.querySelector('input[name="device"]:checked');
      const devSet = join.querySelector('input[name="device"]').closest('fieldset');
      devSet.setAttribute('aria-invalid', dev ? 'false' : 'true'); if (!dev && !bad) bad = join.querySelector('input[name="device"]');
      mark(f.country, !!f.country.value);
      mark(f.agree, f.agree.checked);
      if (bad) {
        bad.focus();
        note.textContent = en ? 'Please fill in your name, a valid email, your phone and country, and tick the agreement.' : 'محتاجين الاسم، وإيميل صحيح، ونوع الموبايل، والبلد، والموافقة.';
        return;
      }
      if (f.website.value) return; // a bot filled the hidden field
      const body = new URLSearchParams({
        name: f.name.value.trim(), email: f.email.value.trim(), device: dev.value, country: f.country.value,
        goal: [...join.querySelectorAll('input[name="goal"]:checked')].map((c) => c.value).join(', '),
        lang: join.dataset.lang, src: params.get('src') || params.get('utm_source') || document.referrer.replace(/^https?:\/\//, '').split('/')[0] || 'direct',
      });
      const btn = join.querySelector('button[type="submit"]');
      btn.disabled = true;
      note.textContent = en ? 'Sending' : 'بنسجل بياناتك';
      try {
        // Apps Script answers with a redirect the browser can't read across sites; a network error still throws.
        await fetch(url, { method: 'POST', mode: 'no-cors', body });
      } catch (err) {
        btn.disabled = false;
        note.textContent = en ? 'That didn\'t go through. Please check the internet and try again.' : 'التسجيل موصلش. ممكن نجرب تاني بعد التأكد من النت.';
        return;
      }
      const done = document.getElementById('join-done');
      join.hidden = true; done.hidden = false; done.focus();
      const go = join.dataset.channel;
      if (go) {
        let n = 5;
        const count = document.getElementById('join-count');
        const tick = () => {
          count.textContent = en ? `Opening the channel in ${n}` : `القناة هتفتح بعد ${n} ثواني`;
          if (n-- <= 0) { location.href = go; return; }
          setTimeout(tick, 1000);
        };
        tick();
      }
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

  // ---------- trailer: loads when near the screen, plays muted on a loop; paused on its poster with reduced motion ----------
  const tr = document.querySelector('[data-trailer]');
  if (tr) {
    const v = tr.querySelector('video');
    const cap = tr.querySelector('.trailer-cap');
    const caps = JSON.parse(cap.dataset.caps);
    const btn = tr.querySelector('.trailer-btn');
    const SHOT = 59 / 30; // seconds per shot; the end card follows the last one
    let shown = 0;
    let loaded = false;
    const load = () => { if (loaded) return; loaded = true; v.querySelectorAll('source').forEach((s) => { s.src = s.dataset.src; }); v.load(); };
    const setBtn = (playing) => {
      btn.setAttribute('aria-pressed', String(playing));
      btn.querySelector('.tb-t').textContent = playing ? btn.dataset.pause : btn.dataset.play;
    };
    const play = () => { load(); const p = v.play(); if (p && p.catch) p.catch(() => setBtn(false)); };
    v.addEventListener('play', () => setBtn(true));
    v.addEventListener('pause', () => setBtn(false));
    v.addEventListener('timeupdate', () => {
      const i = Math.floor(v.currentTime / SHOT);
      if (i >= caps.length) { cap.classList.add('is-out'); return; }
      if (i !== shown || cap.classList.contains('is-out')) {
        shown = i; cap.classList.add('is-out');
        setTimeout(() => { cap.innerHTML = caps[i]; cap.classList.remove('is-out'); }, still ? 0 : 160);
      }
    });
    btn.addEventListener('click', () => (v.paused ? play() : v.pause()));
    if (!still && 'IntersectionObserver' in window) {
      let userPaused = false;
      btn.addEventListener('click', () => { userPaused = !v.paused ? false : true; });
      const vo = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { if (!userPaused) play(); } else if (!v.paused) { v.pause(); }
      }, { rootMargin: '200px 0px' });
      vo.observe(v);
    }
  }

  // ---------- content modules (src/modules.mjs) ----------
  // Every module reads fine without this script: the first screen, the example plan and the first report show as built.
  const io = (els, cb, opts) => {
    if (!('IntersectionObserver' in window)) return null;
    const o = new IntersectionObserver((entries) => entries.forEach(cb), opts);
    els.forEach((el) => o.observe(el));
    return o;
  };
  /** Shows screen i of a stacked phone. */
  const showScreen = (stackEl, i) => {
    [...stackEl.querySelectorAll('img')].forEach((im, k) => {
      im.classList.toggle('on', k === i);
      if (k === i) { im.loading = 'eager'; im.removeAttribute('aria-hidden'); } else im.setAttribute('aria-hidden', 'true');
    });
  };

  // A day with us: the step in the middle of the screen picks the phone's screen and the clock.
  const day = document.querySelector('[data-day]');
  if (day) {
    const steps = [...day.querySelectorAll('.m-step')];
    const stackEl = day.querySelector('.m-stack');
    const clock = day.querySelector('.m-clock');
    let cur = 0;
    const set = (i) => {
      if (i === cur) return;
      cur = i;
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      showScreen(stackEl, i);
      const tn = steps[i].querySelector('.m-tn'), tw = steps[i].querySelector('.m-tw');
      clock.children[0].textContent = tn ? tn.textContent : '';
      clock.children[1].textContent = tw ? tw.textContent : '';
    };
    io(steps, (e) => { if (e.isIntersecting) set(steps.indexOf(e.target)); }, { rootMargin: '-45% 0px -45% 0px' });
  }

  // The plan example: each answer rebuilds the example plan.
  const plan = document.querySelector('[data-plan]');
  if (plan) {
    const D = JSON.parse(plan.querySelector('.m-plan-data').textContent);
    const card = plan.querySelector('.m-plan');
    const out = (k) => card.querySelector(`[data-p="${k}"]`);
    const fmt = (n) => Math.round(n).toLocaleString('en-US');
    const st = { goal: 'lose', days: '3', place: 'gym', health: 'none' };
    let shown = { k: 1650, p: 135 };
    const tween = (el, from, to) => {
      if (still || from === to) { el.textContent = fmt(to); return; }
      const t0 = performance.now();
      const f = (t) => { const x = Math.min(1, (t - t0) / 600); el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - x, 3))); if (x < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    };
    const render = () => {
      let k = { lose: 1650, keep: 2050, gain: 2350 }[st.goal] + { 3: 0, 4: 70, 5: 140 }[st.days];
      if (st.health === 'chronic' && st.goal === 'lose') k += 150;
      const p = { lose: 135, keep: 115, gain: 150 }[st.goal];
      tween(out('k'), shown.k, k);
      tween(out('p'), shown.p, p);
      shown = { k, p };
      out('w').textContent = String(10 + (st.days === '5' ? 1 : 0));
      out('s').textContent = D.split[st.place][st.days];
      out('t').textContent = D.today[st.place][st.days] + (st.health === 'chronic' ? D.effort.gentle : D.effort.normal);
      [0.25, 0.35, 0.12, 0.28].forEach((part, i) => {
        out(`m${i}`).textContent = D.meals[st.goal][i];
        out(`m${i}k`).textContent = fmt(Math.round((k * part) / 10) * 10);
      });
      out('n').textContent = D.notes[st.health];
      card.classList.remove('is-flash');
      if (!still) { void card.offsetWidth; card.classList.add('is-flash'); }
    };
    plan.querySelectorAll('[data-q]').forEach((g) => g.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      g.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      st[g.dataset.q] = b.dataset.v;
      render();
    }));
  }

  // Eating out: the steps play in turn while the section is on screen; a click stops the autoplay.
  const outEl = document.querySelector('[data-out]');
  if (outEl) {
    const btns = [...outEl.querySelectorAll('.m-olist button')];
    const stackEl = outEl.querySelector('.m-stack');
    let oi = 0, timer = null, seen = false, held = still;
    const set = (i) => {
      oi = i;
      btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      showScreen(stackEl, i);
    };
    const play = () => {
      clearInterval(timer);
      outEl.classList.toggle('is-playing', !held && seen);
      if (held || !seen) return;
      timer = setInterval(() => set((oi + 1) % btns.length), 4200);
    };
    btns.forEach((b, k) => b.addEventListener('click', () => { held = true; set(k); play(); }));
    io([outEl], (e) => { seen = e.isIntersecting; if (seen && !held) set(oi); play(); }, { threshold: 0.35 });
  }

  // Rest timer: a 60 second countdown; the ring turns with CSS.
  const timerEl = document.querySelector('[data-timer]');
  if (timerEl) {
    const ring = timerEl.querySelector('.m-ring');
    const val = timerEl.querySelector('.m-ring-v');
    const btn = timerEl.querySelector('button');
    let t = null;
    const show = (s) => { val.textContent = s >= 60 ? '01:00' : `00:${String(s).padStart(2, '0')}`; };
    const stop = (label) => { clearInterval(t); t = null; ring.classList.remove('is-run'); btn.textContent = btn.dataset.start; if (label) val.textContent = label; else show(60); };
    btn.addEventListener('click', () => {
      if (t) { stop(); return; }
      let s = 60;
      show(s);
      ring.classList.remove('is-run'); void ring.offsetWidth; ring.classList.add('is-run');
      btn.textContent = btn.dataset.skip;
      t = setInterval(() => { s -= 1; show(s); if (s <= 0) stop(btn.dataset.go); }, 1000);
    });
  }

  // Reports: the top sheet slides away and the next comes forward (buttons, chips, a tap or a swipe).
  const rep = document.querySelector('[data-reports]');
  if (rep) {
    const sheets = [...rep.querySelectorAll('.m-sheet')];
    const chips = [...rep.querySelectorAll('[data-r]')];
    const cap = rep.querySelector('.m-rep-cap');
    const caps = JSON.parse(cap.dataset.caps);
    const n = sheets.length;
    let rk = 0;
    const set = (k, dir) => {
      const prev = rk;
      rk = (k + n) % n;
      sheets.forEach((s) => {
        const sk = Number(s.dataset.k);
        if (!still && dir > 0 && sk === prev && prev !== rk) { s.classList.add('is-out'); setTimeout(() => s.classList.remove('is-out'), 380); }
        s.dataset.pos = String((sk - rk + n) % n);
        s.querySelector('img').loading = 'eager';
      });
      chips.forEach((c) => c.setAttribute('aria-pressed', String(Number(c.dataset.r) === rk)));
      cap.textContent = caps[rk];
    };
    rep.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => set(rk + Number(b.dataset.step), Number(b.dataset.step))));
    chips.forEach((c) => c.addEventListener('click', () => set(Number(c.dataset.r), 0)));
    sheets.forEach((s) => s.addEventListener('click', () => set(rk + 1, 1)));
    const deck = rep.querySelector('.m-deck');
    let sx = null;
    deck.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    deck.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      const fwd = dx < 0;
      if (Math.abs(dx) > 40) set(rk + (fwd ? 1 : -1), fwd ? 1 : -1);
      sx = null;
    });
  }

  // The captain: the highlighted card moves through the day while the section is on screen.
  const capt = document.querySelector('[data-captain]');
  if (capt && !still) {
    const cards = [...capt.querySelectorAll('.m-cc')];
    let ci = 0, ct = null;
    io([capt], (e) => {
      clearInterval(ct);
      if (!e.isIntersecting) return;
      ct = setInterval(() => { cards[ci].classList.remove('now'); ci = (ci + 1) % cards.length; cards[ci].classList.add('now'); }, 3200);
    }, { threshold: 0.2 });
  }

  // Module numbers show their real value at rest and count up from a smaller one when they come into view.
  const counts = [...document.querySelectorAll('[data-to]')];
  if (counts.length && !still) {
    const run = (el) => {
      const to = Number(el.dataset.to), from = Number(el.dataset.from), t0 = performance.now();
      const f = (t) => { const x = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - x, 3))).toLocaleString('en-US'); if (x < 1) requestAnimationFrame(f); };
      el.textContent = String(from);
      requestAnimationFrame(f);
    };
    const co = io(counts, (e) => { if (e.isIntersecting) { co.unobserve(e.target); run(e.target); } }, { threshold: 0.6 });
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
  }

  // ---------- the motion layer ----------
  function runMotion() {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Smooth scrolling, driven by GSAP's ticker so pinned scenes stay in sync.
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.18, smoothWheel: true, syncTouch: false });
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
        lenis.scrollTo(target, { offset: -(target.closest('.page-hero') ? 0 : 110), duration: 0.9 });
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
      const [slogan, h1, lead, ctas, soon] = hero.querySelectorAll('.hero-text > *');
      const wrapPhone = hero.querySelector('.hero-phone');
      gsap.set([slogan, h1, lead, ctas, soon], { opacity: 1, y: 0 });
      gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.05 })
        .from(slogan, { y: 16, opacity: 0, duration: 0.8 })
        .from(heroWords, { yPercent: 110, duration: 1, stagger: 0.045 }, 0.05)
        .from(lead, { y: 20, opacity: 0, duration: 0.9 }, 0.3)
        .from(ctas.children, { y: 16, opacity: 0, duration: 0.8, stagger: 0.06 }, 0.4)
        .from(soon, { opacity: 0, duration: 0.8 }, 0.5)
        .fromTo('.hero-stage', { opacity: 0, y: 90 }, { opacity: 1, y: 0, duration: 1.3 }, 0.3)
        .fromTo(wrapPhone, { scale: 0.92 }, { scale: 1, duration: 1.4 }, 0.3);
    }

    // Inner pages: the heading rises word by word.
    const pageHero = document.querySelector('.page-hero .wrap');
    if (pageHero) {
      const h = pageHero.querySelector('[data-split]');
      const words = splitWords(h, true);
      gsap.set(pageHero, { opacity: 1, y: 0 });
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
        .from(pageHero.querySelector('.kicker'), { y: 20, opacity: 0, duration: 0.7 })
        .from(words, { yPercent: 110, duration: 1, stagger: 0.045 }, 0.05);
      const lead = pageHero.querySelector('.lead');
      if (lead) tl.from(lead, { y: 20, opacity: 0, duration: 0.8 }, 0.3);
      const jumps = document.querySelectorAll('.jump a');
      if (jumps.length) tl.from(jumps, { y: 16, opacity: 0, duration: 0.6, stagger: 0.04 }, 0.4);
    }

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

    // Scroll scenes. Built inside matchMedia so they rebuild cleanly when the layout switches between phone and desktop.
    // Pinned scenes are created first, top to bottom, so everything below them measures with their extra scroll.
    const mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 921px)', mob: '(max-width: 920px)' }, (c) => {
      const { desk } = c.conditions;

      // Hero: while scrolling, the text drifts up and fades a little, the phone grows gently.
      if (hero) {
        const wrapPhone = hero.querySelector('.hero-phone');
        const toCenter = () => Math.max(240, wrapPhone.getBoundingClientRect().top + window.scrollY + wrapPhone.offsetHeight / 2 - window.innerHeight / 2);
        gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: hero, start: 'top top', end: () => `+=${toCenter()}`, scrub: true, invalidateOnRefresh: true } })
          .to(hero.querySelector('.hero-text'), { y: -80, opacity: 0.25 }, 0)
          .fromTo(hero.querySelector('.phone-hero'), { scale: 1 }, { scale: desk ? 1.06 : 1.03 }, 0)
          .fromTo(hero.querySelector('.glow'), { scale: 1, opacity: 1 }, { scale: 1.25, opacity: 0.8 }, 0);
      }

      // How it works: a thin line draws across.
      const how = document.querySelector('.how');
      if (how) {
        const line = document.querySelector('.how-line span');
        if (line) gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: how, start: 'top 85%', end: 'bottom 55%', scrub: 0.6 } });
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
      const skip = (el) => el.closest('.hero, .page-hero');
      const items = gsap.utils.toArray('.reveal').filter((el) => !skip(el));
      ScrollTrigger.batch(items, {
        start: 'top 92%', once: true,
        onEnter: (els) => els.forEach((el, i) => {
          gsap.fromTo(el, { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: i * 0.06, overwrite: 'auto', clearProps: 'transform' });
        }),
      });
      ScrollTrigger.sort();
    });

    // Measurements change once fonts and images are in.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
