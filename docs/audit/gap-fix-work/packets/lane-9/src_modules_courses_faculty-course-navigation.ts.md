# Work packet: edit src/modules/courses/faculty-course-navigation.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/teacher-courses-courseid-index.md

## G2-17-001-002  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:10-14 accepts arbitrary nonempty course route segments; docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-113 accepts numeric mapping/course IDs and slugs.
- vNext now: src/modules/courses/faculty-course-navigation.ts:28-29 accepts only UUID deliveryId, src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:10 calls notFound otherwise.
- Fix: Add explicit legacy-link resolver or documented redirect/migration handling for old numeric and slug links; do not guess an unrelated delivery.

## G2-17-001-026  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:5-20 resolves numeric mapping before plain course unless ref=course; maps numeric to slug.
- vNext now: src/modules/courses/faculty-course-navigation.ts:28-29 validates UUID only, with no ref=course override.
- Fix: Provide route-level old-link resolver for ref=course with exact mapping-first fallback or declare legacy URLs unsupported in a signed-off decision.
