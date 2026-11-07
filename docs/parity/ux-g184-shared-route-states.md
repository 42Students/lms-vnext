# UX-G184 — Shared authenticated route states

**Canonical state: DOING.** Thirteen routed loading/error/not-found surfaces are registered in this group.

## Changes shipped

- `admin/error.tsx` routes recovery to the verified Super Admin Tenant Setup destination `/admin/tenants`.
- `teacher/error.tsx` offers recovery to the Faculty courses destination `/teacher/courses`.
- `admin/loading.tsx`, `teacher/loading.tsx`, `hr/loading.tsx` now supply meaningful spoken load labels to the existing shared skeleton/timeout UX.
- Other tracked states audited and retained: `admin/not-found.tsx`, `college-admin/not-found.tsx`, `hr/error.tsx`, `hr/not-found.tsx`, `teach/error.tsx`, `teach/loading.tsx`, `teach/not-found.tsx`, `teacher/not-found.tsx`. Role-specific back links, shell embedding and responsive shared primitives remain intact.

## Acceptance

- Unit/source tests in `tests/unit/ux-five-group-batch-20261107.test.ts` check homeHref, within-shell fallback, role-specific loading messages and not-found state for all five role families.
- Authenticated browser smoke spec in `tests/e2e/ux-five-group-batch-20261107.spec.ts` covers the faculty course destination at desktop/mobile. This only validates its route when executed; **it does not yet prove actual error/loading/not-found transitions**.
- Need deterministic injected render errors, slow requests, nonexistent routes, reset recovery and focus return in each role, including client-navigation and direct-load variants at 320/390/1280; no unauthorized data after an error.
- Need exact-SHA lint, typecheck, unit and browser executions, captured desktop/mobile artifacts, regression and security review.

**No DONE until required rendered transitions are exercised.**
