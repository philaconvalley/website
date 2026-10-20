/**
 * The six steps of a first pull request on this repo, shown as cards on
 * /projects (Waskar, 10/17/2026; moved from /join in the site audit, 10/18/2026). The steps and commands are the real ones, taken from
 * src/content/resources/first-pull-request.md, which is the longer guide. If
 * a command changes there, change it here too.
 */
export interface FirstPrStep {
  title: string;
  lead: string;
  code: string | null;
  note: string | null;
}

export const firstPrSteps: FirstPrStep[] = [
  {
    title: 'Fork it',
    lead: 'Your own copy, under your account. Nothing here touches the live site.',
    code: 'github.com/philaconvalley/website → Fork',
    note: null,
  },
  {
    title: 'Clone it',
    lead: 'Pull it down to your machine so you can open the files.',
    code: 'git clone https://github.com/YOUR-USERNAME/website.git\ncd website\nnpm install',
    note: null,
  },
  {
    title: 'Make a branch',
    lead: 'Never work on main. Give your change its own branch.',
    code: 'git checkout -b fix/readme-typo',
    note: null,
  },
  {
    title: 'Change something small',
    lead: 'A typo, a dead link, a stale line. Small is the point. Build before you commit, so you know nothing broke.',
    code: 'npm run build',
    note: null,
  },
  {
    title: 'Commit and push',
    lead: 'Say what changed, not how you changed it.',
    code: 'git add README.md\ngit commit -m "Fix typo in README"\ngit push origin fix/readme-typo',
    note: null,
  },
  {
    title: 'Open the PR',
    lead: 'GitHub shows a Compare and pull request button. Set the base branch to main. Someone from the flock will review it.',
    code: null,
    note: null,
  },
];
