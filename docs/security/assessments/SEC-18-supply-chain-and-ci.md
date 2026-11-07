# SEC-18 secure development and software supply chain: assessment (2026-11-08)

Method: read of `.github/` (224 workflows, CODEOWNERS, dependabot.yml), GitHub API alerts, lockfile. Nothing VERIFIED.

| Control | Finding | Proposed state |
|---|---|---|
| 001 branch protection | The ruleset on `main` was disabled by the owner on 2026-11-05; anyone with write access pushes straight to `main` (the GPT lanes and Claude do) | GAP (owner item 6) |
| 003, 004 review of sensitive paths, second owner | `CODEOWNERS` names the owner for `/src/security/` and `/src/db/`; it binds only with branch protection and a second person | PARTIAL (owner) |
| 006 MFA for developers | Not readable from the repository | UNASSESSED (owner: GitHub organisation setting) |
| 007 short-lived CI credentials | CI uses the default `GITHUB_TOKEN`; no cloud credentials in GitHub (images are built on Actions and pushed from the owner's laptop); the only `id-token: write` is in `deploy-development.yml`, which is not used | IMPLEMENTED_UNVERIFIED |
| 008 production secrets in PR jobs | No workflow references a repository secret (one file name contains the word); no `pull_request_target` trigger; no `workflow_run` chaining | IMPLEMENTED_UNVERIFIED |
| 009 pin third-party actions | All 616 `uses:` lines in 224 workflows were pinned to commit SHAs on 2026-11-08 (`actions/checkout`, `setup-node`, `upload-artifact`, `github-script`, `setup-go`, `oven-sh/setup-bun`, `google-github-actions/auth` and `setup-gcloud`); the version stays as a trailing comment; Dependabot's github-actions ecosystem proposes updates | IMPLEMENTED_UNVERIFIED |
| Least-privilege tokens | Every one of the 224 workflows has a top-level `permissions:` block; write scopes appear in 1 (`contents`), 9 (`statuses`) and 1 (`id-token`) | IMPLEMENTED_UNVERIFIED |
| 011, 019 dependency updates | `dependabot.yml` (npm weekly, groups, actions); 2 open medium alerts, both in dev tooling, recorded in `accepted-risks.md` | IMPLEMENTED_UNVERIFIED |
| 012 SAST | `security:central` ratchet (route wrapper, server actions, tenant tables, dynamic `sql.raw`), ESLint, the "authz critical boundary" and API gate workflows; no CodeQL or Semgrep | PARTIAL: add CodeQL (free for private repos on Enterprise only; check plan) |
| 013 secret scanning | Workflows "no new committed credentials", "reject committed credential artifacts", "full history secrets"; all green on main | IMPLEMENTED_UNVERIFIED |
| 014 container and IaC review | Dockerfile builds `migrator` and `runner` targets; manifest hardened (see SEC-17); no image scan, no Dockerfile or manifest linter in CI | GAP |
| 016, 017 artifact integrity and provenance | Images are pushed by tag from a downloaded Actions artifact; no signature, no provenance attestation, no digest pinning in the manifest | GAP |
| 021 review of new identity or crypto libraries | No written rule; `package.json` additions are not gated | GAP: add a CODEOWNERS line for `package.json` and lockfile |

Safe next steps without the owner: CODEOWNERS entries for `package.json`, `package-lock.json`, `.github/`, `deploy/` and `drizzle/`; digest pinning in `deploy-from-artifact.ps1`; an image scan step (needs a pinned third-party action, to be reviewed first).
