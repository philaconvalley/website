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

If any page later drops more than 3 performance points against this table, spec §5.5 applies:
depth drops to two planes site-wide before anything else is cut.
