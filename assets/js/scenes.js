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

  // always present, even when no GSAP scenes exist (test/freeze API)
  window.__scenes = {};

  if (!stages.length || typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ---- shared motion helpers (the old duplicated keyframes) ------------ */
  // Time semantics: `at` is when the effect STARTS, except cursorTo, where
  // `at` is the ARRIVAL time (presses are choreographed off arrivals).
  // Color literals in builders/helpers are the resolved values of CSS custom
  // properties (--gold = #c9a84c / rgb(201,168,76), --border = #2a2a3e):
  // verify new literals against styles.css :root when adding scenes.

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
  // Infinite spinner (replaces xp-spin). Separate anim, not on the timeline —
  // MUST be included in the builder's returned array so init pauses it and the
  // IO observer can play/pause it with the scene.
  function spin(el) {
    return gsap.to(el, { rotation: 360, duration: 0.7, ease: 'none', repeat: -1 });
  }

  /* ---- scene registry --------------------------------------------------
     Each builder receives the .demo element and returns an ARRAY of paused
     animations (timelines/tweens). Builders are added per migration task. */
  var SCENES = {};

  SCENES['dashboard'] = function (stage) {
    var q = gsap.utils.selector(stage);
    var cur = q('.sc-cursor'), btn = q('.sd-new'), card = q('.sd-card--new');
    var tl = gsap.timeline({ repeat: -1, repeatDelay: 0 });
    tl.set(cur, { left: '42%', top: '66%', scale: 1 }, 0)
      .set(card, { opacity: 0, y: 10 }, 0);
    cursorTo(tl, cur, '84%', '7%', 1.3, 1.0);
    press(tl, cur, 1.5);
    clickFlash(tl, btn, 1.45);
    cardIn(tl, card, 1.7, { y: 10 });
    tl.to(card, { opacity: 0, y: 10, duration: 0.6 }, 4.3)  // matches old 82→100% fade-back
      .set({}, {}, 5);                       // zero-duration pad: cycle ends at exactly 5s
    return [tl];
  };

  SCENES['dashboard-select'] = function (stage) {
    var q = gsap.utils.selector(stage);
    var cur = q('.sc-cursor'), a = q('.lc-card--a'), b = q('.lc-card--b'), btn = q('.sd-new');
    var SEL = { borderColor: '#c9a84c', boxShadow: '0 0 0 2px rgba(201,168,76,0.5)' };
    var UNSEL = { borderColor: '#2a2a3e', boxShadow: 'none' };
    var tl = gsap.timeline({ repeat: -1 });
    tl.set(cur, { left: '22%', top: '86%', scale: 1 }, 0)
      .set([a, b], UNSEL, 0).set(btn, { opacity: 0.5 }, 0);
    cursorTo(tl, cur, '26%', '52%', 0.99, 0.7); press(tl, cur, 1.21);
    tl.to(a, Object.assign({ duration: 0.25 }, SEL), 1.43);
    cursorTo(tl, cur, '70%', '52%', 2.53, 0.9); press(tl, cur, 2.75);
    tl.to(b, Object.assign({ duration: 0.25 }, SEL), 2.97)
      .to(btn, { opacity: 1, duration: 0.33 }, 2.97)
      .to([a, b], Object.assign({ duration: 0.33 }, UNSEL), 5.17)
      .set({}, {}, 5.5);
    return [tl];
  };

  // Keyframe ground truth (5.2s):
  //   tp-cursor:  0-6% rest (62%,92%) → 44% arrive (29.9%,49.4%) → 50% press → 56% release → 100% stay
  //   tp-pickring: 0-44% unsel (border:#2a2a3e,shadow:none) → 52-100% sel (gold border + ring); no revert
  //   tp-headtint: 0-44% bg var(--s3)=#1f1f2e → 52-100% gold tint; no revert
  //   tp-cartin:  0-48% (opacity:0, x:2cqw) → 60-100% (opacity:1, x:0); no revert
  //   tp-addon:   0-50% opacity:0.4 → 60-100% opacity:1; no revert
  // Beat-table discrepancy: plan said "revert at 5.2s" — keyframes stay selected. Also --s3=#1f1f2e not #1f1f2c.
  SCENES['templates-pick'] = function (stage) {
    var q = gsap.utils.selector(stage);
    var cur = q('.sc-cursor'), pick = q('.tp-pick'), head = q('.tp-pick .sc-head'),
        fly = q('.tp-cart-fly'), add = q('.tp-add');
    var tl = gsap.timeline({ repeat: -1 });
    // Cursor rests at (62%,92%) per old s-cursor rule 0-6% keyframe
    tl.set(cur, { left: '62%', top: '92%', scale: 1 }, 0)
      // pick card: resting border = var(--border)=#2a2a3e (provided by sc-card after rename)
      .set(pick, { borderColor: '#2a2a3e', boxShadow: 'none' }, 0)
      // head bg: var(--s3)=#1f1f2e (NOT #1f1f2c as plan stated)
      .set(head, { backgroundColor: '#1f1f2e' }, 0)
      .set(fly, { opacity: 0, x: '2cqw' }, 0)
      .set(add, { opacity: 0.4 }, 0);
    // Cursor arrives at card at 2.29s (44% × 5.2); travels 1.9s from 0.39s
    cursorTo(tl, cur, '29.9%', '49.4%', 2.29, 1.9);
    // Press at 2.6s (50% × 5.2)
    press(tl, cur, 2.6);
    // Card selected look: transition 44%→52% = 2.29s–2.70s; start at 2.29s, duration 0.41s
    tl.to(pick, { borderColor: '#c9a84c', boxShadow: '0 0 0 0.18cqw rgba(201,168,76,0.45)', duration: 0.41 }, 2.29)
      .to(head, { backgroundColor: 'rgba(201,168,76,0.16)', duration: 0.41 }, 2.29);
    // Cart row flies in: 48%=2.496s→60%=3.12s; cardIn duration=0.5s starts at ~2.5s (60%-0.5s=2.62, use 2.5 to match old keyframe start)
    cardIn(tl, fly, 2.5, { x: '2cqw' });
    // Add brightens: 50%=2.6s→60%=3.12s = 0.52s transition
    tl.to(add, { opacity: 1, duration: 0.52 }, 2.6)
      // Cycle pad: end at exactly 5.2s (no revert — keyframes hold selected state at 100%)
      .set({}, {}, 5.2);
    return [tl];
  };

  // Keyframe ground truth (11s):
  //   ts-camera: 0-8% full → 8-22% zoom to translate(7.5%,5.8%) scale(1.7) → 22-50% hold →
  //              50-60% zoom back → 60-100% full
  //   ts-menu:   0-30% opacity:0 → 30-34% fade in → 34-52% opacity:1 → 52-56% fade out → 56-100% opacity:0
  //   ts-mion:   0-44% transparent/var(--text) → 47-53% rgba(201,168,76,0.12)/#c9a84c → 56-100% off
  //              (bg uses 0.12 not 0.14 as plan stated — using explicit tweens to match)
  //   ts-overlay: 0-60% opacity:0 → 60-66% fade in → 66-100% opacity:1; base=SHOWN (100% state)
  //   ts-savepulse: 0-72% no shadow → 78% box-shadow 0.4cqw (NOT 4px) + scale(0.97) → 84-100% off
  //              (pulse helper uses 4px — writing explicit cqw-based tweens to match)
  //   ts-cursor: 0-6% rest (42%,72%) → 24% arrive ⋯ (2.64s) → 30% press (3.3s) →
  //              42% arrive Save-as-Template (4.62s) → 46% press (5.06s) →
  //              72% arrive Save-Template btn (7.92s) → 78% press (8.58s)
  // Beat-table discrepancies vs plan: menuItemOn offAt=5.83s (not 5.16); cursor travel to
  //   savebtn dur=2.31s (not 1.3s); pulse at t=7.92 (72%) not 8.5; ts-mion bg=0.12 not 0.14.
  SCENES['templates-save'] = function (stage) {
    var q = gsap.utils.selector(stage);
    var cur = q('.sc-cursor'), cam = q('.ts-camera'), menu = q('.ts-menu'),
        mi = q('.ts-mi-save'), ovl = q('.ts-overlay'), save = q('.ts-savebtn');
    var tl = gsap.timeline({ repeat: -1 });
    tl.set(cur, { left: '42%', top: '72%', scale: 1 }, 0)
      .set(cam, { transform: 'translate(0,0) scale(1)' }, 0)
      .set(menu, { opacity: 0 }, 0)
      .set(ovl, { opacity: 0 }, 0);
    // Camera zooms to focal card; zoom transition 8%-22% = 0.88s-2.42s, dur=1.54s
    cameraTo(tl, cam, 'translate(7.5%, 5.8%) scale(1.7)', 0.88, 1.54);
    // Cursor travels to ⋯ button; arrives 24%=2.64s, departs ~6%=0.66s, dur=1.98s
    cursorTo(tl, cur, '30.1%', '9.1%', 2.64, 1.98);
    // Press ⋯ at 30%=3.3s; menu fades in 30%-34% = 3.3s-3.74s
    press(tl, cur, 3.3);
    fadeIn(tl, menu, 3.3, 0.44);
    // Cursor travels to "Save as Template"; arrives 42%=4.62s, departs ~35%=3.85s, dur=0.77s
    cursorTo(tl, cur, '23.7%', '18.4%', 4.62, 0.77);
    // Menu item highlights at 44%=4.84s; turns off at 53%=5.83s
    // Using explicit tweens: ts-mion bg=rgba(201,168,76,0.12) (not 0.14 as helper uses)
    tl.to(mi, { backgroundColor: 'rgba(201,168,76,0.12)', color: '#c9a84c', duration: 0.33 }, 4.84)
      .to(mi, { backgroundColor: 'rgba(0,0,0,0)', color: '#dddad0', duration: 0.33 }, 5.83);
    // Press "Save as Template" at 46%=5.06s
    press(tl, cur, 5.06);
    // Menu fades out 52%-56% = 5.72s-6.16s
    fadeOut(tl, menu, 5.72, 0.44);
    // Camera returns to full frame; zoom-out 50%-60% = 5.5s-6.6s, dur=1.1s
    cameraTo(tl, cam, 'translate(0,0) scale(1)', 5.5, 1.1);
    // Overlay + modal fade in 60%-66% = 6.6s-7.26s
    fadeIn(tl, ovl, 6.6, 0.66);
    // Cursor travels to Save Template button; arrives 72%=7.92s, departs 51%=5.61s, dur=2.31s
    cursorTo(tl, cur, '71.5%', '74.9%', 7.92, 2.31);
    // Pulse on savebtn: ts-savepulse uses 0.4cqw ring (not 4px); explicit tweens to match
    // builds 72%-78% = 7.92s-8.58s (0.66s), releases 78%-84% = 8.58s-9.24s (0.66s)
    tl.fromTo(save, { boxShadow: '0 0 0 0 rgba(201,168,76,0)' },
      { boxShadow: '0 0 0 0.4cqw rgba(201,168,76,0.4)', scale: 0.97,
        duration: 0.66, ease: 'power2.out' }, 7.92)
      .to(save, { boxShadow: '0 0 0 0 rgba(201,168,76,0)', scale: 1,
        duration: 0.66 }, 8.58);
    // Press at 78%=8.58s
    press(tl, cur, 8.58);
    // Cycle pad at 11s
    tl.set({}, {}, 11);
    return [tl];
  };

  /* ---- init ------------------------------------------------------------ */
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
