# Work packet (wave 2): edit src/app/(authenticated)/college/courses/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-3/college-admin-courses.md

## G2-18-003-026  [P2] GAP  facet F05  effort S
- Legacy: Legacy client table default order from GET coursesByCollege, no explicit sort configured. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:165-182`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:614-629`
- vNext now: vNext SQL catalogue sorted NAME_ASC by default, supports descending/name/code. `src/modules/courses/college-course-catalogue-service.ts:31-37`, `src/app/(authenticated)/college/courses/page.tsx:16-22`
- Fix: Verify legacy backend response order live; if different, match initial order and sort affordances.

## G2-3-008-001  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/courses.js:9-16`
- vNext now: `src/app/(authenticated)/college/courses/page.tsx:9-26`
- Fix: Old menu activation dispatches `courses` to shared AdminLayout, vNext server page sets PageHeader only; validate legacy nav active/collapse behavior.

## G2-3-008-055  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:611-630`
- vNext now: `src/app/(authenticated)/college/courses/page.tsx:19-24`; `src/components/courses/admin-course-overview.tsx:528-538`
- Fix: Legacy TableSkeleton 8 rows 7 columns during initial load, vNext SSR and data table without equivalent skeleton on page.

## G2-3-008-057  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:607-610`
- vNext now: `src/app/(authenticated)/college/courses/page.tsx:19-24`
- Fix: Legacy stale-data refresh, error-state Retry and session guard distinct; new server throw needs report-level retry.
