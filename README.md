# JGA-OS

## To-Do List Application

A simple, self-contained to-do list app that runs entirely in the browser — no build step, no dependencies.

### Project Structure

```
index.html   — App shell (HTML markup)
styles.css   — Styling
app.js       — Application logic & localStorage persistence
```

### Running Locally

**Option 1 — Open directly**

Just double-click `index.html` (or drag it into a browser tab). That's it.

**Option 2 — Serve with a local HTTP server** (avoids any `file://` quirks)

```bash
# Python 3
python -m http.server 8080
# then open http://localhost:8080
```

```bash
# Node.js (npx)
npx serve .
```

### Features

- Add a to-do item (non-empty, whitespace-trimmed).
- Mark an item as complete / incomplete.
- Delete an individual item.
- Filter view: **All** / **Active** / **Completed**.
- Clear all completed items at once.
- **localStorage** persistence — todos survive page refresh and browser restart.
- Keyboard-friendly: `Tab` through all controls; `Enter` to submit; `Delete`/`Backspace` key removes a focused list item.
- Screen-reader accessible (`role`, `aria-label`, `aria-live`, `aria-pressed`).

---

## 🚀 Live Deployment

The app is a zero-dependency static site — no build step needed.

### GitHub Pages (recommended)

1. Go to **Settings → Pages** in your fork.
2. Source: **GitHub Actions** → **Save**.
3. Live at `https://jgaos2026-gif.github.io/jga-os/` within ~1 minute after the next push.

The included [GitHub Actions workflow](.github/workflows/pages.yml) runs automatically on every push to `main`.

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/jgaos2026-gif/jga-os)

Or manually: connect the repo in Netlify, leave the build command blank, set publish directory to `.`.

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jgaos2026-gif/jga-os)

Or manually: import the repo, choose framework **Other**, deploy.

### Custom Free Domain

| Provider | Free Domain | How |
|----------|-------------|-----|
| [GitHub Pages](https://pages.github.com) | `username.github.io/jga-os` | Built-in, free forever |
| [is-a.dev](https://is-a.dev) | `yourname.is-a.dev` | Submit a PR to their repo |
| [js.org](https://js.org) | `yourname.js.org` | Submit a PR to their repo |

To use a custom domain with GitHub Pages: add your domain to the `CNAME` file in the repo root (one bare domain per line, e.g. `jga-os.is-a.dev`), then set it in **Settings → Pages → Custom domain**.

### localStorage Key

```
jga-os.todos.v1
```

Each todo is stored as a JSON object:

```json
{ "id": "...", "text": "Buy milk", "completed": false, "createdAt": "2026-04-05T00:00:00.000Z" }
```

---

## Constitution

JGA-OS is guided by these core principles:

- **Zero dependencies** — no frameworks, no bundlers, no build step; pure HTML, CSS, and JavaScript only.
- **Privacy first** — all data lives in the user's own browser via `localStorage`; nothing is sent to a server.
- **Accessible by default** — every interactive element has ARIA labels and keyboard support.
- **Deployable anywhere** — the app is a static site and works on GitHub Pages, Netlify, Vercel, or directly from the file system.
- **Open and free** — MIT-licensed, free to use, fork, and adapt.

## Additional Information

- Live site: [https://jgaos2026-gif.github.io/jga-os/](https://jgaos2026-gif.github.io/jga-os/)
- Source code: [https://github.com/jgaos2026-gif/jga-os](https://github.com/jgaos2026-gif/jga-os)
- For bugs or feature requests, please [open an issue](https://github.com/jgaos2026-gif/jga-os/issues).