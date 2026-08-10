#!/usr/bin/env node
/**
 * Mechanical enforcement for two rules in DESIGN.md that drifted twice each
 * before anyone noticed, both times caught by a human reading carefully.
 *
 *   1. Prose budget by mode  (DESIGN.md, "The evidence contract", rule 2)
 *   2. Sentence case on UI labels  (docs/writing-guide.md)
 *
 * Both are checked against the BUILT pages, not the source, for the reason
 * DESIGN.md gives: components expand, and data-driven labels never appear as
 * literals in any .astro file. A source-level grep missed nine labels on the
 * first sweep and four more on the second — every one of them was generated
 * or sat alone inside a multiline slot. The built HTML has no such hiding
 * places.
 *
 * Run: npm run check:design   (requires `npm run build` first)
 *
 * This is a linter, not a judge. When it is wrong, fix the allowlist below and
 * say why in the commit — do not silence the whole rule.
 */

import { readFileSync, existsSync } from 'node:fs';

/** Budgets from DESIGN.md's mode table. Page key -> [mode, limit]. */
const BUDGETS = {
  '': ['Persuade', 250], // home
  about: ['Read', 550],
  join: ['Persuade', 250],
  support: ['Persuade', 250],
  events: ['Operate', 200],
  projects: ['Operate', 200],
  resources: ['Operate', 200],
  contact: ['Operate', 200],
  arcade: ['Operate', 200],
};

/** DESIGN.md rule 2: a rung-1 object's interior is capped separately. */
const OPERABLE_CAP = 120;

/**
 * Proper nouns that are legitimately capitalised mid-label.
 *
 * Anything here is a name someone else owns — a place, a product, a series, a
 * person. Adding a phrase because it is "a heading we like capitalised" is
 * exactly the drift this file exists to stop.
 */
const PROPER_NOUNS = [
  'PhilaCon Valley',
  'Open Collective',
  'Pennovation Center',
  'Pennovation Works',
  'Pennovation',
  'Braid Mill',
  'Silicon Valley',
  'Resilient Coders',
  'Demo Day',
  'Philadelphia',
  'Philly',
  'GitHub',
  'Slack',
  'Discord',
  'Luma',
  'Google Fonts',
  'Code of Conduct',
  'Shopping Debate',
  'Community Handbook',
  'Tap in NFC Lab',
  'NFC',
  'PATCH',
  'Lab',
  'Labs',
  'Arcade',
];

/** Words that may be capitalised anywhere without making a label title case. */
const ALWAYS_OK = new Set(['I', "I'm", "I'd", 'A', 'An', 'The']);

const strip = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
const words = (text) => text.split(/\s+/).filter(Boolean).length;

function mainOf(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return m ? m[1] : null;
}

/** Pulls out every subtree matching an opening tag that carries `attr`. */
function extractMarked(html, attr) {
  const found = [];
  let rest = html;
  const open = new RegExp(`<(\\w+)[^>]*\\b${attr}\\b[^>]*>`, 'i');
  for (;;) {
    const m = rest.match(open);
    if (!m) break;
    const tag = m[1];
    const start = m.index;
    // Walk nested same-name tags so we close on the right one.
    const scan = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, 'gi');
    scan.lastIndex = start;
    let depth = 0;
    let end = -1;
    for (let t; (t = scan.exec(rest));) {
      depth += t[0].startsWith('</') ? -1 : 1;
      if (depth === 0) {
        end = t.index + t[0].length;
        break;
      }
    }
    if (end === -1) break;
    found.push(rest.slice(start, end));
    rest = rest.slice(0, start) + ' ' + rest.slice(end);
  }
  return { without: rest, found };
}

