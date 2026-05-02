# Brick System & Stitch Brick Tech Data System
**Specification Version:** 1.0  
**Effective date:** 2026-05-02  
**Repository:** `jgaos2026-gif/jga-os`

---

## 1. Overview

The **Brick System** is a structured record-keeping framework used to capture, version, and audit every significant operational state in the `jga-os` project.

A **Brick** is a single, atomic unit of information — a fact, decision, event, or configuration snapshot — that is stamped with a timestamp, author, and context tags.

**Stitch Brick Tech Data System** (SBTDS) is the meta-layer that *joins* individual bricks into a coherent, navigable audit trail. It defines how bricks are grouped into topics (stitches), how they transition from state to state, and how they are stored in a compliant folder structure.

---

## 2. Core Concepts

### 2.1 Brick

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (`BRICK-YYYYMMDD-NNN`). |
| `title` | `string` | Short human-readable summary (≤ 80 chars). |
| `type` | `enum` | `DECISION`, `EVENT`, `CONFIG`, `INCIDENT`, `COMPLIANCE`. |
| `state` | `enum` | `DRAFT` → `ACTIVE` → `SUPERSEDED` \| `ARCHIVED`. |
| `author` | `string` | GitHub username or agent ID. |
| `timestamp` | `ISO 8601` | When the brick was created or last updated. |
| `tags` | `string[]` | Topic labels (e.g., `deployment`, `secrets`, `governance`). |
| `body` | `markdown` | Full description, evidence, or structured data. |
| `references` | `string[]` | Links to PRs, issues, runbooks, or prior bricks. |

### 2.2 Stitch

A **Stitch** is an ordered sequence of related bricks that tells a complete story about a topic (e.g., "Netlify go-live", "secrets rotation Q3 2026").  
A stitch is represented as a folder under the relevant taxonomy directory containing all member bricks plus a `_stitch.md` index file.

### 2.3 State Transitions

```
DRAFT ──► ACTIVE ──► SUPERSEDED
                └──► ARCHIVED
```

- **DRAFT** — brick is being authored; not yet authoritative.
- **ACTIVE** — brick is the current authoritative record.
- **SUPERSEDED** — a newer brick replaces this one; the old brick is preserved for history.
- **ARCHIVED** — no longer operationally relevant; kept for compliance.

---

## 3. File Taxonomy

```
docs/
└── bricks/
    ├── decisions/          # DECISION bricks
    ├── events/             # EVENT bricks (deployments, incidents)
    ├── configs/            # CONFIG bricks (netlify.toml snapshots, etc.)
    ├── incidents/          # INCIDENT bricks
    └── compliance/         # COMPLIANCE bricks (audits, certifications)
        └── state-to-state/ # Compliance foldering for regulatory transitions
```

Each directory may contain:
- Individual brick files: `BRICK-YYYYMMDD-NNN.md`
- Stitch directories: `stitch-<slug>/` with a `_stitch.md` index

---

## 4. Brick Template

Create new bricks by copying the template below into the appropriate taxonomy directory.

```markdown
---
id: BRICK-YYYYMMDD-001
title: "<Short summary>"
type: DECISION | EVENT | CONFIG | INCIDENT | COMPLIANCE
state: DRAFT
author: <github-username-or-agent-id>
timestamp: YYYY-MM-DDTHH:MM:SSZ
tags:
  - <tag1>
  - <tag2>
references:
  - https://github.com/jgaos2026-gif/jga-os/pull/<number>
---

## Context

<!-- Why does this brick exist? What was the situation? -->

## Decision / Event / Config / Incident / Compliance detail

<!-- Full description. Use sub-sections as needed. -->

## Outcome / Impact

<!-- What changed? What is the expected result? -->

## Follow-up actions

- [ ] Action item 1
- [ ] Action item 2
```

---

## 5. Stitch Index Template

Place a `_stitch.md` file in every stitch directory.

```markdown
---
stitch: <slug>
title: "<Human-readable stitch name>"
state: OPEN | CLOSED
created: YYYY-MM-DDTHH:MM:SSZ
closed: YYYY-MM-DDTHH:MM:SSZ   # omit if still OPEN
tags:
  - <tag1>
---

## Purpose

<!-- What is this stitch tracking? -->

## Member bricks (ordered)

| Order | Brick ID | Title | State |
|-------|----------|-------|-------|
| 1 | BRICK-YYYYMMDD-001 | ... | ACTIVE |
| 2 | BRICK-YYYYMMDD-002 | ... | DRAFT  |

## Summary

<!-- What story do these bricks tell together? -->
```

---

## 6. State-to-State Compliance Foldering

For regulatory or audit purposes, transitions between compliance states are captured in `docs/bricks/compliance/state-to-state/`.

Each transition folder is named `<FROM_STATE>-to-<TO_STATE>-YYYYMMDD/` and must contain:

1. A compliance brick (`BRICK-YYYYMMDD-NNN.md`) describing the transition.
2. Evidence files (screenshots, logs, exported reports) in an `evidence/` sub-directory.
3. A `_checklist.md` confirming all required steps were completed.

**Example:**
```
docs/bricks/compliance/state-to-state/
└── staging-to-production-20260502/
    ├── BRICK-20260502-001.md
    ├── _checklist.md
    └── evidence/
        └── netlify-deploy-screenshot.png
```

---

## 7. Governance of Bricks

- Any contributor may create a **DRAFT** brick.
- Promoting a brick to **ACTIVE** requires a Maintainer to merge the PR containing it.
- Only the Repository Owner may mark a brick **ARCHIVED**.
- Bricks may never be deleted — only transitioned to **ARCHIVED** or **SUPERSEDED**.

---

*For constitutional authority over this specification, see [CONSTITUTION.md](./CONSTITUTION.md).*
