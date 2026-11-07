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
