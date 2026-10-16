// Hero photo: one hero-eligible gallery photo at random per visit, so returning
// visitors see more of the room. Loaded parser-blocking right after the hero
// figure, so it sets the photo before the browser starts loading one: a single
// download and a single paint, no swap. A served file, not inline: the CSP
// allows scripts from this origin only.
(function () {
  var figure = document.querySelector('[data-hero-photos]');
  var img = figure && figure.querySelector('img[data-hero-img]');
  if (!figure || !img) return;
  var photos;
  try {
    photos = JSON.parse(figure.getAttribute('data-hero-photos') || '[]');
  } catch (e) {
    photos = [];
  }
  if (!photos.length) return;
  var pick = photos[Math.floor(Math.random() * photos.length)];
  img.alt = pick.alt;
  img.srcset = pick.srcset;
  img.src = pick.src;
})();
