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
