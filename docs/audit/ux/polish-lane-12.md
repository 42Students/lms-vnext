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

## 16 · Teacher / Published gradebook directory
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx`
**Problems found (9):** huge learner headings repeated down a report list, list cards detached by large gaps, filter wrapping awkwardly on phone, search controls without clear widths, exported CSV scope cluttering live result count, duplicate per-row borders, metrics single-column despite available tablet width, long published-score caveat occupying lower viewport, and generic padded error state.

**Fix:** one legacy-style hairline-separated learner directory, 2/3-column score summaries, responsive search/filter/CSV controls, concise status counts with a secondary methodology disclosure and explicit CSV-scope explanation. Retain filtered search, bulk CSV export, page links, warning for assessment count cap, grade availability semantics, and privacy-safe learner links. Reviewed route/loading/inherited not-found, normalized data, Pagination, EmptyState and shared controls.

**Files changed:** gradebook `page.tsx`, `error.tsx`, queue and proof. Static review only; no runtime/CI.

## 17 · Teacher / Retired Section notices
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/page.tsx`
**Problems found (5):** no actual rendered notices page (intentional) but a misleading notice-board loading label, duplicate canvas/card skeleton, authorization-error padding drifting from the shared canvas, undersized retry button on phones, and no safe directory route after authorization read failure.

**Fix:** kept scoped-notice authorization check and redirect to the real Discussions route unchanged; corrected loading label/shape, aligned PageHeader, primary Retry and secondary Back to courses recovery at 375 and 768. Inspected parent faculty layout/not-found and target discussion page; did not reconstruct obsolete notice UI.

**Files changed:** notices `error.tsx`, `loading.tsx`, queue and proof. Route is pure redirect, no visible layout. Static review only, no CI.

## 18 · Teacher / Course default route
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx`
**Problems found (5):** index page is redirect-only but shows incorrect card-style loading fallback, generic loading label, thick duplicate error-canvas border, Retry framed as a secondary action when it is primary, and a centered recovery row with undersized back link on mobile.

**Fix:** retain validated redirect to the existing Course home tab; align loading shape, error PageHeader, mobile 44px Retry and Back to courses actions to the single canvas. Reviewed faculty course tab loader/error/not-found, dynamic course id validation and parent faculty shell. No fake intermediate content added.

**Files changed:** base course `error.tsx`, `loading.tsx`, queue and proof. Source-only review, no CI.

## 19 · Teacher / Section quiz builder
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx`
**Problems found (8):** duplicate Back to course links, excessive header spacing, large secondary quiz builder heading, nested question/preview cards inside canvas, unbalanced type/points controls on tablets, Create and publish checkbox competing for button width on phones, generic loading message, and route error without safe recovery.

**Fix:** one PageHeader Back to course action; flatter hairline question/preview sections; responsive two-column type/points controls; stacked mobile Create and publish; route-specific loading and error/retry/return UI. Read the 446-line QuizChoiceBuilder including local draft reconciliation, question/option order, publish/archive confirmations, paste options, learner preview and validation; preserved APIs, ids, labels, question behaviour and confirmations.

**Files changed:** manage page, error, loading, shared choice builder, queue and proof. Static-only, no runtime/CI.

## 20 · Teacher / Section reports
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx`  
**Problems found (9):** oversized repeated section and row headings competing with the page h1, a detached roster count, metric blocks with ambiguous reading order, assessment rows with large separate action areas, multi-line narrow filter toolbar, redundant Clear control when no filter, report links too narrow for touch, pagination with uneven mobile spacing, and error without a safe escape.

**Fix:** move the roster count into the single PageHeader subtitle; create a compact 2/4-column definition-list summary and a unified hairline report directory with 16px item titles, aligned right actions on desktop and full-width links on phones; place attendance/gradebook follow-ups in equal-width border-separated columns; provide one-column phone and aligned tablet/desktop filter controls, hide Clear unless active, and align responsive pagination/retry and contextual not-found navigation. Preserve all report selectors, full assessment metrics, authorized links, unknown counts, paging, form GET semantics and existing exact wording.

**Files changed:** `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx`, `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/error.tsx`, new `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/not-found.tsx`, queue and this proof. Reviewed `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/loading.tsx`, the parent course layout/error/loading, Faculty tab navigation, shared PageHeader/Button/EmptyState and report query model; no route template exists.

**Verification boundary:** static JSX/semantics and 375/768/1280 responsive utility review only; no code execution, tests, build, screenshots or CI.

## 21 · Teacher / Attendance session coverage
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx`  
**Problems found (8):** 4-way summary separated by wide card-like blocks, inconsistent heading scale with adjacent reports, recent session title/date losing reading order at 375px, overly dense mobile title/date clusters, no distinct session list boundaries, over-wide provenance disclaimer, nested bordered error card inside the shell canvas, and loading skeleton shaped like an unrelated card.

