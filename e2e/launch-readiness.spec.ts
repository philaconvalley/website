import { test, expect } from '@playwright/test';

/**
 * Smoke tests for the four fixes shipped before Founders Alley (10/20/2026):
 * placeholder content out of the build, an honest contact form, a canonical
 * host that answers 200, and a homepage description of its own.
 */

const CANONICAL_HOST = 'https://www.philaconvalley.com';

test.describe('placeholder content', () => {
  // The files stay in the repo as `_example-*.md` templates. The content
  // loaders skip names that start with `_`, so they never become pages.
  //
  // Two right answers, depending on the server. `astro preview` ignores
  // vercel.json, so the page is a plain 404. Vercel applies the redirect in
  // vercel.json, so the browser lands on the index page. Either proves the
  // placeholder is gone; the placeholder page itself answering 200 is the fail.
  const retired = [
    { path: '/projects/example-project', index: '/projects' },
    { path: '/resources/example-resource', index: '/resources' },
  ];
  for (const { path, index } of retired) {
    test(`${path} is not published`, async ({ page }) => {
      const response = await page.goto(path);
      const landed = new URL(page.url()).pathname.replace(/\/$/, '');

      if (response?.status() === 404) return;
      expect(landed, `${path} should 404 or redirect to ${index}`).toBe(index);
      expect(response?.status()).toBe(200);
    });
  }

  test('the sitemap and RSS feed list no placeholder', async ({ request }) => {
    const index = await (await request.get('/sitemap-index.xml')).text();
    const sitemapUrls = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(sitemapUrls.length).toBeGreaterThan(0);
    for (const url of sitemapUrls) {
      const body = await (await request.get(new URL(url).pathname)).text();
      expect(body).not.toContain('example-');
    }

    const rss = await (await request.get('/rss.xml')).text();
    expect(rss).not.toContain('example-');
  });
});

test.describe('contact form', () => {
  const fill = async (page: import('@playwright/test').Page) => {
    await page.goto('/contact');
    await page.getByLabel('Name *').fill('Smoke Test');
    await page.getByLabel('Email *').fill('smoke@example.com');
    await page.getByLabel('Message *').fill('Hello from Playwright.');
  };

  test('shows an error, and keeps the text, when Formspree rejects it', async ({ page }) => {
    await page.route('https://formspree.io/**', (route) =>
      route.fulfill({ status: 422, contentType: 'application/json', body: '{"error":"x"}' }),
    );
    await fill(page);
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByRole('alert')).toContainText('did not send');
    await expect(page.getByText('Message sent!')).toBeHidden();
    await expect(page.getByLabel('Message *')).toHaveValue('Hello from Playwright.');
  });

  test('shows an error when the network fails', async ({ page }) => {
    await page.route('https://formspree.io/**', (route) => route.abort());
    await fill(page);
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('alert')).toContainText('did not send');
  });

  test('gives up after 15 seconds when Formspree never answers', async ({ page }) => {
    // The route never fulfills, like a server that accepts the connection and
    // hangs. The fake clock lets the test skip the 15 real seconds.
    await page.clock.install();
    await page.route('https://formspree.io/**', () => {});
    await fill(page);
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('button', { name: 'Sending...' })).toBeDisabled();

    await page.clock.runFor(14_000);
    await expect(page.getByRole('alert')).toBeHidden();

    await page.clock.runFor(1_000);
    await expect(page.getByRole('alert')).toContainText('did not send');
    await expect(page.getByRole('button', { name: 'Send message' })).toBeEnabled();
  });

  test('sends the spam trap empty and lets browsers autofill', async ({ page }) => {
    let posted = '';
    await page.route('https://formspree.io/**', (route) => {
      posted = route.request().postData() ?? '';
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await fill(page);

    const trap = page.locator('input[name="_gotcha"]');
    await expect(trap).toBeHidden();
    await expect(trap).toHaveAttribute('tabindex', '-1');
    await expect(page.getByLabel('Name *')).toHaveAttribute('autocomplete', 'name');
    await expect(page.getByLabel('Email *')).toHaveAttribute('autocomplete', 'email');

    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText('Message sent!')).toBeVisible();
    // Multipart body: the field must be present, and its value empty.
    expect(posted).toMatch(/name="_gotcha"\r\n\r\n\r\n/);
  });

  test('disables the button while sending, then confirms', async ({ page }) => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route('https://formspree.io/**', async (route) => {
      await held;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await fill(page);
    await page.getByRole('button', { name: 'Send message' }).click();

    const sending = page.getByRole('button', { name: 'Sending...' });
    await expect(sending).toBeDisabled();
    release();

    await expect(page.getByText('Message sent!')).toBeVisible();
    await expect(page.getByRole('alert')).toBeHidden();
  });
});

test.describe('canonical host', () => {
  for (const path of ['/', '/about', '/events']) {
    test(`${path} names the www host`, async ({ page }) => {
      await page.goto(path);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical?.startsWith(`${CANONICAL_HOST}/`)).toBe(true);
    });
  }

  test('robots.txt points at the www sitemap', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain(`Sitemap: ${CANONICAL_HOST}/sitemap-index.xml`);
  });
});

test('homepage description matches the hero tagline', async ({ page }) => {
  await page.goto('/');
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  const tagline = (await page.getByTestId('hero-tagline').innerText()).replace(/\s+/g, ' ').trim();
  expect(description).toBe(tagline);
});
