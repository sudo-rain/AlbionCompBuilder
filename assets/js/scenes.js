// Scene motion. Looks live in CSS (scenes.css); ALL scene motion lives here as
// GSAP timelines. With no JS (or prefers-reduced-motion) every scene rests on
// its completed base frame. window.__scenes exposes anims for test freezing.
(function () {
  var stages = document.querySelectorAll('.demo[data-scene]');
  var legacy = document.querySelectorAll('.demo:not([data-scene])');

  // Transitional: un-migrated scenes still run CSS animations behind the
  // html.js/is-onscreen gate that demos.js used to drive. Remove with the gate
  // in the final cleanup task.
  if (legacy.length) {
    legacy.forEach(function (demo) { demo.classList.add('is-onscreen'); });
    if ('IntersectionObserver' in window) {
      var legacyObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          e.target.classList.toggle('is-onscreen', e.isIntersecting);
        });
      }, { threshold: 0.1 });
      legacy.forEach(function (demo) { legacyObs.observe(demo); });
    }
  }

  if (!stages.length || typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ---- shared motion helpers (the old duplicated keyframes) ------------ */
  // Time semantics: `at` is when the effect STARTS, except cursorTo, where
  // `at` is the ARRIVAL time (presses are choreographed off arrivals).

  // Cursor glide: arrive at (x%, y%) at time `at`, traveling for `dur` seconds.
  function cursorTo(tl, cur, x, y, at, dur) {
    tl.to(cur, { left: x, top: y, duration: dur, ease: 'power1.inOut' }, at - dur);
  }
  // Cursor press: dip at `at` (replaces every *-cursor scale(0.78) beat).
  function press(tl, cur, at) {
    tl.to(cur, { scale: 0.78, duration: 0.18, ease: 'power2.out' }, at)
      .to(cur, { scale: 1, duration: 0.22, ease: 'power2.out' }, at + 0.18);
  }
  // Button click flash (replaces sd-click): ring + depress.
  function clickFlash(tl, btn, at) {
    tl.fromTo(btn, { boxShadow: '0 0 0 0 rgba(201,168,76,0)' },
      { boxShadow: '0 0 0 4px rgba(201,168,76,0.32)', scale: 0.95,
        duration: 0.18, ease: 'power2.out' }, at)
      .to(btn, { boxShadow: '0 0 0 0 rgba(201,168,76,0)', scale: 1,
        duration: 0.3 }, at + 0.18);
  }
  // Soft pulse ring (replaces sd-pulse / ts-savepulse / xi-pulse-*).
  function pulse(tl, el, at) {
    tl.fromTo(el, { boxShadow: '0 0 0 0 rgba(201,168,76,0)' },
      { boxShadow: '0 0 0 4px rgba(201,168,76,0.4)', scale: 0.97,
        duration: 0.25, ease: 'power2.out' }, at)
      .to(el, { boxShadow: '0 0 0 0 rgba(201,168,76,0)', scale: 1,
        duration: 0.4 }, at + 0.25);
  }
  // Card entrance (replaces sd-cardin / tp-cartin / xi-cardin).
  // `from` = {y: '10px'} or {x: '2cqw'} style offset.
  function cardIn(tl, el, at, from) {
    tl.fromTo(el, Object.assign({ opacity: 0 }, from),
      { opacity: 1, x: 0, y: 0, duration: 0.5, ease: 'power2.out' }, at);
  }
  // Camera pan/zoom starting at `at` (replaces be-/ts-/xp-camera).
  function cameraTo(tl, cam, transform, at, dur) {
    tl.to(cam, { transform: transform, duration: dur, ease: 'power1.inOut' }, at);
  }
  // Fades (replace ts-menu / xp-menu / xi-overlay* / xi-modal* on/off beats).
  function fadeIn(tl, el, at, dur) {
    tl.to(el, { opacity: 1, duration: dur || 0.4 }, at);
  }
  function fadeOut(tl, el, at, dur) {
    tl.to(el, { opacity: 0, duration: dur || 0.4 }, at);
  }
  // Menu-item hover highlight (replaces ts-mion / xp-mion).
  function menuItemOn(tl, el, at, offAt) {
    tl.to(el, { backgroundColor: 'rgba(201,168,76,0.14)', color: '#c9a84c',
      duration: 0.2 }, at)
      .to(el, { backgroundColor: 'rgba(0,0,0,0)', color: '#dddad0',
        duration: 0.25 }, offAt);
  }
  // Infinite spinner (replaces xp-spin). Separate anim, not on the timeline.
  function spin(el) {
    return gsap.to(el, { rotation: 360, duration: 0.7, ease: 'none', repeat: -1 });
  }

  /* ---- scene registry --------------------------------------------------
     Each builder receives the .demo element and returns an ARRAY of paused
     animations (timelines/tweens). Builders are added per migration task. */
  var SCENES = {};

  /* ---- init ------------------------------------------------------------ */
  window.__scenes = {};
  stages.forEach(function (stage) {
    var name = stage.getAttribute('data-scene');
    var build = SCENES[name];
    if (!build) return;
    var anims = build(stage).map(function (a) { return a.pause(0); });
    stage.__anims = anims;
    (window.__scenes[name] = window.__scenes[name] || []).push.apply(
      window.__scenes[name], anims);
  });

  if (!('IntersectionObserver' in window)) {
    stages.forEach(function (s) {
      (s.__anims || []).forEach(function (a) { a.play(); });
    });
    return;
  }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      (entry.target.__anims || []).forEach(function (a) {
        entry.isIntersecting ? a.play() : a.pause();
      });
    });
  }, { threshold: 0.1 });
  stages.forEach(function (s) { if (s.__anims) obs.observe(s); });
})();
