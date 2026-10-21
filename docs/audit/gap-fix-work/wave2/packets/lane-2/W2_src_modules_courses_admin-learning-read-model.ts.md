# Work packet (wave 2): edit src/modules/courses/admin-learning-read-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-13-013-009  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:87-93` stats key totalLessons (cache size)
- vNext now: `src/app/(authenticated)/admin/lessons/page.tsx:85` displays matching lessons, current-page content counts from `src/modules/courses/admin-learning-read-model.ts:22-27`
- Fix: Expose global total active lesson count in authorized stats endpoint, not page-level content counts

## G2-18-002-028  [P2] GAP  facet F05  effort M
- Legacy: Legacy page sizes 10/25/50/100 and saved in localStorage `admin-lessons-page-size`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:19-20`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:112-115`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:519-523`
- vNext now: vNext superadmin fixed 25 per page, no size chooser. `src/app/(authenticated)/admin/lessons/page.tsx:118-122`, `src/modules/courses/admin-learning-read-model.ts:2-7`
- Fix: Enable 10/25/50/100 and remember preference safely; preserve navigation links.
