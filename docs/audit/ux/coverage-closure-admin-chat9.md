# UX coverage closure — /admin last third and explicit raw-table cleanup (chat-9)

Based on `docs/orchestrator/briefs/ux-coverage-closure.md`, generated `docs/audit/ux/COVERAGE-MATRIX.md` at sync, and `docs/orchestrator/ui-ux/pages-admin.md` route positions **75–111**.

## Coverage result

- Last-third route records: **37/37** had a UX test mention and **37/37** had an authored route note before this pass; no missing route-level test or note remained in the provided matrix.
- Existing tests `tests/unit/ux-admin-chat9-batch-01..04.test.ts` explicitly name all 37 routes by `UX-admin-<slug>-01`, with route source file paths. They were retained, not weakened.
- Added **7** stronger `UX-admin-*` coverage tests in `tests/unit/ux-admin-chat9-coverage-closure.test.ts`, including the 37-route source inventory and direct behavioral assertions of the repaired tables and three canonical aliases.
- Three **noShared** flags in the matrix represent **intentional delegation**, not interactive screens: `/admin/projects/[projectId]` redirects to the encoded summary, `/admin/projects/templates/[templateId]/overview` validates permissions and redirects to the canonical subview, and `/admin/recruiters` re-exports the scoped HR page. These must not grow duplicate headers or forms just to satisfy a static shared-component scanner. **Waiver requires owner approval**; no unapproved entry has been inserted in `COVERAGE-WAIVERS.md`.

## Raw tables explicitly requested, across authenticated /admin

| Source route | Before | After |
|---|---:|---:|
| `/admin/settings` | 2 raw tables | 2 shared DataTables, with mobile priority and explicit empty copy |
| `/admin/course-progress/students` | 1 raw table | 1 shared DataTable, preserving persisted counts/“Not measured” |
| `/admin/features/[collegeId]/trace` | 1 raw table | 1 shared DataTable for the resolution chain, preserving scope winner/ignored details and existing learner directory |
| **Total** | **4** | **0 raw tables** |

Additionally, two raw tables inside the admin-facing `ProjectAdminReadinessPage` shared widget were replaced by responsive DataTables; all required Action/Manage links remain reachable at phone widths. Replaced **6 raw table instances total** (4 in `src/app/(authenticated)/admin`, 2 in shared projects widget).

## Verification

Added 7 focused coverage tests and 12 scroll/motion tests (**19** total new named regressions). This pass deliberately does not claim that Vitest, TypeScript, lint, coverage generator, browser, motion or screen-reader suites ran. Run `node scripts/audit/ux-coverage.mjs` and the relevant `npm run ux:audit:verify` gate on the pushed SHA. Global unrelated matrix gaps remain assigned to their respective lanes.
