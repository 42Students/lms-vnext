# Work packet (wave 2): edit src/modules/courses/super-admin-student-progress-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/course-progress.md

## G2-14-003-048  [P2] GAP  facet F12  effort S
- Legacy: Legacy items 0 returns null average and one note; vNext percent null when total0 but admin detail computes mean only among measurable rows — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:153-162`
- vNext now: `src/modules/courses/super-admin-student-progress-model.ts:7-13`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:30-35`
- Fix: Show exact no-work note and blank summary, not mixed metric display
