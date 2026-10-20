/**
 * Parser for the Community Handbook's foundation/community-values.md. Kept in
 * its own file with no imports, so tests can load it without the build-time
 * fetch or the JSON snapshot. Used by src/lib/handbook.ts.
 *
 * Every `## ` heading in that file is read as a value, so the file must hold
 * only value headings below its intro.
 */

export interface HandbookValue {
  name: string;
  /** The first sentence under the value's heading. */
  line: string;
}

/** Strips the markdown a sentence may carry: links, bold, italics, code. */
function plain(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The first sentence of a paragraph: up to the first ". ", "! " or "? ". */
function firstSentence(paragraph: string): string {
  const match = /^.*?[.!?](?=\s|$)/.exec(paragraph);
  return (match ? match[0] : paragraph).trim();
}

/**
 * Parses community-values.md: each `## Name` heading is a value, and the
 * first sentence of the paragraph under it is its line. Returns null when the
 * file holds no value with both a name and a line, so the caller falls back.
 * Kept in step with scripts/refresh-handbook-values.mjs.
 */
export function parseValues(markdown: string): HandbookValue[] | null {
  const values: HandbookValue[] = [];
  const sections = markdown.split(/^## +/m).slice(1);
  for (const section of sections) {
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
  return values.length > 0 ? values : null;
}
