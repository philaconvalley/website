/**
 * Generates the site's favicon set from the brand badge in src/assets/icons/.
 *
 * A favicon is not one file, it is a set: different consumers want different
 * sizes, and they do not agree about transparency.
 *
 * The source is the transparent mascot head, cropped tight with the antenna
 * removed. At 16px the antenna is one or two blurry pixels, and leaving room
 * for it shrinks the head.
 *
 * Browser tabs get the transparent badge. The tab strip is always a known
 * light or dark grey, and the yellow head reads against both.
 *
 * The platform icons cannot take that deal, so they get brand coral baked in:
 *   - iOS discards alpha outright and composites onto black. Left transparent,
 *     the badge's black outline would disappear into that black and the icon
 *     would read as a smudge.
 *   - Android launchers vary in what they put behind a transparent manifest
 *     icon, so the same risk applies with less predictability.
 *
 * The platform icons also get padding. iOS rounds the corners and many Android
 * launchers cut the icon to a circle; the tight crop that suits a tab would
 * lose the edge of the head and the beak tip. 15% on each side clears both.
 *
 * Run with `npm run icons:generate` after replacing the source file. The
 * outputs are committed, so this is not part of the build — it only needs to
 * run when the brand mark itself changes.
 *
 * The source is 512x512, which is the largest output. Do not add a bigger
 * target without a bigger source; upscaling would only invent detail.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sources = join(root, 'src/assets/icons');
const out = join(root, 'public/icons');

/** Baked in behind the platform icons, which cannot keep an alpha channel. */
const OPAQUE_BACKGROUND = '#EF657F'; // brand-coral

/** Share of each side left empty on platform icons, so masks don't clip the mark. */
const PLATFORM_PADDING = 0.15;

const MARK = 'philacon-badge-clear.png';

const targets = [
  { file: 'favicon-32.png', size: 32 },
  { file: 'favicon-192.png', size: 192 },
  { file: 'apple-touch-icon.png', size: 180, platform: true },
  { file: 'icon-192.png', size: 192, platform: true },
  { file: 'icon-512.png', size: 512, platform: true },
];

await mkdir(out, { recursive: true });

for (const { file, size, platform } of targets) {
  let pipeline;

  if (platform) {
    const pad = Math.round(size * PLATFORM_PADDING);

    // Choosing the background ourselves rather than leaving the platform to
    // pick one is the whole point — iOS would otherwise pick black.
    pipeline = sharp(join(sources, MARK))
      .resize(size - 2 * pad, size - 2 * pad)
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: OPAQUE_BACKGROUND })
      .flatten({ background: OPAQUE_BACKGROUND });
  } else {
    pipeline = sharp(join(sources, MARK)).resize(size, size);
  }

  const { size: bytes } = await pipeline
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(out, file));

  console.log(`${file.padEnd(22)} ${size}x${size}  ${(bytes / 1024).toFixed(1)} KB`);
}

// /favicon.ico is requested by path, not by <link>: RSS readers, link
// unfurlers and older browsers ask for it whether or not the page names it.
// An .ico is a directory of images, and since Windows Vista each entry may be
// a plain PNG, so the container is written by hand rather than adding a
// dependency for it.
const ICO_SIZES = [16, 32, 48];

const images = await Promise.all(
  ICO_SIZES.map((size) =>
    sharp(join(sources, MARK)).resize(size, size).png({ compressionLevel: 9 }).toBuffer(),
  ),
);

const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(images.length, 4);

let offset = header.length;
images.forEach((png, i) => {
  const entry = 6 + 16 * i;
  header.writeUInt8(ICO_SIZES[i], entry); // width
  header.writeUInt8(ICO_SIZES[i], entry + 1); // height
  header.writeUInt8(0, entry + 2); // palette size: none
  header.writeUInt8(0, entry + 3); // reserved
  header.writeUInt16LE(1, entry + 4); // colour planes
  header.writeUInt16LE(32, entry + 6); // bits per pixel
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});

const ico = Buffer.concat([header, ...images]);
await writeFile(join(root, 'public/favicon.ico'), ico);
console.log(
  `${'favicon.ico'.padEnd(22)} ${ICO_SIZES.join('/')}  ${(ico.length / 1024).toFixed(1)} KB`,
);
