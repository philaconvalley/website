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
  // The list comes from the page, so treat it as untrusted: keep only photos
  // whose src is a gallery path on this site. srcset is rebuilt from that
  // checked path, with the same 800px rule as index.astro, never read.
  var galleryPath = /^\/images\/gallery\/[a-z0-9-]+\/[a-z0-9-]+\.jpg$/;
  if (!Array.isArray(photos)) return;
  photos = photos.filter(function (p) {
    return p && typeof p.src === 'string' && galleryPath.test(p.src);
  });
  if (!photos.length) return;
  var pick = photos[Math.floor(Math.random() * photos.length)];
  var src = galleryPath.exec(pick.src)[0];
  img.alt = typeof pick.alt === 'string' ? pick.alt : '';
  img.srcset = src.replace(/\.jpg$/, '-800.jpg') + ' 800w, ' + src + ' 1600w';
  img.src = src;
})();
