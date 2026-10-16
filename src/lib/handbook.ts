/**
 * Build-time community values, read from the Community Handbook.
 *
 * The handbook is the one source of truth for the values (Waskar, 10/16/2026).
 * It is public, it sits beside the community guidelines and the code of
 * conduct, and anyone can suggest a change to it. The website never keeps a
 * list of its own: About shows every value the handbook holds, in its order.
 *
 * The same two rules as src/lib/community.ts apply:
 *
 * 1. GitHub must never block a deploy. One request, a short timeout, no retry.
 * 2. When the fetch fails, or the file no longer parses, the page uses the
 *    last-known-good copy at src/data/handbook-values-snapshot.json and warns.
 *    Refresh it with `npm run data:refresh`.
 *
 * The site is static, so a handbook change shows up on the next deploy.
 */

import snapshotJson from '../data/handbook-values-snapshot.json';
import { links } from '../config';
import { parseValues, type HandbookValue } from './parse-handbook-values';

export type { HandbookValue };

const FETCH_TIMEOUT_MS = 5000;

async function fetchValues(): Promise<HandbookValue[] | null> {
  try {
    const response = await fetch(links.handbook.valuesRaw, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'user-agent': 'philaconvalley-website-build' },
    });
    if (!response.ok) {
      console.warn(`[handbook] values returned HTTP ${response.status} — using snapshot.`);
      return null;
    }
    const values = parseValues(await response.text());
    if (!values) console.warn('[handbook] values file parsed to zero values — using snapshot.');
    return values;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[handbook] values unreachable (${reason}) — using snapshot.`);
    return null;
  }
}

const snapshot: HandbookValue[] = snapshotJson.values;

let inflight: Promise<HandbookValue[]> | null = null;

/** Every handbook value, in handbook order. Memoised for the build. */
export function getHandbookValues(): Promise<HandbookValue[]> {
  inflight ??= fetchValues().then((values) => values ?? snapshot);
  return inflight;
}
