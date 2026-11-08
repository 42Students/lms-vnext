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

## Executed additional negative authorization browser proof — 8 November 2026

- [Exact-SHA CI run 42469427421](https://github.com/42Students/lms-vnext/actions/runs/42469427421) **SUCCEEDED** at `9eedcf0e661d63ca383f03e66d47f9bda721d8b6`. The expanded shared suite completed 17 responsive/role/browser checks on isolated seeded PostgreSQL, including an authorized College Admin directory followed by a direct filtered People CSV call without a recent OTP device session. The endpoint denied export; no CSV content or attachment headers were returned.
- This is deliberate protection of personal data, **not** successful positive CSV download acceptance. All eleven related serializer/import/export models still need complete malformed/empty/cap/overlap/privacy scenarios and a genuinely recent-device-authenticated positive download with current tenant scope. **G178 remains DOING.**

## PostgreSQL multi-page acceptance — 8 November 2026

- [Exact-SHA CI run 42475241236](https://github.com/42Students/lms-vnext/actions/runs/42475241236) **SUCCEEDED**, at commit `973c8ee60312bf0eeb8a654c3ff19ebbe1b6e7cf`. The workflow checks full TypeScript, scoped ESLint, real reset+seed against a disposable PostgreSQL instance, dedicated export model/encoding/contacts/security unit suites and the integrated People CSV test.
- The new `tests/integration/college-people-export.test.ts` fixture inserts **105 real active Mentor memberships** belonging to the seeded college, fetches them through two 100-row directory pages, checks 105 distinct exported membership IDs with one header and no false truncation, and confirms the same names are invisible to a foreign college. The test also covers filtered role selection, spreadsheet formula neutralization, and forged role/tenant rejection, then cleans up every inserted row.
- The separate [shared browser run 42469427421](https://github.com/42Students/lms-vnext/actions/runs/42469427421) confirms the actual People CSV HTTP endpoint refuses a seeded College Admin lacking recent OTP device authentication. The database-backed service test does not emulate device authentication and is not a privileged HTTP export receipt.
- **Remaining group-wide closure:** positive recently-OTP-authenticated browser downloads, all eleven models/flows at empty/cap/error/PII cases, import failure recovery and full responsive keyboard review. These gates have not been waived; status stays **DOING**.

## Unicode spreadsheet formula safety hardening — 8 November 2026

- Commit `a9e6c81bf8f77b47900c6e0bd1379a39cbdec194`: `college-student-csv-model.ts` now uses the canonical `spreadsheetCsvCell` guard for student import report cells. The previous whitespace-only formula detection missed zero-width and combining-mark prefixes ahead of `=`, `+`, `-`, and `@`.
- Commit `13cf40120606776535eb2e1015aa9f87540b5d96`: `college-contacts-export-model.ts` now uses the same guard, covering `Mc` and `Me` mark classes as well as already covered Unicode controls.
- Commits `495b0ac8ea192ce946f80b31014024f44081ad6d` and `1e7a4e3fec13cbdfbd5dbbfb289569cd3154405e`: `tests/unit/ux-five-group-batch-20261107.test.ts` validates formula-like Unicode inputs in actual student import report CSV output and contact-export cell serializers, while preserving ordinary text/quoted-field compatibility.
- Dedicated CI workflows cover these tests in their existing UX component and People CSV regression jobs. **Workflow creation/triggering is not evidence of success**; record the passing exact-SHA run before promoting any individual acceptance claim.
- **Still DOING:** none of the above bypasses recent-device authentication or proves the positive OTP-authenticated multi-tenant download and all eleven export/import journeys. Existing scope, row limits, PII restrictions, authorization and user-selected download permissions stay unchanged.
