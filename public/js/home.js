// Home page: the numbers odometer. Served as a file, not inlined, because the CSP allows
// scripts from this origin only (script-src 'self'); Astro inlines small
// <script> blocks, which the CSP blocks. Same pattern as event-freshness.js.
// The hero photo pick lives in hero-photo.js, which must run earlier.

// The live numbers roll in like an odometer every time a stat comes half
//    into view: on load, on a refresh, and again after it scrolls fully out
//    of view and back (Waskar, 10/15/2026). The reset happens only while the
//    stat is fully off screen, so no one sees a number drop to 0. Reduced
//    motion plays its fade once and never replays (styles: global.css, "numbers band odometer"). odo-arm.js
//    already hid the stats before paint. The HTML holds the real values (no-JS,
//    search) and an sr-only copy is what assistive tech reads. Under reduced
//    motion nothing moves: the stat fades in instead.
(function odometer() {
  window.pcvOdoReady = true;
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (!counters.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAGGER = 80; // ms between stats that arrive together
  var ROLL_AT = 150; // ms after the rule starts drawing
  var RISE_AT = 700; // ms after the rule starts: label and note rise
  var COLUMN_STEP = 60; // ms between digit columns, left to right
  var ROLL = 1100; // ms, matches .odo-strip in global.css
  var REDUCED = 300; // ms, matches the reduced-motion fade
  // The hero stat line waits for the hero entrance (headline words at 0.1s
  // and 0.3s, tagline at 0.5s, 0.9s each) so the roll is the last beat, not
  // one more motion on top of them. Measured from navigation start.
  var HERO_SETTLED = 1000;

  function itemOf(el) {
    return el.closest('[data-odo-item]');
  }

  // Per number: 'idle' (hidden, waiting), 'playing', or 'done'. The last
  // observed visibility decides whether a finished number resets right away.
  var state = new WeakMap();
  var offScreen = new WeakMap();

  function finish(el) {
    var layer = el.querySelector('.odo-layer');
    if (layer) layer.remove();
    itemOf(el).setAttribute('data-odo', 'done');
    state.set(el, 'done');
    // It ended while scrolled away: reset now, unseen.
    if (offScreen.get(el)) reset(el);
  }

  // Back to the hidden starting state (html.odo styles), with a fresh overlay
  // at 0. Runs only while the number is fully off screen.
  function reset(el) {
    if (reduce) return;
    var item = itemOf(el);
    var rule = item.querySelector('[data-odo-rule]');
    if (rule) rule.style.transitionDelay = '';
    Array.prototype.forEach.call(item.querySelectorAll('[data-odo-rise]'), function (rise) {
      rise.style.transitionDelay = '';
    });
    build(el);
    item.removeAttribute('data-odo');
    state.set(el, 'idle');
  }

  // No observer: show everything as it is.
  if (!('IntersectionObserver' in window)) {
    counters.forEach(finish);
    return;
  }

  // One column per digit: a strip of 0-9 that starts at 0 and stops on the
  // digit. At most 9 cells of travel, so a digit moves under one cell per
  // frame and stays readable (an extra lap moved 1.3 cells and flickered).
  function build(el) {
    var layer = document.createElement('span');
    layer.className = 'odo-layer';
    layer.setAttribute('aria-hidden', 'true');
    el.getAttribute('data-count')
      .split('')
      .forEach(function (digit) {
        var col = document.createElement('span');
        col.className = 'odo-col';
        var strip = document.createElement('span');
        strip.className = 'odo-strip';
        for (var n = 0; n < 10; n++) {
          var cell = document.createElement('span');
          cell.textContent = String(n);
          strip.appendChild(cell);
        }
        strip.setAttribute('data-target', digit);
        col.appendChild(strip);
        layer.appendChild(col);
      });
    el.appendChild(layer);
  }

  // Every write for one batch of stats happens in one frame. The hidden state
  // was painted before (odo-arm.js), so no forced layout read is needed.
  function playBatch(batch) {
    window.requestAnimationFrame(function () {
      batch.forEach(function (job) {
        var el = job.el;
        var delay = job.delay;
        var item = itemOf(el);
        var strips = el.querySelectorAll('.odo-strip');
        if (reduce) {
          item.style.transitionDelay = delay + 'ms';
        } else {
          var rule = item.querySelector('[data-odo-rule]');
          if (rule) rule.style.transitionDelay = delay + 'ms';
          Array.prototype.forEach.call(item.querySelectorAll('[data-odo-rise]'), function (rise) {
            rise.style.transitionDelay = delay + RISE_AT + 'ms';
          });
          Array.prototype.forEach.call(strips, function (strip, k) {
            strip.style.transitionDelay = delay + ROLL_AT + COLUMN_STEP * k + 'ms';
            strip.style.transform =
              'translateY(' + -Number(strip.getAttribute('data-target')) * 10 + '%)';
          });
        }
        item.setAttribute('data-odo', 'play');
        state.set(el, 'playing');
        var end = reduce
          ? delay + REDUCED
          : delay + Math.max(ROLL_AT + COLUMN_STEP * (strips.length - 1) + ROLL, RISE_AT + 300);
        // Finish when the last strip reports its roll has ended, so the
        // overlay never leaves early on a busy page (a late start would cut
        // the last frames and make the digits jump). The timer is only a
        // fallback, with room for a late start.
        var finished = false;
        var done = function () {
          if (finished) return;
          finished = true;
          finish(el);
        };
        var last = strips[strips.length - 1];
        if (last) {
          last.addEventListener('transitionend', function onEnd(event) {
            if (event.target !== last || event.propertyName !== 'transform') return;
            last.removeEventListener('transitionend', onEnd);
            done();
          });
        }
        window.setTimeout(done, end + 1000);
      });
    });
  }

  if (!reduce) counters.forEach(build);
  counters.forEach(function (el) {
    state.set(el, 'idle');
  });

  var io = new IntersectionObserver(
    function (entries) {
      var batch = [];
      entries.forEach(function (entry) {
        var el = entry.target;
        offScreen.set(el, !entry.isIntersecting);
        if (!entry.isIntersecting) {
          if (state.get(el) === 'done') reset(el);
          return;
        }
        if (entry.intersectionRatio < 0.5 || state.get(el) !== 'idle') return;
        if (reduce) io.unobserve(el);
        var hero = entry.target.closest('[data-testid="hero-stats"]');
        var base = hero ? Math.max(0, HERO_SETTLED - performance.now()) : 0;
        batch.push({ el: entry.target, delay: base + STAGGER * batch.length });
      });
      if (batch.length) playBatch(batch);
    },
    { threshold: [0, 0.5] },
  );
  counters.forEach(function (el) {
    io.observe(el);
  });
})();
