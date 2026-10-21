# Work packet: edit src/components/courses/faculty-course-home-signals.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-18-001-064  [P1] GAP  facet F12  effort M
- Legacy: Legacy Next action picks first known pending ungraded content, passes lesson and content id. `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:173-217`, `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:146-168`
- vNext now: vNext chooses pending submission and routes to lesson `?lesson` but catch-all ignores `?content`. `src/components/courses/faculty-course-home-signals.tsx:23-35`, `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:14-28`
- Fix: Support lesson+content focus and scroll/highlight item; preserve deep links for Review work.

## G2-18-001-042  [P2] GAP  facet F07  effort M
- Legacy: Legacy syllabus load failure is error Alert with Retry; partial course-state failure has warning `Some course state could not be loaded`. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:890-934`
- vNext now: vNext Workspace load failure handled by route error boundary, signal warning separately. `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx:10-20`, `src/components/courses/faculty-course-home-signals.tsx:38-45`
- Fix: Separate lesson-fetch failures from dashboard metric failures; preserve retry and partial-content views.

## G2-18-001-045  [P2] GAP  facet F08  effort S
- Legacy: Legacy faculty signals offer `Retry signals` on partial failure. `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:400-410`
- vNext now: vNext warning retries through `?refreshSignals=1` hyperlink. `src/components/courses/faculty-course-home-signals.tsx:38-45`
- Fix: Use equivalent action wording and real revalidation; confirm query param triggers refetch.