**Fix:** use the same 2/4-column hairline metric strip as Section reports, one 18px report-section heading, a bordered divider list with stacked phone / aligned tablet+ time labels, readable line lengths and touch-safe Back to Attendance. Remove nested error card in favor of a full-width retry plus safe Courses escape, use directory-shaped loading skeleton, and add a privacy-safe route-specific missing state. Preserve dateTime, IST formatting, counts and unknown semantics, the 40-session cap, omitted-count status and course authorization.

**Files changed:** `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx`, `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/error.tsx`, `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/loading.tsx`, new `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/not-found.tsx`, queue and proof. Reviewed FacultyCourseTabLayout, nearest teacher layout/fallbacks, shared components and session coverage service; no route template exists.

**Verification boundary:** static JSX/semantics and 375/768/1280 class review only; no runtime, tests, build, screenshot or CI.

## 22 · Teacher / Individual learner in a Section
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx`  
**Problems found (8):** competing heading scales, nested StatTiles inside the canvas, long contact values on phones, overly stacked tablet metrics, weak Back tap target, cramped monthly follow-up, retry without recovery, and a generic missing state.
**Fix:** remove nested tiles, use responsive hairline summary sections, uniform 18px headings, long-value wrapping and phone-width actions; add flat error and privacy-safe not-found with Courses escape. Preserved authorized data, attendance semantics, IST times, session table and links. Inspected local loading, teacher/course layouts, DataTable/StatTile and detail service. Files: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx`, `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/error.tsx`, new `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/not-found.tsx`, queue and proof. Static 375/768/1280 review; no build/tests/browser/CI.

