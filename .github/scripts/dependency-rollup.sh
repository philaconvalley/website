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

# The alert count, not the package count: one package can carry several advisories.
if [ "$total" -eq 0 ]; then
  echo "No open Dependabot alerts."
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

# Ordered worst-first so the table is a priority list rather than an inventory.
rows="$(jq -r --arg repo "$REPO" '
  def sevrank: {"critical":4,"high":3,"medium":2,"low":1}[.] // 0;
  group_by(.dependency.package.name)
  | map({
      pkg:     .[0].dependency.package.name,
      scope:   (.[0].dependency.scope // "unknown"),
      n:       length,
      top:     (max_by(.security_advisory.severity | sevrank).security_advisory.severity),
      # The highest patched version across all advisories for the package, compared
      # numerically rather than as a string ("10" > "9"). Advisories on different
      # release branches patch at different versions, so listing them all is noise —
      # this single number is the one that clears every alert for the package.
      patched: ([.[].security_vulnerability.first_patched_version.identifier]
                 | map(select(. != null))
                 | if length == 0 then ""
                   else (max_by(split(".") | map(tonumber? // 0))) end)
    })
  | sort_by([-(.top | sevrank), -.n, .pkg])
  | map("| [`\(.pkg)`](https://github.com/\($repo)/security/dependabot?q=is%3Aopen+package%3A\(.pkg)) | \(.n) | \(.top) | \(if .patched == "" then "**none available**" else "`\(.patched)`" end) | \(.scope) |")
  | join("\n")' <<<"$alerts")"

unpatched="$(jq '[.[] | select(.security_vulnerability.first_patched_version == null)] | length' <<<"$alerts")"
if [ "$unpatched" -eq 0 ]; then
  patch_line="Every one of these has a patched version available, so none of them are blocked on an upstream fix."
else
  patch_line="${unpatched} of these have no patched version published yet and cannot be fixed by upgrading — they need a workaround or an accepted risk."
fi

# Written to a file rather than a variable: a heredoc inside $( ) does not parse
# under bash 3.2 (still the default on macOS, where this gets run by hand), and
# `gh --body-file` sidesteps argument-length limits as the table grows.
body_file="$(mktemp)"
trap 'rm -f "$body_file"' EXIT

cat >"$body_file" <<EOF
<!-- managed-by: .github/workflows/dependency-rollup.yml — edited in place weekly, do not retitle -->

**${total} open Dependabot alerts** across ${pkgs} packages: ${severities}.

${patch_line}

## How to act on this

Dependabot security updates are enabled on this repo, so the fix for most rows below arrives on its own as a pull request — **review and merge those PRs rather than picking a row here and upgrading by hand.** Two people patching the same transitive dependency in different ways is worse than waiting a day.

This issue is a dashboard, not a work queue. It is rewritten in place every Monday, so it always reflects the current state and never needs triaging as stale.

## Reading the severity honestly

This site is a static build: Astro compiles to HTML at deploy time and the only JavaScript reaching a visitor is Alpine.js from a CDN. Most packages below (\`vite\`, \`rollup\`, \`postcss\`, \`esbuild\`, \`svgo\`, \`sharp\`) are **build toolchain** — they run on CI and on maintainer laptops, never in a visitor's browser, even though GitHub labels their scope \`runtime\`. A "high" here usually does not mean a high risk to anyone visiting the site.

The exposure that *is* real for this repo: it is public and accepts pull requests from forks, and CI runs \`npm ci\` + \`npm run build\` on them. A code-execution flaw in a build dependency is reachable by anyone who can open a PR. That is the reason to keep this list short, rather than visitor-facing risk.

## Alerts by package

| Package | Alerts | Highest severity | Patched in | Scope |
| ------- | -----: | ---------------- | ---------- | ----- |
${rows}

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
