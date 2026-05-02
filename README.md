# JGA-OS To-Do List

A lightweight, accessible to-do list app — pure HTML, CSS, and vanilla JavaScript. No build step, no dependencies.

## Features

- Add, edit (double-click), complete, and delete tasks
- Filter by All / Active / Completed
- Persists to `localStorage`
- Keyboard-accessible and screen-reader friendly
- Responsive design

## Running locally

Open `index.html` in any browser — no server required.

## Deployment (Netlify)

This site is deployed via the **Netlify GitHub App** (Option A — Netlify-managed deploys).

| Step | Resource |
|------|----------|
| Connect Netlify & go live | [docs/runbooks/NETLIFY_GO_LIVE.md](docs/runbooks/NETLIFY_GO_LIVE.md) |
| Manage secrets & environment variables | [docs/runbooks/SECRETS.md](docs/runbooks/SECRETS.md) |

**Quick summary:**
1. Import the repo into Netlify via the GitHub App.
2. Confirm publish directory is `.` (no build command needed).
3. Add any required environment variables in **Netlify → Site settings → Environment variables**.
4. Every push to `main` deploys automatically; every PR gets a Deploy Preview.

## Governance

This project uses a structured record-keeping and agent-governance framework:

| Document | Description |
|----------|-------------|
| [docs/governance/CONSTITUTION.md](docs/governance/CONSTITUTION.md) | Chain-of-command, code of conduct, operating rules for autonomous agents |
| [docs/governance/BRICK_STITCH_SPEC.md](docs/governance/BRICK_STITCH_SPEC.md) | Brick system & stitch brick tech data system — structured audit trail |

## Project structure

```
jga-os/
├── index.html               # App entry point
├── styles.css               # Styles
├── app.js                   # Application logic
├── netlify.toml             # Netlify build + headers config
└── docs/
    ├── governance/
    │   ├── CONSTITUTION.md
    │   └── BRICK_STITCH_SPEC.md
    └── runbooks/
        ├── NETLIFY_GO_LIVE.md
        └── SECRETS.md
```
