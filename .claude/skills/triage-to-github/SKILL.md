---
name: triage-to-github
description: >-
  Acts as a technical lead triaging an incoming signal (a code review finding,
  a bug report, a feature idea, a screenshot, a Slack/pasted message, or an
  already-filed raw GitHub issue) into a well-formed GitHub issue for the
  philaconvalley/website repo: a clear title, a structured body, the right
  existing labels (bug/enhancement/documentation/accessibility/design/content/
  dependencies/ci plus a beginner/intermediate/advanced difficulty tag and
  good first issue/help wanted where relevant), and alignment with the repo's
  issue templates. Use this when the user says things like "make this a
  GitHub issue", "file an issue for this", "turn these review findings into
  issues", or pastes a bug/feature/finding and wants it filed to GitHub.
  Always drafts and shows the full issue (or batch of issues) for
  confirmation before creating it via `gh issue create` — unless the user has
  already pasted fully-specified content and explicitly asked for issues to
  be created from it, in which case the draft step is the request itself.
  Scoped to the PhilaCon Valley website open-source repo (community
  contributor labels, no client/points model) — for Linear ticket work on
  agency client engagements, use `triage-to-linear` instead.
---

# Triage to GitHub (PhilaCon Valley Website)

## Overview

This skill turns any incoming signal about the `philaconvalley/website` repo —
a multi-agent/code review finding, a bug someone reports, a feature idea, a
screenshot, or a raw item someone wants cleaned up — into a GitHub issue that
matches how this repo actually files issues: a plain descriptive title (no
bracket prefixes in practice, even though the templates suggest them), a
structured body, and labels drawn from the existing taxonomy so community
contributors can filter by difficulty and topic.

**This skill wears two hats at once, not one after the other: technical lead
and community leader.** PhilaCon Valley's mission is building a community of
developers, not just shipping a website — every issue filed here is also a
potential first contribution, a teaching moment, or a signal to the community
about what the org actually values. That means two things the purely-technical
version of this skill would skip:

1. **Bias toward more onboarding surface, not less.** Don't default a finding
   to `intermediate` just because the tool/agent that surfaced it was
   reasoning at a code-review level. Ask: could a newcomer do this _with a
   good Context section_? If yes, it's `beginner`/`good first issue` — under-
   labeling difficulty quietly gatekeeps the community you're trying to grow.
2. **Every issue says why it matters to the community, not just to the
   codebase.** A missing RSS redirect isn't just "a bug" — it's a community
   member's writing failing to reach readers. Say that. It's the difference
   between a ticket queue and an invitation.

It runs as a **draft-then-confirm** pipeline by default. Filing a GitHub issue
is outward-facing — visible to contributors, sometimes cross-linked from PRs —
so don't skip confirmation. The one exception: if the user has already pasted
complete, specific content (e.g. "make these N findings into issues" with the
findings spelled out), that message already **is** the confirmed draft — show
the created issues afterward rather than re-drafting and re-asking.

## When to use

Trigger on any of:

- "Turn this into a GitHub issue" / "file an issue" / "make these issues"
- "Turn these review findings into issues" (code review, security review,
  multi-agent review output)
- A pasted bug report, feature idea, or screenshot of a defect
- "Clean up / re-triage this GitHub issue" (existing-issue path)

If the user only wants analysis and not a filed issue, do that first; offer to
file an issue at the end.

## The triage pipeline

```
1. INGEST     Detect the source, extract the signal
2. CLASSIFY   Bug vs enhancement vs documentation vs content vs chore
3. DEDUPE     Search existing issues for a match        → gh issue list --search
4. LABEL      Pick from the established taxonomy         → references/label-taxonomy.md
5. NAME       Plain, specific, descriptive title
6. DESCRIBE   Fill the body template for the issue type  → references/body-templates.md
7. CONFIRM    Show the full draft; on approval, write
```

### Step 1 — Ingest

Identify the source and extract the signal: what's broken/missing, where
(file:line if known), why it matters, and any suggested fix already surfaced
by the source (e.g. a code review already proposed one — reuse it, don't
re-derive it).

### Step 2 — Classify

Decide the issue type, which drives both the label and the body shape:

- **bug** — something is broken today (a real defect with observable wrong
  behavior)
- **enhancement** — something works but could be better, or a net-new
  capability
- **documentation** — docs are missing, wrong, or drifted from the code
- **content** — a project/resource/blog submission (see the repo's own
  `content_submission.md` / `blog_submission.md` templates for that path
  specifically — this skill is for engineering-side findings, not community
  content submissions)
- **chore** — dependency bump, CI change, cleanup with no user-facing effect

Also estimate a **difficulty** tag for community contributors —
`beginner` / `intermediate` / `advanced` — based on how much of the codebase
and how many concepts a contributor needs to understand to fix it, not on how
severe the bug is. A one-line CSS fix is `beginner` even if it's visually
annoying; a build-time/SSG data-flow bug is `intermediate` or `advanced` even
if the fix ends up small.

**Default to asking "could a Context section make this beginner-approachable?"
before settling for `intermediate`.** A fix that's mechanically small — swap
an import, add one HTML attribute, extract markup you can point at an existing
example of — is `beginner`/`good first issue` even if _understanding why_
requires explaining a concept (build-time vs. browser execution, what SRI is,
component extraction), as long as that explanation fits in a short `## Context`
section. Reserve `intermediate`/`advanced` for issues that genuinely require
either judgment calls with no clear right answer, or touching several
unfamiliar systems at once. Undercounting `beginner` issues isn't neutral —
it's fewer doors open to whoever is looking at this repo for their first PR.

### Step 3 — Dedupe (search first)

Before drafting a new issue, search for an existing one:

