# Work packet: edit src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/teacher-courses-courseid-index.md, docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-17-001-016  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:211-224 displays 'Could not load teacher course context', 'Please retry. If this continues, your course assignment may be missing or unavailable.' and 'Try again'.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx:11-19 displays 'Unable to load Course workspace', 'Your course workspace could not be loaded. Retry to check your current Section access.', 'Retry'.
- Fix: Align message and retry label with old copy or explicitly approve vNext wording; preserve explanatory context.

## G2-18-001-039  [P2] GAP  facet F07  effort S
- Legacy: Legacy access errors distinguish `Faculty access required` vs `Could not load teacher course context`. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:217-226`
- vNext now: vNext missing delivery returns 404 and errors `Unable to load Course workspace`, no role-specific message on this route. `src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx:17-19`, `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx:10-20`
- Fix: Distinguish no faculty role, revoked assignment and transient server failure with legacy copy where safe.

## G2-18-001-041  [P2] GAP  facet F07  effort M
- Legacy: Legacy roster error is `We couldn't load the class roster. Check your connection and try again.` `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:234-265`
- vNext now: vNext roster fetch occurs server-side, resulting error boundary rather than inline Alert and Retry. `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:27-31`, `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx:10-20`
- Fix: Add inline roster error panel with exact message + Retry, not a false zero-roster state.

## G2-18-001-042  [P2] GAP  facet F07  effort M
- Legacy: Legacy syllabus load failure is error Alert with Retry; partial course-state failure has warning `Some course state could not be loaded`. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:890-934`
- vNext now: vNext Workspace load failure handled by route error boundary, signal warning separately. `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx:10-20`, `src/components/courses/faculty-course-home-signals.tsx:38-45`
- Fix: Separate lesson-fetch failures from dashboard metric failures; preserve retry and partial-content views.

## G2-18-001-044  [P3] GAP  facet F08  effort S
- Legacy: Legacy access error offers `Try again`. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:220-228`
- vNext now: vNext uses `Retry` and `Back to courses`. `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx:10-20`
- Fix: Rename course bootstrap retry to `Try again` when equivalent path, retain Back link.
