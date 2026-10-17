// Numbers odometer, step 1 of 2. Loaded parser-blocking before the hero (the
// first numbers on the page), so the stats are hidden before the browser paints them: the roll can
// then play on every load, including a refresh with the band already in view,
// and a real number never flashes before it rolls. home.js plays the roll.
// Safety: if home.js has not started within 3s (blocked, failed), show the
// numbers as they are, so they can never stay hidden.
document.documentElement.classList.add('odo');
window.setTimeout(function () {
  if (!window.pcvOdoReady) document.documentElement.classList.remove('odo');
}, 3000);
