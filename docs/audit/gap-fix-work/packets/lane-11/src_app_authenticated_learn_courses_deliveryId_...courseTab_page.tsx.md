# Work packet: edit src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-courses-courseid-catchall.md, docs/audit/gap2/lane-8/shared-course-home.md, docs/audit/gap2/lane-13/course-attendance.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md

## G2-17-006-001  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:17-22 uses legacy slug or numeric courseId and first catch-all segment; docs/legacy-source/frontend/src/utils/learnerCourseDetail.js:2-10 resolves by slug or integer.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:36-44 resolves a delivery UUID; src/modules/courses/learner-course-service.ts:74-120 queries courseSectionDeliveries UUID.
- Fix: Create explicit old slug/numeric-to-delivery resolver for legacy bookmarks or record intentional unsupported ID scheme.

## G2-17-006-013  [P1] GAP  facet F04  effort 
- Legacy: docs/legacy-source/frontend/src/utils/courseUtils/contentAvailability.js:53-84 hides explicit unpublished/inactive; locked items non-actionable with detailed reason.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:76-80 renders ended/historical courses readOnly with banner rather than hiding.
- Fix: Define historical read-only as approved product change vs old visible/actionable check; preserve informative availability reason.

## G2-17-006-018  [P1] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:73-75 preserves query exactly during numeric→slug replace.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:45-55 validates unknown tab parameters and truncates; does not map old course numeric path.
- Fix: If old URLs supported, preserve the exact tab/query across ID conversion.

## G2-17-006-030  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:66-70 hides items with explicit inactive/unpublished and actionable=false locked state from docs/legacy-source/frontend/src/utils/courseUtils/contentAvailability.js:47-84.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:76-80 readOnly flags historical/ended status; additional status conditions not shown in page.
- Fix: Compare denied/locked course visibility and allow read-only history only as intentional policy.

## G2-17-006-031  [P1] GAP  facet F12  effort 
- Legacy: docs/legacy-source/frontend/src/utils/learnerCourseDetail.js:4-10 accepts positive safe integer IDs or any nonempty slug, with numeric-first meaning.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:42/59 passes UUID deliveryId to scoped services.
- Fix: Route through verified delivery mapping rather than applying legacy ID directly.

## G2-17-006-051  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/utils/learnerCourseDetail.js:2-16 course identity integer/slug, courseDTO active/enabled/published flags; docs/legacy-source/frontend/src/utils/courseUtils/contentAvailability.js:47-84 client availability.
- vNext now: src/modules/courses/learner-course-service.ts:74-120 UUID course delivery and courseOffering section/enrollment lifecycle; src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:76-80 readOnly logic.
- Fix: Document legacy course↔vNext offering↔delivery mapping and historical-visibility policy; no data migration but old bookmarks decision.

## G2-8-009-002  [P1] GAP  facet F01  effort M
- Legacy: course slug or numeric course ID from Redux, with slug first (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:37-45`)
- vNext now: new route uses UUID deliveryId; unrecognized legacy tab redirects to home (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:42-55`)
- Fix: Preserve legacy slug/course-ID deep links through scoped resolver and canonical delivery redirect

## G2-8-009-048  [P1] GAP  facet F20  effort M
- Legacy: legacy routeToCourseTab retains query except prior filter and merges lesson/content for deep links (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:146-165`)
- vNext now: vNext learner roadmap explicitly reads filter/lesson/content, faculty only accepts filter/lesson (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:125-134; src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:17-28`)
- Fix: Preserve faculty content deep links / ?content= from old firstPendingContent

## G2-13-009-031  [P2] GAP  facet F07  effort S
- Legacy: Legacy learner API error Failed to load attendance., Retry (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:42-69`)
- vNext now: New server route errors delegated to page boundary; no inline error (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:136-154`)
- Fix: Add recoverable inline error boundary with exact copy.

## G2-13-009-035  [P2] GAP  facet F08  effort S
- Legacy: Legacy student attendance has visible Alert error after failed API, no toast (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:60-69`)
- vNext now: New DataTable loads server-side with generic boundary (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:136-154`)
- Fix: Preserve in-page error alert instead of blank/500.

## G2-17-006-020  [P2] GAP  facet F07  effort 
- Legacy: docs/legacy-source/frontend/src/utils/learnerCourseDetail.js:3-14 rejects invalid ID and missing or non-object API payload 'Course not found'.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:59-74 server services throw/notFound if delivery not accessible.
- Fix: Use explicit missing versus invalid course feedback and match appropriate 404/permission UI.

## G2-17-006-021  [P2] GAP  facet F07  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:121-129 user-facing 'Course unavailable' with reason or 'Could not load course' and Try again.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:76-80 displays past course info banner; service errors handled in route boundary.
- Fix: Distinctly render unavailable/unpublished/access denied vs transient retryable load state with exact legacy labels.

## G2-15-031-022  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:121-130`
- vNext now: `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:44-80`
- Fix: Old Course unavailable retry/back vs new redirects/notFound and route error boundary.

## G2-8-009-020  [P2] GAP  facet F07  effort M
- Legacy: legacy course details fetch failure shows Failed to load course details. (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:93-116,343-348`)
- vNext now: vNext server loadCourseDisplayContentIfReady and route error boundary; no same in-card failure text (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:84-101`)
- Fix: Preserve scoped in-card error banner with Retry for display-only load failures

## G2-8-009-023  [P2] GAP  facet F07  effort M
- Legacy: legacy class assignment pending message specific to no classId (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:485-491`)
- vNext now: vNext course route requires scoped delivery and redirects/notFound if absent (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:58-74`)
- Fix: Provide contextual missing-class notice rather than generic 404 for stale enrolment
