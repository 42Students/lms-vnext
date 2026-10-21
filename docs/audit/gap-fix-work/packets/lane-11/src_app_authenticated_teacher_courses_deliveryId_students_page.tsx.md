# Work packet: edit src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md, docs/audit/gap2/lane-3/course-student-roster.md

## G2-18-001-004  [P1] GAP  facet F01  effort M
- Legacy: `?cls=<numeric-class-id>` selects authorized class and canonicalizes a stale class selection. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:67-82`, `docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:23-47`
- vNext now: Section selector uses delivery UUID; students/attendance accept `cls` only when it matches section or delivery UUID, not legacy numeric class ID. `src/components/courses/faculty-course-tab-navigation.tsx:53-66`, `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:17-26`, `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:24-34`
- Fix: Introduce legacy numeric-class map with tenant/teacher authorization and redirect; do not silently show an unrelated section.

## G2-3-009-028  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:245-251`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:27-31`; `src/modules/attendance/faculty-service.ts:1-40`
- Fix: Legacy GET `/api/v1/learner/getLearnerDetailsByClassId?classId=n`, vNext service `getFacultyDeliveryRoster` keyed deliveryId UUID; map eligible active class roster, test legacy deep link.

## G2-3-009-051  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:234-268`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:18-31`
- Fix: Legacy effect cancels stale roster fetch when classId switches, new redirect server scoped but client search/preview state may linger if deliveryId param changes.

## G2-18-001-041  [P2] GAP  facet F07  effort M
- Legacy: Legacy roster error is `We couldn't load the class roster. Check your connection and try again.` `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:234-265`
- vNext now: vNext roster fetch occurs server-side, resulting error boundary rather than inline Alert and Retry. `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:27-31`, `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx:10-20`
- Fix: Add inline roster error panel with exact message + Retry, not a false zero-roster state.

## G2-3-009-022  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:252-260`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:27-31`
- Fix: Old request failure explicitly `We couldn't load the class roster. Check your connection and try again.` + Retry; new server throw error boundary uses different copy.

## G2-3-009-024  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:256-260`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:27-31`
- Fix: Legacy suppresses duplicate toast and uses single inline error Alert; new global route error may flash navigation rather than local Retry.
