# UX review: /college/batches/cohort/id/students

- Route: `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx`; owner chat-4, first-half College UX rollout.
- Legacy copy, persisted data, mutation endpoints and permission checks unchanged.
- Source improvements: Keyboard-scrollable roster region and sticky first column on 320px; semantic row and column headers while keeping all class-move actions.
- Empty/error and pending states: existing copy retained. Wide tables remain desktop semantic tables, with an explicit keyboard-focusable scroll region on phones; sticky identity or selection column prevents context loss.
- Regression: `tests/unit/UX-college-college-batches-cohort-id-students-01.test.ts`, written but not executed. WebView, real-device and screen-reader validation pending.
