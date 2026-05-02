# JGA-OS Constitution
**Version:** 1.0  
**Effective date:** 2026-05-02  
**Repository:** `jgaos2026-gif/jga-os`

---

## 1. Purpose

This Constitution establishes the chain-of-command, code of conduct, and operating rules for all agents, contributors, and automated systems that interact with the `jga-os` repository and its associated production infrastructure.

---

## 2. Guiding Principles

1. **Safety first** — no action may knowingly degrade production availability or leak secrets.
2. **Minimal blast radius** — changes are kept small, reversible, and clearly scoped.
3. **Transparency** — every automated action is logged, attributable, and reviewable.
4. **Least privilege** — each agent or role is granted only the permissions needed for its task.
5. **Human in the loop** — for irreversible or high-risk actions, a human must approve before execution.

---

## 3. Chain of Command

| Level | Role | Scope |
|-------|------|-------|
| 1 | **Repository Owner / Org Admin** | Full control; final authority on secrets, billing, and compliance. |
| 2 | **Maintainer** | Merge PRs to `main`, approve deployments, manage branch protection. |
| 3 | **Contributor** | Open PRs against feature branches; no direct push to `main`. |
| 4 | **Autonomous Agent (AI/bot)** | May open PRs and comment; may **not** merge or push to protected branches without human approval. |
| 5 | **Read-only Observer** | Issue comments, discussions only. |

### 3.1 Escalation path

```
Autonomous Agent → opens PR → Contributor review → Maintainer approval → merge
                                                  ↓
                                         Blocked? → escalate to Org Admin
```

---

## 4. Code of Conduct

1. All contributors (human or agent) must treat others with respect in issues, PRs, and discussions.
2. Discriminatory, harassing, or abusive language is prohibited.
3. Agents must identify themselves clearly (e.g., in PR descriptions) and must not impersonate humans.
4. Any agent that encounters ambiguous instructions must pause and request clarification rather than guess.
5. Violations are reported to the Repository Owner for review.

---

## 5. Operating Rules for Autonomous Agents

### 5.1 Allowed actions (no human approval required)
- Open draft or ready PRs from feature branches.
- Leave review comments or suggestions.
- Update documentation files.
- Create or update configuration files (non-secret).
- Run CI checks (read-only).

### 5.2 Actions requiring human approval
- Merging any PR to `main` or a release branch.
- Adding, rotating, or deleting secrets/environment variables.
- Changing branch-protection or environment-protection rules.
- Triggering a production deployment outside of the normal CI/CD pipeline.
- Modifying billing settings or connected services.

### 5.3 Prohibited actions
- Committing secret *values* to any file or branch.
- Bypassing branch-protection rules.
- Accessing other repositories outside the declared scope.
- Running shell commands that install system-level software without explicit authorization.
- Deleting repository history (`git push --force`, `git filter-branch`, etc.).

---

## 6. Secret Handling

- Secrets are **never** stored in code, commit messages, PR descriptions, or issue comments.
- All secret *names* (without values) are documented in [`docs/runbooks/SECRETS.md`](../runbooks/SECRETS.md).
- Secret *values* are stored exclusively in the Netlify environment variables dashboard.
- Any accidental exposure of a secret must be reported immediately to the Repository Owner, who will rotate the affected credential within 24 hours.

---

## 7. Deployment Governance

- Production deployments are triggered automatically by Netlify when commits land on `main`.
- Deploy Previews are generated for every PR — no human action required.
- Emergency rollbacks follow the procedure in [`docs/runbooks/NETLIFY_GO_LIVE.md`](../runbooks/NETLIFY_GO_LIVE.md).
- A deployment may be locked (frozen) by a Maintainer or above via the Netlify dashboard.

---

## 8. Amendment Process

1. Any contributor may propose an amendment via a PR that modifies this file.
2. Amendments require approval from at least one Maintainer and the Repository Owner.
3. The `Version` and `Effective date` fields at the top must be updated with each accepted amendment.

---

*This constitution governs all participants in the `jga-os` project.*
