/**
 * Serves the production build (`dist/`) with the response headers defined in
 * `vercel.json`, so security headers can be tested locally against the real
 * built output.
 *
 * `astro preview` serves dist/ but knows nothing about vercel.json, and
 * `vercel dev` applies vercel.json but runs the *dev* server underneath —
 * which injects Vite HMR, the Astro dev toolbar, and a differently-hashed
 * inline analytics script. Neither reflects production. This does.
 *
 * Usage: node scripts/serve-with-headers.mjs [port]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const PORT = Number(process.argv[2] ?? 4322);
const DIST = 'dist';

const config = JSON.parse(await readFile('vercel.json', 'utf8'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/** Headers from vercel.json whose `source` pattern matches this path. */
function headersFor(pathname) {
  const out = {};
  for (const rule of config.headers ?? []) {
    // vercel.json `source` is a path-to-regexp-ish pattern; the patterns used
    // here are simple enough to treat as regex anchored at both ends.
    let matches = false;
    try {
      matches = new RegExp(`^${rule.source}$`).test(pathname);
    } catch {
      matches = rule.source === pathname;
    }
    if (matches) for (const { key, value } of rule.headers) out[key] = value;
  }
  return out;
}

/** Resolve a URL path to a file inside dist/, following Astro's directory-index convention. */
async function resolveFile(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidates = extname(safe)
    ? [join(DIST, safe)]
    : [join(DIST, safe, 'index.html'), join(DIST, `${safe}.html`)];

  for (const c of candidates) {
    try {
      if ((await stat(c)).isFile()) return c;
    } catch {
      /* try next candidate */
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);
  const headers = headersFor(pathname);
  const file = (await resolveFile(pathname)) ?? (await resolveFile('/404'));

  if (!file) {
    res.writeHead(404, { ...headers, 'Content-Type': MIME['.html'] });
    res.end('<h1>404</h1>');
    return;
  }

  const body = await readFile(file);
  res.writeHead(file.endsWith('404.html') ? 404 : 200, {
    ...headers,
    'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
    'Content-Length': body.length,
  });
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`Serving ${DIST}/ with vercel.json headers at http://localhost:${PORT}`);
});