function measure(html) {
  const main = mainOf(html);
  if (!main) return null;

  // Rung-1 operable objects: counted separately, capped separately. Commands
  // inside the object are subtracted too — rule 2 exempts `<pre>` wherever it
  // sits, and an object made of terminal commands is the case it was written
  // for. Without this the walkthrough reads 145 instead of its real 117.
  const { without: noObjects, found: objects } = extractMarked(main, 'data-operable');
  const objectWords = objects.reduce(
    (n, o) => n + words(strip(o.replace(/<pre[\s\S]*?<\/pre>/gi, ' '))),
    0,
  );

  // Commands are artifacts, not sentences.
  const codeless = noObjects.replace(/<pre[\s\S]*?<\/pre>/gi, ' ');
  const codeWords = words(strip(noObjects)) - words(strip(codeless));

  const body = codeless.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  return { prose: words(strip(body)), objectWords, codeWords };
}

/** True when a label reads as Title Case rather than sentence case. */
function isTitleCase(label) {
  let text = label.trim();
  if (!text || text.length > 90) return false;
  for (const noun of PROPER_NOUNS) text = text.split(noun).join(' ');
  const tokens = text.split(/[\s—–/·:,.!?()]+/).filter(Boolean);

  let capsInARow = 0;
  for (const [i, token] of tokens.entries()) {
    const capitalised = /^[A-Z][a-z]+$/.test(token);
    if (i === 0 || ALWAYS_OK.has(token) || !capitalised) {
      capsInARow = capitalised && i > 0 && !ALWAYS_OK.has(token) ? 1 : 0;
      continue;
    }
    capsInARow += 1;
    if (capsInARow >= 2) return true;
  }
  return false;
}

function labelsIn(html) {
  const main = mainOf(html) ?? html;
  const out = [];
  const patterns = [
    /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi,
    /<button[^>]*>([\s\S]*?)<\/button>/gi,
    /<a[^>]*class="[^"]*\bbtn\b[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
  ];
  for (const re of patterns) {
    for (let m; (m = re.exec(main));) {
      const text = strip(m[1]).replace(/\s+/g, ' ').trim();
      if (text) out.push(text);
    }
  }
  return out;
}

const failures = [];
const rows = [];

for (const [page, [mode, limit]] of Object.entries(BUDGETS)) {
  const file = page ? `dist/${page}/index.html` : 'dist/index.html';
  if (!existsSync(file)) {
    failures.push(`${file} is missing — run \`npm run build\` first.`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const m = measure(html);
  if (!m) {
    failures.push(`${file} has no <main> landmark.`);
    continue;
  }

  rows.push({ page: page || 'home', mode, limit, ...m });

  if (m.prose > limit) {
    failures.push(
      `/${page} is ${m.prose} body words against a ${mode} budget of ${limit}. ` +
        `Cut ${m.prose - limit}, or show the thing instead of describing it.`,
    );
  }
  if (m.objectWords > OPERABLE_CAP) {
    failures.push(
      `/${page} has ${m.objectWords} words inside its operable object, over the ${OPERABLE_CAP} cap. ` +
        `The object is proof, not an essay in disguise.`,
    );
  }

  for (const label of labelsIn(html)) {
    if (isTitleCase(label)) {
      failures.push(
        `/${page} label is Title Case: "${label}" — sentence case, per the writing guide.`,
      );
    }
  }
}

const pad = (s, n) => String(s).padEnd(n);
console.log(
  `${pad('page', 12)}${pad('mode', 10)}${pad('prose', 8)}${pad('budget', 8)}object  code`,
);
for (const r of rows) {
  console.log(
    pad(r.page, 12) +
      pad(r.mode, 10) +
      pad(r.prose, 8) +
      pad(r.limit, 8) +
      pad(r.objectWords || '-', 8) +
      (r.codeWords || '-'),
  );
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} design-contract violation(s):\n`);
  for (const f of failures) console.error(`  · ${f}`);
  console.error('\nRules: DESIGN.md "The evidence contract" · docs/writing-guide.md\n');
  process.exit(1);
}

console.log('\n✓ Prose budgets and sentence case hold.');
