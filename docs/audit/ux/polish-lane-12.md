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

## 03 · Teacher / Class Schedule
**Surface:** `src/app/(authenticated)/teacher/calendar/page.tsx`  
**Problems found (9):** secondary navigation isolated under the title, nested calendar card duplicating the authenticated canvas border, toolbar/form gutters misaligned with the PageHeader, inflexible narrow section/month form controls, unusably compressed seven-day cells at 375px, missing visual treatment for today's date, weak empty-state contrast, unseparated detailed day/week section, and centered error actions.

**Fix:** promote “View live classes” to the shared page header, remove duplicate outer card, align calendar tools/form and preserve date links, use responsive 1/2/3-column filters and a full-width mobile Apply action, give the month grid a deliberate horizontally scrollable 770px minimum at phone widths (with the existing ScrollCue), apply existing legacy `data-today` highlighting in IST, use the shared slim alert for no schedules, separate the detailed agenda with one hairline, and align retry/courses error actions. Preserved query validation, timezone, current/previous/next month links, schedule exports, and learner class schedule interactions.

**Files changed:** `src/app/(authenticated)/teacher/calendar/page.tsx`, `src/app/(authenticated)/teacher/calendar/error.tsx`, queue and proof. Route loading, parent layout/error/not-found and the legacy class-month CSS, ScrollCue, CalendarGrid and LearnerClassSchedule inspected; no local template/not-found exists.

**Verification boundary:** static review only; no runtime or CI executed.

## 04 · Teacher / Contact detail
**Surface:** `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx`  
**Problems found (7):** vertically spread read-only facts, an overlarge empty-state component embedded under a simple roles heading, inconsistent gaps between sections, long disclaimer not capped for readability, Back button compressed on narrow devices, error retry without directory recovery, and missing route-local not-found treatment for intentionally hidden contacts.

**Fix:** align department and current roles in a responsive two-column description area at 768px (stacked on phones), retain all labels and role badges, replace a redundant nested full-page empty state with a compact status message, cap privacy copy line length, widen Back action for 375px screens, align retry and safe directory navigation, and add a generic `not-found.tsx` which does not reveal hidden membership data. Preserved filtered return URL, authorization/hidden-contact handling, parameters, identifiers and confidentiality boundary.

**Files changed:** `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx`, its `error.tsx`, new `not-found.tsx`, queue and proof. Loading state and nearest parent faculty layout reviewed, unchanged.

**Verification boundary:** static JSX and responsive review; no browser run or CI.

## 05 · Teacher / Tabbed contacts directory
**Surface:** `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx`  
**Problems found (8):** contact cards in a three-column grid instead of the legacy directory table, repeated boxed row treatment on the only canvas, cramped filter toolbar at 768px, misaligned count/controls when labels wrap, full-width filter controls fighting a narrow flex row, contact/department text lacking an aligned reading order, inconsistent mobile row tap area, and incorrectly escaped error header with a centered paragraph.

**Fix:** render compact shared hairline Table with Contact/Department/Current college roles at tablet+ widths; switch to no-card, separator-only mobile rows with full 44px accessible links; consolidate toolbar as a 1/2/3-column responsive grid; align total count, tab strip, search and pagination to a common gutter; retain existing filter query semantics, user-role privacy, role pills, and direct detail links; align the retry surface. Mobile/tablet are genuinely separate layouts, not squeezed cards.

**Files changed:** `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx`, its `error.tsx`, `src/components/courses/faculty-contacts-table.tsx`, queue and proof. Pagination, filters, loading, parent layout, link states and redirected invalid tabs inspected.

**Verification boundary:** static TypeScript/JSX inspection only; no build/tests or screenshots.

## 06 · Teacher / Contacts index redirect
**Surface:** `src/app/(authenticated)/teacher/contacts/page.tsx`  
**Problems found (0):** this route has no rendered surface; it only performs a server redirect to `/teacher/contacts/allContacts` and should not introduce a duplicate heading, loading card or intermediate screen.

**Fix:** reviewed the redirect destination, tab validation, query-filtered directory landing route and parent loading/error/access/not-found fallbacks. Kept the redirect unchanged so that the index never flashes a second layout at 375px, 768px or desktop. The actual directory layout was polished under surface 05.

**Files changed:** queue and proof only. Preserved original route and redirect behavior.

