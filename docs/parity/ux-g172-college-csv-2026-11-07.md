# UX-G172 — college administration outbound CSV acceptance

Scope: `src/modules/colleges/admin-history-export-model.ts`, `src/modules/colleges/admin-readiness-export-model.ts`, `src/modules/colleges/admin-tenant-export-model.ts`.

## Review and improvements
- Administrator history and readiness evidence now reuse the central `spreadsheetCsvCell` serializer, preventing Unicode category Mc/Me prefixes from concealing spreadsheet commands. Quoted strings, commas, newlines and source text remain intact.
- The readability of historical timestamps is retained in IST. A single reusable timestamp formatter avoids constructing one formatter per event.
- Readiness CSV adds a UTF-8 BOM consistent with the other administrative exports for spreadsheet application imports.
- Tenant directory export already used the centralized serializer, with a clear 1,000-row cap, overflow line, IST timestamps, privacy-safe columns and strict filters; that implementation is intentionally retained.
- Readiness CSV contains persisted check evidence and remediation, not a promise of production launch approval.

## Acceptance
- Unit: `npx vitest run tests/unit/ux-g170-g172-csv-acceptance.test.ts tests/unit/chat4-college-admin-export-boundaries.test.ts tests/unit/super-admin-readiness-export.test.ts tests/unit/chat4-superadmin-readiness-csv-formula.test.ts tests/unit/admin-tenant-export-model.test.ts tests/unit/chat4-super-admin-tenant-export-security.test.ts`
- Browser: `npx playwright test tests/e2e/ux-g170-g172-csv.spec.ts --project=chromium` at 1280×800 and 390×844, with actual emitted CSV bytes and viewport screenshots.
- Browser fixture is synthetic, development-only and disabled without `UX_EXPORT_FIXTURE=1`; live staff/tenant auth is not bypassed.
- Exact-SHA CI: [focused acceptance](https://github.com/42Students/lms-vnext/actions/runs/42392908781). Verify the run and screenshot artifact before DONE.

## Regression/security checks
- No permissions, organization/college scope, step-up checks, query schemas, cap, or sensitive export columns changed.
- Retained `private, no-store`, `nosniff` and attachment responses on the real API routes.
- Negative cases include hidden spreadsheet operators, capped rows, and filtering/scope protections.

## Exact-SHA final scoped acceptance — 2026-11-08

- **DONE**. [GitHub Actions run 42416880809](https://github.com/42Students/lms-vnext/actions/runs/42416880809) passed on commit `8eb26b8dbfadbe25c888a2c04827fc350e0659b5`: checkout SHA, scoped ESLint, full TypeScript, 8 Vitest files / 31 tests, and 2 real PostgreSQL tenant authorization integration tests.
- Chromium: 5/5 passed. Desktop 1280×800 and mobile 390×844 downloadable CSV fixture with screenshots, plus real disposable-db OTP-based College Admin and Super Admin downloads, cross-college scope rejection, and denied Learner requests.
- Artifact: `ux-g170-g172-export-browser-evidence` ID `13591839350` (screenshots, downloaded CSV bytes and browser reporter).
- Production authorization implementation is untouched. This is scoped seeded test-environment UX/security-regression acceptance, not an assertion of release-wide certification or live production access.
