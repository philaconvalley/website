// The first pull request walkthrough moved from /join#first-pr to
// /projects#first-pr (site audit, 10/18/2026). Old links in Discord posts and
// guides still land on the steps. Loaded parser-blocking at the top of /join,
// so the jump happens before the page paints. A served file, not inline: the
// CSP allows scripts from this origin only.
(function () {
  if (location.hash === '#first-pr') location.replace('/projects#first-pr');
})();