## 23 · Teacher / Section students directory
**Surface:** `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx`  
**Problems found (9):** disjoint stat blocks, brittle flex toolbar, invalid `mt-[6px].5` class, CSV action competing with search, insufficient header action target, uneven table-count hierarchy, nested centered error card, no safe retry exit, no tailored missing state.
**Fix:** compact responsive 2/3-column summary, structured search-first 1/2-column toolbar, valid spacing utility, subordinate export control and flat loading/error/fallback alongside existing DataTable, pagination and avatar Dialog. Retained permissions, cls redirect, authorized CSV scope, all search fields, contact links and wording. Inspected loading, layouts, shared components and all roster states. Files: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx`, `src/app/(authenticated)/teacher/courses/[deliveryId]/students/error.tsx`, new `src/app/(authenticated)/teacher/courses/[deliveryId]/students/not-found.tsx`, `src/components/courses/faculty-course-roster.tsx`, queue and proof. Static 375/768/1280 review; no execution, tests, screenshots or CI.

## 24 · Teacher / My Courses
**Surface:** `src/app/(authenticated)/teacher/courses/page.tsx`  
**Problems found (8):** dashboard-like overlapping summary strip in each course, card rows competing with a dense 3-column desktop grid, four search controls cramped at tablet widths, count disclosures styled as more buttons, unclear course summary order, large row rhythm at 768px, centered error action unrelated to shell and generic missing state.
**Fix:** course list on a single canvas with one/two-column responsive distinct-course layout, hairline inline Content/Assignments/Quizzes metrics replacing nested SummaryStrip, demoted count disclosures, aligned search/filter controls, flat error/retry and route-specific missing state. Preserved all course data, selection/authorization, auto-submit GET filters, badges, tests IDs, pagination, exact labels and links. Reviewed list, auto-submit filter, PageHeader, loading, layout and fallbacks. Files: `src/app/(authenticated)/teacher/courses/page.tsx`, `src/app/(authenticated)/teacher/courses/error.tsx`, new `src/app/(authenticated)/teacher/courses/not-found.tsx`, `src/components/courses/faculty-course-list.tsx`, queue, proof. Static widths only, no app/tests/CI.

## 25 · Teacher / Live classes
**Surface:** `src/app/(authenticated)/teacher/live-classes/page.tsx`  
**Problems found (9):** full large edit form immediately visible above schedule, 4-item filter flex row compressed at 768px, Section control too small with long course labels, competing page and editor headings, oversized session titles, row links constrained on phones, unbounded disclaimer, bare failure panel and card-shaped loader unrelated to directory.
**Fix:** collapse infrequent Schedule/Edit/Cancel form into accessible native Disclosure without changing its fields, validation, confirmation or mutation states; align 1/2/4-column filter layout at 375/768/1280, keep content list above fold, make page actions touch-safe, use compact hairline list with 16px titles, improved recovery and matching loading/not-found. Preserve HTTPS links, IST, safe copying, pagination, published-only data, aria-labels, commands and wording. Reviewed editor/quarter-hour picker, ConfirmDialog, ThirdPartyLink, local loading and parent layout. Files: `src/app/(authenticated)/teacher/live-classes/page.tsx`, `src/app/(authenticated)/teacher/live-classes/error.tsx`, `src/app/(authenticated)/teacher/live-classes/loading.tsx`, new `src/app/(authenticated)/teacher/live-classes/not-found.tsx`, `src/components/courses/faculty-live-class-editor.tsx`, queue, proof. Static responsive review only; no runtime, tests or CI.

## 26 · Teacher / Notifications
**Surface:** `src/app/(authenticated)/teacher/notifications/page.tsx`  
**Problems found (7):** long announcements preceding actionable unread items, older-page navigation centered away from the list edge, same h1-like visual weight for both notification sections, oversized phone older-page action wrapping, error buttons centered off canvas, no direct fallback in missing route, and weak separation of primary workflow from broadcasts.
**Fix:** elevate personal notifications and read/unread actions ahead of college announcements, preserve full announcement feed below, align section headings to legacy 18px, make pagination affordance full-width on 375px, flatten error and provide privacy-safe missing route. Existing NotificationToolbar, notification grouping, mark-read/routing, pinned and unread badges, action confirmation, rate limiting, exact wording, and announcement availability remain unchanged. Inspected local loading and parent faculty layout; notifications list, toolbar, announcement feed and empty states. Files changed: `src/app/(authenticated)/teacher/notifications/page.tsx`, `src/app/(authenticated)/teacher/notifications/error.tsx`, new `src/app/(authenticated)/teacher/notifications/not-found.tsx`, queue and proof. Static mobile/tablet review only; no code/tests/CI.

## 27 · Teacher / Profile contact availability
**Surface:** `src/app/(authenticated)/teacher/profile/contacts/page.tsx`  
**Problems found (8):** overly tall separation between read-only identity sections, narrow contact facts on 768px, long email/phone with weak wrapping, a header navigation item not width-aware on phones, redundant physical section borders, status details not grouped to one reading edge, disclaimer spanning too much width and no safe recovery from route errors.
**Fix:** preserve two clear sections on the white canvas with matched hairline/gutter, responsive single/two-column definition lists, long-value wrapping, 18px headings and bounded notes; width-aware Profile navigation and flat Retry/Profile/missing-state recovery. Protected status-only semantics, intentionally unavailable editing, no save behavior and college-managed contact wording. Inspected contact service, loading, parent profile/teacher layout and fallback. Files changed: `src/app/(authenticated)/teacher/profile/contacts/page.tsx`, `src/app/(authenticated)/teacher/profile/contacts/error.tsx`, new `src/app/(authenticated)/teacher/profile/contacts/not-found.tsx`, queue and proof. Static 375/768/1280 review only; no runtime/screenshots/tests/CI.

## 28 · Teacher / Profile self-managed details
**Surface:** `src/app/(authenticated)/teacher/profile/details/page.tsx`  
**Problems found (12):** inline link too small on phones, overlong unavailable explanation, dense profile anchor row with weak focus, stacked legacy form cards, 2-column fields too tight at 768, save/discard hierarchy inverted, wide buttons crowding narrow screens, inconsistent vertical breaks, boxed skills/metadata rows inside white canvas, repeatable nested fieldset cards, generic loading copy and missing profile-safe recovery.
**Fix:** align breadcrumbs/header action with continuous canvas; harmonize anchored editor sections at 4/8/16/24 spacing and 18px headings; replace nested skill/metadata/record cards with separated rows, make text-section Save primary and Discard secondary with 375px full-width actions, preserve profile section IDs, save locking, confirmations, unsaved warnings, error feedback, search, fields and schemas; add context-specific loading/error/not-found with Profile navigation. Reviewed self-profile access, FacultyProfileEditor, TextSection, Skills, Metadata, Repeatable and shared ConfirmDialog, ErrorState, forms and faculty layout.
**Files changed:** `src/app/(authenticated)/teacher/profile/details/page.tsx`, its `error.tsx`, `loading.tsx`, new `not-found.tsx`, four editor child components and parent FacultyProfileEditor, queue and proof. Static 375/768/1280 inspection only; no app/test/CI.

## 29 · Teacher / Faculty profile overview
**Surface:** `src/app/(authenticated)/teacher/profile/page.tsx`. **Problems found (8):** three competing links, inconsistent widths, mobile wrap/clipping, repeated boxed shortcuts, weak edit hierarchy, overly narrow tablet information, contact overflow and unhelpful error recovery.
**Fix:** make Edit About the sole PageHeader primary action; demote teaching/contact destinations to accessible inline nav, align Profile facts in a 1/2/3-column description layout without cards, wrap contact values, cap disclaimer, and use flat retry/Courses error plus safe not-found. Inspected profile access, parent layout, loading/error/not-found and routes; no local template. **Files changed:** page, error, new not-found, queue and proof. Source/static 375/768/1280 review only.

## 30 · Teacher / Current teaching assignments
**Surface:** `src/app/(authenticated)/teacher/profile/teaching/page.tsx`. **Problems found (9):** unreferenced Pagination import, oversized per-course headings, flex search controls cramped at tablet, double line-height class, heading/action hierarchy, heavy row dividers, inline action too small for mobile, wide disclaimer and retry without safe navigation.
**Fix:** keep single PageHeader/subtitle, aligned employment facts, search-first 1/3 responsive toolbar, compact hairline rows, 16px titles and phone-width course links, align status/badge, bound disclaimer; include error and not-found recovery. Preserve all query params, faculty-only service, read-only labels, record statuses, paging destinations and existing wording. Inspected local loading, teacher/profile parent layouts and status-empty states; no template. **Files changed:** page, error, new not-found, queue and proof. No runtime, tests, build, screenshot or CI.

## 31 · Teacher / Assignment report
**Surface:** `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx`. **Problems found (10):** four nested metric cards competing with canvas, timing cards, oversized section headings, unaligned header actions, primary submission list undifferentiated from back/export controls, dense empty score lists, wrap-prone distribution rows, individual missing-student cards, student filter compressed at 768px and error panel using a second canvas.
**Fix:** use legacy continuous summary and timing hairline strips, 18px section headings, full-width primary filter/submission action on phone, unboxed student lists, aligned chart labels, responsive student list filter and pagination. Provide flat retry and privacy-safe local not-found. Preserved score math, chart thresholds, disclosures, StudentTable data, grade Drawer, print/download and CSV integrations, timestamps, authorization and all routes. Explicitly did not edit the transferred `faculty-report-download.tsx` owned by polish2. Read related module CSS, FacultyAssignmentReview state flows, report route error/loading, parent teacher fallback; no template. **Files changed:** report page, error, new not-found, `src/components/courses/faculty-report-student-table.tsx`, queue and proof. Source inspection only (375/768/1280), no runtime, tests or CI.

## 32 · Teacher / Assignment submissions report
**Surface:** `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx`. **Problems found (9):** three competing tab strips, search bar wrapping at tablet, duplicate page-level actions, overly large learner names, repeated mobile row borders, exposed secondary grade visibility/order selectors, full-width export note with poor hierarchy, unbounded last explanation, and read failure without recovery.
**Fix:** retain grading tabs as visible primary control and collapse unchanged grade publication/sorting Tabs into one accessible disclosure; align search-first 1/3 responsive form, make CSV subordinate to persisted count, render hairline learner rows with 16px names and full-width mobile actions. Flat retry/Courses recovery and safe missing state. Keep exact filter/url semantics, CSV scope, persisted data, HTTPS file review, grades/publication confidentiality, IST, pagination and labels. Inspected search/query service, FacultySubmissionFileReview, local loading and parent route/teacher fallback; no template. **Files changed:** page, error, new not-found, queue and proof. Source-only 375/768/1280; no runtime/tests/CI.
