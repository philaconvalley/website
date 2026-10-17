#!/usr/bin/env node
/**
 * Works out the real fix path for each package in a set of Dependabot alerts.
 *
 * Why this exists: dependency-rollup.sh used to decide the fix path from two
 * facts only — is the package in package.json, and does the advisory name a
 * patched version. On 2026-10-12 that got two of three rows wrong:
 *
 * - postcss-selector-parser said "npm update", but tailwindcss 3 requires ^6
 *   and @tailwindcss/typography pins 6.0.10, while the fix is 7.1.6. npm update
 *   cannot cross a parent's range, so the command did nothing.
 * - http-cache-semantics said "blocked upstream" because the advisory left its
 *   patched-version field empty. 4.3.0 was already on the registry, outside the
 *   vulnerable range, and inside astro's ^4.2.0.
 *
 * So this reads the two sources that actually decide it: the npm registry (is
 * any released version outside the vulnerable range?) and package-lock.json
 * (does every parent's declared range allow a safe version?).
 *
 * Usage:
 *   node dependency-fix-paths.mjs <alerts.json>
 *   LOCKFILE_PATH=... MANIFEST_PATH=... node dependency-fix-paths.mjs <alerts.json>
 *
 * Prints one JSON object keyed by package name:
 *   { "pkg": { "path": "fixed" | "pr" | "update" | "override" | "blocked",
 *              "fix": "1.2.3" | null,
 *              "pinnedBy": ["parent@1.0.0 (^0.9.0)"],
 *              "vulnerableInstalled": 2 } }
 */
import { readFileSync } from 'node:fs';
import semver from 'semver';

const alertsPath = process.argv[2];
if (!alertsPath) {
  console.error('usage: dependency-fix-paths.mjs <alerts.json>');
  process.exit(2);
}

const alerts = JSON.parse(readFileSync(alertsPath, 'utf8'));
const manifest = JSON.parse(readFileSync(process.env.MANIFEST_PATH ?? 'package.json', 'utf8'));
const lock = JSON.parse(readFileSync(process.env.LOCKFILE_PATH ?? 'package-lock.json', 'utf8'));

const direct = new Set([
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.devDependencies ?? {}),
]);

// GitHub writes ranges as "< 7.1.6" or ">= 1.0.0, < 2.0.0"; semver wants
// "<7.1.6" and ">=1.0.0 <2.0.0". A bare "= 1.2.3" is an exact match.
function toSemverRange(ghRange) {
  const range = ghRange
    .split(',')
    .map((part) => part.replace(/\s+/g, '').replace(/^=(?=\d)/, ''))
    .join(' ');
  if (!semver.validRange(range, { loose: true })) {
    throw new Error(`Cannot parse advisory range "${ghRange}"`);
  }
  return range;
}

// Lockfile keys look like "node_modules/a/node_modules/@scope/b"; the package
// name is whatever follows the last "node_modules/".
function nameFromKey(key) {
  return key.slice(key.lastIndexOf('node_modules/') + 'node_modules/'.length);
}

// The name comes from the GitHub API, so encode all of it rather than trusting
// it to be a well-formed npm name. The registry wants a scoped name's leading
// "@" literal and its "/" encoded: "@scope%2Fname".
async function registryVersions(pkg) {
  const res = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(pkg).replace(/^%40/, '@')}`,
    {
      headers: { accept: 'application/vnd.npm.install-v1+json' },
    },
  );
  if (!res.ok) throw new Error(`npm registry returned ${res.status} for ${pkg}`);
  const doc = await res.json();
  // Prereleases are not a fix anyone should be told to install.
  return Object.keys(doc.versions).filter((v) => semver.valid(v) && !semver.prerelease(v));
}

const lockEntries = Object.entries(lock.packages ?? {}).filter(([key]) => key !== '');

const byPackage = Map.groupBy(alerts, (a) => a.dependency.package.name);
const result = {};

for (const [pkg, pkgAlerts] of byPackage) {
  const ranges = pkgAlerts.map((a) =>
    toSemverRange(a.security_vulnerability.vulnerable_version_range),
  );
  const isVulnerable = (v) => ranges.some((r) => semver.satisfies(v, r, { loose: true }));

  const installed = lockEntries
    .filter(([key]) => nameFromKey(key) === pkg)
    .map(([, entry]) => entry.version)
    .filter(Boolean);
  const vulnerableInstalled = installed.filter(isVulnerable);

  const safe = (await registryVersions(pkg)).filter((v) => !isVulnerable(v)).sort(semver.compare);
  // The fix is the lowest safe release above everything vulnerable we have
  // installed — not just any safe version, since an older unaffected line is
  // a downgrade nobody should be told to make.
  const floor = vulnerableInstalled.length
    ? vulnerableInstalled.reduce((a, b) => (semver.gt(a, b) ? a : b))
    : null;
  const fix = floor ? (safe.find((v) => semver.gt(v, floor)) ?? null) : (safe.at(-1) ?? null);

  // A parent pins the package when no safe version satisfies its declared range.
  // Only `dependencies` and `optionalDependencies` install anything; peers do not.
  const pinnedBy = [];
  for (const [key, entry] of lockEntries) {
    const spec = entry.dependencies?.[pkg] ?? entry.optionalDependencies?.[pkg];
    if (!spec || !semver.validRange(spec, { loose: true })) continue;
    if (!semver.maxSatisfying(safe, spec, { loose: true })) {
      pinnedBy.push(`${nameFromKey(key)}@${entry.version} (${spec})`);
    }
  }

  // "fixed" covers the gap between a merge that clears the lockfile and
  // Dependabot's rescan closing the alert, so the issue never tells someone to
  // redo work that is already on main.
  let path;
  if (installed.length && !vulnerableInstalled.length) path = 'fixed';
  else if (!fix) path = 'blocked';
  else if (direct.has(pkg)) path = 'pr';
  else if (pinnedBy.length) path = 'override';
  else path = 'update';

  result[pkg] = {
    path,
    fix,
    pinnedBy: [...new Set(pinnedBy)].sort(),
    vulnerableInstalled: vulnerableInstalled.length,
  };
}

process.stdout.write(`${JSON.stringify(result)}\n`);
