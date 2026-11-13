# Secure development standard, change management and threat modelling (SEC-25-004, 005, 011, 016; SEC-18-003, 004)

Status: written 2026-11-08, needs the owner's approval. It records rules that the repository already enforces and the review steps that remain human.

## Rules the build enforces (cannot be skipped)

| Rule | Enforced by |
|---|---|
| Every API route goes through `route()` / `internalRoute()` / `webhookRoute()` | `npm run security:central` (`route-not-on-wrapper` = 0) |
| Sensitive actions (role, permission, user, export, import, settings) require a fresh sign-in | `sensitive-without-step-up` = 0 |
| No raw `request.json()`, no raw dynamic SQL, no server action without a guard | `raw-request-json`, `sql-raw-dynamic`, `server-action-unguarded` ratchets |
| Every table is classified; every tenant table has a policy | `table-without-tenant-classification`, `tenant-table-without-rls` |
| New routes do not add unvalidated bodies, unbounded pagination or echoed error text | `npm run security:api-surface` ratchet |
| No secrets in source or in the built output | secret scans in CI, `scripts/security/scan-built-bundles.mjs` |
| Unauthenticated callers reach only the public routes | `scripts/verify/unauth-gate.mjs` against `docs/security/baselines/unauth-baseline.json` |
| A role never gains a route silently | `scripts/verify/role-route-matrix.mjs` against the committed baseline |
| UI uses the shared components and tokens | `ux:guard`, `ux:consistency` |

## Review rules (human)

1. Changes to `src/security/`, `src/db/`, `drizzle/`, `deploy/`, `.github/`, `scripts/security/` and package files need the code owner (`.github/CODEOWNERS`). It binds once branch protection is on (OWNER-ACTIONS).
2. A new role, permission or table is a security-model change: add it to `policy.ts`, the role matrix baseline and the table classification in the same change.
3. Prefer a named permission on `route()` over `service-enforced`; a new `service-enforced` route needs a sentence in the pull request saying where the check lives.
4. Migrations are additive and reversible where possible; the owner approves their application to any shared environment.

## Threat modelling (high-risk changes)

Required for: a new sign-in or session path, a new machine-to-machine route, a new file type, a new external provider, a new role, a change to row-level security. Fill in, in the pull request:
- What asset or capability does this add? Who can reach it unauthenticated, as another tenant, as the same tenant but a different user?
- What does an attacker gain if the input is hostile, replayed, or racing a revocation?
- Which existing control stops it (name the guard or test), and which new test proves it?
Result is kept with the change; the architecture document `docs/security/central-security-architecture.md` is updated when a layer changes.

## Change management

Normal: pull request, CI green (the nine required jobs), merge to main, build images by the Build images workflow, deploy to dev by digest, `/ready` and a sign-in check. Emergency: same steps with the incident lead's approval, review afterwards within 48 hours. Production deploys are not automated and need the owner. Rollback: redeploy the previous digest; for row-level security set `PGOPTIONS=-c app.rls_mode=inert` (rehearsed on dev 2026-11-08, `docs/security/rls-rollout.md`).

## Evidence process (SEC-25-016)

Findings and control status live only in `docs/tracker.json`. A control moves with an exact commit and a passing run URL; nothing is VERIFIED without an independent reviewer. Evidence files go in `docs/security/evidence/`; the reviewer pack is regenerated with `node scripts/security/gen-audit-handoff.cjs`; the tracker draft with `node scripts/security/gen-tracker-pending.cjs` and merged with `scripts/security/merge-tracker-pending.cjs`.
