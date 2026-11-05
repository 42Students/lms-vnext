# Security execution order

Written 2026-11-05. This is a working order, not a status source. Status lives only in `docs/tracker.json` under `security` (see [tracker-integration.md](tracker-integration.md)). The requirements are in [control-catalog.md](control-catalog.md), the release gates in [acceptance-matrix.md](acceptance-matrix.md).

It also absorbs the engineering checks in [../planning/vnext-tightening-plan.md](../planning/vnext-tightening-plan.md). Where the two overlap, do the step once and record it against the control.

## State on 2026-11-05

- Tracker: 0 of 493 controls verified, 28 partial evidence, 1 confirmed gap (`SEC-18-002`, `main` not protected), 464 unassessed. Release sign-off is not approved.
- A ruleset requiring pull requests, one approval, up-to-date branches and these checks was created on 2026-11-05 and then set to `disabled` the same day: `lint`, `typecheck`, `unit`, `db00-scope`, `source-contracts`, `schema-drift`, `database`, `build`, and the 493-control completeness check. `SEC-18-002` stays open until it is enforcing again.
- CI on `main` (commit `46365be787`) fails 6 of those checks, so the ruleset could not be enforced while red:

| Check | Failure |
|---|---|
| `typecheck`, `build` | 8 errors, all `TS2345`, in API routes where an `unknown` request body is passed to a typed function. They came in with the bounded-body commits, for example `b1df78af4d` |
| `lint` | 1 error, plus 315 warnings |
| `unit` | 91 tests in 45 files |
| `database` | 345 tests in 78 files, mostly `PROJECT_ACCESS_DENIED` and `Missing permission: placements.manage` |
| `db08-staged-acceptance` | 2 tests expect `placements.manage` but now get `membership.role.m…` |

- The dev deployment runs an older hotfix branch, not `main`. It has none of the security work. Its image build skips the type check (`SKIP_BUILD_TYPECHECK` in the `Dockerfile`), so CI is the only type check.

## Order

### Gate 0: make CI trustworthy

Nothing else is trusted until this is done, and it must not be done by weakening tests.

1. Fix the 8 `TS2345` errors by parsing and validating the body with the route's own schema, not by casting.
2. Fix the lint error.
3. For every failing unit, database and `db08` test, decide which of these it is, and record the answer in the commit message:
   - the test still expects old behaviour that a security control deliberately changed: update the test and name the control;
   - the fixture lacks what the control now requires (explicit selected role, live grant): fix the fixture;
   - the code is wrong and the control broke a real feature: fix the code and tell the owner.
   Do not delete, skip or loosen a test to get green.
4. Confirm the required checks pass on the exact SHA, then ask the owner to re-enable the ruleset and re-query it (`SEC-18-002`).
5. Make `scripts/deploy-from-artifact.ps1` refuse a commit whose checks did not all pass, then remove `SKIP_BUILD_TYPECHECK`.

### Phase A: find out how big the job is

Assess the 464 unassessed controls and sort them by what happens if the control is missing. Use `node scripts/tracker.mjs --security-next` for the live queue. An assessment records what the code does today and what proof is missing. It is not a fix and does not change a state to `VERIFIED`.

### Phase B: the core (SP-02, SP-03, SP-04, SP-01)

Finish these completely before moving on:

- tenant and resource isolation, including exports, reports, storage and counts
- real database access: actual runtime role, `BYPASSRLS` absent, policies and grants, drift detection
- every exported HTTP method classified, with object and tenant checks proved
- selected-role isolation and fresh step-up for sensitive actions

Each needs executed positive and negative tests on an exact SHA against disposable PostgreSQL using the restricted runtime role.

### Phase C: the rest

Secrets and storage (SP-05), workers and integrations (SP-06), infrastructure and supply chain (SP-07), detection, incidents and recovery (SP-08), governance (SP-10), then the independent review (SP-09).

## Owner-only items

Claude does not do these.

- Rotate the production database password, and remove it from `query.sh` in the local `42LMS` folder.
- Decide whether to delete the GCP service account key `a9dd3b20eb41`. It is also this laptop's gcloud login, so deleting it breaks deploys from here until a replacement exists.
- Revoke the dev TPO session token that was printed in a chat session on 2026-11-03.
- Re-enable the ruleset once CI is green.
- An external penetration test costs money. Decide separately.
- Dev needs a deploy of `main`, including migration `0332`, before any hardening can be checked there. Hold this until Gate 0 is done.

## Rules for whoever does the work

- Pin the `main` SHA before starting, and fetch again before pushing.
- Never mark a control `VERIFIED` from a green workflow. Follow the evidence levels in [README.md](README.md).
- Never test against production data, and never touch production.
- Do not put credentials in Git, logs or chat.
- Keep fixes small and one concern per commit, so a failing check can be traced.
