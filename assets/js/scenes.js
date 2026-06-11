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
  // properties (--gold = #c9a84c / rgb(201,168,76), --border = #2a2a3e,
  // --text = #dddad0): verify new literals against styles.css :root when adding scenes.

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

  // Keyframe ground truth (10s):
  //   xp-camera:    0-9% scale(1) → 9-24% zoom → 24-46% hold scale(1.45) → 46-58% return → 58-100% scale(1)
  //                 transform-origin: 100% 0 (top-right, kept in CSS)
  //   xp-menu:      0-16% opacity:0 → 16-22% fade in → 22-48% opacity:1 → 48-52% fade out → 52-100% opacity:0
  //   xp-mion:      0-32% transparent/text → 32-36% on → 36-46% rgba(201,168,76,0.14)/gold
  //                 → 46-50% off → 50-100% transparent (bg=0.14; menuItemOn helper matches)
  //   xp-dots:      0-48% opacity:1 → 48-52% fade out → 52-100% opacity:0; base=0 (CSS sets opacity:0)
  //   xp-loading:   0-48% opacity:0 → 48-52% fade in → 52-100% opacity:1; base=1 (CSS sets opacity:1)
  //   xp-morewidth: 0-48% min-width:5cqw → 48-52% → 52-100% min-width:10.5cqw; base=10.5cqw
  //   xp-bannerin:  0-58% opacity:0 translateY(-0.8cqw) → 58-68% slide in → 68-100% opacity:1 none
  //   xp-cursor:    0-5% rest (80%,40%) → 18% arrive ⋯ (96%,5.5%) → 24% press → 29% release
  //                 → 36% arrive gs (84.6%,19.5%) → 41% press → 46% release → 58% return ⋯ → 100%
  //   xp-spin:      separate CSS (deleted); replaced by spin() GSAP helper
  // Beat-table discrepancies vs plan:
  //   menu fade-in: keyframe 16%→22% = 1.6s–2.2s (plan said start at 2.4s); using keyframe times
  //   mion window: keyframe 32%→46% = 3.2s–4.6s (plan said 3.4–4.8s); using keyframe times
  //   camera return: keyframe 46%→58% = 4.6s–5.8s dur=1.2s (plan said 5.0–6.2s); using keyframe
  SCENES['export'] = function (stage) {
    var q = gsap.utils.selector(stage);
    var cur = q('.sc-cursor'), cam = q('.xp-camera'), menu = q('.xp-menu'),
        gs = q('.xp-mi-gs'), dots = q('.xp-more-dots'), load = q('.xp-more-loading'),
        more = q('.xp-more'), banner = q('.xp-banner'), spinner = q('.xp-spinner');
    var tl = gsap.timeline({ repeat: -1 });
    // Initial state: cursor rests at (80%,40%) per xp-cursor 0-5% keyframe
    tl.set(cur, { left: '80%', top: '40%', scale: 1 }, 0)
      .set(cam, { transform: 'scale(1)' }, 0)
      .set(menu, { opacity: 0 }, 0)
      // dots/loading base from CSS: dots=0, loading=1 — GSAP set confirms for clean cycle
      .set(dots, { opacity: 1 }, 0)    /* 0% keyframe state: dots shown at start of cycle */
      .set(load, { opacity: 0 }, 0)    /* 0% keyframe state: loading hidden at start of cycle */
      .set(more, { minWidth: '5cqw' }, 0)  /* 0% keyframe state: narrow ⋯ button */
      .set(banner, { opacity: 0, y: '-0.8cqw' }, 0);
    // Camera zooms to top-right; 9%=0.9s start, 24%=2.4s arrive, dur=1.5s
    cameraTo(tl, cam, 'scale(1.45)', 0.9, 1.5);
    // Cursor travels to ⋯; arrives 18%=1.8s, departs ~5%=0.5s, dur=1.3s
    cursorTo(tl, cur, '96%', '5.5%', 1.8, 1.3);
    // Press ⋯ at 24%=2.4s
    press(tl, cur, 2.4);
    // Menu fades in; keyframe 16%=1.6s–22%=2.2s (0.6s). Starts BEFORE press — CSS approximation
    fadeIn(tl, menu, 1.6, 0.6);
    // Cursor travels to "Export to Google Sheets"; arrives 36%=3.6s, departs ~29%=2.9s, dur=0.7s
    cursorTo(tl, cur, '84.6%', '19.5%', 3.6, 0.7);
    // Menu item highlights: keyframe 32%=3.2s on, 46%=4.6s off; bg=0.14 matches helper
    menuItemOn(tl, gs, 3.2, 4.6);
    // Press "Export to Google Sheets" at 41%=4.1s
    press(tl, cur, 4.1);
    // Menu fades out; keyframe 48%=4.8s–52%=5.2s
    fadeOut(tl, menu, 4.8, 0.4);
    // Dots fade out, loading fades in, button widens; keyframe 48%=4.8s–52%=5.2s
    tl.to(dots, { opacity: 0, duration: 0.4 }, 4.8)
      .to(load, { opacity: 1, duration: 0.4 }, 4.8)
      .to(more, { minWidth: '10.5cqw', duration: 0.4 }, 4.8);
    // Camera returns to full frame; keyframe 46%=4.6s start, 58%=5.8s arrive, dur=1.2s
    cameraTo(tl, cam, 'scale(1)', 4.6, 1.2);
    // Cursor returns to ⋯/Exporting; keyframe 46%=4.6s–58%=5.8s
    cursorTo(tl, cur, '96%', '5.5%', 5.8, 1.2);
    // Banner slides in; keyframe 58%=5.8s–68%=6.8s
    tl.to(banner, { opacity: 1, y: 0, duration: 1.0, ease: 'power2.out' }, 5.8)
      // Cycle pad
      .set({}, {}, 10);
    return [tl, spin(spinner)];
  };

  // Keyframe ground truth (13s):
  //   xi-cursor:     0-6%  rest (58%,38%) → 14% arrive (74.5%,7.7%) → 18% press → 22% release
  //                  → 30% arrive (71.6%,64.4%) → 33% press → 36% release
  //                  → 46% arrive (36.25%,57%) → 49% press → 52% release
  //                  → 60% arrive (67.8%,64%) → 63% press → 66% release
  //                  → 72% return (74.5%,7.7%) → 100% hold
  //   xi-overlay:    0-16% opacity:0 → 22-38% opacity:1 → 44-100% opacity:0
  //                  fade-in: 2.08s–2.86s (0.78s); fade-out: 4.94s–5.72s (0.78s)
  //   xi-overlay2:   0-36% opacity:0 → 42-66% opacity:1 → 72-100% opacity:0
  //                  fade-in: 4.68s–5.46s (0.78s); fade-out: 8.58s–9.36s (0.78s)
  //   Backdrop overlap window: 4.94–5.46s (ov1 fading out, ov2 fading in simultaneously)
  //   xi-modal-out:  0-33% opacity:1 → 36-100% opacity:0 (fade-out: 4.29s–4.68s, dur=0.39s)
  //   xi-modal2-in:  0-40% opacity:0 → 43-100% opacity:1 (fade-in: 5.20s–5.59s, dur=0.39s)
  //   xi-pulse-ws:   30%=3.9s start, 34%=4.42s peak (0.4cqw ring), 38%=4.94s off
  //                  (NOT 4px — old keyframe uses 0.4cqw; explicit tweens required)
  //   xi-pulse-final: 60%=7.8s start, 64%=8.32s peak (0.4cqw), 68%=8.84s off
  //                  (same cqw override as ws pulse)
  //   xi-swatchpop:  46%=5.98s scale(1) → 50%=6.50s scale(1.18) → 54%=7.02s scale(1)
  //                  build starts 0.39s before press (6.37s); peak is 0.13s after press
  //   xi-cardin:     64%=8.32s start, 72%=9.36s full (dur=1.04s; cardIn at=8.32, dur=1.04)
  //   old base (100% state): overlays opacity:0, modal1 opacity:0, modal2 opacity:1,
  //                          new card opacity:1 transform:none, cursor at 74.5%,7.7%
  // Beat-table discrepancies vs plan:
  //   ov1 fade-in: plan says fadeIn(ov1, 2.34, 0.5); keyframe starts 2.08s, full at 2.86s
  //     → using keyframe times: 2.08s start, 0.78s dur
  //   pulse(wsBtn): plan uses helper (4px ring); keyframe has 0.4cqw ring → explicit tweens
  //   pulse(fin): same cqw discrepancy → explicit tweens
  //   swatch build: plan tl.to(sw, {scale:1.18}, 6.37); keyframe build starts 5.98s
  //     → start scale build at 5.98s to match keyframe, peak at 6.50s, release at 7.02s
  //   cardIn duration: plan leaves at helper default (0.5s); keyframe dur=1.04s → pass dur explicitly
  SCENES['export-import'] = function (stage) {
    var q = gsap.utils.selector(stage);
    var cur = q('.sc-cursor'), ov1 = q('.xi-overlay'), ov2 = q('.xi-overlay2'),
        m1 = q('.xi-modal'), m2 = q('.xi-modal2'), wsBtn = q('.xi-import--ws'),
        fin = q('.xi-import--final'), sw = q('.xi-swatch--on'), card = q('.sd-card--new');
    var tl = gsap.timeline({ repeat: -1 });
    // Initial states at t=0 (cycle start / old 0% keyframe values)
    tl.set(cur, { left: '58%', top: '38%', scale: 1 }, 0)
      .set(ov1, { opacity: 0 }, 0)
      .set(ov2, { opacity: 0 }, 0)
      .set(m1, { opacity: 1 }, 0)    /* modal1 base opacity: 1 (old 0-33% state = visible inside hidden overlay) */
      .set(m2, { opacity: 0 }, 0)    /* modal2 base opacity: 0 (old 0-40% state) */
      .set(card, { opacity: 0, y: '1.2cqw' }, 0);
    // Cursor travels to "Import from .xlsx"; arrives 14%=1.82s, departs ~6%=0.78s, dur=1.04s
    cursorTo(tl, cur, '74.5%', '7.7%', 1.82, 1.04);
    // Press "Import from .xlsx" at 18%=2.34s
    press(tl, cur, 2.34);
    // Overlay1 fades in: keyframe 16%=2.08s → 22%=2.86s (0.78s)
    fadeIn(tl, ov1, 2.08, 0.78);
    // Cursor travels to worksheet "Import"; arrives 30%=3.9s, departs ~22%=2.86s, dur=1.04s
    cursorTo(tl, cur, '71.6%', '64.4%', 3.9, 1.04);
    // Press worksheet "Import" at 33%=4.29s
    press(tl, cur, 4.29);
    // Pulse on wsBtn: old xi-pulse-ws uses 0.4cqw ring (not 4px); explicit tweens to match
    // keyframe: 30%=3.9s start build → 34%=4.42s peak → 38%=4.94s off (0.52s each)
    tl.fromTo(wsBtn, { boxShadow: '0 0 0 0 rgba(201,168,76,0)' },
      { boxShadow: '0 0 0 0.4cqw rgba(201,168,76,0.4)', scale: 0.97,
        duration: 0.52, ease: 'power2.out' }, 3.9)
      .to(wsBtn, { boxShadow: '0 0 0 0 rgba(201,168,76,0)', scale: 1, duration: 0.52 }, 4.42);
    // Modal1 fades out: 33%=4.29s → 36%=4.68s (0.39s)
    fadeOut(tl, m1, 4.29, 0.39);
    // Overlay1 fades out: 38%=4.94s → 44%=5.72s (0.78s)
    fadeOut(tl, ov1, 4.94, 0.78);
    // Overlay2 fades in: 36%=4.68s → 42%=5.46s (0.78s) — OVERLAPS with ov1 fade-out (4.94–5.46)
    fadeIn(tl, ov2, 4.68, 0.78);
    // Modal2 fades in: 40%=5.20s → 43%=5.59s (0.39s)
    fadeIn(tl, m2, 5.20, 0.39);
    // Cursor travels to green swatch; arrives 46%=5.98s, departs ~42%=5.46s, dur=0.52s
    cursorTo(tl, cur, '36.25%', '57%', 5.98, 0.52);
    // Press green swatch at 49%=6.37s
    press(tl, cur, 6.37);
    // Swatch pop: xi-swatchpop 46%=5.98s → 50%=6.50s (build) → 54%=7.02s (release) — scale 1.18
    // Build starts at cursor arrival (5.98s), peaks 0.52s later at 6.50s, returns at 7.02s
    tl.to(sw, { scale: 1.18, duration: 0.52, ease: 'power2.out' }, 5.98)
      .to(sw, { scale: 1, duration: 0.52 }, 6.50);
    // Cursor travels to final "Import" in rename modal; arrives 60%=7.8s, departs ~52%=6.76s, dur=1.04s
    cursorTo(tl, cur, '67.8%', '64%', 7.80, 1.04);
    // Press final "Import" at 63%=8.19s
    press(tl, cur, 8.19);
    // Pulse on fin: old xi-pulse-final uses 0.4cqw ring; explicit tweens to match
    // keyframe: 60%=7.8s start → 64%=8.32s peak → 68%=8.84s off (0.52s each)
    tl.fromTo(fin, { boxShadow: '0 0 0 0 rgba(201,168,76,0)' },
      { boxShadow: '0 0 0 0.4cqw rgba(201,168,76,0.4)', scale: 0.97,
        duration: 0.52, ease: 'power2.out' }, 7.80)
      .to(fin, { boxShadow: '0 0 0 0 rgba(201,168,76,0)', scale: 1, duration: 0.52 }, 8.32);
    // Overlay2 fades out: 66%=8.58s → 72%=9.36s (0.78s)
    fadeOut(tl, ov2, 8.58, 0.78);
    // New card enters: xi-cardin 64%=8.32s → 72%=9.36s (dur=1.04s); y offset matches keyframe
    // Using fromTo directly since cardIn hardcodes duration:0.5 but keyframe dur=1.04s
    tl.fromTo(card, { opacity: 0, y: '1.2cqw' },
      { opacity: 1, y: 0, duration: 1.04, ease: 'power2.out' }, 8.32);
    // Cursor returns to "Import from .xlsx": 72%=9.36s, travels from 66%=8.58s, dur=0.78s
    cursorTo(tl, cur, '74.5%', '7.7%', 9.36, 0.78);
    // Cycle pad at 13s
    tl.set({}, {}, 13);
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
