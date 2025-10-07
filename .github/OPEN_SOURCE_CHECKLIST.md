# Open Source Project Checklist

This checklist will help you make the PhilaCon Valley website a fully open source project on GitHub.

## ✅ Files & Documentation

- [x] LICENSE file (MIT License)
- [x] README.md with badges and project info
- [x] CONTRIBUTING.md with contribution guidelines
- [x] CODE_OF_CONDUCT.md
- [x] Issue templates (.github/ISSUE_TEMPLATE/)
  - [x] Bug report
  - [x] Feature request
  - [x] Content submission
- [x] Pull request template
- [x] GitHub funding configuration (.github/FUNDING.yml)

## 📋 GitHub Repository Setup

Follow these steps to make your repository open source:

### 1. Create/Update Repository on GitHub

- [ ] Create a new repository at https://github.com/philaconvalley/website
- [ ] Or update existing repository settings

### 2. Configure Repository Settings

Go to **Settings** in your GitHub repository:

#### General
- [ ] Set repository to **Public** (Settings > General > Danger Zone > Change visibility)
- [ ] Add description: "Official website for PhilaCon Valley - Philadelphia's tech community by us, for us"
- [ ] Add website: https://philaconvalley.com
- [ ] Add topics/tags: `community`, `philadelphia`, `tech-community`, `astro`, `open-source`, `diversity`, `inclusion`

#### Features
- [ ] Enable **Issues**
- [ ] Enable **Discussions** (optional, for community Q&A)
- [ ] Enable **Projects** (optional, for roadmap)
- [ ] Disable **Wiki** (we use README instead)

#### Manage Access
- [ ] Add core contributors as maintainers
- [ ] Set up branch protection for `main`:
  - Require pull request reviews before merging
  - Require status checks to pass

### 3. Push Your Code

If you haven't already pushed to GitHub:

```bash
git remote add origin https://github.com/philaconvalley/website.git
git branch -M main
git push -u origin main
```

### 4. Set Up Community Health Files

GitHub will automatically detect these files:
- [ ] Verify LICENSE shows up in repository
- [ ] Check that CODE_OF_CONDUCT.md is recognized
- [ ] Confirm CONTRIBUTING.md appears in "Contributing" section

### 5. Configure GitHub Features

#### Labels
Create labels for issues (Settings > Labels):
- [ ] `bug` (red) - Something isn't working
- [ ] `enhancement` (blue) - New feature or request
- [ ] `documentation` (yellow) - Documentation improvements
- [ ] `good first issue` (green) - Good for newcomers
- [ ] `help wanted` (purple) - Extra attention needed
- [ ] `content` (orange) - Content submission (project/resource)
- [ ] `accessibility` (pink) - Accessibility improvements

#### Security
- [ ] Add SECURITY.md with security policy (optional)
- [ ] Enable Dependabot alerts (Settings > Security)
- [ ] Enable Dependabot security updates

### 6. Add GitHub Actions (Optional)

Create `.github/workflows/ci.yml` for automated testing:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
```

### 7. Promote Your Open Source Project

- [ ] Add "Open Source" badge to README (already done ✅)
- [ ] Tweet/post about accepting contributions
- [ ] Add to website footer: "Open source on GitHub"
- [ ] Submit to open source directories:
  - [ ] [Open Source Friday](https://opensourcefriday.com/)
  - [ ] [First Timers Only](https://www.firsttimersonly.com/)
  - [ ] [Good First Issue](https://goodfirstissue.dev/)

### 8. Create Initial Issues

Create some "good first issue" issues to help new contributors:
- [ ] Fix typo in documentation
- [ ] Improve accessibility (add ARIA labels)
- [ ] Add new project to showcase
- [ ] Create tutorial/resource
- [ ] Improve mobile responsiveness

### 9. Set Up Contribution Workflow

- [ ] Review and merge first pull request
- [ ] Thank contributors (add CONTRIBUTORS.md or use All Contributors)
- [ ] Set up automatic welcome messages for new contributors (GitHub Actions)

### 10. Maintain Community Standards

- [ ] Respond to issues within 48 hours
- [ ] Review pull requests within 1 week
- [ ] Keep CONTRIBUTING.md up to date
- [ ] Recognize and celebrate contributors

## 🎉 You're Open Source!

Once you've completed these steps, your project is officially open source and ready for community contributions!

## Resources

- [GitHub's Open Source Guide](https://opensource.guide/)
- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Building Welcoming Communities](https://opensource.guide/building-community/)
- [Best Practices for Maintainers](https://opensource.guide/best-practices/)