**Verification boundary:** source inspection, no runtime tests or CI.

## 07 · Teacher / Course home and Blueprint route
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx`  
**Problems found (9):** content and assignment item cards nested inside bordered lesson cards and the global canvas, unusually dense authoring/video/order forms exposed for every expanded lesson, action links compressed on phone, five stat tiles overly separated from content, double border treatments on empty lessons, heavy lesson-card padding drifting from global gutter, generic loading title, generic route error, and generic missing-lesson state without a recovery path.

**Fix:** retain Course Workspace and all query parsing/filter/lesson navigation but use native Disclosure for less-frequent lesson authoring, video and reorder controls; unfold these automatically for a selected lesson; render lesson and assessment items as hairline-separated rows rather than cards within cards; align the lesson heading to the shared canvas, make header actions stack at phone widths, and provide route-specific loading, retry/back, and safe not-found states. Existing faculty ownership, video permission, edit/delete confirmations, quiz attempts, content links, assessment state, class links, and learner preview behaviours remain wired.

**Files changed:** `src/components/courses/faculty-course-workspace.tsx`, `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx`, `loading.tsx`, new `not-found.tsx`, queue and proof. Teacher parent layout, lesson authoring, video manager, content order editor, quiz editor/review, item lifecycle, and home signals inspected.

**Verification boundary:** source-only review; no runtime/test/CI.

## 08 · Teacher / Section assessment health
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx`  
**Problems found (9):** Scope heading competing with h1, assessment row titles rendered as oversized page headings, filter controls wrapping at 375px, narrow 4-column metric grids on tablets, page header action lacking a mobile width rule, heavy repeated report-item borders, permanent pagination even for one page, dense grading-methodology disclaimer occupying primary content, and a generic card-shaped loading/error treatment.

**Fix:** restore one h1 visual hierarchy, use compact row titles/status Badge and legacy dividers, make filter grid 1/3 responsive with 44px touch targets, metric pairs on phones/tablets and four cells on wide screens, hide single-page pagination, move methodology explanation into an accessible native disclosure, align Retry and switch loading to directory shape. Kept counts, unknown-data semantics, permitted Section-only links, filters and URL pagination unchanged.

**Files changed:** assessment-health `page.tsx`, `error.tsx`, `loading.tsx`, queue and proof; nearest faculty course layout and inherited not-found states checked.

**Verification boundary:** static state/class review only; no runtime or CI.

## 09 · Teacher / Section assignments management
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx`
**Problems found (8):** unconstrained draft selector, overlarge secondary heading, stacked fields wasting tablet width, create/edit/publish/archive actions conflicting at 375px, methods fieldset nested as another card, empty resources using a full-page state within the form, resource rows unaligned on narrow devices, and route error with custom non-legacy padding and no safe exit.

**Fix:** place title/instructions and side-by-side due date/points in one responsive form grid; keep draft selector bounded and accessible; use one row of full-width phone actions and compact desktop actions; remove the nested method card and list resource links as separated aligned rows with safe touch targets and a compact empty message; align retry/back actions to PageHeader. Preserved unsaved-switch/archive confirmations, per-assignment method loading, validation, submissions restrictions, pending state and authoring APIs. Reviewed nearest parent access layout and route loading; no route-local not-found/template existed.

**Files changed:** assignment editor, method picker, resource links, manage/error.tsx, manage/loading.tsx, queue and proof.
**Verification:** static TypeScript/JSX inspection; runtime, tests and CI deliberately not run.

## 10 · Teacher / Attendance corrections redirect
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx`
**Problems found (5):** legacy placeholder route has no visible content but mismatched route loading label, generic card skeleton, inconsistent error padding on the single shell canvas, desktop-sized Retry control on phones, and no navigation fallback after failed authorization check.

**Fix:** preserve validation, Section authorization and redirect to attendanceDetail exactly (never resurrect the unimplemented request-history page); align route loading to the correction check, use existing directory loading shape, align PageHeader/error text and full-size primary Retry with a safe Back to courses link. Reviewed parent faculty access/error/not-found, and redirect destination routing; no local not-found/template exists.

**Files changed:** attendance-corrections `error.tsx`, `loading.tsx`, queue and proof. `page.tsx` intentionally unchanged: no rendered layout exists.
**Verification:** static review only; no build or CI.

