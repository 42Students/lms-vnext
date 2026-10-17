# Graceful core verification — chat-14

Tests below are authored but not executed in this lane. DONE on a helper means its named contract is implemented; application-wide call-site adoption and browser acceptance are separate work.

| ID | Status | Evidence |
| --- | --- | --- |
| GR-01 | DONE | `src/lib/friendly-error.ts`; `tests/unit/graceful-api-helpers.test.ts` — GR-01; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-01 edge regression (authored, not run) |
| GR-02 | DONE | `src/lib/friendly-error.ts`; `tests/unit/graceful-api-helpers.test.ts` — GR-02; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-02 edge regression (authored, not run) |
| GR-03 | DONE | `tests/unit/graceful-api-helpers.test.ts` — GR-03; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-03 edge regression (authored, not run) |
| GR-04 | DONE | `src/lib/api-fetch.ts`; `tests/unit/graceful-api-helpers.test.ts` — GR-04; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-04 edge regression (authored, not run) |
| GR-05 | DONE | `src/lib/request-id.ts`, `src/observability/logger.ts`, `src/lib/api-error.ts`; `tests/unit/graceful-api-helpers.test.ts` — GR-05 (shared paths; route-by-route adoption still required); `tests/unit/graceful-core-edge-regressions.test.ts` — GR-05 edge regression (authored, not run) |
| GR-06 | DONE | `src/lib/api-error.ts`; `tests/unit/graceful-server-helpers.test.ts` — GR-06; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-06 edge regression (authored, not run) |
| GR-07 | DONE | `src/lib/api-error.ts`; `tests/unit/graceful-server-helpers.test.ts` — GR-07; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-07 edge regression (authored, not run) |
| GR-08 | DONE | `src/lib/with-api-guard.ts`; `tests/unit/graceful-server-helpers.test.ts` — GR-08 (wrapper; routes adopt separately); `tests/unit/graceful-core-edge-regressions.test.ts` — GR-08 edge regression (authored, not run) |
| GR-10 | DONE | `src/components/ui/inline-notice.tsx`; `tests/unit/graceful-action-helpers.test.ts` — GR-10; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-10 edge regression (authored, not run) |
| GR-30 | DONE | `src/hooks/use-guarded-action.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-30; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-30 edge regression (authored, not run) |
| GR-32 | DONE | `src/lib/conflict-recovery.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-32; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-32 edge regression (authored, not run) |
| GR-33 | DONE | `src/lib/form-validation.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-33; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-33 edge regression (authored, not run) |
| GR-34 | DONE | `src/lib/action-idempotency.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-34 (server dedupe adoption pending); `tests/unit/graceful-core-edge-regressions.test.ts` — GR-34 edge regression (authored, not run) |
| GR-50 | DONE | `src/lib/outbound.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-50; adopted provider paths below; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-50 edge regression (authored, not run) |
| GR-52 | DONE | `src/lib/transaction-retry.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-52; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-52 edge regression (authored, not run) |
| GR-60 | DONE | `src/hooks/use-form-draft.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-60; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-60 edge regression (authored, not run) |
| GR-11 | DONE | `src/app/global-error.tsx`, `src/app/error.tsx`, `src/components/public/graceful-error-boundary.tsx`, `src/app/api/client-errors/route.ts`; `tests/unit/graceful-root-screens.test.ts`, `tests/unit/graceful-merge-syntax.test.ts` — GR-11 (UUID browser report accepted by chat-16 schema and correlated with visible 8-character reference); `tests/unit/graceful-core-edge-regressions.test.ts` — GR-11 edge regression (authored, not run) |
| GR-12 | DONE | `src/components/public/graceful-error-boundary.tsx`; `tests/unit/graceful-root-screens.test.ts` — GR-12; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-12 edge regression (authored, not run) |
| GR-13 | DONE | `src/app/(authenticated)/*/not-found.tsx` and root; `tests/unit/graceful-root-screens.test.ts` — GR-13 |
| GR-14 | DONE | `src/app/forbidden/page.tsx`; `tests/unit/graceful-root-screens.test.ts` — GR-14 |
| GR-15 | DONE | `src/lib/return-to.ts`; `tests/unit/graceful-root-screens.test.ts` — GR-15 (session-response guard, authenticated layout and OTP return are wired; browser acceptance pending); `tests/unit/graceful-core-edge-regressions.test.ts` — GR-15 edge regression (authored, not run) |
| GR-16 | DONE | `src/components/public/offline-banner.tsx`; `tests/unit/graceful-root-screens.test.ts` — GR-16; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-16 edge regression (authored, not run) |
| GR-17 | DONE | `src/proxy.ts`, `docs/operations/maintenance.md`; `tests/unit/graceful-root-screens.test.ts` — GR-17; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-17 edge regression (authored, not run) |
| GR-22 | DONE | `src/app/layout.tsx`; `tests/unit/graceful-root-screens.test.ts` — GR-22; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-22 edge regression (authored, not run) |
| GR-23 | DONE | `src/components/public/browser-support-notice.tsx`; `tests/unit/graceful-root-screens.test.ts` — GR-23; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-23 edge regression (authored, not run) |
| GR-18 | DONE | `src/lib/db-outage.ts` and `src/lib/api-error.ts`; `tests/unit/graceful-server-helpers.test.ts` — GR-18 (central API fallback); `tests/unit/graceful-core-edge-regressions.test.ts` — GR-18 edge regression (authored, not run) |
| GR-54 | DONE | `src/lib/api-error.ts`; `tests/unit/graceful-server-helpers.test.ts` — GR-54 (central error handler only); `tests/unit/graceful-core-edge-regressions.test.ts` — GR-54 edge regression (authored, not run) |
| GR-19 | DONE | `src/components/ui/graceful-page-loading.tsx`, 203 new loading boundaries; `tests/unit/graceful-route-coverage.test.ts` — GR-19 |
| GR-20 | DONE | 207 new error boundaries; `tests/unit/graceful-route-coverage.test.ts` — GR-20 |
| GR-09 | DONE | `tests/unit/graceful-raw-error-scan.test.ts` — GR-09; immutable existing-file SHA allowlist in `docs/audit/graceful/raw-error-allowlist.json`; `tests/unit/graceful-core-edge-regressions.test.ts` — GR-09 edge regression (authored, not run) |
| GR-31 | DONE | `tests/unit/graceful-raw-error-scan.test.ts` — GR-31 (new violations gate; existing component adoption remains with account lanes) |
| GR-35 | DONE | `src/components/ui/confirm-action-dialog.tsx`; `tests/unit/graceful-ui-primitives.test.ts` — GR-35 (shared primitive; per-page adoption pending) |
| GR-36 | DONE | `src/components/ui/disabled-reason.tsx`; `tests/unit/graceful-ui-primitives.test.ts` — GR-36 (shared primitive; per-page adoption pending) |
| GR-37 | DONE | `src/lib/safe-format.ts`; `tests/unit/graceful-ui-primitives.test.ts` — GR-37 (shared primitive; per-page adoption pending) |
| GR-38 | DONE | `src/lib/safe-format.ts`; `tests/unit/graceful-ui-primitives.test.ts` — GR-38 (shared primitive; per-page adoption pending) |
| GR-39 | DONE | `src/components/ui/long-text.tsx`; `tests/unit/graceful-ui-primitives.test.ts` — GR-39 (shared primitive; per-page adoption pending) |
| GR-40 | DONE | `src/lib/upload-validation.ts + src/lib/upload-progress.ts`; `tests/unit/graceful-ui-primitives.test.ts` — GR-40 (shared primitive; per-page adoption pending); `tests/unit/graceful-core-edge-regressions.test.ts` — GR-40 edge regression (authored, not run) |
| GR-56 | DONE | `src/components/ui/third-party-link.tsx`; `tests/unit/graceful-ui-primitives.test.ts` — GR-56 (shared primitive; per-page adoption pending) |
| GR-62 | DONE | `src/hooks/use-form-draft.ts`; `tests/unit/graceful-ui-primitives.test.ts` — GR-62 (shared primitive; per-page adoption pending); `tests/unit/graceful-core-edge-regressions.test.ts` — GR-62 edge regression (authored, not run) |
| GR-64 | DONE | `src/lib/safe-download.ts`; `tests/unit/graceful-ui-primitives.test.ts` — GR-64 (shared primitive; per-page adoption pending); `tests/unit/graceful-core-edge-regressions.test.ts` — GR-64 edge regression (authored, not run) |
| GR-53 | DONE | `src/components/auth/login-form.tsx`; `tests/unit/graceful-login-guards.test.ts`, `tests/unit/graceful-merge-syntax.test.ts` — GR-53 (reapplied to latest main clean login: guarded apiFetch, timeout, resend/email fallback and returnTo; legacy wording preserved) |

| GR-55 | DONE | `src/lib/background-job.ts`; `tests/unit/graceful-background-import.test.ts` — GR-55 (worker adoption pending) |
| GR-63 | DONE | `src/lib/import-preview.ts`; `tests/unit/graceful-background-import.test.ts` — GR-63 (import-route adoption pending) |
| GR-51 | BLOCKED | Provider acceptance/idempotency verification needed before automatic outbound retry; `src/modules/messaging/service.ts` receipts exist but have no safe retry worker |

## 2026-10-17 shared-layer edge pass

- Re-examined all 29 existing DONE GR contracts listed above; authored an additional named regression for each in `tests/unit/graceful-core-edge-regressions.test.ts`. These tests are **not executed** by chat-14; the orchestrator must run them before making runtime acceptance claims. Existing DONE statuses are inherited; this pass does not establish new runtime verification.
- GR-60 / GR-62: `src/hooks/use-form-draft.ts` now installs exit handlers on mount, flushes the latest edit synchronously on `pagehide` and `beforeunload`, and does not replace a user edit that arrives before late local-storage restoration.
- GR-40 / GR-54: `src/lib/upload-progress.ts` now translates all failed XHR statuses through `friendlyApiError`, including rate limit and session failures; selected files remain caller-owned for retry.
- **Queue disposition:** no OPEN GR entries remain in the chat-14 core queue at this revision. GR-51 remains BLOCKED pending provider delivery idempotency and acceptance, and cannot be truthfully reported DONE; cross-application adoption and live browser acceptance remain responsibilities of the assigned lanes and orchestrator.
