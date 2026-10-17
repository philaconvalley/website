#!/usr/bin/env bash
#
# Maintains a single rolling GitHub issue summarising open Dependabot alerts.
#
# Why this exists: Dependabot itself cannot open issues — it only opens PRs and
# writes alerts to the Security tab, which contributors cannot see (it needs push
# access). This repo runs on drive-by contributions, and the issue tracker is the
# only surface community members actually look at, so dependency risk was
# invisible to everyone except maintainers.
#
# Deliberately ONE issue, rewritten in place, not one issue per alert: 35 open
# alerts would have been more issues than the rest of the tracker combined, and
# each individual bump is not a task anyone should claim — Dependabot's own PRs
# are the fix path. This issue is a dashboard, not a work queue.
#
# Usage:
#   GITHUB_REPOSITORY=owner/repo ./dependency-rollup.sh
#   DRY_RUN=1 ... ./dependency-rollup.sh   # print the body, touch nothing
#
set -euo pipefail

REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY must be set (owner/repo)}"
TITLE="Dependency security rollup"
LABEL="dependencies"
DRY_RUN="${DRY_RUN:-0}"
TODAY="$(date -u +%Y-%m-%d)"

# --paginate cannot be combined with --jq, and --slurp returns one array per page,
# so the pages are merged here rather than in the query.
if ! pages="$(gh api --paginate --slurp "repos/${REPO}/dependabot/alerts?state=open&per_page=100" 2>&1)"; then
  {
    echo "Could not read Dependabot alerts for ${REPO}:"
    echo "$pages"
    echo
    echo "This endpoint is not covered by the default Actions token scope. In a workflow"
    echo "it needs 'permissions: { vulnerability-alerts: read }' — note that"
    echo "'security-events' covers code scanning, NOT Dependabot alerts. Run by hand it"
    echo "needs a gh token with the security_events scope."
  } >&2
  exit 1
fi
alerts="$(jq 'add // []' <<<"$pages")"

total="$(jq 'length' <<<"$alerts")"

alerts_file="$(mktemp)"
dismissed_file="$(mktemp)"
body_file="$(mktemp)"
trap 'rm -f "$alerts_file" "$dismissed_file" "$body_file"' EXIT

# An alert a maintainer dismissed as an accepted risk leaves the open list, and
# with it this issue — which would make the accepted risk invisible to exactly
# the people this issue exists for. List those still installed at a vulnerable
# version, with the maintainer's reason. Read before the zero check below, so
# dismissing the last open alert does not close the issue that records it.
gh api --paginate --slurp "repos/${REPO}/dependabot/alerts?state=dismissed&per_page=100" \
  | jq '[add // [] | .[] | select(.dismissed_reason == "tolerable_risk" or .dismissed_reason == "no_bandwidth")]' \
    >"$dismissed_file"
dismissed_fixes="$(node "$(dirname "$0")/dependency-fix-paths.mjs" "$dismissed_file")"
accepted_rows="$(jq -r --arg repo "$REPO" --argjson fixes "$dismissed_fixes" '
  map(select($fixes[.dependency.package.name].vulnerableInstalled > 0))
  | map("| [`\(.dependency.package.name)`](https://github.com/\($repo)/security/dependabot/\(.number)) | \(.security_advisory.severity) | \(.dismissed_reason | gsub("_"; " ")) | \(.dismissed_at[0:10]) | \((.dismissed_comment // "no reason given") | gsub("\\|"; "\\\\|") | gsub("\n"; " ")) |")
  | join("\n")' "$dismissed_file")"

