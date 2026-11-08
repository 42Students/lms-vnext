# UX-G168 — Super Admin CSV export UX, part 1

**Scope:** Five registered export files: `src/modules/admin-ui/super-admin-batch-roster-export-model.ts`, `super-admin-faculty-assignments-csv-service.ts`, `super-admin-learning-csv-service.ts`, `super-admin-scoped-csv-model.ts`, `super-admin-scoped-csv-service.ts`. Canonical state: `docs/tracker.json#uxReview.groups[UX-G168]`.

## User-facing review and repairs

- **Batch roster CSV:** Uses the shared `spreadsheetCsvCell` for comprehensive Unicode-hidden formula protection, including combining marks and control/format prefixes. Keeps four-column headings, Excel-compatible UTF-8 BOM, stable CRLF, class labels and quoted fields.
- **Faculty assignments CSV:** Truncated-results notice is now padded to seven columns, matching the heading and normal rows; retained first-300 cap, plain-language warning, download filename, no-store and content sniffing protection.
- **Learning/assessment CSV:** Truncated-results notice now matches every corresponding report schema, including the 13-column assignment/quiz exports and 10/9-column lesson/progress exports. Preserves filtered page-vs-full modes, cap metadata, ordering, authorized reads and available due-date labels.
- **Scoped directory CSV model:** Export href generator refuses external, protocol-relative and recursively encoded ambiguous URLs even if accidentally supplied by future UI code; valid internal filters and cap/pagination behavior unchanged. Duplicate request selectors are rejected as before.
- **Scoped directory export:** Status validation failure now returns a machine-readable, private, no-store JSON error rather than a text body that could be mistaken for a CSV. Explicit recent-device authentication and 250-row cap unchanged.

## Acceptance and invariants

- `tests/unit/ux-g168-admin-export-ux.test.ts`: formula injection and BOM, unsafe destinations, duplicate query filters, exact column counts for truncation under 301/501-row synthetic workloads.
- Existing export regression tests: `tests/unit/chat3-sa-faculty-assignments-csv-http.test.ts`, `tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts` and `tests/unit/chat13-scoped-csv-export-page-size.test.ts`.
- `.github/workflows/ux-g165-g168-acceptance.yml` is exact-SHA lint, TypeScript, unit and Super Admin browser check with learner-negative download assertion at phone/desktop widths. Attach results below.
- No authorization, tenant scoping, row caps, grading, hidden records or endpoint privilege changes. Existing Super Admin download requirements remain mandatory; the URL validation is presentation-only, not authorization.

**Closure boundary:** scoped CSV UX/behavior, not global security/release signoff. Completion receipt appended after successful execution.

## Verified scoped closure — 2026-11-08

- **DONE (registered outbound CSV scope).** [UI and export-regression run 42448745272](https://github.com/42Students/lms-vnext/actions/runs/42448745272): exact SHA `d952f236caa7df3a5e3702bbe3000d2d43e85941`, 6 unit suites / 86 tests, TypeScript and lint, 3/3 Chrome cases on a seeded Super Admin page at 1280px/390px and denied learner CSV, screenshots artifact `13604796811`.
- [Authenticated CSV run 42450162869](https://github.com/42Students/lms-vnext/actions/runs/42450162869): exact SHA `5bfc9df253fd67c23f067b7c3dbb57922c61b7bd`; 9 unit suites / 50 cases, 7/7 Chrome HTTP acceptance. Fresh first-party two-factor Super Admin login, persisted selected college, successful private faculty directory CSV (250-row cap), malformed client paging refusal and role negative.
- Actual CSV bytes retained as artifact `ux-four-report-export-evidence` ID `13605900252`. Existing permission and step-up protections have not been loosened, and this scoped UX acceptance does not certify overall production release.
