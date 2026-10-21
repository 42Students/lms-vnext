# Work packet (wave 2): edit src/app/api/admin/course-progress/students/export/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/course-progress.md, docs/audit/gap2/lane-2/admin-course-progress-controller.md

## G2-14-003-056  [P2] GAP  facet F14  effort S
- Legacy: Legacy export CSV file course-progress-courseId-class-classId.csv; vNext course-progress-students.csv — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:207-225`
- vNext now: `src/app/api/admin/course-progress/students/export/route.ts:19-26`
- Fix: Build filename from selected course/class, stable legacy headers

## G2-2-015-084  [P2] GAP  facet F14  effort S
- Legacy: Legacy filenames include courseId and classId to distinguish scope `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:223-225`
- vNext now: Super Admin filename is always course-progress-students.csv `src/app/api/admin/course-progress/students/export/route.ts:22-26`
- Fix: Encode selected offering/section scope in download filename
