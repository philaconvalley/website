import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

/**
 * Guards what PostHog and Sentry send, against the privacy page's promises.
 * Runs under playwright.observability.config.ts, which builds the site with
 * the observability host set to `localhost`, so both tools are live here.
 *
 * Why this exists: an SDK upgrade can change a default with no error anywhere.
 * Sentry 11 did exactly that, removing `sendDefaultPii` in favour of a
 * `dataCollection` object whose defaults collect cookies and query strings.
 *
 * The /relay/* rewrites live only on Vercel, so these tests stub those paths
 * and read what the browser would have sent.
 */

type Relay = 'p' | 's' | 'c';
interface Sent {
  relay: Relay;
  url: string;
  body: Buffer | null;
}

interface PostHogEvent {
  event: string;
  distinct_id?: string;
  properties: Record<string, unknown>;
}

/**
 * PostHog drops events from browsers that look automated: `navigator.webdriver`
 * and the `HeadlessChrome` brand in `navigator.userAgentData`. Hide both, or
 * every PostHog assertion passes with nothing sent.
 */
async function lookLikeAVisitor(context: BrowserContext) {
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });
    Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => undefined });
  });
}

async function recordRelays(context: BrowserContext) {
  const sent: Sent[] = [];
  await context.route('**/relay/**', async (route) => {
    const request = route.request();
    const relay = new URL(request.url()).pathname.split('/')[2] as Relay;
    sent.push({ relay, url: request.url(), body: request.postDataBuffer() });
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":1}' });
  });
  return sent;
}

/** PostHog gzips its batches; decode them into events. */
function postHogEvents(sent: Sent[]): PostHogEvent[] {
  return sent
    .filter((s) => s.relay === 'p' && s.body)
    .flatMap((s) => {
      const body = s.body as Buffer;
      let text: string;
      try {
        text = gunzipSync(body).toString();
      } catch {
        text = body.toString();
      }
      const json = JSON.parse(text);
      return Array.isArray(json) ? json : (json.batch ?? [json]);
    });
}

/** A Sentry envelope is newline-separated JSON: a header, then item pairs. */
function sentryEvents(sent: Sent[]) {
  return sent
    .filter((s) => s.relay === 's' && s.body)
    .flatMap((s) =>
      (s.body as Buffer)
        .toString()
        .split('\n')
        .slice(1)
        .flatMap((line) => {
          try {
            return [JSON.parse(line)];
          } catch {
            return [];
          }
        })
        .filter((item) => item.exception),
    );
}

async function expectNothingStored(page: Page, context: BrowserContext) {
  expect(await context.cookies()).toEqual([]);
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));
  expect(storage).toEqual({ local: [], session: [] });
}

test.describe('PostHog', () => {
  test('sends a cookieless, profile-free pageview and stores nothing', async ({
    page,
    context,
  }) => {
    await lookLikeAVisitor(context);
    const sent = await recordRelays(context);
    const otherOrigins: string[] = [];
    page.on('request', (r) => {
      if (new URL(r.url()).origin !== 'http://localhost:4323') otherOrigins.push(r.url());
    });

    await page.goto('/?utm_source=newsletter&email=someone%40example.com#top');

    await expect
      .poll(() => postHogEvents(sent).map((e) => e.event), { timeout: 15_000 })
      .toContain('$pageview');
    const pageview = postHogEvents(sent).find((e) => e.event === '$pageview')!;

    // Cookieless mode: one shared id, hashed per day on PostHog's servers.
    expect(pageview.distinct_id ?? pageview.properties.distinct_id).toBe('$posthog_cookieless');
    expect(pageview.properties.$process_person_profile).toBe(false);
    expect(pageview.properties).not.toHaveProperty('$ip');

    // Campaign tags stay; everything else after "?" and "#" goes.
    const currentUrl = String(pageview.properties.$current_url);
    expect(currentUrl).toContain('utm_source=newsletter');
    expect(currentUrl).not.toContain('email');
    expect(currentUrl).not.toContain('#');

    expect(otherOrigins, 'nothing may leave for another origin').toEqual([]);
    await expectNothingStored(page, context);
  });

  test('records a click on the Discord link', async ({ page, context }) => {
    await lookLikeAVisitor(context);
    const sent = await recordRelays(context);
    await page.goto('/join');
    await expect
      .poll(() => postHogEvents(sent).map((e) => e.event), { timeout: 15_000 })
      .toContain('$pageview');

    // The real click leaves for Discord before PostHog sends its batch, so
    // stop the navigation. Autocapture still sees the click.
    await page.evaluate(() =>
      document.addEventListener('click', (e) => e.preventDefault(), { capture: true }),
    );
    await page.locator('a[href="/discord"]').first().click();

    await expect
      .poll(() => postHogEvents(sent).filter((e) => e.event === '$autocapture'), {
        timeout: 15_000,
      })
      .not.toHaveLength(0);
    const click = postHogEvents(sent).find((e) => e.event === '$autocapture')!;
    expect(String(click.properties.$elements_chain)).toContain('/discord');
  });
});

