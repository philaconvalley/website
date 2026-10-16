// LabTrack: pause the endless loop while it is off screen, and resume it when
// it comes back into view. All parts pause together, so the story stays in
// sync. Without JavaScript the loop simply runs. Under reduced motion the
// loop is already frozen by CSS, so there is nothing to pause.
(function () {
  if (!('IntersectionObserver' in window)) return;
  var tracks = document.querySelectorAll('[data-lab-track]');
  if (!tracks.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.removeAttribute('data-paused');
      else entry.target.setAttribute('data-paused', '');
    });
  });
  Array.prototype.forEach.call(tracks, function (track) {
    io.observe(track);
  });
})();
