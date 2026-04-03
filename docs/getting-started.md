# Getting Started

This guide will help you get the PhilaCon Valley website running on your own computer so you can make changes and see them in real time.

## What You'll Need

- **[Node.js](https://nodejs.org)** version 20 or higher — download it from the link, it's free. Pick the "LTS" version.
- **[Git](https://git-scm.com)** — this is how we manage code. If you're on a Mac, you may already have it. Try typing `git --version` in your terminal.
- **A code editor** — we recommend [VS Code](https://code.visualstudio.com/) (free). Any text editor works.

> **New to the terminal?** On Mac, open the "Terminal" app. On Windows, use "Command Prompt" or "PowerShell". The commands below go in there.

## Step by Step

### 1. Fork the repository

Click the **Fork** button at the top right of [this GitHub page](https://github.com/philaconvalley/website). This creates your own copy.

### 2. Clone it to your computer

```bash
# Replace YOUR-USERNAME with your GitHub username
git clone https://github.com/YOUR-USERNAME/website.git
cd website
```

### 3. Install dependencies

```bash
npm install
```

This downloads all the libraries the project needs. It may take a minute the first time.

### 4. Start the development server

```bash
npm run dev
```

Open **http://localhost:4321** in your browser. You should see the site!

Any changes you make to files will automatically show up in the browser.

### 5. When you're done

Press `Ctrl + C` in the terminal to stop the server.

## Useful Commands

| Command           | What it does                                          |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Starts a local server so you can preview changes live |
| `npm run build`   | Builds the production version and checks for errors   |
| `npm run preview` | Preview the production build before deploying         |

## Common Issues

**"command not found: node"** — Node.js isn't installed. Download it from [nodejs.org](https://nodejs.org).

**"command not found: git"** — Git isn't installed. Download it from [git-scm.com](https://git-scm.com).

**Port 4321 is already in use** — Another process is using that port. Stop it or try a different port: `npm run dev -- --port 3000`.

## Next Steps

- [Adding Content](adding-content.md) — Add a project or resource (no coding required)
- [Contributing Guide](contributing.md) — Submit your changes as a pull request
- [Architecture](architecture.md) — Understand how the codebase is organized