test.describe('PostHog contact form event', () => {
  const typed = {
    name: 'Jane Testvisitor',
    email: 'jane.testvisitor@example.com',
    message: 'A private message that must never reach analytics.',
  };

  async function sendContactForm(page: Page, context: BrowserContext, formspreeStatus: number) {
    await lookLikeAVisitor(context);
    const sent = await recordRelays(context);
    await context.route('https://formspree.io/**', (route) =>
      route.fulfill({
        status: formspreeStatus,
        contentType: 'application/json',
        body: formspreeStatus === 200 ? '{"ok":true}' : '{"error":"rejected"}',
      }),
    );
    await page.goto('/contact');
    // Wait for PostHog to load, so the submit is not the first thing it sees.
    await expect
      .poll(() => postHogEvents(sent).map((e) => e.event), { timeout: 15_000 })
      .toContain('$pageview');
    const form = page.locator('form[action*="formspree.io"]');
    await form.locator('[name="name"]').fill(typed.name);
    await form.locator('[name="email"]').fill(typed.email);
    const subject = form.locator('[name="subject"]');
    if ((await subject.evaluate((el) => el.tagName)) === 'SELECT') {
      await subject.selectOption({ index: 1 });
    } else {
      await subject.fill('Test subject');
    }
    await form.locator('[name="message"]').fill(typed.message);
    await form.locator('[type="submit"]').click();
    return sent;
  }

  test('sends contact_form_sent after Formspree accepts, with nothing typed', async ({
    page,
    context,
  }) => {
    const sent = await sendContactForm(page, context, 200);
    await expect
      .poll(() => postHogEvents(sent).map((e) => e.event), { timeout: 15_000 })
      .toContain('contact_form_sent');

    // No PostHog payload, from any event, may carry what the visitor typed.
    const everything = JSON.stringify(postHogEvents(sent));
    for (const value of Object.values(typed)) expect(everything).not.toContain(value);
  });

  test('sends nothing when Formspree rejects the message', async ({ page, context }) => {
    const sent = await sendContactForm(page, context, 422);
    await expect(page.getByText('Your message did not send.')).toBeVisible();
    await page.waitForTimeout(4_000);
    expect(postHogEvents(sent).map((e) => e.event)).not.toContain('contact_form_sent');
  });

  test('ignores event names that are not on the allowlist', async ({ page, context }) => {
    await lookLikeAVisitor(context);
    const sent = await recordRelays(context);
    await page.goto('/contact');
    await expect
      .poll(() => postHogEvents(sent).map((e) => e.event), { timeout: 15_000 })
      .toContain('$pageview');
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent('pcv-track', { detail: { event: 'jane@example.com' } })),
    );
    await page.waitForTimeout(4_000);
    expect(JSON.stringify(postHogEvents(sent))).not.toContain('jane@example.com');
  });
});

