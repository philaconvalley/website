/**
 * Regenerates src/data/projects-snapshot.json — the last-known-good repo list
 * and "good first issue" counts that /projects falls back to when GitHub does
 * not answer during a build.
 *
 * Run it, review the diff, commit it:
 *
 *   npm run data:refresh
 *
 * Unlike the build-time fetch in src/lib/projects.ts, this script is ALLOWED to
 * fail. If GitHub is unreachable or returns zero repos, it exits non-zero and
 * leaves the existing file untouched.
 *
 * The repo filter mirrors isPublicOrgProject() in src/lib/community.ts. That
 * module is the authority; if the filter changes there, change it here too.
 * (Duplicated for the same reason as refresh-community-data.mjs: plain Node
 * cannot load .ts.)
 */
import { writeFile } from 'node:fs/promises';

const ORG = 'philaconvalley';
const OUT = 'src/data/projects-snapshot.json';
const headers = {
  Accept: 'application/vnd.github+json',
  'user-agent': 'philaconvalley-website-refresh',
};
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function getJson(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    console.error(`${url} returned HTTP ${response.status}. Snapshot left unchanged.`);
    process.exit(1);
  }
  return response.json();
}

const isPublicOrgProject = (r) =>
  typeof r?.name === 'string' && !r.name.startsWith('.') && !r.archived && !r.fork;

const repos = (await getJson(`https://api.github.com/orgs/${ORG}/repos?type=public&per_page=100`))
  .filter(isPublicOrgProject)
  .map((r) => ({
    name: r.name,
    description: r.description ?? null,
    url: r.html_url,
    language: r.language ?? null,
    pushedAt: r.pushed_at ?? '',
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

if (repos.length === 0) {
  console.error('GitHub returned zero public repos. Snapshot left unchanged.');
  process.exit(1);
}

const query = encodeURIComponent(`org:${ORG} label:"good first issue" is:issue is:open`);
const { items = [] } = await getJson(
  `https://api.github.com/search/issues?q=${query}&per_page=100`,
);
const goodFirstIssues = {};
for (const item of items) {
  const name = String(item.repository_url ?? '')
    .split('/')
    .pop();
  if (repos.some((r) => r.name === name)) goodFirstIssues[name] = (goodFirstIssues[name] ?? 0) + 1;
}

const snapshot = {
  _comment:
    'Last-known-good public repos and "good first issue" counts for /projects. Used ONLY when GitHub fails to answer during a build. Regenerate with `npm run data:refresh` and commit the diff.',
  _generated: new Date().toISOString().slice(0, 10),
  repos,
  goodFirstIssues,
};
await writeFile(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(
  `Wrote ${repos.length} repos to ${OUT}. Good first issues: ${JSON.stringify(goodFirstIssues)}`,
);
