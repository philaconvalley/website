/**
 * Generates the site's favicon set from the brand mark in src/assets/icons/.
 *
 * A favicon is not one file, it is a set: different consumers want different
 * sizes, and they do not agree about transparency.
 *
 * Browser tabs get the transparent mark. That is the look we want, and it lets
 * the icon sit on whatever colour the tab strip happens to be. The known cost
 * is dark chrome: the mark is black-outlined, and against a dark tab strip that
 * outline stops separating the bird from its background. It still reads by its
 * yellow fill, it just loses some definition.
 *
 * The platform icons cannot take that deal, so they get a white background
 * baked in:
 *   - iOS discards alpha outright and composites onto black. Left transparent,
 *     the mark's outline would disappear into that black and the icon would
 *     read as a smudge — not a subtle loss like the dark tab strip, a broken
 *     icon.
 *   - Android launchers vary in what they put behind a transparent manifest
 *     icon, so the same risk applies with less predictability.
 *
 * Both are generated from the clear source rather than the purple one, because
 * the two source files are not framed alike: the purple art insets the mark, so
 * at small sizes a meaningful share of the tile is margin rather than bird.
 *
 * Run with `npm run icons:generate` after replacing either source file. The
 * outputs are committed, so this is not part of the build — it only needs to
 * run when the brand mark itself changes.
 *
 * Sources are 192x192 PNGs, which is why there is no 512 output; upscaling
 * would only invent detail that is not there. When design sends a vector
 * source, add a 512 entry and the manifest can carry a real one for Android
 * splash screens.
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sources = join(root, 'src/assets/icons');
const out = join(root, 'public/icons');

/** Baked in behind the platform icons, which cannot keep an alpha channel. */
const OPAQUE_BACKGROUND = '#ffffff';

const MARK = 'philacon-mark-clear.png';

const targets = [
  { file: 'favicon-32.png', size: 32 },
  { file: 'favicon-192.png', size: 192 },
  { file: 'apple-touch-icon.png', size: 180, flatten: true },
  { file: 'icon-192.png', size: 192, flatten: true },
];

await mkdir(out, { recursive: true });

for (const { file, size, flatten } of targets) {
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

  let pipeline = sharp(join(sources, MARK)).resize(size, size, {
    fit: 'contain',
    background: flatten ? OPAQUE_BACKGROUND : transparent,
  });

  // Choosing the background ourselves rather than leaving the platform to pick
  // one is the whole point — iOS would otherwise pick black.
  if (flatten) pipeline = pipeline.flatten({ background: OPAQUE_BACKGROUND });

  const { size: bytes } = await pipeline
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(out, file));

  console.log(`${file.padEnd(22)} ${size}x${size}  ${(bytes / 1024).toFixed(1)} KB`);
}
