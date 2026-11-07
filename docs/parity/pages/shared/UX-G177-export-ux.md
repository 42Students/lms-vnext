# UX-G177 — TPO messaging history exports

## Surface and implementation
- Canonical group: `docs/tracker.json#uxReview.groups`; claimed for focused export UX.
- Registered implementation: `src/modules/messaging/receipt-history-export-model.ts`
- Download entrypoint: `/api/placements/tpo/campaigns/history/export`
- UX changes: UTF-8 BOM, a nine-column matching-total footer to stop spreadsheet column misalignment; preserves provider-accepted—not handset-delivered—semantics and aggregate-only, role-filtered export.
- Shared metadata encoding helper where applicable: `src/modules/shared/metadata-export-csv-cell.ts`.
- No changes to API authorization, tenant scoping, step-up policy, record source, or export size limits.

## Acceptance and non-regression
- Source tests: `tests/unit/UX-G169-G171-G174-G177-exports.test.ts` and the pre-existing CSV regression suite.
- Browser/HTTP acceptance: `tests/e2e/ux-report-export-journeys.spec.ts` with disposable seeded Postgres and role checks, downloads retained as evidence.
- Exact-SHA Actions: `.github/workflows/ux-report-exports-acceptance.yml`. Closure requires successful lint, full TypeScript, focused Vitest, authenticated Chromium and evidence artifact.
- UX review checks: non-ASCII UTF-8, formula injection, multi-line row spoofing, consistent column shape, understandable time/status semantics, scoped authorization, and a recoverable failure for unauthorized users.
- Excluded from this scoped group: global release, accessibility conformance certification, penetration testing, and cross-account role matrix sign-off.

## Result
Pending exact-SHA acceptance; do not mark DONE before the run is green.
