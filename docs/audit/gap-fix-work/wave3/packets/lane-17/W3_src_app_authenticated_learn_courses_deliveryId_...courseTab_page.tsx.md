# Work packet (wave 3): edit src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-courses-courseid-catchall.md

## G2-17-006-028  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:72-79 replaces numeric course ID with slug URL without losing tab/query; docs/legacy-source/frontend/src/utils/learnerCourseDetail.js:20-27 builds canonical path.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:42-55 only canonicalizes tab, deliveryId remains UUID.
- Fix: Support old numeric and slug deep links if required; explicitly sign off otherwise.
