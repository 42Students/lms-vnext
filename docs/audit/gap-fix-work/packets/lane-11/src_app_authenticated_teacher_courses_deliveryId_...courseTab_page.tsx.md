# Work packet: edit src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/teacher-courses-courseid-index.md, docs/audit/gap2/lane-18/u001-faculty-course-tab.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md, docs/audit/gap2/lane-8/shared-course-home.md

## G2-17-001-013  [P1] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:10-14 preserves original query string without parsing (including cls/ref/filter); docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:63-85 consumes cls.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:4-11 does not accept searchParams; src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:13-24 accepts filter/lesson only after redirect.
- Fix: Plumb incoming searchParams through default page and preserve safely when building /home URL; decide which parameters are intentionally retired.

## G2-18-001-003  [P1] GAP  facet F01  effort M
- Legacy: `?ref=course` disambiguates numeric course ID against faculty mapping ID. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:92-98`, `docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:7-20`
- vNext now: No ref field is parsed; only `filter` and `lesson`. `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:14-20`
- Fix: Recognize old `ref=course` links at compatibility route and resolve within active faculty membership.

## G2-18-001-032  [P1] GAP  facet F05  effort S
- Legacy: Legacy Blueprint filters lower-case `all,lectures,resources,assessments,live-sessions` and retain page while switching. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:90-98`, `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:402-411`
- vNext now: vNext link filters upper-case ALL,LECTURES,RESOURCES,ASSESSMENTS,LIVE, invalid default ALL. `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:17-20`, `src/components/courses/faculty-course-workspace.tsx:518-529`
- Fix: Accept both old lower-case variants and vNext enums; canonicalize links without discarding user filter.

## G2-18-001-052  [P1] GAP  facet F10  effort M
- Legacy: Legacy course bootstrap calls GET mapping-by-id, GET course-by-id or slug, GET active teacher assignments, writes only Redux route context. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:60-135`, `docs/legacy-source/frontend/src/api/Services/courseServices.js:186-208`, `docs/legacy-source/frontend/src/api/Services/courseServices.js:316-345`, `docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:30-33`
- vNext now: vNext uses server DB join on delivery+teaching assignments, gets workspace and home signals, no legacy bootstrap REST calls. `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:24-41`, `src/modules/courses/faculty-course-service.ts:60-202`, `src/modules/courses/faculty-course-service.ts:204-335`
- Fix: Introduce safe compatibility redirects for existing external links; do not reintroduce client-side authoritative Redux.

## G2-18-001-064  [P1] GAP  facet F12  effort M
- Legacy: Legacy Next action picks first known pending ungraded content, passes lesson and content id. `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:173-217`, `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:146-168`
- vNext now: vNext chooses pending submission and routes to lesson `?lesson` but catch-all ignores `?content`. `src/components/courses/faculty-course-home-signals.tsx:23-35`, `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:14-28`
- Fix: Support lesson+content focus and scroll/highlight item; preserve deep links for Review work.

## G2-18-001-065  [P1] GAP  facet F12  effort S
- Legacy: Legacy content filter accepts `live-sessions` and renders scheduled state labels Live now/Ended. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:90-98`, `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:1100-1107`
- vNext now: vNext filter enum uses `LIVE`, contentType LIVE_CLASS, no matched existing live-sessions query. `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:17-20`, `src/components/courses/faculty-course-workspace.tsx:563-572`
- Fix: Map legacy filter key and verify live session status semantics.

## G2-15-031-010  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-120`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:25-40`
- Fix: Legacy Redux selectedCourseId/classId/slug vs new courseSectionDeliveryId.

## G2-15-031-060  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-120`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:25-40`
- Fix: Numeric course/class/lesson ID and Redux vs UUID delivery, enrollment and membership schema.

## G2-8-009-048  [P1] GAP  facet F20  effort M
- Legacy: legacy routeToCourseTab retains query except prior filter and merges lesson/content for deep links (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:146-165`)
- vNext now: vNext learner roadmap explicitly reads filter/lesson/content, faculty only accepts filter/lesson (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:125-134; src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:17-28`)
- Fix: Preserve faculty content deep links / ?content= from old firstPendingContent
