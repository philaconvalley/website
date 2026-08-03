# Event photos

Image files for the homepage's "The room" mosaic go here.

Dropping a file in this folder does nothing on its own. Each photo also needs an
entry in `src/content/gallery/` naming the event, the date, and its alt text —
that entry is what puts it on the page. Full instructions and the field table:
[`docs/adding-content.md`](../../../docs/adding-content.md#adding-event-photos).

```
public/images/gallery/patch-002-pairing.webp   <- the file
src/content/gallery/patch-002-pairing.json     <- what makes it appear
```

## Before you add one

The mosaic renders under the headline **"Every photo is a real Thursday."** Two
things follow from that, and neither is a formality:

- **It has to be one of our nights.** A photo from a conference we attended, a
  partner's production shoot, or a stock library makes the page assert something
  untrue in the one section built to prove the sentence above it. If the mosaic
  is empty the homepage says "Come see the room." instead and nothing is
  claimed — that is the correct state until real photos exist, not a gap to
  fill.
- **The people in it have to be okay with it.** This is a public homepage. There
  is no way to un-publish a face someone finds later.

## Format

WebP or JPEG, roughly 1600px on the long edge. The grid crops to fill, so put
the subject near the centre. Keep files under ~300KB — these load on phones.
