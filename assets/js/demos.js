/* Pauses off-screen .demo scenes for perf. Pure enhancement:
   without JS, scenes animate continuously (CSS baseline). */
(function () {
  var demos = document.querySelectorAll('.demo');
  if (!demos.length) return;

  if (!('IntersectionObserver' in window)) {
    // No observer: keep every scene running.
    demos.forEach(function (demo) { demo.classList.add('is-onscreen'); });
    return;
  }

  // Pre-mark every scene as on-screen so visible scenes never flash paused
  // during the gap between the html.js flag and the observer's first async
  // callback. The observer then pauses any that are actually off-screen.
  demos.forEach(function (demo) { demo.classList.add('is-onscreen'); });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-onscreen', entry.isIntersecting);
      });
    },
    { rootMargin: '0px', threshold: 0.1 }
  );
  demos.forEach(function (demo) { observer.observe(demo); });
})();
