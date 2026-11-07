# UX-G178 — People exports and CSV workflows

**Canonical state: DOING.** Group inventory: eleven `src/modules/people` model/service files.

## Implemented correctness improvements

- `college-people-export-model.ts`: reusable `appendUniquePeopleCsvRows` deduplicates member IDs across overlapping result pages, enforces the cap, and renderer slices to the published CSV cap.
- `college-people-export-service.ts`: deduplicates paginated directory results and reports truncated/incomplete exports rather than silently presenting a shorter CSV as exhaustive.
- `admin-users-export-service.ts`: deduplicates super-admin paginated membership results and propagates incomplete count instead of a false complete result.
- Other tracked files audited: `admin-users-export-model.ts`, `college-contacts-export-model.ts`, `college-contacts-export-service.ts`, `college-faculty-csv-columns.ts`, `college-faculty-csv-service.ts`, `college-role-directory-export-service.ts`, `college-student-csv-model.ts`, `college-student-csv-service.ts`. Existing auth, tenant scoping, formula neutralization, previews and confirmed imports are not weakened.

## Required proof

- Unit regression `tests/unit/ux-five-group-batch-20261107.test.ts` covers overlaps, cap 1000, truncation source contract, and presence of college-scoped permission gate.
- Playwright `tests/e2e/ux-five-group-batch-20261107.spec.ts` tests 1280px/390px People Directory and role-negative CSV access; screenshots only become proof when actually executed.
- Still need exact-SHA `npm run lint`, `npm run typecheck`, `npm test`, and database-integrated pagination overlap/concurrent insert/delete simulations with actual CSV count/header rows.
- Check all eleven exports/imports for security boundaries, CSV injection, PII masking, duplicate identities, structural malformed CSV, empty/oversize file, 500/1000 caps, partial imports and downloaded filename/content-type/cache headers.
- Verify desktop/mobile download and error feedback with temporary authorized test accounts, plus a non-admin/foreign-college denial.

**No DONE until all eleven related surfaces have supporting test/browser/privacy evidence and final security/regression reviews.**
