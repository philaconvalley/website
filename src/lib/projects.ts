/**
 * Build-time project list for /projects: the public repos in the GitHub org,
 * and how many open "good first issue" issues each one has.
 *
 * The same two rules as src/lib/community.ts apply:
 *
 * 1. GitHub must never block a deploy. One request each, a short timeout, no
 *    retry.
 * 2. When a request fails, the page uses the last-known-good copy at
 *    src/data/projects-snapshot.json and warns. Refresh it with
 *    `npm run data:refresh`. The page never says "coming soon" while nine
 *    projects exist.
 *
 * The repo filter is isPublicOrgProject(), shared with Home's "things shipped"
 * count, so the two pages count the same repos.
 */

import snapshotJson from '../data/projects-snapshot.json';
import { projectCopy } from '../data/projects';
import { isPublicOrgProject } from './community';

const FETCH_TIMEOUT_MS = 10_000;
const ORG = 'philaconvalley';
const LABEL = 'good first issue';

export interface RepoRecord {
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  pushedAt: string;
}

export interface Project {
  name: string;
  url: string;
  title: string;
  blurb: string;
  tags: string[];
  goodFirstIssues: number;
}

interface Snapshot {
  repos: RepoRecord[];
  goodFirstIssues: Record<string, number>;
}

const snapshot = snapshotJson as Snapshot;

async function getJson(url: string, label: string): Promise<unknown> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'user-agent': 'philaconvalley-website-build',
    };
    if (import.meta.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${import.meta.env.GITHUB_TOKEN}`;
    }
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) {
      console.warn(`[projects] ${label} returned HTTP ${response.status} — using snapshot.`);
      return null;
    }
    return await response.json();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[projects] ${label} unreachable (${reason}) — using snapshot.`);
    return null;
  }
}

/** Public org repos, or null. `type=public` keeps private client work out even
 *  when a GITHUB_TOKEN is set, which would otherwise return private repos too. */
async function fetchRepos(): Promise<RepoRecord[] | null> {
  const body = await getJson(
    `https://api.github.com/orgs/${ORG}/repos?type=public&per_page=100`,
    'GitHub org repos',
  );
  if (!Array.isArray(body)) return null;
  const repos = body.filter(isPublicOrgProject).map((repo) => {
    const r = repo as Record<string, unknown>;
    return {
      name: String(r.name),
      description: typeof r.description === 'string' ? r.description : null,
      url: typeof r.html_url === 'string' ? r.html_url : `https://github.com/${ORG}/${r.name}`,
      language: typeof r.language === 'string' ? r.language : null,
      pushedAt: typeof r.pushed_at === 'string' ? r.pushed_at : '',
    };
  });
  if (repos.length === 0) {
    console.warn('[projects] GitHub returned zero public repos — using snapshot.');
    return null;
  }
  return repos;
}

/** Open "good first issue" issues per repo, from one search call, or null. */
async function fetchGoodFirstIssues(): Promise<Record<string, number> | null> {
  const query = encodeURIComponent(`org:${ORG} label:"${LABEL}" is:issue is:open`);
  const body = await getJson(
    `https://api.github.com/search/issues?q=${query}&per_page=100`,
    'GitHub issue search',
  );
  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items)) return null;
  const counts: Record<string, number> = {};
  for (const item of items) {
    const repoUrl = (item as { repository_url?: unknown }).repository_url;
    if (typeof repoUrl !== 'string') continue;
    const name = repoUrl.split('/').pop() ?? '';
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

/** Repos ready for a newcomer come first, then the most recently pushed. */
export function toProjects(repos: RepoRecord[], issues: Record<string, number>): Project[] {
  return repos
    .map((repo) => {
      const copy = projectCopy[repo.name];
      return {
        name: repo.name,
        url: repo.url,
        title: copy?.title ?? repo.name,
        blurb: copy?.blurb ?? repo.description ?? 'A community project. See it on GitHub.',
        tags: copy?.tags ?? (repo.language ? [repo.language] : []),
        goodFirstIssues: issues[repo.name] ?? 0,
        pushedAt: repo.pushedAt,
      };
    })
    .sort((a, b) => b.goodFirstIssues - a.goodFirstIssues || b.pushedAt.localeCompare(a.pushedAt))
    .map(({ pushedAt: _pushedAt, ...project }) => project);
}

let inflight: Promise<Project[]> | null = null;

/** Every public org project, memoised for the build. */
export function getProjects(): Promise<Project[]> {
  inflight ??= Promise.all([fetchRepos(), fetchGoodFirstIssues()]).then(([repos, issues]) =>
    toProjects(repos ?? snapshot.repos, issues ?? snapshot.goodFirstIssues),
  );
  return inflight;
}
