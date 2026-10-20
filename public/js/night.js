// The night system, step 2 of 2 (styles: global.css, "night timeline"): the
// "How a night goes" timeline on About, the four "First time?" points on
// Events, and the role ladder on Join. It plays the first [data-night-strip]
// on the page; a step needs a [data-night-dot] and a [data-night-rise], and
// [data-night-seg] is optional.
// Served as a file because the CSP allows scripts from this origin only.
// night-arm.js hides the steps before paint.
//
// - Purpose: explanation. A line draws from step to step like time passing;
//   as it reaches a step, the dot pops in and the text rises.
// - When: each time a quarter of the strip comes into view, and again after it
//   scrolls fully out of view and back, like the Home odometer.
// - Replays are shorter (half the step time). The first view gets the full
//   sequence; later views are a reminder.
// - The reset happens only while the strip is fully off screen.
// - Timing is set on each element (no parent variable), in one write per play.
// - Reduced motion: nothing moves. The steps fade in once, no replay.
(function nightTimeline() {
  window.pcvNightReady = true;
  var strip = document.querySelector('[data-night-strip]');
  if (!strip) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STEP = 320; // ms between steps on the first view
  var STEP_REPLAY = 160; // ms between steps on a replay
  var RISE_AFTER = 60; // ms after its dot: the step's text rises
  var SEG_AFTER = 80; // ms after its dot: the segment to the next dot draws
  var VISIBLE = 0.25; // share of the strip in view that starts the timeline

  var steps = Array.prototype.slice.call(strip.querySelectorAll('li'));
  var played = false;

  function time(replay) {
    var step = reduce ? 0 : replay ? STEP_REPLAY : STEP;
    steps.forEach(function (li, i) {
      var start = i * step;
      var dot = li.querySelector('[data-night-dot]');
      var rise = li.querySelector('[data-night-rise]');
      var seg = li.querySelector('[data-night-seg]');
      dot.style.transitionDelay = start + 'ms';
      rise.style.transitionDelay = (reduce ? 0 : start + RISE_AFTER) + 'ms';
      if (seg) {
        // The segment ends as the next dot pops in.
        seg.style.transitionDelay = start + SEG_AFTER + 'ms';
        seg.style.transitionDuration = Math.max(step - SEG_AFTER, 0) + 'ms';
      }
    });
  }

  function play(replay) {
    played = true;
    time(replay);
    window.requestAnimationFrame(function () {
      strip.setAttribute('data-night', 'play');
    });
  }

  // Back to the hidden state, at once: transitions live only on the play
  // state, so removing it snaps. Runs only while the strip is off screen.
  function reset() {
    strip.removeAttribute('data-night');
    strip.setAttribute('data-night-replay', '');
  }

  if (!('IntersectionObserver' in window)) {
    play(false);
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!played && entry.intersectionRatio >= VISIBLE) {
          play(strip.hasAttribute('data-night-replay'));
          if (reduce) io.disconnect();
        } else if (played && !entry.isIntersecting && !reduce) {
          played = false;
          reset();
        }
      });
    },
    { threshold: [0, VISIBLE] },
  );
  io.observe(strip);
})();
