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


## Genuine OTP/People CSV browser acceptance added — 8 November 2026

- [Real-device People acceptance](https://github.com/42Students/lms-vnext/blob/main/tests/e2e/ux-g178-real-device-people-exports.spec.ts) at commits `c85f677e066617a28e4738eb58ea4a4c17e437fd` and `5a2a947b8ee9d0998dd5107bf5dd09f33ce5113a` uses the first-party OTP challenge and device-session verifier on disposable PG17, with persisted College Admin role selection or Super Admin dual factor.
- Desktop 1280×800 and mobile 390×844 exercises cover actual college People/Contacts/Faculty/Learner CSV GETs, a Chrome download of Contacts CSV, Super Admin People CSV, anti-tenant/duplicate/invalid filters, student and Faculty CSV preflight with no mutation, explicit unconfirmed-import denial, and seeded-role-cookie refusal without fresh-device auth.
- The dedicated [five-scenario exact-SHA workflow](https://github.com/42Students/lms-vnext/actions/runs/42490093718) sets randomly generated six-digit `AUTH_TEST_OTP` only in `APP_ENV=development`, with a fixed allowlist of disposable seed contacts and ephemeral session secrets. It never modifies production session guards.
- **DOING remains the only valid canonical status** until actual CI success and all eleven source workflows have reviewed desktop/mobile, positive/negative, privacy, empty/capped, import recovery and regression evidence.


## Release acceptance review — successful exact-SHA witnesses (8 November 2026)

The original partial notes predate the now **successful** end-to-end runs. This is the release review for the eleven registered model/service sources; it does not claim an untested end-to-end *successful bulk import* or a production-environment OTP bypass.

| Registered source | Confirmed functional/security witness |
| --- | --- |
| `admin-users-export-model.ts`, `admin-users-export-service.ts` | Authenticated Super Admin 2-factor CSV download, 500-row cap/header/PII exclusion and scoped platform permissions in [real-device CI 42490093718](https://github.com/42Students/lms-vnext/actions/runs/42490093718), with CSV encoding/escaping model regressions in the same run |
| `college-contacts-export-model.ts`, `college-contacts-export-service.ts` | Real College Admin CSV download at 1280px and 390px, actual Chromium saved bytes, masked learner phone/email headers, malformed filter denial and no-cache response in run 42490093718; model cap/formula/duplicate-field cases and real data-service/dedup/validation unit regressions in [PostgreSQL CI 42491199524](https://github.com/42Students/lms-vnext/actions/runs/42491199524) |
| `college-people-export-model.ts`, `college-people-export-service.ts` | Real 105-membership, two-page PG17 export with no duplicates, forged-role denial and foreign-college zero results in run 42491199524; real first-party OTP College Admin HTTP download at both viewports, malformed tenant-filter denial and saved CSV header/attachments in run 42490093718 |
| `college-role-directory-export-service.ts` | Authenticated Faculty and Learner directory CSV downloads with current College Admin membership, protected route header/content/caching and duplicate role-filter denial in run 42490093718; the role-directory model also has existing strict filter, formula and cap tests in `tests/unit/college-role-directory-export.test.ts` |
| `college-faculty-csv-columns.ts`, `college-faculty-csv-service.ts` | Malformed-header PREVIEW produces actionable structured feedback, missing confirm blocks IMPORT, and tenant selection must be a current College Admin in run 42490093718. Independent `chat4-college-faculty-csv-import.test.ts` and `chat4-college-faculty-csv-behaviour.test.ts` cover successful mocked onboarding, 500-row cap, duplicate/invalid rows, non-mutating PREVIEW, failed/partial receipts, and safe error messages. These positive unit cases are **not** represented as a persisted PG17 bulk-import pass |
| `college-student-csv-model.ts`, `college-student-csv-service.ts` | Real OTP PREVIEW invalid-header/error and explicit unconfirmed-IMPORT denial in run 42490093718; CSV formula protection and default cap/header tests in [shared run 42488283549](https://github.com/42Students/lms-vnext/actions/runs/42488283549) and [run 42491199524](https://github.com/42Students/lms-vnext/actions/runs/42491199524); source retains strict scoped program/college import authorization and recovery audit behavior |

- [Real-device five-scenario run 42490093718](https://github.com/42Students/lms-vnext/actions/runs/42490093718) **SUCCEEDED** on exact commit `3940e45c32cde1ad76bf32ccc1433c48f657cce1`. Actual first-party OTP sessions, dual-factor Super Admin, persisted College Admin selection, desktop/mobile 1280/390 responsive CSV download, strict negative role/tenant/filters, preflight user feedback and no E2E privilege bypass; [screenshots and browser artifact 13621928989](https://github.com/42Students/lms-vnext/actions/runs/42490093718/artifacts/13621928989).
- [Real PostgreSQL/database and privacy run 42491199524](https://github.com/42Students/lms-vnext/actions/runs/42491199524) **SUCCEEDED** on exact commit `4db03685d341e8c6abab8e31a2260dc7b1753b50`: exact SHA, lint, full TypeScript, seven scoped unit suites and multi-page/foreign-college PG acceptance. [Shared responsive/unit run 42488283549](https://github.com/42Students/lms-vnext/actions/runs/42488283549) also succeeded for component regressions at its own exact SHA.
- Regression review: all eleven source files reviewed for CSV formula neutralization, 500/1000 cap, safe incomplete/empty output messaging, non-mutating preview, explicit import consent, masked contact columns, duplicate paging, and recovery receipts. Independent faculty and student model tests are present for successful/partial mock behavior; the group is UX/export-surface coverage, not a certification that all external identity-provider bulk imports succeeded in PG17.
- Security review: protected endpoints retain recent-device step-up and selected tenant/role authorization, origin checks for import, no private identity/OTP keys, no spreadsheet execution cells, and no unbounded export. Actual authenticated download and unprivileged/foreign-college denials were executed; no production security bypass or weakening was introduced.
