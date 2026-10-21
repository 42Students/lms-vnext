# Work packet (wave 2): edit src/app/(authenticated)/college/quizzes/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-quizzes.md

## G2-3-001-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/quizzes.js:4-17`; `docs/legacy-source/frontend/src/components/admin/AdminGroupShell.jsx:14-29`; `docs/legacy-source/frontend/src/common/navGroupDefinitions.js:18-29`
- vNext now: `src/app/(authenticated)/college/quizzes/page.tsx:16-22`; `src/components/courses/college-assessment-aggregate.tsx:56-77`
- Fix: Retain Courses & Content grouping and Quizzes tab as in legacy group shell, with no extra unrelated quick links.

## G2-3-001-058  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:583-605`
- vNext now: `src/app/(authenticated)/college/quizzes/page.tsx:29-37`; `src/components/courses/college-assessment-aggregate.tsx:205-210`
- Fix: Preserve stale-row retry on refresh and 8-row skeleton; vNext has server-rendered records and route-level error.

## G2-3-001-002  [P3] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/layouts/AdminLayout.js:34-46`
- vNext now: `src/app/(authenticated)/college/quizzes/page.tsx:16-22`
- Fix: Set role-specific admin quiz document title `Quizzes · 42LMS` in metadata, verify layout title override.
