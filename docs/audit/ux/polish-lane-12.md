# Lane 12 — page polish proof

## 01 · Teacher / My Assignments
**Surface:** `src/app/(authenticated)/teacher/allAssignments/page.tsx`  
**Problems found (10):** duplicate course/lesson/deadline lines, multi-card-on-canvas nesting, seven competing row actions, tablet three-column filters too narrow, search field compression, mobile row controls competing for width, unclear creation layout on narrow screens, duplicate full-page empty states when no assigned courses, route-error actions centered away from the content edge, and a missing `load` reference on the submission-grade error action.

**Fix:** use legacy single-canvas hairline-separated assessment rows; retain status and ownership badges but consolidate each date to one line; move secondary links, Edit, lifecycle changes, and management controls behind an accessible native “Actions” disclosure while keeping their destinations and confirmations; use 1/2/3 responsive filter columns at 375/768/1280 widths; make create and error actions full-width on phones and aligned at larger widths; use a compact informative no-course alert; wire the submission-grade Refresh button to its parent loader. All status, archive, review, save, publish, validation, busy and error flows remain connected through existing components. Faculty shell layout and parent error/loading/not-found examined; no local not-found/template file exists.

**Files changed:** `src/app/(authenticated)/teacher/allAssignments/page.tsx`, `src/app/(authenticated)/teacher/allAssignments/error.tsx`, `src/components/courses/faculty-assessment-overview.tsx`, `src/components/courses/faculty-assessment-create.tsx`, `src/components/courses/faculty-assignment-review.tsx`, `docs/orchestrator/queues/clone/lane-12-polish.md`, this proof file.

**Verification boundary:** static inspection of layout, responsive utility classes, user actions, state branches and TypeScript references only; no runtime, screenshot, build, test or CI executed per lane rules.

## 02 · Teacher / My Quizzes
**Surface:** `src/app/(authenticated)/teacher/allQuizzes/page.tsx`  
**Problems found (8):** unbalanced page spacing against sibling assignments, overextended results navigation button at phone widths, error actions centered instead of aligned with the canvas, competing row-level Submit/Release/Withhold controls, duplicate result-publication actions already present inside the submissions drawer, stale attempts remaining visible when a subsequent load fails, dense uncollapsed answer transcripts, and repeated zero-count plus empty-state messages.

**Fix:** align PageHeader and link geometry with the first polished faculty listing; align error/retry navigation and increase touch targets at 375px; keep the Submissions trigger as the single inline entry point and move Release/Withhold controls to their existing explicit-confirmation drawer controls; clear stale attempts before loading; provide native accessible answer disclosures per learner; suppress redundant zero-count beside the empty state. Preserved `?content=` preselection, permissions, per-section attempt data, publication confirmations, and notification wording.

**Files changed:** `src/app/(authenticated)/teacher/allQuizzes/page.tsx`, `src/app/(authenticated)/teacher/allQuizzes/error.tsx`, `src/components/courses/faculty-quiz-review.tsx`, queue and proof. Shared assessment creation/list/editor, question editor, and legacy faculty route loading/access/error/not-found inspected; unchanged as part of this surface.

**Verification boundary:** source inspection and responsive class/state review only; no tests, app runtime, build or CI performed.
