# Work packet: edit src/modules/courses/admin-course-workspace.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/courses.md

## G2-12-003-076  [P1] GAP  facet F19  effort L
- Legacy: Legacy dependency counts only visible paginated rows; 10/25/50/100 `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:450-454`
- vNext now: VNext eagerly loads all college faculty/course/offering/section relations `src/modules/courses/admin-course-workspace.ts:11-37`
- Fix: Paginate and lazy-load nonessential relation stats

## G2-12-003-077  [P1] GAP  facet F19  effort S
- Legacy: Legacy fetch courses/department independently; guards stale scope `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:155-206`
- vNext now: VNext Promise.all entire workspace; any failed dependency fails page `src/modules/courses/admin-course-workspace.ts:14-19`
- Fix: Use independent load/error boundaries
