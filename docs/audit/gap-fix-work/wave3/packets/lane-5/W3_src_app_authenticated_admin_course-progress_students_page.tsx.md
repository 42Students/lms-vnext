# Work packet (wave 3): edit src/app/(authenticated)/admin/course-progress/students/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-course-progress-controller.md

## G2-2-015-069  [P1] MISSING  facet F06  effort L
- Legacy: Legacy requires class then taught course; active/past teaching assignments annotated `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:105-134`
- vNext now: Super Admin student detail accepts only offeringId UUID after clicking a directory result `src/app/(authenticated)/admin/course-progress/students/page.tsx:18-29`
- Fix: Add class/section chooser and class-taught course chooser with historical indicator
