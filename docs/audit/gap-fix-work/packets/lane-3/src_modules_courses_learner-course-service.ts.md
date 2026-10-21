# Work packet: edit src/modules/courses/learner-course-service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u006-learner-courses.md, docs/audit/gap2/lane-16/u008-learner-syllabus.md, docs/audit/gap2/lane-17/learner-courses-courseid-catchall.md, docs/audit/gap2/lane-2/admin-learner-progress-controller.md, docs/audit/gap2/lane-3/student-course-controller.md

## G2-15-006-038  [P1] GAP  facet F10  effort L
- Legacy: Legacy user class+semester course fetch `getLearnerCourses` and semester GET (`CoursesContent.jsx:117-126,183-202)
- vNext now: VNext DB joins full historic course deliveries and listLearnerProgramSemesters (learn/courses/page.tsx:19-24,121-124; learner-course-service.ts:74-196)
- Fix: Document current-vs-historical active course target and elective enrolment criteria crosswalk

## G2-15-006-043  [P1] GAP  facet F11  effort L
- Legacy: Legacy course visibility determined by published/enabled/locked flags, elective actionability (courseListingUtils.js:109-120; courseHref:7-15)
- vNext now: VNext delivery+path availability, returns active/historical rows and readOnly (learn/courses/page.tsx:98-103; learner-course-service.ts:149-196)
- Fix: Explicitly gate published/locked/prerequisite states as legacy where authorized

## G2-16-008-017  [P1] GAP  facet F05  effort M
- Legacy: `syllabus.js:258-283,842-849`: sortLessonContents tier comparator accommodates heterogeneous sequence/date metadata.
- vNext now: `learner-course-service.ts:1077-1115`: mixes typed content/assignment/quiz, sorts sequence then kind priority then id.
- Fix: Verify mixed-kind ordering against legacy sort tier (sequence/date) and adjust tie-breaker/priority.

## G2-16-008-040  [P1] GAP  facet F10  effort S
- Legacy: `syllabus.js:698-714`: quiz list updates after key bump on dialog close.
- vNext now: `learner-course-service.ts:925-1074`: server query only when page refresh/navigation.
- Fix: Trigger router.refresh after assessment outcome and dialog close.

## G2-16-008-071  [P1] GAP  facet F22  effort M
- Legacy: `syllabus.js:258-283`: sorting based on legacy content sort candidates and tier.
- vNext now: `learner-course-service.ts:1077-1115`: typed sequence order and id.
- Fix: Align sequence fallback for content with no explicit order and mixed migration data.

## G2-17-006-001  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:17-22 uses legacy slug or numeric courseId and first catch-all segment; docs/legacy-source/frontend/src/utils/learnerCourseDetail.js:2-10 resolves by slug or integer.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:36-44 resolves a delivery UUID; src/modules/courses/learner-course-service.ts:74-120 queries courseSectionDeliveries UUID.
- Fix: Create explicit old slug/numeric-to-delivery resolver for legacy bookmarks or record intentional unsupported ID scheme.

## G2-17-006-051  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/utils/learnerCourseDetail.js:2-16 course identity integer/slug, courseDTO active/enabled/published flags; docs/legacy-source/frontend/src/utils/courseUtils/contentAvailability.js:47-84 client availability.
- vNext now: src/modules/courses/learner-course-service.ts:74-120 UUID course delivery and courseOffering section/enrollment lifecycle; src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:76-80 readOnly logic.
- Fix: Document legacy course↔vNext offering↔delivery mapping and historical-visibility policy; no data migration but old bookmarks decision.

## G2-2-017-061  [P1] GAP  facet F22  effort L
- Legacy: Learner per-content latest attempt is single row `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:29-43`
- vNext now: Learner course list joins all membership/content rows `src/modules/courses/learner-course-service.ts:599-610`
- Fix: Use latest-progress subquery to prevent duplicate lesson rows

## G2-3-025-037  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:42-43`
- vNext now: `src/modules/courses/learner-course-service.ts:58-71`
- Fix: Legacy principal can request an authorized learner ID; vNext requires an ACTIVE LEARNER college membership, so test delegated/scoped reads and legitimate faculty/admin class use.

## G2-3-025-038  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:101-107`
- vNext now: `src/modules/courses/learner-course-service.ts:317-341`
- Fix: Legacy /byClass redacts detail and faculty email only when principal is learner; vNext instructor read requires learner, while faculty must use separate delivery endpoints.

## G2-3-025-042  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentCourseServiceImpl.java:183-190`
- vNext now: `src/modules/courses/learner-course-service.ts:171-190`
- Fix: Legacy displays mapped active/not-deleted semester courses (and allowedForDisplay filter); vNext requires active offering/delivery/section enrollment, which can hide unmapped-by-delivery catalog entries.

## G2-16-008-029  [P3] GAP  facet F07  effort S
- Legacy: `syllabus.js:917-933`: partial failure lists quiz list/assignment completion/content progress and Retry state.
- vNext now: `learner-course-workspace.tsx:693-698`; `learner-course-service.ts:878,965`: stateWarnings+Retry, same intent.
- Fix: Use exact legacy warning wording incl `completion/counts may be incomplete`, and component-specific retry.
