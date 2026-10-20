# Lane 12 — page polish proof

## 01 · Teacher / My Assignments
**Surface:** `src/app/(authenticated)/teacher/allAssignments/page.tsx`  
**Problems found (10):** duplicate course/lesson/deadline lines, multi-card-on-canvas nesting, seven competing row actions, tablet three-column filters too narrow, search field compression, mobile row controls competing for width, unclear creation layout on narrow screens, duplicate full-page empty states when no assigned courses, route-error actions centered away from the content edge, and a missing `load` reference on the submission-grade error action.

**Fix:** use legacy single-canvas hairline-separated assessment rows; retain status and ownership badges but consolidate each date to one line; move secondary links, Edit, lifecycle changes, and management controls behind an accessible native “Actions” disclosure while keeping their destinations and confirmations; use 1/2/3 responsive filter columns at 375/768/1280 widths; make create and error actions full-width on phones and aligned at larger widths; use a compact informative no-course alert; wire the submission-grade Refresh button to its parent loader. All status, archive, review, save, publish, validation, busy and error flows remain connected through existing components. Faculty shell layout and parent error/loading/not-found examined; no local not-found/template file exists.

**Files changed:** `src/app/(authenticated)/teacher/allAssignments/page.tsx`, `src/app/(authenticated)/teacher/allAssignments/error.tsx`, `src/components/courses/faculty-assessment-overview.tsx`, `src/components/courses/faculty-assessment-create.tsx`, `src/components/courses/faculty-assignment-review.tsx`, `docs/orchestrator/queues/clone/lane-12-polish.md`, this proof file.

**Verification boundary:** static inspection of layout, responsive utility classes, user actions, state branches and TypeScript references only; no runtime, screenshot, build, test or CI executed per lane rules.
