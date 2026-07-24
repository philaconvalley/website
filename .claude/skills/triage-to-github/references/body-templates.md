# Body Templates

Pick the skeleton matching the issue's type label. Keep the technical sections
short and concrete — file:line references beat prose descriptions. But see
**"Context for beginner / good first issue"** below before treating "short" as
license to skip explanation entirely.

## Bug template

```markdown
## Description

<What's broken, where (file:line), and why — the mechanism, not just the symptom.>

## Expected Behavior

<What should happen.>

## Actual Behavior

<What actually happens instead.>

## Fix

<Concrete suggested fix, if one is already known. Omit this section rather than guessing if unclear.>

## Why this matters

<One or two sentences of real-world/community impact — see "Why this matters" below.>

## Found via

<Reporter, screenshot, or review pass that surfaced this — e.g. "Multi-agent code review (date) — security review pass.">

<Community-invite footer — see below.>
```

## Enhancement template

```markdown
## Description

<What exists today and what's missing or could be better.>

## Suggested Fix

<Concrete proposal. If it's a judgment call rather than an obvious fix, say so explicitly and frame it as worth discussing, not a mandate.>

## Why this matters

<One or two sentences of real-world/community impact.>

## Found via

<Source.>

<Community-invite footer — see below.>
```

## Documentation template

```markdown
## Description

<What the docs say vs. what the code actually does — the drift, specifically.>

## Suggested Fix

<What to update, and where.>

## Why this matters

<One or two sentences of real-world/community impact.>

## Found via

<Source.>

<Community-invite footer — see below.>
```

## Context for beginner / good first issue (required, not optional)

`good first issue` and `beginner` are promises to a reader with **zero prior
exposure to this codebase** — possibly their first PR ever. A body that's
technically accurate but assumes they already know what a "content
collection" or "SSG build step" is breaks that promise; they'll bounce off
the issue instead of picking it up.

Whenever an issue carries either label, add a `## Context` section, placed
right after `## Description`, that a newcomer can read _before_ opening any
code:

- Explain the one underlying concept in plain language (what a content
  collection is, what "unused import" means and how to check for one, why
  build-time and browser-time code are different environments) — a sentence
  or two, not a tutorial.
- Point at the specific file(s) to open first, in the order to read them.
- Say what "done" looks like in concrete, checkable terms (a command to run,
  a page to visually check) so they know when to stop.
- If there's a real judgment call to make (e.g. "delete this vs. wire it in"),
  say so explicitly and give a one-line steer on how to decide, rather than
  leaving it open-ended.

Do **not** add this section to `intermediate`/`advanced`-only issues — for
that audience it's noise, not help; keep those terse and technical.

Example (for an unused-component issue tagged `beginner, good first issue`):

```markdown
## Context

Astro components (`.astro` files) only render when something else `import`s
and uses them — an unused component sits in the file tree but never produces
any HTML. You can confirm a component is unused by grepping the codebase for
its name outside its own file.

Start by reading `src/components/EventCard.astro` to see what it was built to
render, then `src/pages/events.astro` to see how the events page actually
works today (a plain embedded iframe, no custom component). That tells you
whether deleting the component or wiring it in is the right call — see
"Suggested Fix" below for the tradeoff.
```

## Why this matters (required on every issue)

Technical rationale ("this violates X pattern") is not the same as impact.
Every issue needs one or two sentences naming who's actually affected and how
— a reader who lands on a dead link, a contributor whose write-up becomes
unreachable, every site visitor a missing header leaves slightly less
protected, a maintainer trying to onboard the next contributor off a doc
that's quietly wrong. This is what turns a ticket queue into a shared sense of
why the codebase matters, rather than a pile of disconnected complaints.

If you genuinely can't articulate real impact beyond "best practice says so,"
that's useful information too — say that plainly rather than inflating the
stakes. Not everything needs to sound urgent to be worth fixing.

## Community-invite footer (required on every issue)

Close every issue with a short invite, separated by a horizontal rule:

```markdown
---

New to this codebase? Comment below if you want to claim this or have
questions — happy to point you in the right direction. Community-built
software should have community-sized on-ramps.
```

This applies to `intermediate`/`advanced` issues too, not just beginner ones —
adjust "new to this codebase" framing slightly if the issue clearly isn't
approachable for a first PR (e.g. "Want to take this on? Comment below —
happy to talk through the tradeoffs before you start."), but never drop the
invite entirely. A tracker that never invites anyone in reads as closed-door
even when the repo is nominally open source.

## Notes

- Don't include an `## Environment` section (browser/device/OS) unless the
  bug is actually environment-dependent — most findings from a code review
  aren't, and the repo's `bug_report.md` template's environment section is
  meant for community-reported runtime bugs, not source-level findings.
- Keep code excerpts short (a few lines) and always name the file:line they
  came from — don't paste entire functions.
- When multiple issues come from the same review pass, use the same "Found
  via" wording across all of them so they're greppable as a batch later.
