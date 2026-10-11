/* Progressive enhancement only: the site is fully usable without this file. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  var toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.hidden = false;
    var current = function () {
      return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    };
    var label = function () {
      toggle.setAttribute('aria-label', current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    };
    label();
    toggle.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('nous-theme', next); } catch (e) {}
      label();
    });
  }

  /* ---------- Copy email ---------- */
  var copyBtn = document.querySelector('.c-copy');
  if (copyBtn && navigator.clipboard) {
    copyBtn.hidden = false;
    var label = copyBtn.querySelector('span');
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(copyBtn.getAttribute('data-copy')).then(function () {
        copyBtn.classList.add('is-done'); label.textContent = 'Copied';
        setTimeout(function () { copyBtn.classList.remove('is-done'); label.textContent = 'Copy'; }, 1800);
      });
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  var header = document.querySelector('.site-header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 12); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active section in nav + domain contents ---------- */
  var watch = function (links, rootMargin, apply) {
    var map = {};
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (el) map[el.id] = a;
    });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting && map[e.target.id]) apply(map[e.target.id]); });
    }, { rootMargin: rootMargin });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  };

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.primary-nav a'));
  watch(navLinks, '-45% 0px -50% 0px', function (active) {
    navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
    active.setAttribute('aria-current', 'true');
    // keep the active pill visible in the scrollable mobile nav
    var nav = active.closest('.primary-nav');
    if (nav && nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: active.offsetLeft - 24, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  });

  var chapterLinks = Array.prototype.slice.call(document.querySelectorAll('.dnav a'));
  watch(chapterLinks, '-40% 0px -55% 0px', function (active) {
    chapterLinks.forEach(function (a) { a.classList.remove('is-active'); });
    active.classList.add('is-active');
  });

  /* ---------- GSAP animations ---------- */
  window.addEventListener('load', function () {
    if (reduceMotion || !window.gsap) return;
    var gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    // Hero intro
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.reveal-hero', { y: 28, opacity: 0, duration: .9, stagger: .09 })
      .from('.phone-main', { y: 140, opacity: 0, duration: 1.2 }, '-=.55')
      .from('.phone-left', { x: 80, y: 80, opacity: 0, duration: 1.1 }, '<.15')
      .from('.phone-right', { x: -80, y: 80, opacity: 0, duration: 1.1 }, '<')
      .from('.orbit', { opacity: 0, duration: 1.4, stagger: .12 }, '<')
      .from('.float-card', { scale: .85, opacity: 0, duration: .7, stagger: .12, ease: 'back.out(1.6)' }, '-=.6');

    if (!window.ScrollTrigger) return;

    // Gentle parallax on the hero phones
    gsap.to('.phone-main', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.phone-side', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Milestones: the timeline draws itself with scroll and reveals each milestone as the line reaches it
    var tl = document.querySelector('.tl');
    if (tl) {
      var tlItems = tl.querySelectorAll('.tl-item');
      var line = tl.querySelector('.tl-line');
      var setProgress = function (self) {
        var p = self.progress;
        tl.style.setProperty('--p', p.toFixed(3));
        var lineW = line.offsetWidth || 1;
        tlItems.forEach(function (item, i) {
          // horizontal: compare against the pin position; vertical (line hidden): evenly spaced
          var at = line.offsetParent ? (item.offsetLeft + 28) / lineW : i / tlItems.length;
          item.classList.toggle('is-on', p >= at - 0.02);
        });
      };
      tl.classList.add('is-tracking');
      window.ScrollTrigger.create({
        trigger: tl, start: 'top 75%', end: 'bottom 60%',
        onUpdate: setProgress, onRefresh: setProgress
      });
    }

    // Section reveals
    gsap.utils.toArray('.section-head, .split-head, .dblock').forEach(function (el) {
      gsap.from(el, { y: 24, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    window.ScrollTrigger.batch('.reveal', {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        // Disable the cards' CSS transform transition while GSAP moves them, then hand control back,
        // otherwise the two fight and cards settle late (and overlap their neighbours).
        batch.forEach(function (el) { el.style.transition = 'none'; });
        gsap.from(batch, {
          y: 16, opacity: 0, duration: .7, stagger: .08, ease: 'power3.out', overwrite: true,
          onComplete: function () {
            batch.forEach(function (el) { el.style.transition = ''; });
            gsap.set(batch, { clearProps: 'transform,opacity' });
          }
        });
      }
    });
  });
})();
