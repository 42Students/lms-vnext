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

## Unit-failures-r1 response (2026-10-17)

The cloud report `docs/orchestrator/unit-failures-r1.md` lists seven chat-14 assertions. This branch contains **source or assertion repairs for GR-11, GR-53, GR-35, GR-19, GR-20**, and tighter GR-09/GR-31 scan semantics. All 509 detected page/layout segments now have `loading.tsx` and `error.tsx` as inspected from the branch Git tree; live execution is still pending.

- GR-11: `tests/unit/graceful-merge-syntax.test.ts` checks supported browser-report fields, rejects malformed/unknown ones.
- GR-53: `src/components/auth/login-form.tsx` now sanitizes the API-provided fallback destination, matching the existing named regression.
- GR-35: `src/components/ui/confirm-action-dialog.tsx` no longer contains a misleading browser-confirm pattern in its comment; accessible dialog retained.
- GR-19, GR-20: eight new route boundaries under admin placements student lookup and TPO discussion, overview, team; `tests/unit/graceful-route-coverage.test.ts` enforces both IDs across the entire app.
- GR-09, GR-31: `tests/unit/graceful-raw-error-scan.test.ts` adds ID-named regressions for safe local Zod issue trees and telemetry exemptions. **Known global failing conditions in account-lane components remain; not represented as passing or as BLOCKED under the strict protocol.** Account lanes must address real raw-code sinks and unguarded writes, not widen the baseline.
- No new OPEN GR item was found in `graceful-chat-14.md`; GR-51 continues to need verified provider-side acceptance and idempotency. Existing DONE labels describe authored implementations, not executed acceptance. Tests were not run by this lane.


## Refreshed test list: chat-14 round 3

`unit-failures-r1.md` refreshed at 18:50 still reports **GR-09 and GR-31**. This branch has no executed proof yet.

| ID | Current evidence and limitation |
| --- | --- |
| GR-09 | `tests/unit/graceful-raw-error-scan.test.ts` now explicitly tests both direct raw-code JSX expressions and local Zod issue tree exemptions; every changed component at baseline comparison snapshot was inspected. The code is authored, but the cloud test must be rerun. |
| GR-31 | `src/components/auth/membership-chooser.tsx` + `tests/unit/graceful-login-guards.test.ts` demonstrate actual guarded, friendly membership switching (GR-04/GR-30/GR-31 named). Static scan inventory in `docs/audit/graceful/gr31-outstanding-mutations-r1.md` identifies 27 **unfixed** account-lane business-write components. The global GR-31 scanner remains expected to fail until owners adopt the guard. |

This audit does **not** mark the remaining 27 violations DONE, NOT-A-GAP or BLOCKED. The initial DONE row for GR-31 denotes the shared regression gate, not application-wide adoption. GR-51 is still provider-blocked.


## Round 4 — GR-04 / GR-30 / GR-31 / GR-35 adoption evidence

Shared guarded-action adoptions on the chat-14 branch, authored but not run:

| ID | Status | Source and ID-named test |
| --- | --- | --- |
| GR-04 / GR-30 / GR-31 | DONE on eight listed call sites only | `src/components/activity/notification-toolbar.tsx`, `learner-notifications-inbox.tsx`, `src/components/admin/department-create-form.tsx`, `super-admin-batch-graduate-action.tsx`, `src/components/courses/resource-progress-control.tsx`, `src/components/placements/tpo-public-placement-toggle.tsx`, `src/components/tpo/tpo-new-followup-modal.tsx`, `tpo-placement-cell-read-action.tsx`; `tests/unit/graceful-mutation-adoption-round4.test.ts`, eight individual GR-31-named tests |
| GR-35 | DONE on shared notification toolbar | `src/components/activity/notification-toolbar.tsx` uses `ConfirmActionDialog` instead of a native blocking confirmation; `tests/unit/graceful-mutation-adoption-round4.test.ts` — GR-35 |
| GR-31 | OPEN: global adoption still incomplete | `docs/audit/graceful/gr31-outstanding-mutations-r1.md`: **19** account-lane business-write components still lack `useGuardedAction`. The global `tests/unit/graceful-raw-error-scan.test.ts` remains a live failing gate until fixed; do not refresh the SHA baseline to fake a pass. |
| GR-51 | BLOCKED | Real provider delivery acceptance/idempotency guarantees are still required before automatic resend can safely be enabled. |

The 43 prior DONE core entries describe existing helpers and screens, not newly closed GR IDs this round. There are no further explicitly OPEN core queue entries. No migrations proposed. Tests were written but not run in this lane.
