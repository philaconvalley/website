import { getHeroPhotos } from '../../lib/hero-photos';

// Hero photo: one hero-eligible gallery photo at random per visit, so returning
// visitors see more of the room. Loaded parser-blocking right after the hero
// figure, so it sets the photo before the browser starts loading one: a single
// download and a single paint, no swap. A served file, not inline: the CSP
// allows scripts from this origin only.
//
// Built from the gallery at build time. The photo list is part of the script,
// so the script reads no URL from the page (CodeQL js/xss-through-dom).
export async function GET() {
  const photos = (await getHeroPhotos()).map(({ src, alt, srcset }) => ({ src, alt, srcset }));
  const script = `(function () {
  var img = document.querySelector('[data-hero-photos] img[data-hero-img]');
  if (!img) return;
  var photos = ${JSON.stringify(photos)};
  if (!photos.length) return;
  var pick = photos[Math.floor(Math.random() * photos.length)];
  img.alt = pick.alt;
  img.srcset = pick.srcset;
  img.src = pick.src;
})();
`;
  return new Response(script, {
    headers: { 'Content-Type': 'text/javascript; charset=utf-8' },
  });
}
