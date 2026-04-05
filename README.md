# JGA-OS To-Do List

A lightweight, zero-dependency to-do list web application built with vanilla HTML, CSS, and JavaScript.  
Tasks are automatically saved to the browser's **localStorage** so they persist across page refreshes.

## Features

- ✅ **Add** new tasks with a single keystroke or button click
- ✏️ **Edit** existing tasks via a modal dialog
- 🗑 **Delete** individual tasks
- ☑️ **Mark tasks as complete** with a checkbox
- 🔍 **Filter** tasks by All / Active / Completed
- 🧹 **Clear all completed** tasks in one click
- 💾 **localStorage persistence** – tasks survive page reloads
- ♿ Accessible markup with ARIA labels

## Getting Started

No build step or server required – just open `index.html` in any modern browser.

```bash
git clone https://github.com/jgaos2026-gif/jga-os.git
cd jga-os
# open index.html in your browser
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

## File Structure

```
jga-os/
├── index.html                       # Application markup
├── style.css                        # Styling
├── app.js                           # Task logic & localStorage integration
├── CNAME                            # Custom domain for GitHub Pages
├── netlify.toml                     # Netlify deploy config
├── vercel.json                      # Vercel deploy config
└── .github/workflows/pages.yml     # Auto-deploy to GitHub Pages on push
```

## 🚀 Live Deployment

The app is a zero-dependency static site — no build step needed.

### GitHub Pages (recommended)

1. Go to **Settings → Pages** in your fork
2. Source: **GitHub Actions** → **Save**
3. Live at `https://jgaos2026-gif.github.io/jga-os/` within ~1 minute after the next push

The included [GitHub Actions workflow](.github/workflows/pages.yml) runs automatically on every push to `main` — no manual deploy steps needed.

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/jgaos2026-gif/jga-os)

Or manually: connect the repo in Netlify, leave the build command blank, set publish directory to `.`.

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jgaos2026-gif/jga-os)

Or manually: import the repo, choose framework **Other**, deploy.

### Custom Free Domain

| Provider | Free Domain | How |
|----------|------------|-----|
| [GitHub Pages](https://pages.github.com) | `username.github.io/jga-os` | Built-in, free forever |
| [is-a.dev](https://is-a.dev) | `yourname.is-a.dev` | Submit a PR to their repo |
| [js.org](https://js.org) | `yourname.js.org` | Submit a PR to their repo |
| [Freenom](https://freenom.com) | `.tk .ml .ga .cf .gq` | Register free, add CNAME |

To use a custom domain with GitHub Pages: add your domain to the `CNAME` file in the repo root (one bare domain per line, e.g. `jga-os.is-a.dev`), then set it in **Settings → Pages → Custom domain**.

## Constitution

JGA-OS is guided by these core principles:

- **Zero dependencies** — no frameworks, no bundlers, no build step; pure HTML, CSS, and JavaScript only
- **Privacy first** — all data lives in the user's own browser via `localStorage`; nothing is sent to a server
- **Accessible by default** — every interactive element has ARIA labels and keyboard support
- **Deployable anywhere** — the app is a static site and works on GitHub Pages, Netlify, Vercel, or directly from the file system
- **Open and free** — MIT-licensed, free to use, fork, and adapt

## Additional Information

- Live site: [https://jgaos2026-gif.github.io/jga-os/](https://jgaos2026-gif.github.io/jga-os/)
- Source code: [https://github.com/jgaos2026-gif/jga-os](https://github.com/jgaos2026-gif/jga-os)
- For bugs or feature requests, please [open an issue](https://github.com/jgaos2026-gif/jga-os/issues).