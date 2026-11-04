# Machine-only scheduler, scanner, and audit-sync boundaries

**Date:** 2026-11-04  
**Repository:** `42Students/lms-vnext`, `main`  
**Status:** Scoped implementation and regression tests authored; GitHub Actions execution and deployment proof **pending**. This is a security engineering receipt, **not** a control-closure tracker or production certification. The only status authority remains `docs/tracker.json`.

## In-scope corrective work

### 1. Notification scheduling worker

`src/app/api/internal/operations/notification-scheduler/route.ts` now rejects **all** requests bearing a browser `Origin` header, whether same-origin or cross-origin. The scheduler authenticates only with its distinct `x-notification-scheduler-key` secret. Configuration with fewer than 32 or more than 256 UTF-8 bytes, leading/trailing whitespace, or any internal whitespace fails closed. Unexpected URL query parameters are rejected before the job is selected. The existing bounded JSON, exactly-one `jobName` field, fixed job allowlist, readiness flag, distributed lease, and no-store responses are preserved.

Relevant change: [machine-only notification scheduler fix](https://github.com/42Students/lms-vnext/commit/0a2564fef38ab11b0e6fdf74fc34ed819172859f).

### 2. Malware scanner verdict callback

`src/app/api/internal/storage/scan-verdict/route.ts` now disallows a browser `Origin` and any callback query parameters. During parallel development, its scanner credential validation was consolidated by another contributor into `src/modules/storage/scan-verdict-request-guard.ts`; current tests and global security scan explicitly recognize and inspect that delegation. Do not mistake the scanner service's private R2 HEAD and DB generation checks for an actual deployed malware engine: release acceptance still needs independent scanner deployment and clean/infected fixture proof.

Relevant change: [machine-only scanner callback fix](https://github.com/42Students/lms-vnext/commit/93e39636cc5429388a72ddc98fea5d4caa400097).

### 3. Audit-findings synchronization

The machine-only Cloud Scheduler GET endpoint was additionally hardened against weak bearer credentials, browser-origin calls, arbitrary query parameters, and request bodies. Another contributor subsequently extracted the shared decision into `src/modules/bug-tracker/audit-cron-request-guard.ts`. The independent additional endpoint regression matrix is included in that contributor's dedicated `security-audit-cron.yml` gate. Its documented GET contract remains unchanged.

Relevant changes: [initial audit endpoint hardening](https://github.com/42Students/lms-vnext/commit/32ab4194f4789d8abb94e22fa560bfca8a5a5ac4); [independent audit endpoint tests](https://github.com/42Students/lms-vnext/commit/520b948d6b997e959fab6623f9f585ca5ad5b876); [existing audit cron gate expanded](https://github.com/42Students/lms-vnext/commit/83badafe77e092ecdb34249b5ecf802f5a2898f2).

## Regression and gate changes

- `tests/unit/security-machine-only-scheduler-and-scanner.test.ts` exercises origin denial (including same-origin), configured secret failures, wrong worker tokens, unexpected query parameters, 2 KiB scanner body limits, readiness refusal, legitimate scheduled notification job, and valid signed scanner callback, with worker/database side effects mocked.
- `tests/unit/api-origin-guard.test.ts` now documents these **machine-only** exceptions to its browser-origin static scan, and checks their no-Origin rule plus timing-safe credential handling in the correct route or delegated module. Ordinary cookie-authenticated APIs retain the existing same-origin requirement.
- `.github/workflows/security-machine-workers.yml` runs the two suites whenever the touched routes, delegated scanner guard, or those tests change.
- `.github/workflows/security-audit-cron.yml` separately includes the independent audit-sync endpoint tests.

Relevant changes: [machine worker regression matrix](https://github.com/42Students/lms-vnext/commit/50de515c4a2602c6ec6e1276ef1ba59a7bd3ebfa); [global source guard compatibility](https://github.com/42Students/lms-vnext/commit/65ca19fb1ac192191ebcb2354f8eb1d2a9931c3e); [machine worker CI gate](https://github.com/42Students/lms-vnext/commit/2e309af55f854309c167ab7c7e2f5665d300da0d).

## Current test evidence and limitations

The focused [machine-worker GitHub Actions run](https://github.com/42Students/lms-vnext/actions/runs/41835748039) finished **failure with zero executed job steps**; this **does not** establish a passing or failing application assertion. In this connector-only session there is no checked-out full repository or registered disposable PostgreSQL environment, so the authored Vitest tests were not executed here. Do not mark the relevant `SEC-08-017`, `SEC-15-007`, `SEC-16-001`, or `SEC-16-014` controls as `VERIFIED` or `PARTIAL_EVIDENCE` based only on source changes.

## Before production promotion

1. Execute the exact-commit Vitest suites, typecheck, and method/API gate in an approved environment after workflow runners are restored.
2. Confirm external Cloud Scheduler and scanner clients never send browser `Origin` headers; retest both real authorized and denied requests through the production ingress. Worker secrets must be independently generated, rotated, and stored in secret management, never in Git.
3. Review Cloud Scheduler identity, route reachability, distributed idempotency/lease, scanner network isolation and database role grants; prove that a stolen non-worker cookie cannot trigger a machine job.
4. Prove scanner full-object validation using clean/infected fixtures, object-generation overwrite races, upload-URL expiry, tenant mismatch, replay and compromise revocation on disposable PostgreSQL and private object storage.
5. Enforce branch protection and independent security review. The program's current source changes cannot substitute for runtime attacker-model tests or operational control evidence.
