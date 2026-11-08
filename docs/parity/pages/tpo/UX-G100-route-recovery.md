# UX-G100 — Tpo · Batches / BatchId → Calendar / Export (part 3)

## Scope

18 registered page/error/loading surfaces (plus 0 additional route-only entries). This is an engineering UX pass, not a release or security certification.

- `/tpo/batches/[batchId]/registrations/[membershipId]/history/page.tsx`
- `/tpo/batches/[batchId]/reminder-prep/page.tsx`
- `/tpo/batches/[batchId]/rules/page.tsx`
- `/tpo/batches/[batchId]/students/page.tsx`
- `/tpo/calendar/export/page.tsx`
- `/tpo/calendar/page.tsx`

## Implemented on main

- Route-specific failure recovery now keeps the existing retry/action and an explicit safe path to the TPO home, batch list, calendar, company list or placement list, as relevant.
- A failed read is not treated as an empty dataset or successful placement mutation. Sensitive error details are not exposed.
- Loading copy and in-shell error presentation refined where affected. Existing TPO role, tenant, data-service and mutation logic remains in place.
- Source changes: [a0783d5f5baae96ae8baa7be6328603065583f99](https://github.com/42Students/lms-vnext/commit/a0783d5f5baae96ae8baa7be6328603065583f99).

## Remaining acceptance

The new shared recovery fixture is strictly development-flag gated and uses synthetic errors, never real tenant data. It exercises the actual error components at 1280×800 and 390×844, keyboard retry/safe-exit and no overflow; real seeded Learner-denial checks separately verify TPO access boundaries. Those checks are valuable but **do not independently prove all 18 operational surfaces**. Verify relevant live role workflows, existing regression suites and exact-SHA CI before changing this group to DONE.

- Unit: `npx vitest run tests/unit/ux-tpo-ten-recovery.test.ts`
- Browser: `npx playwright test tests/e2e/ux-tpo-ten-recovery.spec.ts --project=chromium --workers=2`
- Workflow: `.github/workflows/ux-tpo-ten-recovery-acceptance.yml`
- Evidence target: [TPO recovery CI runs](https://github.com/42Students/lms-vnext/actions/workflows/ux-tpo-ten-recovery-acceptance.yml)

Status as authored: **DOING — executed acceptance not yet verified**.
