# Graceful core verification — chat-14

Tests below are authored but not executed in this lane. DONE on a helper means its named contract is implemented; application-wide call-site adoption and browser acceptance are separate work.

| ID | Status | Evidence |
| --- | --- | --- |
| GR-01 | DONE | `src/lib/friendly-error.ts`; `tests/unit/graceful-api-helpers.test.ts` — GR-01 |
| GR-02 | DONE | `src/lib/friendly-error.ts`; `tests/unit/graceful-api-helpers.test.ts` — GR-02 |
| GR-03 | DONE | `tests/unit/graceful-api-helpers.test.ts` — GR-03 |
| GR-04 | DONE | `src/lib/api-fetch.ts`; `tests/unit/graceful-api-helpers.test.ts` — GR-04 |
| GR-05 | DONE | `src/lib/request-id.ts`, `src/observability/logger.ts`, `src/lib/api-error.ts`; `tests/unit/graceful-api-helpers.test.ts` — GR-05 (shared paths; route-by-route adoption still required) |
| GR-06 | DONE | `src/lib/api-error.ts`; `tests/unit/graceful-server-helpers.test.ts` — GR-06 |
| GR-07 | DONE | `src/lib/api-error.ts`; `tests/unit/graceful-server-helpers.test.ts` — GR-07 |
| GR-08 | DONE | `src/lib/with-api-guard.ts`; `tests/unit/graceful-server-helpers.test.ts` — GR-08 (wrapper; routes adopt separately) |
| GR-10 | DONE | `src/components/ui/inline-notice.tsx`; `tests/unit/graceful-action-helpers.test.ts` — GR-10 |
| GR-30 | DONE | `src/hooks/use-guarded-action.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-30 |
| GR-32 | DONE | `src/lib/conflict-recovery.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-32 |
| GR-33 | DONE | `src/lib/form-validation.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-33 |
| GR-34 | DONE | `src/lib/action-idempotency.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-34 (server dedupe adoption pending) |
| GR-50 | DONE | `src/lib/outbound.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-50 (provider adapters adoption pending) |
| GR-52 | DONE | `src/lib/transaction-retry.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-52 |
| GR-60 | DONE | `src/hooks/use-form-draft.ts`; `tests/unit/graceful-action-helpers.test.ts` — GR-60 |
| GR-11 | DONE | `src/app/global-error.tsx`, `src/app/error.tsx`, `src/app/api/client-errors/route.ts`; `tests/unit/graceful-root-screens.test.ts` — GR-11 |
| GR-12 | DONE | `src/components/public/graceful-error-boundary.tsx`; `tests/unit/graceful-root-screens.test.ts` — GR-12 |
| GR-13 | DONE | `src/app/(authenticated)/*/not-found.tsx` and root; `tests/unit/graceful-root-screens.test.ts` — GR-13 |
| GR-14 | DONE | `src/app/forbidden/page.tsx`; `tests/unit/graceful-root-screens.test.ts` — GR-14 |
| GR-15 | DONE | `src/lib/return-to.ts`; `tests/unit/graceful-root-screens.test.ts` — GR-15 (end-to-end sign-in wiring follows) |
| GR-16 | DONE | `src/components/public/offline-banner.tsx`; `tests/unit/graceful-root-screens.test.ts` — GR-16 |
| GR-17 | DONE | `src/proxy.ts`, `docs/operations/maintenance.md`; `tests/unit/graceful-root-screens.test.ts` — GR-17 |
| GR-22 | DONE | `src/app/layout.tsx`; `tests/unit/graceful-root-screens.test.ts` — GR-22 |
| GR-23 | DONE | `src/components/public/browser-support-notice.tsx`; `tests/unit/graceful-root-screens.test.ts` — GR-23 |
