import { test, expect } from '@playwright/test';

/**
 * Astro's `compressHTML` drops the whitespace between tags that sit on separate
 * source lines. Where that whitespace was the only space between two words, the
 * words join. It fails in two ways, and this file guards both:
 *
 * 1. On screen. `read\n<a>the long version</a>` renders as "readthe long
 *    version". /join shipped three of these.
 * 2. In extracted text only. Two `display: block` spans look like two lines, but
 *    `textContent` has no space between them. Google, link previews, and
 *    copy-paste read `textContent`, so the homepage headline appeared in search
 *    results as "Come as you are.Leave with a flock."
 *
 * The fix in both cases is an explicit `{' '}` between the elements in source.
 */

const PAGES = [
  '/',
  '/about',
  '/contact',
  '/events',
  '/events/patch-002',
  '/join',
  '/support',
  '/projects',
  '/resources',
  '/arcade',
  '/arcade/flappy-philacon',
];

for (const path of PAGES) {
  test(`no words join across tags on ${path}`, async ({ page }) => {
    await page.goto(path);

    const joins = await page.evaluate(() => {
      const found: string[] = [];
      const word = /[\p{L}\p{N}]/u;
      const visible = (el: Element) => (el as HTMLElement).offsetParent !== null;

      // 1. On screen: an inline element butts against a word with no space.
      //    "from<a>open" or "<a>link</a>text". A dash counts too: "implied —<a>read".
      const inlineTags = 'a, strong, em, b, i, code, span';
      for (const el of document.querySelectorAll(inlineTags)) {
        if (!visible(el) || getComputedStyle(el).display !== 'inline') continue;
        const text = el.textContent ?? '';
        if (!text.trim()) continue;
        const before = el.previousSibling;
        const after = el.nextSibling;
        if (
          before?.nodeType === Node.TEXT_NODE &&
          /[\p{L}\p{N}—–]$/u.test(before.textContent ?? '') &&
          word.test(text[0])
        ) {
          found.push(`on screen: "…${(before.textContent ?? '').slice(-20)}${text.slice(0, 20)}…"`);
        }
        if (
          after?.nodeType === Node.TEXT_NODE &&
          /^[\p{L}\p{N}]/u.test(after.textContent ?? '') &&
          word.test(text[text.length - 1])
        ) {
          found.push(`on screen: "…${text.slice(-20)}${(after.textContent ?? '').slice(0, 20)}…"`);
        }
      }

      // 2. Extracted text: a token in textContent that is two innerText tokens
      //    glued together. Scoped to elements whose text is used as a name or
      //    a snippet: headings, links, buttons, labels, captions.
      const named = 'h1, h2, h3, h4, h5, h6, a, button, label, figcaption';
      for (const el of document.querySelectorAll(named)) {
        if (!visible(el)) continue;
        const extracted = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
        const rendered = ((el as HTMLElement).innerText ?? '').replace(/\s+/g, ' ').trim();
        if (!rendered) continue;
        const tokens = new Set(rendered.split(' '));
        for (const token of extracted.split(' ')) {
          if (tokens.has(token)) continue;
          for (let i = 1; i < token.length; i++) {
            if (tokens.has(token.slice(0, i)) && tokens.has(token.slice(i))) {
              found.push(`extracted <${el.tagName.toLowerCase()}>: "${extracted.slice(0, 80)}"`);
              break;
            }
          }
        }
      }

      return [...new Set(found)];
    });

    expect(joins, `words joined across tags on ${path}`).toEqual([]);
  });
}
