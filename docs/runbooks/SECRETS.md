# Secrets Reference
**Project:** `jga-os`  
**Deployment method:** Netlify GitHub App

> ⚠️ **This file contains secret *names* only — never secret values.**  
> All values must be stored in the Netlify environment variables dashboard (see [NETLIFY_GO_LIVE.md](./NETLIFY_GO_LIVE.md#step-3--set-environment-variables--secrets-in-netlify)).

---

## Where Secrets Live

| Storage location | Purpose |
|-----------------|---------|
| **Netlify → Site settings → Environment variables** | All runtime secrets consumed by the site or Netlify build. ✅ Primary store. |
| **GitHub → Settings → Secrets and variables → Actions** | Only needed if you later add GitHub Actions workflows that reference secrets. Not required for Option A (Netlify GitHub App). |

---

## Netlify Environment Variables

The following names are placeholders — add **values** in the Netlify dashboard only.

### Core deployment (Netlify GitHub App — no tokens needed)

When using the Netlify GitHub App, Netlify manages deploy credentials internally.  
**No `NETLIFY_AUTH_TOKEN` or `NETLIFY_SITE_ID` secrets need to be stored in GitHub.**

### Application secrets (add as your app grows)

| Variable name | Scope | Description |
|---------------|-------|-------------|
| `NODE_ENV` | Production | Set to `production` for production deploys. |
| `SITE_URL` | All contexts | Full public URL of the site (e.g., `https://jga-os.netlify.app`). |

> **Template for future secrets** — copy this row and fill in details:
>
> | `SECRET_NAME` | Production \| All | What this secret does and where it comes from. |

### Future integrations (names only — add values when integrating)

| Variable name | Scope | Description |
|---------------|-------|-------------|
| `STRIPE_SECRET_KEY` | Production | Payment processing secret key (Stripe dashboard → Developers → API keys). |
| `STRIPE_PUBLISHABLE_KEY` | All contexts | Stripe publishable key (safe to use in frontend, but still keep out of code). |
| `OPENAI_API_KEY` | Production | OpenAI API key (platform.openai.com → API keys). |
| `DATABASE_URL` | Production | Connection string for a future database (e.g., PostgreSQL). |
| `JWT_SECRET` | Production | Secret used to sign/verify JSON Web Tokens. Generate with `openssl rand -base64 32`. |

---

## GitHub Repository / Environment Secrets (future use only)

If you later add GitHub Actions workflows, store these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret name | Where to set | Description |
|-------------|-------------|-------------|
| `NETLIFY_AUTH_TOKEN` | Repo-level secret | Only needed for Option B (GitHub Actions deploy). Generate in Netlify → User settings → Applications → Personal access tokens. |
| `NETLIFY_SITE_ID` | Repo-level secret | Only needed for Option B. Found in Netlify → Site settings → General → Site details → Site ID. |

---

## Secret Rotation Policy

1. Rotate all secrets at least every **90 days** for production credentials.
2. Immediately rotate any secret that may have been exposed (committed to code, pasted in a PR, etc.).
3. After rotation, update the value in the Netlify dashboard and verify the next deployment succeeds.
4. Record the rotation event as a Brick in `docs/bricks/events/` per the [Brick System spec](../governance/BRICK_STITCH_SPEC.md).

---

## Emergency — Accidental Secret Exposure

If a secret value is ever committed to the repository:

1. **Immediately rotate** the affected credential in the originating service.
2. Use `git filter-repo` or GitHub's secret scanning support to remove the exposure from history.
3. Notify the Repository Owner within 1 hour.
4. Open a compliance brick (`INCIDENT` type) documenting the exposure and remediation steps.

---

*See also: [NETLIFY_GO_LIVE.md](./NETLIFY_GO_LIVE.md) · [CONSTITUTION.md](../governance/CONSTITUTION.md)*
