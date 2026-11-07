# UX-G174 — Faculty assignment/quiz reports

## Surface and implementation
- Canonical group: `docs/tracker.json#uxReview.groups`; claimed for focused export UX.
- Registered implementation: `src/modules/courses/faculty-report-csv.ts`
- Download entrypoint: `/api/courses/faculty/reports/[kind]/[assessmentId]/csv`
- UX changes: Hardened Unicode formula prefixes on learner/note cells, while typed numeric totals remain numeric; preserves section-scoped report authorization, exact 500-row bound and IST timestamps.
- Shared metadata encoding helper where applicable: `src/modules/shared/metadata-export-csv-cell.ts`.
- No changes to API authorization, tenant scoping, step-up policy, record source, or export size limits.

## Acceptance and non-regression
- Source tests: `tests/unit/UX-G169-G171-G174-G177-exports.test.ts` and the pre-existing CSV regression suite.
- Browser/HTTP acceptance: `tests/e2e/ux-report-export-journeys.spec.ts` with disposable seeded Postgres and role checks, downloads retained as evidence.
- Exact-SHA Actions: `.github/workflows/ux-report-exports-acceptance.yml`. Closure requires successful lint, full TypeScript, focused Vitest, authenticated Chromium and evidence artifact.
- UX review checks: non-ASCII UTF-8, formula injection, multi-line row spoofing, consistent column shape, understandable time/status semantics, scoped authorization, and a recoverable failure for unauthorized users.
- Excluded from this scoped group: global release, accessibility conformance certification, penetration testing, and cross-account role matrix sign-off.

## Result
DOING — source and unit/negative acceptance improved, but a positive authenticated faculty report download and a real seeded assessment are not yet covered by the browser proof.

- Faculty CSV omission-note six-column fix: [commit dcc6ede](https://github.com/42Students/lms-vnext/commit/dcc6ede8063de2c9722ff794297da2a98b8752a9).
- [Green run 42414921156](https://github.com/42Students/lms-vnext/actions/runs/42414921156): full TypeScript, lint, 50/50 Vitest, and learner denied arbitrary faculty export.
- Do **not** mark UX-G174 DONE until a real Faculty role has an authorized assessment in the disposable DB and the corresponding CSV download succeeds with positive and negative browser evidence.
