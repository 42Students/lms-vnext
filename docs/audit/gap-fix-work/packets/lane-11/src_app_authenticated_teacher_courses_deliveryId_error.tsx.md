# Work packet: edit src/app/(authenticated)/teacher/courses/[deliveryId]/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/teacher-courses-courseid-index.md

## G2-17-001-015  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:211-224 displays 'Faculty access required' with 'Sign in with a Faculty account to open this course.' and no Retry for non-faculty.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/error.tsx:8-12 shows 'Unable to load Faculty Course', generic explanation, Retry and Back to Courses.
- Fix: Use distinct forbidden vs transient-load states; preserve exact faculty-access wording when authorization fails.