# The alert count, not the package count: one package can carry several advisories.
if [ "$total" -eq 0 ] && [ -z "$accepted_rows" ]; then
  echo "No open Dependabot alerts and no accepted risks."
  existing="$(gh issue list --repo "$REPO" --state open --label "$LABEL" --limit 100 \
    --json number,title --jq "map(select(.title == \"${TITLE}\")) | .[0].number // empty")"
  if [ -n "$existing" ]; then
    if [ "$DRY_RUN" = "1" ]; then
      echo "[dry run] would close issue #${existing}"
    else
      gh issue comment "$existing" --repo "$REPO" \
        --body "All Dependabot alerts are resolved as of ${TODAY}. Closing; the weekly job will reopen a fresh rollup if new alerts appear."
      gh issue close "$existing" --repo "$REPO"
    fi
  fi
  exit 0
fi

# Severity breakdown, skipping empty buckets so the summary line does not read
# "0 critical" and invite a scan for a number that is not there.
severities="$(jq -r '
  def sevlabel: {"critical":"critical","high":"high","medium":"moderate","low":"low"}[.];
  [.[].security_advisory.severity]
  | group_by(.)
  | map({sev: .[0], n: length})
  | sort_by({"critical":0,"high":1,"medium":2,"low":3}[.sev] // 4)
  | map("\(.n) \(.sev | sevlabel)")
  | join(", ")' <<<"$alerts")"

pkgs="$(jq '[.[].dependency.package.name] | unique | length' <<<"$alerts")"

# Whether a package is declared in package.json decides whether anyone is coming
# to fix it. Dependabot's security updater edits manifests, so a package with no
# entry there gets no PR — not "eventually", ever. Every alert on `picomatch` and
# `sharp` sat open for exactly this reason while the issue told readers to wait
# for a PR.
manifest="${MANIFEST_PATH:-package.json}"
direct="$(jq -c '[(.dependencies // {}), (.devDependencies // {})] | add | keys' "$manifest")"

transitive_count="$(jq --argjson direct "$direct" \
  '[.[].dependency.package.name] | unique | map(select(. as $p | $direct | index($p) | not)) | length' \
  <<<"$alerts")"

# Being transitive is not enough to say `npm update` will work, and an empty
# patched-version field is not enough to say nothing will. Both were wrong on
# 2026-10-12. The helper checks the npm registry and the lockfile's parent
# ranges instead; see the header of dependency-fix-paths.mjs.
printf '%s' "$alerts" >"$alerts_file"
fixes="$(node "$(dirname "$0")/dependency-fix-paths.mjs" "$alerts_file")"

if [ "$total" -eq 0 ]; then
  summary_line="**No open Dependabot alerts.** The accepted risks below are still installed."
else
  summary_line="**${total} open Dependabot alerts** across ${pkgs} packages: ${severities}."
fi

if [ "$transitive_count" -eq 0 ]; then
  transitive_line="Every package below is a direct dependency, so every row has a pull request coming."
elif [ "$transitive_count" -eq "$pkgs" ]; then
  transitive_line="**All ${pkgs} packages below are transitive and will not fix themselves.**"
else
  transitive_line="**${transitive_count} of the ${pkgs} packages below are transitive and will not fix themselves.**"
fi

# Ordered worst-first so the table is a priority list rather than an inventory.
rows="$(jq -r --arg repo "$REPO" --argjson fixes "$fixes" '
  def sevrank: {"critical":4,"high":3,"medium":2,"low":1}[.] // 0;
  group_by(.dependency.package.name)
  | map({
      pkg:     .[0].dependency.package.name,
      scope:   (.[0].dependency.scope // "unknown"),
      n:       length,
      top:     (max_by(.security_advisory.severity | sevrank).security_advisory.severity),
      # The lowest released version outside every advisory range for the package,
      # from the registry rather than the advisory, whose patched field can be empty
      # even when a fixed release exists.
      fix:     $fixes[.[0].dependency.package.name]
    })
  | sort_by([-(.top | sevrank), -.n, .pkg])
  | map("| [`\(.pkg)`](https://github.com/\($repo)/security/dependabot?q=is%3Aopen+package%3A\(.pkg)) | \(.n) | \(.top) | \(if .fix.fix == null then "**none available**" else "`\(.fix.fix)`" end) | \(.scope) | \(
      if .fix.path == "fixed" then "fixed in the lockfile — the alert closes on the next Dependabot scan"
      elif .fix.path == "blocked" then "blocked upstream"
      elif .fix.path == "pr" then "wait for the PR"
      elif .fix.path == "update" then "**`npm update \(.pkg)`**"
      else "**override** — pinned by \(.fix.pinnedBy | map("`\(.)`") | join(", "))"
      end) |")
  | join("\n")' <<<"$alerts")"

unpatched="$(jq '[.[] | select(.path == "blocked")] | length' <<<"$fixes")"
if [ "$unpatched" -eq 0 ]; then
  patch_line="Every one of these has a fixed version released, so none of them are blocked on an upstream fix."
else
  patch_line="${unpatched} of these packages have no fixed version released yet and cannot be fixed by upgrading — they need a workaround or an accepted risk."
fi

# Only the accepted risks are left: say so plainly instead of rendering lines
# about "every package below" over an empty table.
if [ "$total" -eq 0 ]; then
  patch_line=""
  transitive_line=""
  rows="| _none_ | 0 | | | | nothing open |"
fi

if [ -n "$accepted_rows" ]; then
  accepted_section="## Accepted risks

These alerts were dismissed by a maintainer, so they are not counted above, but the vulnerable version is still installed. Each one is a decision someone made, with the reason they gave.

| Package | Severity | Dismissed as | On | Reason |
| ------- | -------- | ------------ | -- | ------ |
${accepted_rows}
"
else
  accepted_section=""
fi

# Written to a file rather than a variable: a heredoc inside $( ) does not parse
# under bash 3.2 (still the default on macOS, where this gets run by hand), and
# `gh --body-file` sidesteps argument-length limits as the table grows.
cat >"$body_file" <<EOF
<!-- managed-by: .github/workflows/dependency-rollup.yml — edited in place weekly, do not retitle -->

${summary_line}

${patch_line}

## How to act on this

Read the **Fix path** column first — it says who is coming to fix each row, and for some of them the answer is nobody.

- **wait for the PR** — the package is declared in \`package.json\`, so Dependabot's security updater can edit it and opens a pull request on its own. Review and merge that PR rather than upgrading by hand; two people patching the same dependency in different ways is worse than waiting a day.
- **\`npm update <pkg>\`** — the package is **transitive**: nothing in \`package.json\` names it, so there is no manifest line for the security updater to change and **no pull request is coming, however long you wait.** Every parent's declared range already allows the fixed version, so the command works. Run it, commit the \`package-lock.json\` change, open a PR.
- **override** — also transitive, but the listed parents declare a range that excludes every fixed version, so \`npm update\` silently does nothing. Add an \`overrides\` entry in \`package.json\`, run \`npm install\`, and diff the build output before and after. Say in the PR when the override can come out, since it is a thing someone has to remember to remove later.
- **blocked upstream** — no fixed version has been released (checked against the npm registry, not just the advisory). Nothing to merge; it needs a workaround or an accepted risk. To accept it, dismiss the alert as *tolerable risk* with a reason — it then moves to the **Accepted risks** section below rather than disappearing.

${transitive_line}

This issue is a dashboard, not a work queue — with one exception: the \`npm update\` and **override** rows genuinely are claimable work, because nothing else will claim them. It is rewritten in place every Monday, so it always reflects the current state and never needs triaging as stale.

## Reading the severity honestly

This site is a static build: Astro compiles to HTML at deploy time and the only JavaScript reaching a visitor is Alpine.js. Most packages below (\`vite\`, \`rollup\`, \`postcss\`, \`esbuild\`, \`svgo\`, \`sharp\`) are **build toolchain** — they run on CI and on maintainer laptops, never in a visitor's browser, even though GitHub labels their scope \`runtime\`. A "high" here usually does not mean a high risk to anyone visiting the site.

The exposure that *is* real for this repo: it is public and accepts pull requests from forks, and CI runs \`npm ci\` + \`npm run build\` on them. A code-execution flaw in a build dependency is reachable by anyone who can open a PR. That is the reason to keep this list short, rather than visitor-facing risk.

## Alerts by package

| Package | Alerts | Highest severity | Patched in | Scope | Fix path |
| ------- | -----: | ---------------- | ---------- | ----- | -------- |
${rows}

${accepted_section}
Full detail, including the advisory text and the dependency path for each alert, is in [the Dependabot alerts tab](https://github.com/${REPO}/security/dependabot) — visible to maintainers only, which is why this summary exists.

<sub>Updated ${TODAY} by the \`dependency-rollup\` workflow.</sub>
EOF

if [ "$DRY_RUN" = "1" ]; then
  cat "$body_file"
  exit 0
fi

# Match on the exact title among open labelled issues rather than using the search
# API, whose index lags behind issue creation by enough to duplicate the issue on
# consecutive runs.
existing="$(gh issue list --repo "$REPO" --state open --label "$LABEL" --limit 100 \
  --json number,title --jq "map(select(.title == \"${TITLE}\")) | .[0].number // empty")"

if [ -n "$existing" ]; then
  gh issue edit "$existing" --repo "$REPO" --body-file "$body_file"
  echo "Updated issue #${existing} (${total} open alerts)."
else
  url="$(gh issue create --repo "$REPO" --title "$TITLE" --label "$LABEL" --body-file "$body_file")"
  echo "Created ${url} (${total} open alerts)."
fi
