# Netlify Go-Live Runbook
**Project:** `jga-os`  
**Deployment method:** Netlify GitHub App (Option A — Netlify-managed deploys)  
**Site type:** Static (HTML/CSS/JS — no build step)

---

## Prerequisites

- You have a [Netlify account](https://app.netlify.com/signup) (free tier is sufficient).
- You are an **Owner** or **Member** of the `jgaos2026-gif` GitHub organization.
- The `netlify.toml` file is present in the repository root (it is — see [`netlify.toml`](../../netlify.toml)).

---

## Step 1 — Connect Netlify GitHub App

1. Log in to [app.netlify.com](https://app.netlify.com).
2. Click **"Add new site"** → **"Import an existing project"**.
3. Choose **GitHub** as the Git provider.
4. Authorize the **Netlify GitHub App** when prompted (grant access to `jgaos2026-gif/jga-os`).
5. Select the repository `jgaos2026-gif/jga-os` from the list.

> **Why GitHub App, not OAuth token?**  
> The Netlify GitHub App integration is scoped per-repository and rotates its own credentials — no personal tokens to manage or expire.

---

## Step 2 — Confirm Build / Publish Settings in Netlify UI

Netlify will auto-detect settings from `netlify.toml`. Confirm the following:

| Setting | Value |
|---------|-------|
| **Base directory** | *(leave empty)* |
| **Build command** | *(leave empty — static site, no build)* |
| **Publish directory** | `.` |
| **Functions directory** | *(leave empty)* |

If any value differs, correct it in **Site settings → Build & deploy → Continuous deployment**.

---

## Step 3 — Set Environment Variables / Secrets in Netlify

1. In the Netlify dashboard, go to **Site settings → Environment variables**.
2. Click **"Add a variable"** for each secret listed in [`docs/runbooks/SECRETS.md`](./SECRETS.md).
3. Enter the secret **name** exactly as listed and paste in the **value** from your secure vault (1Password, Bitwarden, etc.).
4. Choose scope:
   - **All deploy contexts** — available in production, previews, and branch deploys.
   - **Production** — available only on `main` branch deploys (recommended for sensitive keys).

> ⚠️ **Never** paste secret values into `netlify.toml`, code, or PR descriptions.

---

## Step 4 — Set a Custom Domain (optional)

1. Go to **Site settings → Domain management → Add custom domain**.
2. Enter your domain (e.g., `jga-os.example.com`).
3. Follow the DNS instructions shown — typically add a `CNAME` record pointing to `<your-netlify-site>.netlify.app`.
4. Wait for DNS propagation (up to 48 hours, usually much faster).

---

## Step 5 — Enable HTTPS (automatic)

Netlify provisions a free TLS certificate via Let's Encrypt automatically once your domain resolves.

1. Go to **Site settings → Domain management → HTTPS**.
2. Confirm **"Netlify managed certificate"** is shown as active.
3. Enable **"Force HTTPS"** to redirect all HTTP traffic to HTTPS.

---

## Step 6 — Verify the Live Site

1. Open your Netlify site URL (or custom domain).
2. Check that:
   - The To-Do List app loads correctly.
   - `styles.css` and `app.js` are served with long cache headers (`Cache-Control: public, max-age=31536000`).
   - The browser console shows no errors.
3. Open a test PR to confirm **Deploy Preview** is generated automatically.

---

## Step 7 — Monitor Deployments

- Every push to `main` triggers a new production deploy automatically.
- Every PR generates a **Deploy Preview** URL (posted as a PR comment by Netlify).
- View deployment history at **Site overview → Deploys**.

---

## Rollback Procedure

### Option A — Roll back via Netlify dashboard (recommended)

1. Go to **Site overview → Deploys**.
2. Find the last known-good deploy in the list.
3. Click on it → **"Publish deploy"**.
4. Confirm — the previous version is live within seconds.

### Option B — Roll back via git revert

```bash
git revert <bad-commit-sha>
git push origin main
```

Netlify detects the push and deploys the reverted version automatically.

### Option C — Lock deployments (freeze production)

If you need to prevent any new deploys temporarily:

1. Go to **Site overview → Deploys → Lock deploys**.
2. All new pushes to `main` are queued but not deployed until you unlock.

---

## Useful Links

| Resource | URL |
|----------|-----|
| Netlify dashboard | https://app.netlify.com |
| Netlify docs — file-based config | https://docs.netlify.com/configure-builds/file-based-configuration/ |
| Netlify docs — environment variables | https://docs.netlify.com/environment-variables/overview/ |
| Netlify docs — custom domains | https://docs.netlify.com/domains-https/custom-domains/ |
| Netlify docs — rollbacks | https://docs.netlify.com/site-deploys/manage-deploys/#rollbacks |
| Secrets reference | [docs/runbooks/SECRETS.md](./SECRETS.md) |
| Governance | [docs/governance/CONSTITUTION.md](../governance/CONSTITUTION.md) |
