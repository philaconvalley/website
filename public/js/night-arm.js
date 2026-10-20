// About page: the "How a night goes" timeline, step 1 of 2. Loaded
// parser-blocking just before the strip, so its steps are hidden before the
// browser paints them and the timeline can draw itself on every view. night.js
// plays it. Same pattern as odo-arm.js on Home.
// Safety: if night.js has not started within 3s (blocked, failed), show the
// steps as they are, so they can never stay hidden.
document.documentElement.classList.add('night');
window.setTimeout(function () {
  if (!window.pcvNightReady) document.documentElement.classList.remove('night');
}, 3000);
