---
title: 'How to Make Your First Pull Request'
description: 'A beginner-friendly, step-by-step walkthrough of forking, cloning, branching, committing, and opening your first pull request on this repo.'
category: 'Tutorial'
level: 'Beginner'
author: 'PhilaCon Valley'
date: 2026-07-18
tags: ['git', 'github', 'open-source', 'beginner', 'pull-request']
---

Never opened a pull request before? By the end of this page, you will have opened a real one. We will use this website's own repo as the example, and we will explain every term the first time it shows up. Nothing here assumes you have used Git before.

Stuck at any point? Comment on the [issue you're working on](https://github.com/philaconvalley/website/issues) or ask in Slack. That is what we are there for.

## Two Words Worth Knowing

**Fork** — your own personal copy of this repo, sitting under your GitHub account. You can do anything to it. Nothing you do to your fork touches the real site.

**Pull request** (PR for short) — a request you send to us that says "here's a change I made, please review it and add it to the real project." Opening one does not change anything by itself. A maintainer has to approve it first.

## What You Need Before You Start

- A free [GitHub account](https://github.com/signup)
- [Git](https://git-scm.com) installed — open a terminal and type `git --version`. If you see a version number, you're set.
- [Node.js](https://nodejs.org) version 20 or higher — download the "LTS" version
- A code editor, like [VS Code](https://code.visualstudio.com/) (free)

One more thing, and it's easy to miss: Git needs to know your name and email before it will let you save a change. If this is a brand-new computer, run this once:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

You only ever have to do this once per computer.

See [Getting Started](https://github.com/philaconvalley/website/blob/main/docs/getting-started.md) if you want more detail on any of the above.

## Step 1: Fork the Repo

Go to [github.com/philaconvalley/website](https://github.com/philaconvalley/website) and click **Fork**, top right of the page. GitHub copies the whole repo to your account. That copy lives at `github.com/YOUR-USERNAME/website`.

## Step 2: Clone Your Fork

"Cloning" downloads your fork onto your computer so you can actually edit the files. In your terminal:

```bash
# Swap in your own GitHub username
git clone https://github.com/YOUR-USERNAME/website.git
cd website
```

Make sure everything works before you touch anything:

```bash
npm install
npm run dev
```

Open **http://localhost:4321** in your browser. If you see the site, you're ready.

## Step 3: Create a Branch

Don't work directly on `main` — think of it as the shelf everyone else is reading from. Instead, make yourself a side copy to work in:

```bash
git checkout -b fix/readme-typo
```

Pick a name that describes what you're doing, like `fix/broken-link` or `content/new-tutorial`.

## Step 4: Make Your Change

For practice, try fixing a small typo, an outdated line, or a broken link somewhere in the docs or `README.md`. Look around first — someone may have already fixed the obvious ones, and that's fine. If you can't find anything to tidy up, skip ahead to a real [`good first issue`](https://github.com/philaconvalley/website/issues) instead; the rest of the steps below work exactly the same way.

Save the file, then double-check nothing broke:

```bash
npm run build
```

## Step 5: Commit Your Change

A commit is a labeled snapshot of what you changed.

```bash
git add README.md
git commit -m "Fix typo in README"
```

Say what changed, not how you changed it. "Fix typo in README" is useful. "Update file" is not.

If Git stops you here with a message about not knowing who you are, go back and run the two `git config` commands from the prerequisites above, then try the commit again.

## Step 6: Push Your Branch

"Pushing" uploads your branch, and the commits on it, to your fork on GitHub. `origin` is just Git's built-in nickname for "the remote copy I cloned from" — you don't need to set that up yourself.

```bash
git push origin fix/readme-typo
```

**If this asks for a password and rejects it:** GitHub stopped accepting plain passwords for this a while back. That's expected, not a mistake on your part. The two easiest fixes:

- Install [GitHub Desktop](https://desktop.github.com) and use it to push instead of the terminal — it handles login for you, and
- Or install the [GitHub CLI](https://cli.github.com) and run `gh auth login` once, which sets up your terminal to authenticate on its own from then on.

## Step 7: Open the Pull Request

1. Go to your fork: `github.com/YOUR-USERNAME/website`
2. GitHub shows a banner for your branch with a **Compare & pull request** button — click it
3. Confirm the base repository is `philaconvalley/website` and the base branch is `main`
4. Write a title and a couple sentences on what you changed and why
5. Working from an open issue? Add `Closes #123` (with the real issue number) to the description — this closes the issue automatically once your PR is merged
6. Click **Create pull request**

Done. That's a real pull request, opened by you. A maintainer will review it and automated checks will run. If they ask for changes, that's just how collaboration works — it happens to everyone, including us.

## Common Gotchas

- **"Please tell me who you are"** — Git needs your name and email set once per computer. See the prerequisites above.
- **Push rejected / asked for a password** — Plain passwords don't work anymore. Use GitHub Desktop or `gh auth login` (see Step 6).
- **Nothing shows up on GitHub after pushing** — Double check you actually ran `git push origin your-branch-name`, and that it finished without an error.
- **Wrong base branch** — Your PR should almost always target `main`, unless a maintainer tells you otherwise.
- **Editing directly on `main`** — Makes it hard to update your fork later. Always branch first (Step 3).
- **Cloned the original repo instead of your fork** — Delete the folder and re-clone using your fork's URL (`github.com/YOUR-USERNAME/website`), not the original.
- **Fork has fallen behind `main`** — Click **Sync fork** on your fork's GitHub page before starting new work.

## Learn More

- [GitHub Docs: Fork a repo](https://docs.github.com/en/get-started/quickstart/fork-a-repo)
- [GitHub Docs: About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [Contributing Guide](https://github.com/philaconvalley/website/blob/main/docs/contributing.md) — the full workflow for this repo

Ready for the real thing? Browse [open issues](https://github.com/philaconvalley/website/issues) labeled `good first issue` and give it a try.
