# Work packet: edit src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/teacher-courses-courseid-index.md, docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-17-001-001  [P1] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:10-14 preserves path and appends /home.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:8-11 redirects to delivery UUID /home.
- Fix: Preserve search parameters on canonical default redirect (including repeated parameters and percent-encoding).

## G2-17-001-002  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:10-14 accepts arbitrary nonempty course route segments; docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-113 accepts numeric mapping/course IDs and slugs.
- vNext now: src/modules/courses/faculty-course-navigation.ts:28-29 accepts only UUID deliveryId, src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:10 calls notFound otherwise.
- Fix: Add explicit legacy-link resolver or documented redirect/migration handling for old numeric and slug links; do not guess an unrelated delivery.

## G2-17-001-013  [P1] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:10-14 preserves original query string without parsing (including cls/ref/filter); docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:63-85 consumes cls.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:4-11 does not accept searchParams; src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:13-24 accepts filter/lesson only after redirect.
- Fix: Plumb incoming searchParams through default page and preserve safely when building /home URL; decide which parameters are intentionally retired.

## G2-17-001-039  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:10 splits path and query, strips trailing /, retains original query literally; :7-14 uses redirectedRef.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:8-11 does not preserve query, trailing slash or hash by explicit logic.
- Fix: Add canonical URL construction that carries query safely and tests trailing slash, encoded slug, repeated query keys, long/special strings.

## G2-18-001-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy `/teacher/courses/:courseId/...` accepts slug or positive numeric mapping/course ID and canonicalizes numeric to slug. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-115`, `docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:2-20`
- vNext now: vNext requires UUID deliveryId and rejects non-UUID default links. `src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:4-11`, `src/modules/courses/faculty-course-service.ts:204-211`
- Fix: Add safe legacy-deep-link resolver from numeric mapping/course slug plus explicit section to an authorized delivery UUID; redirect with preserved intended tab.
