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
DONE 2026-11-08, scoped faculty CSV export acceptance.

- [Exact-SHA successful workflow](https://github.com/42Students/lms-vnext/actions/runs/42415829658) on commit `446898f87dc7f7e13b55e0c03110c858cfdfdef5`: scoped lint, full TypeScript, 9 Vitest suites/50 passed cases and 6/6 Chromium E2E.
- Seeded a real faculty-taught Section assignment and quiz in the disposable E2E database, then downloaded both through real OTP-authenticated, membership-role-selected Faculty HTTP requests (200 and CSV attachment).
- Cross-Section scope mismatch, duplicate query selector and real Learner requests cannot download either report. Existing Super Admin and TPO exports remain green.
- GitHub artifact `ux-four-report-export-evidence` ID `13591243239` contains the actual report CSV bytes; mobile viewport 390×844 for the Faculty HTTP journey.
- The scope is report CSV bytes, validation, safety and role/scope checks. This does not certify rendered UI screenshots or production release.
