# Performance baseline

Captured on `waskar/site-redesign` at commit `de52793`, immediately
before the motion system landed. Spec §5.5 gates the redesign on staying within 3 performance
points of these numbers.

Command: `npx --yes @lhci/cli@0.15.x autorun --config=.lighthouserc.json --collect.numberOfRuns=3` (resolved to `@lhci/cli@0.15.1`)
Machine: local dev (numbers are not comparable to CI — re-baseline there if CI is ever the gate).

| URL          | Performance | Accessibility | Best practices | SEO   |
| ------------ | ----------- | ------------- | -------------- | ----- |
| `/`          | `79`        | `95`          | `93`           | `100` |
| `/about/`    | `84`        | `95`          | `93`           | `100` |
| `/events/`   | `92`        | `96`          | `75`           | `100` |
| `/projects/` | `81`        | `93`          | `96`           | `100` |

## Read the performance column as a median, not a measurement

The table records the median of three runs. The runs were not tight. `/about/` scored
`0.77 / 0.84 / 0.95` — an 18-point spread on one machine, in one sitting, against one build.
The other pages were sampled the same way and there is no reason to think they are steadier.

That matters because spec §5.5's gate is ±3 points, and the noise here is six times the gate.
Three local runs cannot resolve a 3-point change: a page that genuinely regressed by 3 points
will often score _higher_ than this table, and an unchanged page will often score lower. Taken
at face value, `84` sends the next implementer chasing a regression that does not exist, or
waving through one that does.

So evaluate the gate like this:

1. **CI is the enforcement surface.** If the numbers here are ever used to block a change, they
   must first be re-taken in CI, where the machine is at least consistent between runs. The
   figures above are local and indicative — useful for spotting a page that halved, not for
   adjudicating three points.
2. **Locally, compare medians of at least 5 runs, taken back-to-back in one sitting**, with the
   same command and nothing else running. Compare median against median, never a single run
   against this table.
3. **Record the spread, not just the median**, whenever this file is updated. A median with no
   spread beside it reads as precision the measurement does not have.
4. **Treat a sub-5-point local move as no signal at all.** Investigate the trace (LCP, TBT, the
   actual bytes shipped) rather than the score, because those are stable where the composite
   score is not.

If any page later drops more than 3 performance points against this table, measured that way,
spec §5.5 applies: depth drops to two planes site-wide before anything else is cut.