test.describe('Sentry', () => {
  test('the smoke-test hook reports one error, with no query string and no user', async ({
    page,
    context,
  }) => {
    const sent = await recordRelays(context);
    await page.goto('/about?email=someone%40example.com#sentry-smoke-test');

    await expect.poll(() => sentryEvents(sent).length, { timeout: 15_000 }).toBe(1);
    const [event] = sentryEvents(sent);

    expect(event.exception.values[0].value).toContain('Sentry smoke test');
    expect(event.request.url).toBe('http://localhost:4323/about');
    expect(event.user).toBeUndefined();
    expect(event.request).not.toHaveProperty('cookies');
    expect(event.request).not.toHaveProperty('headers');
    await expectNothingStored(page, context);
  });

  test('tags errors with the debug IDs Sentry needs to read the source maps', async ({
    page,
    context,
  }) => {
    // The Sentry Vite plugin (astro.config.mjs) stamps every bundle with a
    // debug ID. The SDK sends the IDs of the files in the stack trace, and
    // Sentry matches them to the uploaded maps. With no IDs, every stack
    // trace stays minified, with no error anywhere.
    const sent = await recordRelays(context);
    await page.goto('/about#sentry-smoke-test');
    await expect.poll(() => sentryEvents(sent).length, { timeout: 15_000 }).toBe(1);
    const [event] = sentryEvents(sent);
    const images: { type: string; code_file: string; debug_id: string }[] =
      event.debug_meta?.images ?? [];
    const thrower = event.exception.values[0].stacktrace.frames.at(-1).filename as string;
    const image = images.find((i) => i.code_file === thrower);
    expect(image, `no debug ID for ${thrower}`).toBeDefined();
    expect(image!.type).toBe('sourcemap');
    expect(image!.debug_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('ignores errors that do not come from our scripts', async ({ page, context }) => {
    const sent = await recordRelays(context);
    await page.goto('/about');
    // Thrown from an inline evaluation: no stack frame in our bundles, the
    // same as an error from a browser extension or the console.
    await page.evaluate(() =>
      setTimeout(() => {
        throw new Error('inline error, not from our scripts');
      }, 0),
    );
    await page.waitForTimeout(3_000);
    expect(sentryEvents(sent)).toEqual([]);
  });
});

test.describe('both tools', () => {
  test('cause no enforced CSP violations', async ({ page, context }) => {
    await lookLikeAVisitor(context);
    const sent = await recordRelays(context);
    await page.addInitScript(() => {
      (window as unknown as { __blocked: string[] }).__blocked = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        if (e.disposition === 'enforce') {
          (window as unknown as { __blocked: string[] }).__blocked.push(
            `${e.effectiveDirective} ${e.blockedURI}`,
          );
        }
      });
    });
    await page.goto('/#sentry-smoke-test');
    await expect.poll(() => postHogEvents(sent).length, { timeout: 15_000 }).toBeGreaterThan(0);
    await expect.poll(() => sentryEvents(sent).length, { timeout: 15_000 }).toBe(1);
    expect(
      await page.evaluate(() => (window as unknown as { __blocked: string[] }).__blocked),
    ).toEqual([]);
  });

  test('send nothing on any other host', async ({ page, context }) => {
    await lookLikeAVisitor(context);
    const sent = await recordRelays(context);
    const chunks: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('posthog-client')) chunks.push(r.url());
    });
    // Same build, same server, different hostname: the gate must hold.
    await page.goto('http://127.0.0.1:4323/#sentry-smoke-test');
    await page.waitForTimeout(5_000);
    expect(sent).toEqual([]);
    expect(chunks, 'the PostHog client should not even download').toEqual([]);
  });
});

/**
 * The relay targets live in vercel.json and the DSN lives in src/config.ts.
 * If one changes without the other, events go to the wrong project or get
 * rejected, and no test above would notice: they stub the relays.
 */
test.describe('relay wiring', () => {
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const config = readFileSync('src/config.ts', 'utf8');
  const dsn = new URL(config.match(/dsn: '([^']+)'/)![1]);
  const key = dsn.username;
  const projectId = dsn.pathname.slice(1);
  const rewrite = (source: string) =>
    vercel.rewrites.find((r: { source: string }) => r.source === source)?.destination;

  test('sends errors and CSP reports to the project the DSN names', () => {
    expect(rewrite('/relay/s')).toBe(`https://${dsn.host}/api/${projectId}/envelope/`);
    const reports = new URL(rewrite('/relay/c'));
    expect(reports.host).toBe(dsn.host);
    expect(reports.pathname).toBe(`/api/${projectId}/security/`);
    expect(reports.searchParams.get('sentry_key')).toBe(key);
  });

  test('sends PostHog events to the US region the project lives in', () => {
    expect(config).toContain("apiHost: '/relay/p'");
    // `(.*)`, not `*`: posthog-js posts to paths with a trailing slash
    // (`/e/`), and on Vercel `/relay/p/:path*` does not match those. The
    // PR #239 preview answered every event with the site's 404 page.
    expect(rewrite('/relay/p/:path(.*)')).toBe('https://us.i.posthog.com/:path');
  });

  test('reports enforced CSP violations, and not the Report-Only noise', () => {
    const headers = vercel.headers[0].headers as { key: string; value: string }[];
    const policy = (name: string) => headers.find((h) => h.key === name)!.value;
    expect(policy('Content-Security-Policy')).toContain('report-uri /relay/c');
    expect(policy('Content-Security-Policy-Report-Only')).not.toContain('report-uri');
  });
});