## 11 · Teacher / Course attendance detail
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx`
**Problems found (7):** scheduling form placed before the attendance page heading, duplicate schedule workflows competing with the workspace's existing Schedule Class drawer, visual density at the top before marking attendance, large secondary inline heading, busy shortcut navigation at 375px, generic card loading, and centered error actions.

**Fix:** keep the attendance workspace and its PageHeader/primary marking flow first, move full inline scheduling tools into an accessible secondary Disclosure after the workspace, reduce its heading size and redundant top border, make Course/coverage links stack on phones, use directory loading and align retry/return actions. Reviewed shared 1,281-line attendance workspace including session/month toggles, roster mark/unmark, pending confirmation, schedule drawer, selected-day and student drawers, responsive scrolling, and empty/error states; all routes, session deep-link key, authorization checks, forms and confirmations preserved.

**Files changed:** attendanceDetail `page.tsx`, `error.tsx`, `loading.tsx`, faculty-attendance-schedule-editor, queue and proof.
**Verification:** static reading only; no app/CI run.

## 12 · Teacher / Discussion moderation history
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx`
**Problems found (7):** unrestricted filter toolbar with poor mobile alignment, secondary directory button narrower than 44px hit target in error state, event action rendered like a full heading, timestamp and actor line fragmented, long audit privacy caveat overexposed, pagination shown for one page, and error actions without a safe exit.

**Fix:** use legacy responsive filter strip with full-width mobile Filter, compact neutral status badge per audit action and aligned date/actor rows, native disclosure for the audit scope explanation, conditional pagination, and single-canvas retry/back recovery. Date formatter remains Asia/Kolkata, audit actions privacy-preserving, invalid filter redirect preserved. Reviewed inherited faculty route not-found/loading/layout and shared Pagination/Select/EmptyState states.

**Files changed:** discussion-history `page.tsx`, `error.tsx`, queue and proof.
**Verification:** static inspection only; no runtime/CI.

## 13 · Teacher / Discussion participation summary
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx`
**Problems found (7):** decorative dividers under every metric, unnecessarily tall desktop counts, pinned text competing with sender identity, long methodology disclaimer overexposed, back navigation lacking button affordance, weak metric grouping on 375px screens, and error retry without a safe exit.

**Fix:** align the four counts as one 2-up mobile/4-up desktop summary strip, keep hairlines only between major sections, mark pinned activity with a compact neutral Badge, provide a compact single-canvas Recent activity list and put counting rules in an accessible Disclosure. Preserve IST timestamps, privacy boundaries, empty-list representation, and authorized Section scope. Reviewed shared component/inherited loading/not-found/parent layout.

**Files changed:** discussion-participation `page.tsx`, `error.tsx`, queue and proof.
**Verification:** source-only, no runtime/CI.

## 14 · Teacher / Course discussions
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx`
**Problems found (6):** unencoded course identifier in back navigation, weak return-action affordance on narrow screens, two nested highlighted cards over the shared canvas, discussion composer geometry drifting below the message list, error content centered separately from the PageHeader, and no safe recovery to the course directory.

**Fix:** align the header's Course workspace navigation with shared secondary controls and encode the dynamic URL, flatten pinned-thread decoration to a pale compact separator strip while retaining the distinct scrollable chat region, ensure composer min-width stays constrained, and align retry/back controls. Inspected full moderated discussion component's loading, retry, pin/unpin, deletion and leave confirmations, older messages, reply composer, nested region scroll and 375/768 keyboard behaviours. All ids, labels, wording, logic and APIs remain unchanged.

**Files changed:** discussions `page.tsx`, `error.tsx`, shared discussion component, queue and proof.
**Verification:** static source review; no runtime/CI.

## 15 · Teacher / Individual published gradebook
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx`
**Problems found (8):** poorly scanned inline totals, tiny primary numbers, repetitive borders on breakdown rows, type labels lacking distinction, weak return navigation, permanently exposed score methodology copy, padded generic retry view, and generic inherited 404 for private learner scope.

**Fix:** numeric two/three column summary strip, separated assessment rows with neutral type badges, secondary back control, collapsible score explanation, consistent error retry and privacy-safe local not-found. Preserved published-only scoring, unknown values, routes and authorization. Read loading and parent faculty/gradebook layouts; no local not-found before fix.

**Files changed:** page, error, new not-found, queue and proof. Static inspection only; no tests/CI.
