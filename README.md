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
2. Source: **Deploy from a branch** → `main` → `/` (root) → **Save**
3. Live at `https://<your-username>.github.io/jga-os/` within ~1 minute

A [GitHub Actions workflow](.github/workflows/pages.yml) is included so pushes to `main` deploy automatically.

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

To use a custom domain with GitHub Pages: edit `CNAME` in the repo root with your domain, then set it in **Settings → Pages → Custom domain**.

## Constitution

- [Outline the constitution or fundamental principles of your project here]

## Additional Information

- For any issues or further assistance, please refer to the [documentation](LINK_TO_DOCUMENTATION) or contact the repository owner.