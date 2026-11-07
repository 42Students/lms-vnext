# UX-G169 — Admin announcements metadata export

## Surface and implementation
- Canonical group: `docs/tracker.json#uxReview.groups`; claimed for focused export UX.
- Registered implementation: `src/modules/announcements/admin-csv-model.ts`
- Download entrypoint: `/api/admin/announcements/export`
- UX changes: UTF-8 BOM for spreadsheet opening, single physical line per metadata field, Unicode combining-mark formula neutralization; preserves nine-field labels, 50-row cap, and PII exclusions.
- Shared metadata encoding helper where applicable: `src/modules/shared/metadata-export-csv-cell.ts`.
- No changes to API authorization, tenant scoping, step-up policy, record source, or export size limits.

## Acceptance and non-regression
- Source tests: `tests/unit/UX-G169-G171-G174-G177-exports.test.ts` and the pre-existing CSV regression suite.
- Browser/HTTP acceptance: `tests/e2e/ux-report-export-journeys.spec.ts` with disposable seeded Postgres and role checks, downloads retained as evidence.
- Exact-SHA Actions: `.github/workflows/ux-report-exports-acceptance.yml`. Closure requires successful lint, full TypeScript, focused Vitest, authenticated Chromium and evidence artifact.
- UX review checks: non-ASCII UTF-8, formula injection, multi-line row spoofing, consistent column shape, understandable time/status semantics, scoped authorization, and a recoverable failure for unauthorized users.
- Excluded from this scoped group: global release, accessibility conformance certification, penetration testing, and cross-account role matrix sign-off.

## Result
DONE (scope: outbound CSV UX only), accepted 2026-11-08 on exact checkout SHA `6500a87b93029832eb15106fa7fd6da2514deb23`.

- [Successful dedicated GitHub Actions run](https://github.com/42Students/lms-vnext/actions/runs/42414921156): scoped lint, full TypeScript, 9 Vitest files / 50 cases, 4/4 real Chromium/HTTP acceptance cases.
- Browser verification used a real OTP-verified session for Super Admin (two factor) and a genuine seeded TPO role for messaging; Learner was denied privileged exports. No step-up or tenant/role checks were weakened.
- Evidence artifact `ux-four-report-export-evidence` (GitHub artifact 13590724676) includes actual UTF-8 CSV output. Viewports: 1280px desktop for admin and 320/390px mobile for role-negative and TPO acceptance.
- This is export/HTTP-byte acceptance, not a claim of rendered UI screenshots, exhaustive cross-role certification, or production release acceptance.
