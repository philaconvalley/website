import { test, expect, type Locator } from '@playwright/test';

/**
 * Nothing in CI gated colour contrast, and the redesign shipped its single primary
 * action — the RSVP button in the header and in the phone bottom bar — as white on
 * #FF66A8, which is 2.72:1 against a 4.5:1 requirement. The one control the whole
 * page is built around was the least readable thing on it.
 *
 * These read the *computed* colours out of the browser rather than asserting on
 * class names, so the test measures what a visitor actually sees. A future refactor
 * that changes tokens, swaps a component, or introduces a hover state that inverts
 * the pairing gets caught, not just a literal `text-white` reappearing.
 *
 * Scope is deliberately the elements this branch redesigned. The same pairing still
 * exists on the shared Button component and on several page-level CTA sections that
 * predate this work — tracked separately rather than silently restyled here.
 */

const AA_NORMAL_TEXT = 4.5;

function relativeLuminance([r, g, b]: number[]): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function parseRgba(value: string): { rgb: number[]; a: number } {
  // Only legacy rgb()/rgba() computed styles — reject colour()/oklch()/etc. loudly.
  if (!/^\s*rgba?\(/i.test(value)) {
    throw new Error(`unsupported colour function "${value}"`);
  }
  const nums = value.match(/[\d.]+%?/g);
  if (!nums || nums.length < 3) throw new Error(`cannot parse colour "${value}"`);
  // RGB channels are 0–255 in legacy serializations; `%` on them silently misparses.
  for (let i = 0; i < 3; i++) {
    if (nums[i].endsWith('%')) {
      throw new Error(`percentage RGB channels unsupported "${value}"`);
    }
  }
  const rgb = nums.slice(0, 3).map(Number);
  let a = 1;
  if (nums.length > 3) {
    const raw = nums[3];
    // Modern `rgb(... / 85%)` — convert percentage alpha; leave unitless 0–1 alone.
    a = raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw);
  }
  if (rgb.some((n) => !Number.isFinite(n))) {
    throw new Error(`cannot parse colour "${value}"`);
  }
  if (!Number.isFinite(a) || a < 0 || a > 1) {
    throw new Error(`unsupported alpha in colour "${value}"`);
  }
  return { rgb, a };
}

/**
 * Composites a (possibly translucent) foreground over its background before
 * measuring luminance — matches what a visitor actually sees.
 * Translucent backgrounds are composited over page white; fully transparent
 * backgrounds throw instead of reporting a false 21:1 pass.
 */
function contrastRatio(fg: string, bg: string): number {
  const f = parseRgba(fg);
  const b = parseRgba(bg);
  if (b.a === 0) {
    throw new Error(`transparent background "${bg}"`);
  }
  const bgRgb = b.a < 1 ? b.rgb.map((v) => b.a * v + (1 - b.a) * 255) : b.rgb;
  const composited = f.rgb.map((v, i) => f.a * v + (1 - f.a) * bgRgb[i]);
  const [hi, lo] = [relativeLuminance(composited), relativeLuminance(bgRgb)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Walks up for a non-transparent background: a button's own background may be set
 * on itself or inherited visually from an ancestor, and `rgba(0, 0, 0, 0)` compared
 * against text would silently produce a passing ratio against nothing.
 */
async function effectiveColours(locator: Locator) {
  return locator.evaluate((el) => {
    const color = getComputedStyle(el).color;
    let node: HTMLElement | null = el as HTMLElement;
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      const alpha = bg.match(/[\d.]+/g);
      const isTransparent = !alpha || (alpha.length === 4 && Number(alpha[3]) === 0);
      if (!isTransparent) return { color, background: bg, from: node.tagName };
      node = node.parentElement;
    }
    return { color, background: 'rgb(255, 255, 255)', from: 'fallback' };
  });
}

test.describe('contrast helper alpha compositing', () => {
  // Pure math assertions — no browser needed for the bug in #117.
  test('opaque colours match previous luminance math', () => {
    expect(contrastRatio('rgb(26, 26, 26)', 'rgb(255, 102, 168)')).toBeCloseTo(6.3965, 3);
  });

  test('translucent white on coral is ~2.62:1, not the opaque ~3.07:1', () => {
    const ratio = contrastRatio('rgba(255, 255, 255, 0.85)', 'rgb(239, 101, 127)');
    expect(ratio).toBeCloseTo(2.62, 1);
    expect(ratio).toBeLessThan(3.0);
  });

  test('percentage alpha in modern rgb() syntax is not treated as 85', () => {
    const ratio = contrastRatio('rgb(255 255 255 / 85%)', 'rgb(239, 101, 127)');
    expect(ratio).toBeCloseTo(2.62, 1);
  });

  test('rejects percentage RGB channels and non-rgb() functions', () => {
    expect(() => parseRgba('rgb(100%, 40%, 66%)')).toThrow(/percentage RGB/);
    expect(() => parseRgba('oklch(0.7 0.15 20)')).toThrow(/unsupported colour function/);
  });

  test('translucent backgrounds composite over white; transparent throws', () => {
    // Dark text on brand-dark/5 over white should remain high-contrast, not ~1:1.
    const ratio = contrastRatio('rgb(26, 26, 26)', 'rgba(26, 26, 26, 0.05)');
    expect(ratio).toBeGreaterThan(10);
    expect(() => contrastRatio('rgb(26, 26, 26)', 'rgba(0, 0, 0, 0)')).toThrow(/transparent/);
  });
});

test.describe('primary CTA colour contrast', () => {
  test('the header RSVP button meets WCAG AA for normal text', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const cta = page.locator('[data-testid="hero-cta"]');
    await expect(cta).toBeVisible();

    const { color, background } = await effectiveColours(cta);
    const ratio = contrastRatio(color, background);
    expect(
      ratio,
      `header RSVP is ${ratio.toFixed(2)}:1 (${color} on ${background}), needs ${AA_NORMAL_TEXT}:1`,
    ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  test('the mobile event bar RSVP button meets WCAG AA for normal text', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const cta = page.locator('[data-testid="event-bar-cta"]');
    // Renders only when an event is scheduled; skip loudly rather than pass empty.
    test.skip((await cta.count()) === 0, 'no upcoming event in this build — no bar to check');
    await expect(cta).toBeVisible();

    const { color, background } = await effectiveColours(cta);
    const ratio = contrastRatio(color, background);
    expect(
      ratio,
      `event bar RSVP is ${ratio.toFixed(2)}:1 (${color} on ${background}), needs ${AA_NORMAL_TEXT}:1`,
    ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  test('the current-page nav pill label meets WCAG AA against the pill', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/projects');

    const current = page.locator('[data-testid="desktop-nav"] [aria-current="page"]');
    await expect(current).toBeVisible();

    // The pill is a sibling element behind the label, so the label's own ancestors
    // never yield the pink — compare against the pill's background directly.
    const color = await current.evaluate((el) => getComputedStyle(el).color);
    const pill = await page
      .locator('[data-testid="nav-pill"]')
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    const ratio = contrastRatio(color, pill);
    expect(
      ratio,
      `current nav label is ${ratio.toFixed(2)}:1 (${color} on ${pill}), needs ${AA_NORMAL_TEXT}:1`,
    ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
});
