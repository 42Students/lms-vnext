# Work packet (wave 2): edit src/modules/courses/college-learning-directory-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-17/college-admin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-13-013-011  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:50-52` query default '', limit default15, courseId optional
- vNext now: `src/modules/courses/college-learning-directory-model.ts:8-13` q default'', pageSize default25 and choices10/25/50/100; `src/app/(authenticated)/admin/lessons/page.tsx:119-123` fixed25
- Fix: Provide limit=15 behavior to search clients separately from 25-row directory paging

## G2-13-013-016  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:50-52` unbounded String query, int limit, optional Integer courseId
- vNext now: `src/modules/courses/college-learning-directory-model.ts:9-13` q trimmed max100, page 1..1000, page size enum; `src/app/api/courses/lessons/route.ts:18-22` UUID learningPathId required
- Fix: Normalize API query bounds and provide explicit 400 for illegal numeric limits/course filter

## G2-17-007-019  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:113-114 — Page size restored from `admin-lessons-page-size` localStorage.
- vNext now: src/modules/courses/college-learning-directory-model.ts:8-13 — Size sourced only from URL default 25; no local preference restore.
- Fix: Persist and restore valid page-size preference or document decision.

## G2-17-007-073  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:509-523 — On course selection, entire course list fetched and filtered in browser.
- vNext now: src/modules/courses/college-learning-directory-model.ts:8-13 — Server page range 1..1000 at sizes <=100.
- Fix: Expose result-size/page-cap handling for catalogues beyond 100k rows.

## G2-18-002-106  [P2] GAP  facet F19  effort S
- Legacy: Legacy page-size preference persists across visits; up to 100 rows. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:112-115`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:519-523`
- vNext now: vNext superadmin fixed 25, college query supports 10/25/50/100. `src/app/(authenticated)/admin/lessons/page.tsx:118-122`, `src/modules/courses/college-learning-directory-model.ts:8-14`
- Fix: Bring page size chooser to superadmin to match legacy and college admin.

## G2-13-013-047  [P3] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:70` Math.min(limit,200) cap, default15
- vNext now: `src/modules/courses/college-learning-directory-model.ts:12` 100 max page size, default25; `src/app/(authenticated)/admin/lessons/page.tsx:119` fixed25
- Fix: Publish endpoint-specific caps (autocomplete 15 up to200; directory 25 up to100) distinctly
