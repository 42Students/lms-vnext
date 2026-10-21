# Work packet (wave 3): edit src/modules/courses/faculty-course-navigation.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/teacher-courses-courseid-index.md

## G2-17-001-046  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-121 supports legacy course slug and old numeric ID; docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:50-69 sanitizes ref and class query when canonicalizing.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:10 rejects non-UUID; src/modules/courses/faculty-course-navigation.ts:21-29 only constructs UUID delivery href.
- Fix: Create legacy URL compatibility policy/redirect map (or explicitly document intentional removal because no data migration).
