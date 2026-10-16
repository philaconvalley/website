/**
 * Regenerates src/data/handbook-values-snapshot.json — the last-known-good
 * community values the About page falls back to when GitHub does not answer
 * during a build.
 *
 * Run it, review the diff, commit it:
 *
 *   npm run data:refresh
 *
 * Unlike the build-time fetch in src/lib/handbook.ts, this script is ALLOWED to
 * fail. If the handbook is unreachable or parses to zero values, it exits
 * non-zero and leaves the existing file untouched.
 *
 * The parsing mirrors parseValues() in src/lib/parse-handbook-values.ts. That
 * module is the authority; if the parsing changes there, change it here too.
 * (Duplicated for the same reason as refresh-community-data.mjs: plain Node
 * cannot load .ts.)
 */
import { writeFile } from 'node:fs/promises';

const URL_RAW =
  'https://raw.githubusercontent.com/philaconvalley/community-handbook/main/foundation/community-values.md';
const OUT = 'src/data/handbook-values-snapshot.json';

const plain = (text) =>
  text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const firstSentence = (paragraph) => {
  const match = /^.*?[.!?](?=\s|$)/.exec(paragraph);
  return (match ? match[0] : paragraph).trim();
};

function parseValues(markdown) {
  const values = [];
  for (const section of markdown.split(/^## +/m).slice(1)) {
    const [heading, ...rest] = section.split('\n');
    const paragraph = rest
      .join('\n')
      .split(/\n\s*\n|^---$/m)
      .map((block) => block.trim())
      .find((block) => block.length > 0 && !block.startsWith('>'));
    const name = plain(heading ?? '');
    const line = paragraph ? plain(firstSentence(plain(paragraph))) : '';
    if (name && line) values.push({ name, line });
  }
  return values;
}

const response = await fetch(URL_RAW, {
  signal: AbortSignal.timeout(15000),
  headers: { 'user-agent': 'philaconvalley-website-refresh' },
});
if (!response.ok) {
  console.error(`Handbook values returned HTTP ${response.status}. Snapshot left unchanged.`);
  process.exit(1);
}
const values = parseValues(await response.text());
if (values.length === 0) {
  console.error('Handbook values parsed to zero values. Snapshot left unchanged.');
  process.exit(1);
}

const snapshot = {
  _comment:
    'Last-known-good community values from the Community Handbook (foundation/community-values.md). Used ONLY when GitHub fails to answer during a build. Regenerate with `npm run data:refresh` and commit the diff.',
  _generated: new Date().toISOString().slice(0, 10),
  values,
};
await writeFile(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${values.length} values to ${OUT}: ${values.map((v) => v.name).join(', ')}`);
