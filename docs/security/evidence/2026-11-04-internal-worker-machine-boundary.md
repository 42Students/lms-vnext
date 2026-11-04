# Internal worker machine-boundary hardening — 2026-11-04

**Evidence classification:** implemented source changes and authored adversarial tests; **not independently verified**. This is a technical receipt only. The single source of truth for completion remains `docs/tracker.json`, under `security.controls`. Do not mark a control VERIFIED from this document.

## Scope and committed changes

A dedicated security slice hardened six server-to-server endpoints. All changes were committed directly to `main`; these endpoint source files and test files were re-read from current `main` after the commits.

| Endpoint | Code commit | Boundary |
|---|---|---|
| `POST /api/internal/notifications/release` | `56dd870f69af845362caa41983f416f49d9a43e0` | Require >=32-byte independent bearer secret, deny browser Origin, query and body, no-cache success and failure, generic worker failure |
| `POST /api/internal/placements/tpo/notices/deliver` | `c35a3d62fc7aad88c0112d6d22391070815813e2` | Keep constant-time scheduler key, validate UTF-8 secret byte length, deny Origin, query and body, no-store all responses |
| `POST /api/internal/placements/tpo/withdrawal-escalations/run` | `c70272c04640d589c1129078b0ec97ed6bfe5d02` | Same TPO machine boundary, preserve its fenced job/lease |
| `POST /api/internal/mentor-project-email-dispatch` | `487ded8afe19f57778c0697f9a8e37c4564acd73` | Deny Origin/query/body before readiness and dispatch, retain existing timing-safe bearer check and no-store |
| `POST /api/internal/placements/tpo/offer-expiry/run` | `d88768728bd6df91b27bf2ebdcfe5a60ba8f4a61` | Deny browser Origin, query and body, keep independent long scheduler secret and worker readiness, no-store all responses |
| `GET /api/internal/placements/tpo/scheduler-status` | `1c9319088e17f836d46c54231166c674b6108f80` | Deny browser Origin/query, maintain constant-time long-secret check, no-store even on unauthorized/error responses |

The earlier independent alert scheduler and Telegram webhook changes remain distinct from this slice and are not counted again here.

## Regression files authored

- `tests/unit/internal-notification-release-security.test.ts`: 8 cases (commit `9e836aea8b89dbafcd31160f1a4ce5fe1efdb1b0`).
- `tests/unit/tpo-scheduler-machine-boundary.test.ts`: six cases parameterized over two endpoints = 12 cases (commit `b66e33f5d2e0d45d575bc816854431defee7ac14`).
- `tests/unit/tpo-offer-expiry-machine-boundary.test.ts`: 8 cases (commit `f65d5a81cdfbee3225588ea89603bdbbb17c9751`).
- `tests/unit/tpo-scheduler-status-machine-boundary.test.ts`: 6 cases (commit `032206952de59fc80d2fd4ecd5dfe4e68021dfe2`).
- `tests/unit/mentor-project-email-dispatch-route.test.ts`: 2 extra cases (commit `1f2efcc619ae96177b5745cd39bb3523ed4bc6d2`).

**Total incremental adversarial/positive cases authored: 36.** This is not a passed-test count.

Tests cover weak/missing/mismatched secrets, valid credentials with injected job/tenant parameters, browser Origin with a correct machine credential, non-empty bodies (including forged `Content-Length: 0`), valid empty requests and non-disclosure of backend error detail. TPO tests assert only the predetermined registered job identity may dispatch. These do not substitute for deployed controls.

## Evidence gaps and acceptance commands

**NOT VERIFIED:** GitHub Actions runs at the observed `e3da1b74b57c5f2a258f4c2ecedb9ba3eef14f0b` head reported failures for unit/typecheck/lint and other jobs, with no executed step details; the unit-job log download returned unavailable. Do not infer that the tests passed, or that those failures were caused by this batch.

Execute on an identified **latest, clean** commit, then retain actual run receipts:

```bash
npx vitest run \
  tests/unit/internal-notification-release-security.test.ts \
  tests/unit/tpo-scheduler-machine-boundary.test.ts \
  tests/unit/tpo-offer-expiry-machine-boundary.test.ts \
  tests/unit/tpo-scheduler-status-machine-boundary.test.ts \
  tests/unit/mentor-project-email-dispatch-route.test.ts \
  tests/unit/api-origin-guard.test.ts \
  tests/unit/internal-alert-tick-security.test.ts \
  tests/unit/telegram-webhook-boundary-security.test.ts
npm run typecheck
npm run lint
```

Additionally verify deployment-specific machine credentials are independently generated, at least 32 high-entropy bytes, provisioned through the secret store, scoped per environment, rotated, and inaccessible to users or logs. Confirm all existing CronJobs and service-to-service callers send **no browser Origin, query string or request body**. Verify worker network exposure/IAM restrictions, bounded job concurrency, authorization and tenant isolation inside each downstream worker, and the actual production ingress/grants. Exercise one authorized scheduler invocation per affected job in a disposable or authorized staging environment, then confirm side effects occur exactly once. Inspect every reject path for zero side effects.

The repository branch protection and other global security controls are independent open governance/release gates; no broad domain closure should be inferred from this limited boundary hardening.
