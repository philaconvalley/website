# Label Taxonomy (philaconvalley/website)

Source of truth: `gh label list --repo philaconvalley/website`. Re-run that
command if this file looks stale before trusting it — labels can be added or
renamed in the GitHub UI without this file being updated.

## Type labels (pick exactly one)

| Label | When to use |
|---|---|
| `bug` | Something is broken today — observable wrong behavior vs. what the code/docs claim |
| `enhancement` | Works today but could be better, or a net-new capability |
| `documentation` | Docs missing, wrong, or drifted from the code |
| `content` | A project/resource/blog submission (community content pipeline) |
| `question` | Someone's asking, not reporting/requesting |
| `invalid` | Turns out not to be a real issue on investigation |
| `duplicate` | Already covered by another issue — link it, then close |
| `wontfix` | Valid but deliberately not being addressed |

## Difficulty labels (pick exactly one, for contributor targeting)

| Label | When to use |
|---|---|
| `beginner` | No prior experience with the codebase needed |
| `intermediate` | Some familiarity with the Astro/Tailwind stack needed |
| `advanced` | Deep knowledge of the tech stack required |

Difficulty tracks **how much context a contributor needs**, not how severe the
bug is. A one-line CSS typo fix is `beginner` even if it's an annoying visual
bug; a build-time content-collection data-flow bug is `intermediate`/
`advanced` even if the actual diff ends up small.

## Community/topic labels (add when applicable, zero or more)

| Label | When to use |
|---|---|
| `good first issue` | Self-contained, `beginner`-difficulty, good onboarding task |
| `help wanted` | Maintainers want outside contribution on this specifically |
| `accessibility` | a11y-specific defect or improvement |
| `design` | Visual design / UI |
| `ci` | CI/CD pipeline changes |
| `dependencies` | Dependency bumps (usually Dependabot-authored, rarely hand-filed) |

## Not currently in the taxonomy

There is no `security` label as of this writing. Security-flavored findings
(missing SRI, missing headers, etc.) currently go out as `bug` or
`enhancement` plus a difficulty tag. If security findings become frequent
enough to warrant their own label, raise that with the user before creating
one — don't add labels unilaterally.