```
gh issue list --repo philaconvalley/website --search "<keywords>" --state all
```

**Existing-issue path:** if the source IS already a GitHub issue, don't create
a duplicate — update it in place with `gh issue edit`, and re-read it first
with `gh issue view` so the edit is additive, not a blind overwrite.

### Step 4 — Label

Pick labels from the repo's real taxonomy — see
[`references/label-taxonomy.md`](references/label-taxonomy.md). Always include
exactly one type label (`bug`/`enhancement`/`documentation`/`content`) plus
exactly one difficulty label (`beginner`/`intermediate`/`advanced`). Add
`good first issue` when the difficulty is `beginner` and the fix is genuinely
self-contained. Add topic labels (`accessibility`, `design`, `dependencies`,
`ci`) when they apply. **Never invent a new label** (e.g. a `security` label
doesn't currently exist) — if the taxonomy doesn't have a good fit, say so and
ask before creating one, rather than silently adding it.

### Step 5 — Name

Write a plain, specific, imperative-or-descriptive title — no `[BUG]`/
`[FEATURE]` bracket prefix, even though the issue templates suggest one.
Check recent real issues (`gh issue list --repo philaconvalley/website`) if
unsure of house style; the actual convention in this repo is a bare
descriptive sentence, e.g. "Contact form needs a pending state and a real
error UI (not alert())" — not a vague "Fix bug" or "Update contact.astro".

### Step 6 — Describe

Fill the body using the shape in
[`references/body-templates.md`](references/body-templates.md): `Description`,
then either `Expected Behavior`/`Actual Behavior` (bugs) or `Suggested Fix`
(enhancements/docs/chores), a `## Why this matters` line, a `Found via` line
crediting the source, and the community-invite footer. **The last three are
required on every issue regardless of difficulty** — see below.

**If the issue is tagged `beginner` or `good first issue`, this is also not
optional:** add the `## Context` section described in
[`references/body-templates.md`](references/body-templates.md) — a plain-
language explanation of the underlying concept, which files to read first, and
what "done" looks like. Those labels are a promise to a reader with zero prior
exposure to the codebase; a technically-correct-but-unexplained body breaks
that promise. Skip this section for `intermediate`/`advanced` issues, where it
would just be noise for an audience that already has the context.

**`## Why this matters` is required on every issue, beginner or not.** One or
two sentences connecting the fix to the actual community/mission impact — not
"this violates best practices" but who is affected and how (a reader who hits
a dead link, a contributor whose write-up becomes unreachable, every visitor a
missing security header leaves slightly less protected). If you can't articulate
real-world impact, that's a signal the issue may not be worth filing as-is —
say so instead of inventing generic-sounding stakes.

**The community-invite footer is required on every issue, beginner or not** —
see the standard line in
[`references/body-templates.md`](references/body-templates.md). It's a small
thing, but a ticket queue that never invites anyone in reads as closed-door
even when the repo is nominally open source.

### Step 7 — Confirm, then write

Show the assembled issue (title + labels + body) unless the source already
was an explicit, fully-specified batch request. On approval:

```
gh issue create --repo philaconvalley/website \
  --title "<title>" \
  --body-file <path-to-drafted-body.md> \
  --label "<type>,<difficulty>[,<topic>...]"
```

Use `--body-file` for anything beyond a one-liner — it avoids shell-quoting
issues with backticks, quotes, and multi-line markdown. Report back the
created issue URL(s).

## Hard rules (no exceptions)

1. **Dedupe before creating.** Search first; update in place if a match
   exists rather than filing a duplicate.
2. **No emojis** anywhere in the title, body, or labels.
3. **Exactly one type label + one difficulty label**, drawn from the existing
   taxonomy — never invent a new label without asking first.
4. **Title is a plain descriptive sentence**, not a vague placeholder and not
   a bracket-prefixed template default.
5. **Draft-then-confirm**, except when the user has already pasted
   fully-specified content and explicitly asked for it to become issues — in
   that case the pasted content is the confirmed draft.
6. **Never close an issue from this skill's own judgment** — this skill files
   and shapes issues; closing/resolving requires a merged PR or explicit user
   sign-off.
7. **Credit provenance** ("Found via" / reporter) so issues don't read as if
   they materialized from nowhere.
8. **`beginner`/`good first issue` issues must include a `## Context`
   section** written for a reader with zero prior exposure to the codebase —
   see Step 6. A label promising approachability with a body that assumes
   framework fluency is a broken promise, not a shortcut.
9. **Every issue includes `## Why this matters` (community/mission impact,
   not just technical rationale) and the community-invite footer.** No
   exceptions for `intermediate`/`advanced` issues — the invite costs one
   line and keeps the tracker feeling like an open door.
10. **Don't under-label difficulty by default.** Before writing `intermediate`,
    check whether a `## Context` section would actually make the issue
    `beginner`-approachable — see Step 2. When genuinely unsure, say so and
    ask, rather than silently picking the more gatekept label.

## Tools used

- **`gh` CLI** — `gh issue create`, `gh issue list --search`, `gh issue view`,
  `gh issue edit`, `gh label list`.
- **Source context as available** — Read for pasted findings/screenshots,
  prior review output already in context (e.g. a `/multi-agent-review` run).

If `gh` isn't authenticated or the repo remote isn't `philaconvalley/website`,
stop and flag it rather than guessing a different repo.

## Resources

- [`references/label-taxonomy.md`](references/label-taxonomy.md) — the full
  current label list with when to use each.
- [`references/body-templates.md`](references/body-templates.md) — the
  bug/enhancement/documentation body skeletons.

This skill is a website-repo-scoped sibling of `triage-to-linear` — it covers
open-source community issue filing, not agency client ticket work. Keep them
separate; don't merge their conventions.
