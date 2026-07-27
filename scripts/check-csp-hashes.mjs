/**
 * Fails if the CSP script hashes in `vercel.json` no longer match the inline
 * scripts in the production build.
 *
 * `@vercel/analytics/astro` emits an inline <script type="module"> whose exact
 * bytes are baked into the build. The CSP allowlists it by sha256 hash, so any
 * change to that dependency silently invalidates the hash — and a blocked
 * analytics script fails quietly, with nothing user-visible to notice.
 *
 * This deliberately only DETECTS drift; it does not rewrite vercel.json. A bot
 * silently repairing a security policy means the policy changes without a human
 * ever reading the diff, which defeats the point of reviewing it. Loud failure
 * is the feature.
 *
 * Requires `npm run build` to have run first. Usage: node scripts/check-csp-hashes.mjs
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const DIST = 'dist';
const CSP_KEYS = ['Content-Security-Policy', 'Content-Security-Policy-Report-Only'];

async function htmlFiles(dir, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await htmlFiles(path, acc);
    else if (entry.name.endsWith('.html')) acc.push(path);
  }
  return acc;
}

/**
 * Executable inline scripts only. `application/ld+json` is a data block — the
 * browser never executes it, so CSP script-src does not apply.
 */
function inlineScripts(html) {
  const found = [];
  const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = re.exec(html))) {
    if (/type\s*=\s*["']application\/ld\+json["']/i.test(match[1])) continue;
    found.push(match[2]);
  }
  return found;
}

const sha256 = (body) => `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`;

try {
  await stat(DIST);
} catch {
  console.error(`No ${DIST}/ directory. Run \`npm run build\` first.`);
  process.exit(1);
}

const found = new Map(); // hash -> example file
for (const file of await htmlFiles(DIST)) {
  const html = await readFile(file, 'utf8');
  for (const body of inlineScripts(html)) {
    const hash = sha256(body);
    if (!found.has(hash)) found.set(hash, file);
  }
}

const config = JSON.parse(await readFile('vercel.json', 'utf8'));
const policies = (config.headers ?? [])
  .flatMap((rule) => rule.headers)
  .filter((header) => CSP_KEYS.includes(header.key));

const problems = [];

for (const [hash, example] of found) {
  for (const policy of policies) {
    if (!policy.value.includes(hash)) {
      problems.push(`  missing from ${policy.key}: ${hash}\n    (inline script in ${example})`);
    }
  }
}

// Hashes still allowlisted but no longer present in the build are dead grants.
for (const policy of policies) {
  for (const hash of policy.value.match(/'sha256-[A-Za-z0-9+/=]+'/g) ?? []) {
    const bare = hash.slice(1, -1);
    if (!found.has(bare)) {
      problems.push(
        `  stale entry in ${policy.key}: ${bare}\n    (no inline script in the build matches this)`,
      );
    }
  }
}

if (problems.length) {
  console.error('CSP script hashes are out of sync with the build:\n');
  console.error(problems.join('\n'));
  console.error(
    '\nA dependency that emits inline JavaScript most likely changed.\n' +
      'Update the hashes in vercel.json by hand, then re-run this check.\n' +
      'Do not simply delete the hash — that would allow the script only by\n' +
      "loosening script-src with 'unsafe-inline'.\n",
  );
  process.exit(1);
}

console.log(
  `CSP hashes in sync: ${found.size} inline script(s) allowlisted across ${policies.length} policies.`,
);
