# UI/UX polish · lane 13

## 1. Mentor · Project activity

**Surface:** `src/app/(authenticated)/mentor/activity/page.tsx` (including its invalid-filter, no-access, empty, filled, mobile/tablet, loading and route error states).

**Problems found (12):** (1) Eight equally prominent filters and the page-size selector displaced activity content; (2) filters in four equal desktop columns had no hierarchy; (3) header Projects navigation looked like an action button; (4) CSV export looked like a competing action button; (5) the result count, export and export-cap note had no clear alignment; (6) Clear competed with Apply inside the dense filter grid; (7) form margins and page sections had inconsistent left edges; (8) activity project name and timestamp occupied unnecessarily separate lines; (9) mobile filter/action layout was too dense; (10) empty results offered no next step; (11) single-page lists showed inert pagination; (12) invalid-filter and route error views had inconsistent spacing and retry alignment.

**What changed:** Kept only **Assigned project title**, **Recorded event group**, and **Apply** visible; moved six infrequent selectors plus the original **Page size** into the existing shared `Disclosure` pattern, opening it automatically whenever an advanced filter is active. Retained every original select option, field name, default, route, query behavior, label, clear/export destination, permission guard, and dynamic event text. Demoted Projects and CSV export to plain text links instead of competing bordered buttons; aligned result count and export with one measured separator; placed Clear beneath the disclosure. Compressed the list into labeled activity rows with the project link and IST timestamp in one wrapping metadata row. Restored clear hierarchy at 375px via stacked full-width search controls/Apply and 44px tap targets; at 768px used the existing 36px legacy control rule and two-field search row. Empty results now offer **Clear** for active filters or **Projects** when unfiltered; the one-page state suppresses disabled pagination only. The invalid-filter state and retry button match the content gutter; the existing disabled-state copy remains intact. Reviewed the existing `loading.tsx` (directory skeleton with slow-load recovery), route `error.tsx`, absence of route `not-found.tsx`/`template.tsx`, and parent `mentor/layout.tsx` and authenticated shell; no unrelated global changes.

**Files changed:** `src/app/(authenticated)/mentor/activity/page.tsx`; `src/app/(authenticated)/mentor/activity/error.tsx`; `docs/orchestrator/queues/clone/lane-13-polish.md`; `docs/audit/ux/polish-lane-13.md`.

**Validation:** Source-level JSX/import/tag inspection, including empty, filtered and full result paths plus 375/768/1280 CSS semantics. No browser screenshots or CI were run.

## 2. Mentor · All Quizzes legacy bookmark

**Surface:** `src/app/(authenticated)/mentor/allQuizzes/page.tsx`. Read entire route and Mentor role layout, checked absent route-local loading/error/not-found/template files. Immediate server `redirect("/mentor/projects")` renders no JSX or controls at 375/768/1280. **Problems found: 0, code fixes: none**—preserved the exact bookmark and destination, avoiding an interim redirect flash or duplicate UI. Files changed: checklist and this proof only. No browser or CI.

## 3. Mentor · Meetings calendar

**Surface:** `src/app/(authenticated)/mentor/calendar/page.tsx`; inspected all rendered `FilterBar`/`ResponsiveFilterDrawer`, `MentorMeetingsCalendar` and scoped stylesheet, `MentorProjectsUnavailable`, `MentorCalendarLoadFailure`, shared PageHeader/Input/Select/Button; route-local loading/error, absent not-found/template, nearest Mentor and authenticated layouts.

**Problems found (9):** 8 uniformly prominent filters overwhelmed the meeting list; mobile drawer stacked a wall of controls; primary Filter was not visually aligned with inputs; count appeared below an oversized CSV button; export competed with Filter; meeting action links were right-aligned away from metadata; empty group had an unnecessarily boxed dashed notice; empty filtered results lacked a clear reset path; route error retry sat too close to the error text.

**Changes:** retained all 8 selectors, search field association `form="mentor-calendar-filters"`, options, actions, query serialization, project permissions and CSV export. Kept **Action needed**, **IST dates**, and **Filter** first in a uniform 375px stacked / 768px three-column control row. The remaining 6 selectors now sit under a native accessible `Disclosure`, automatically expanded for active advanced filters inside the existing responsive drawer (one DOM subtree). Pass active filter count to the existing FilterBar button. Align meeting count and secondary CSV export in one responsive result band; provide Clear when a filtered result is empty without removing the existing calendar group empty messages. Left-align row action links with project metadata; quiet empty notices to a hairline without changing text, palette or typography family; align route error retry spacing and control height. Existing `loading.tsx` skeleton, shared failure banner and parent layouts needed no change.

**Files changed:** `src/app/(authenticated)/mentor/calendar/page.tsx`; `src/components/projects/mentor-meetings-calendar.module.css`; `src/app/(authenticated)/mentor/calendar/error.tsx`; lane queue and this proof. Source-level states and 375/768/1280 rules inspected; no runtime screenshots or CI.

## 4. Mentor · Contacts legacy bookmark

**Surface:** `src/app/(authenticated)/mentor/contacts/[[...contactsTab]]/page.tsx` — read entire optional-catchall page and parent Mentor role-guard layout; checked all route-local loading/error/not-found/template candidates (none exist). This route calls `redirect("/mentor/projects")` before any DOM is rendered. **Problems: 0; visual/structural fixes: none.** There is no page surface, overlay, interactive state, focus target, or responsive layout here to clutter or realign. Preserved the exact legacy bookmark route and destination rather than introducing a duplicate screen or redirect flash. **Files changed:** queue and proof only. Source-only inspection; no browser or CI.

## 5. Mentor · Course detail legacy bookmark

**Surface:** `src/app/(authenticated)/mentor/courses/[courseId]/[[...courseTab]]/page.tsx`. Inspected the whole source, optional catchall route candidates (`loading`, `error`, `not-found`, `template`: absent), nearest course layout (absent), and the inherited Mentor role guard. The only operation is a server `redirect("/mentor/projects")`; no on-screen page, loading state, overlay, control, headings, tables or actions are rendered at 375/768/1280. **Problems found: 0; fixes: none.** Maintained exact URL capture and redirect behavior rather than adding an intermediate UI. Files changed: this proof and lane checklist only; no browser/CI.

## 6. Mentor · Courses legacy bookmark

**Surface:** `src/app/(authenticated)/mentor/courses/page.tsx`; reviewed its complete page and all four candidate route states (no loading/error/not-found/template files), inherited Mentor and authenticated layouts. Server-only `redirect("/mentor")` is the **entire** implementation: no rendered DOM, page, form, overlay, hover/focus, loading, empty state or viewport-specific content exists. **Problems found: 0. Changes: none.** Kept the different `/mentor` redirect exactly as written (distinct from the course-detail redirect) to protect legacy routes/permissions. Files changed: lane-13 polish queue and this proof only; no browser/CI.

## 7. Mentor · File Explorer legacy bookmark

**Surface:** `src/app/(authenticated)/mentor/fileExplorer/page.tsx`. Fully inspected: immediate server `redirect("/mentor/projects")`, nearest Mentor role/layout and authenticated shell; route-local loading, error, not-found and template files are absent. All 375/768/1280 and interactive states are inapplicable because no page is rendered before redirect. **Problems: 0; fixes: none.** Did not invent an interim file manager UI or modify redirect/authorization behavior. Files changed: checklist and this proof only; no browser/CI.

## 8. Mentor · Notifications

**Surface:** `src/app/(authenticated)/mentor/notifications/page.tsx` + route-local `loading.tsx` / `error.tsx`; no not-found/template exists. Inspected `NotificationToolbar` and its confirmation, pending/error toast, `NotificationList` (empty/read/mark read/open), `AnnouncementFeed` (disabled/empty/filled), Alert and StatusBadge, nearest Mentor/authenticated layouts.

**Problems found (9):** page opened with announcements before its personal inbox; three section blocks had excessive uniform space; partial-source warning heading competed with the page h1; attention filters wrapped unpredictably at 768px and overloaded 375px; each attention item added a border competing with the list divider; long notification bodies/titles could shrink poorly in two-column rows; route loading gutters differed; error Retry was detached from its explanation; attention filtering/status messages were lower priority than primary notifications.

**Changes:** moved **Personal notifications** and its existing view/read-all controls to the top, with Project attention next and College announcements last, preserving each original section id, heading, text, route and permissions. All query parsers, source failures, announcement policy, inbox cursor and mark-read behavior remain unchanged. Reduced outer blank spacing to legacy 16/24px rhythm; turned attention filters into a 375px single-column / 768px two-column / wider multi-column grid with unchanged inputs/labels and Filter attention. Consolidated attention row divider use, demoted the partial-source notice heading, ensured long list item content has `min-w-0`, and aligned loading and error Retry spacing/44px phone target. No shared visual token changes or new packages. **Files changed:** notifications page, loading and error route files, `src/components/activity/notification-list.tsx`, this proof/queue. Source-level state and responsive check only; no screenshot or CI.


## 9. Mentor · Landing (enabled and unavailable states)

**Surface:** `src/app/(authenticated)/mentor/page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, inherited `mentor/layout.tsx`; inspected `PageHeader`, shared `Alert`, and `GracefulErrorBoundary` with loading/retry/active/inactive role and project module states. No route-local template exists.

**Problems found (6):** failure message and two actions sat in a loosely spaced vertical block; View notifications—the only available next action—was pushed below the retry link; Retry had stray `mb-3` unrelated to its sibling `mt-4`; the primary link did not fill the 375px viewport; root/loading/not-found gutters were inconsistent; route `error.tsx` rendered the full public `GracefulScreen` **inside** the already-authenticated shell instead of an inline retry state.

**Changed:** preserved the exact membership and optional-module permission checks and redirects (`/dashboard`, `/mentor/projects`), existing copy/links, and original legacy control tokens. Grouped availability actions directly under the alert in a shared flex region: full-width **View notifications** first on 375px, content-width from 768px; **Retry access check** stays a demoted secondary text link only for policy resolution failures. Removed competing margins and normalized 16/24px page/content gutters. Passed `insideShell` with `homeHref="/mentor"` to the existing error boundary, retaining diagnostic reporting, safe reload and Retry behavior without nesting a second standalone app layout. Kept not-found wording/destination and loader label, aligned their max width. **Files changed:** mentor landing page, error, loading, not-found, lane queue and this proof. Source-only review; no browser or CI.


## 10. Mentor Profile — legacy bookmark

**Surface:** `src/app/(authenticated)/mentor/profile/page.tsx`. Fully read the server route, inherited Mentor layout/permission guard and checked route-local loading, error, not-found and template files (none). Immediate `redirect("/mentor/projects")` renders no JSX or responsive state, so no clutter, layout, overlay or interactive control exists to polish. **Problems found: 0; changes: none** — maintained legacy route and destination exactly. **Files changed:** this audit and polish queue only. No browser/CI.

## 11. Project activity history

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx`, loading/error and inherited mentor/project layouts; checked FilterBar/ResponsiveFilterDrawer, controls, native Disclosure, list, EmptyState and Pagination (empty/error/filled/focus/375/768). **Problems found/fixed (9):** five undifferentiated filters dominated desktop; mobile filter drawer too long; actions did not align to inputs; redundant bordered workspace navigation competed with Filter; separate result-count and export rows wasted vertical space; export looked primary; empty result had no action; inactive pagination appeared on a single page; error Retry and message lacked aligned spacing. **Fix:** always show importance and type with Filter, keep other three filters behind a native disclosure opened for active values, retained same query field names and options, preserve FilterBar mobile single DOM subtree; demote back/export to links; merge result count and CSV warning; clear action for empty; only render pagination for 2+ pages; align error Retry. **Files:** page, route error, queue, proof. Loading and absence of local not-found/template checked. No browser or CI.

## 12. Task board status / board review

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx` and route loading/error states, inherited mentor/project layout, rendered FilterBar, StatTile, Select/Input/Button, EmptyState, Pagination. **Problems fixed (9):** five-column KPIs and count placed before the useful task list; long filter row wrapped inconsistently; Filter not full-width on phone; workspace link competed with Filter; separate export button before list; Sprint summaries pushed actual tasks below the fold; task h2 typography overwhelmed the page h1; pagination shown for one page; empty/error states had no clear aligned next action. **Changes:** stack/mobile grid for filters, retain all query names/options; demote workspace and CSV exports; move task results and pagination ahead of optional sprint summaries (same exact data and text); adjust row title hierarchy and gutters, add empty-state workspace action, conditional pagination and 44px retry. **Files:** page, error, queue, proof. Source-level hover/focus and 375/768/1280 review; no browser/CI.

## 13. Project closeout

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx`, its loading/error route states, `MentorProjectCloseoutControl` (unchecked/partial/ready/pending/confirm/error), `ConfirmDialog`, Checkbox and StatusBadge, Mentor layout. **Problems fixed (6):** bordered header workspace link competed with completion action; checklist rows lacked dividers; inconsistent 0/16/24px vertical spaces; disabled explanation separated from prerequisite rows; active completion control sat too far below checklist; route retry had no consistent 44px target. **Changes:** demote workspace navigation, add single hairline row separators, unify gutters, keep native checklist/status/readiness above controls, tighten enabled confirmation spacing and align error retry. Preserved all four prerequisites, three required acknowledgments, request/confirmation behavior, wording, IDs and legacy tokens. **Files:** page, error, queue, proof. No CI/browser; 375/768 and enabled/disabled states checked in source.

## 14. Mentor delivery-version review

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx`, loading/error and inherited Mentor layout; read complete metadata, review, learner notes, source/demo safety checks, attachments, history and shared Disclosure. **Problems fixed (8):** large headings competed with h1, huge 10-field review grid before feedback, secondary overview looked primary, repeated equal-weight sections made a wall of text, attachment/history sections overwhelmed primary review content, duplicated loading message, inconsistent error gutter and Retry target. **Changes:** demote navigation to link, unify 16/24px legacy section rhythm and heading scale, leave decision/feedback/notes/source first, collapse attachment and history evidence into existing accessible disclosure controls (all data/links/labels preserved), remove duplicate loading text and align retry. Mobile 375 full width, tablet 768 grid, no new token/package. **Files:** page, loading, error, proof and queue. No browser/CI.

## 15. Mentor meeting outcome notes

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx` and route loading/error states; inspected `MentorMeetingNotesEditor` (view/edit/confirm/discard/pending/save error/success), Dialog, ConfirmDialog, Textarea, project permissions and inherited layout. **Problems fixed (6):** secondary Meeting history styled like primary; 24px excess gaps separated notes and action; status/time competed with outcome hierarchy; section gutters inconsistent; loading repeated the same text twice; route error Retry had no consistent 44px tap target. **Changes:** demoted history, unified label/outcome/action vertical rhythm, kept notes editing dialog and all audit/validation/permissions intact, aligned loading/error and removed duplicate skeleton text. **Files:** page, loading, error, queue, proof. Source-only 375/768 and states review; no CI/browser.

## 16. Mentor project workspace shell

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx`, project loading/error, inherited Mentor layout, ProjectWorkspaceHeader/ProjectWorkspace, Tabs/Breadcrumbs, MentorProductBacklog, MentorLaneBoard and MentorTaskAllocation with their existing create/edit/confirm/disabled/empty states. **Problems fixed (7):** ten large bordered secondary tools pushed the selected board/content below fold; quick links competed with workspace tabs; page root and board gaps differed; tools overflowed on 375px; title/header weight competed with actions; secondary links looked primary; error retry uses wrong breakpoint. **Changed:** move unchanged Additional project tools disclosure below the selected page content, turn tool buttons into simple wrapping 1/2/3-column links with 44px phone targets, normalize shell and board spacing to 16/24px, align error retry to 768px. Preserved every tab, route, authorization and workspace state; shared rendered components inspected but deferred their owned overlay-specific changes to their queued surfaces. **Files:** page, error, queue, proof. No browser/CI.

## 17. Resource links directory

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx`, loading/error, inherited layout, FilterBar/Select/Input, EmptyState/Pagination, safe-link states. **Problems fixed (9):** large card-per-resource framing nested within canvas, oversized h2 titles, crowded filters, CSV export competed with page task, redundant pagination on one page, 375px Filter button too small, empty state lacked reset, duplicate loading text, error Retry sizing. **Changes:** hairline resource list with compact labels, responsive filter controls, demoted export and header action, restore clear action when no matches, hide single page pager, normalize route state gutters. All URL checks/query parameters and text preserved. **Files:** page, loading, error, audit/queue. Source-only; no browser/CI.

## 18. Delivery review completeness

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx`, loading/error, inherited Mentor layout, PageHeader, EmptyState, Pagination and StatusBadge. Reviewed enabled/disabled, zero/one/many versions, missing review data and 375/768 layout. **Problems fixed (6):** workspace secondary CTA competed with content; list headings too heavy for version rows; metadata and dates spaced inconsistently; no next step for zero versions; pagination occupied space for single-page history; error retry misaligned. **Changes:** demote workspace link, compact row separators and description grid, add original workspace destination as empty recovery, hide single-page pager and align error Retry. No altered ids, date labels or disclosure of restricted history. **Files:** page, error, audit, queue. Source-only; no CI/browser.

## 19. Delivery review overview

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx`, loading/error, inherited Mentor layout, FilterBar/ResponsiveFilterDrawer, EmptyState, Pagination and review detail navigation. **Problems fixed (8):** bordered workspace/export actions competed with Filter; search controls wrapped unevenly at 375/768; coverage heading was oversized; individual version h2 headings competed with main title; large 24px separator preceded results; no action on zero versions; pagination for one page; error Retry misaligned. **Changed:** measured responsive filter grid, quiet secondary links, restore list hierarchy and section spacing, empty workspace action, conditional pager, aligned error. Preserved all query fields, version routes, review text and permissions. **Files:** page, error, proof, queue. Source-only; no CI/browser.

## 20. At-risk & readiness

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx`, route loading/error, FilterBar/ResponsiveFilterDrawer, stat tiles, EmptyState/Pagination and inherited project access. **Problems fixed (9):** boxed 5-card metric region inside white canvas, uneven typography, dense filter wrapping at 375/768, header back CTA overemphasized, list h2 titles larger than needed, mismatched vertical gutters, empty filters with no reset, inert single-page pagination, duplicate loading and cramped error Retry. **Changes:** flatten signals into separated responsive metrics, align 2-field filter/search/action grid and 44px phone targets, demote workspace, compact row titles, clear recovery for empty, conditional pager and tidy states. Preserve all query semantics and safety caveats. **Files:** page/loading/error/proof/queue. Source-only; no CI/browser.

## 21. Mentor task feedback

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx`, loading/error, EmptyState, StatusBadge, version rows, authorized Board link; checked absent not-found/template. **Problems fixed (6):** generic conversation-unavailable notice buried persisted review feedback, oversized row headings, no recovery for empty feedback, inconsistent gutters, feedback rows cramped on mobile, route retry not 44px. **Changes:** place actual read-only feedback before contextual warning (warning text retained verbatim), align compact version headings and responsive rows, add original Board destination in empty state, standardize error Retry. Preserved all permission/persistence caveats and link targets. **Files:** page, error, queue, proof. Source-only review, no CI/browser.

## 22. Mentor team membership history

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx`, loading/error, Tabs, FilterBar/Select, StatusBadge/Pagination/EmptyState, Mentor role scope; reviewed all/open/ended, invalid filter and 375/768. **Problems fixed (7):** history navigation was buried below filter row, uneven filter widths, Filter lacked phone full width, header back looked primary, version row headings oversized, empty lacked next step, single-page pagination and error retry spacing. **Changes:** move retained tabs above controls, align filter grid, demote team workspace link, compact rows and dates, empty workspace recovery, conditional pager and aligned error. All query names/tabs/routes/copy retained. **Files:** page, error, proof, queue. Source-only; no CI/browser.

## 23. Mentor team & meeting log

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx`, loading/error, FilterBar, MentorMeetingReschedule (dialog/confirmation/discard/error/pending), meeting records, empty/Pagination and role checks. **Problems fixed (9):** equal-weight five filters buried meeting list; filters too dense on phone, primary Filter weak, 3-count summary heading oversized, workspace link looked primary, meeting titles oversized, 24px separators added height, no empty next action, single-page paginator and error retry spacing. **Changes:** keep status and title filter visible with full-width mobile Filter, collapse three advanced fields auto-open when active; compact coverage and meeting rows, demote workspace link, empty recovery and conditional pager. Keep reschedule behavior, labels, dates, routes and permissions unchanged. **Files:** page/error/audit/queue. Source-only; no CI/browser.

## 24. Release & Sprint timeline

**Surface:** `src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx`, loading/error, NeedsDoingChips, Timeline/TimelineEntry, StatusBadge, EmptyState and Pagination. **Problems fixed (8):** competing bordered workspace button, two disconnected chip rows, oversized release/sprint headings, cramped mobile controls, absent empty next step, inert pagination for one page, retry sizing and a local stylesheet import pointing to no existing module (`legacy-timeline-filters.module.css`). **Changes:** group both chip filters at one left edge using shared spacing, remove unavailable local CSS dependency while retaining shared legacy chip styles and aria labels, quiet headings, demote back link, add empty Sprint workspace action, conditional pager and aligned route error. All milestone semantics, hrefs and privacy copy retained. **Files:** page, error, audit/queue. No runtime/CI.

## 25. Mentor projects directory

**Surface:** `src/app/(authenticated)/mentor/projects/page.tsx`, loading/error, ProjectParticipantListControls/Pagination (search, filters, sorted/paged, pending auto-refresh), ProjectList (empty/filled/hover/focus/card details), MentorProjectsUnavailable and Mentor access shell. **Problems fixed (8):** seven header actions formed a multi-row toolbar before any projects; navigation links looked equally primary, filter row wrapped unevenly at 375/768, input widths misaligned, list content far below fold, no clear separation between projects and secondary tools, disabled/error control sizing inconsistent, page gutters excessive. **Changes:** keep Projects heading, filters and actual ProjectList immediately visible, move all seven original destinations to a grouped responsive `Disclosure` after the list, demote them to text links, use mentor-only filter grid aligned at 375/768 without touching learner layout, align route Retry. Every option/name, live refresh, route, permission and card content retained. **Files:** page, shared participant-list controls, error, proof, queue. Source-only; no CI/browser.

## 26. Mentor reports

**Surface:** `src/app/(authenticated)/mentor/reports/page.tsx`, loading/error, FilterBar/Disclosure/ResponsiveFilterDrawer, report list, source metric statuses, EmptyState and Pagination. **Problems fixed (10):** two groups of four boxed KPIs displaced filtered projects, six undifferentiated selectors cluttered 375px, two competing export/workspace actions, filter submit misalignment, cards nested inside canvas, oversized row titles, empty state lacking a next step, single-page pager, inconsistent section gaps and route Retry. **Changes:** show core search/status/Filter first, group four advanced selectors behind accessible disclosure opened when selected, move metric groups below actionable report rows, flatten cards to hairline list, demote CSV and nav links, empty Clear, conditional pager, error consistency. All numbers, labels, query behavior and permissions preserved. **Files:** page, error, queue, proof. No browser/CI.

## 27. Delivery review history

**Surface:** `src/app/(authenticated)/mentor/review-history/page.tsx`, loading/error, Tabs, FilterBar/Disclosure, history list, permissions and empty/pagination. **Problems fixed (10):** decision tabs appeared after overlong six-field filter row; search action lacked focus; four rarely used controls dominated page; status/data columns misaligned at 375/768; pending-review header styled primary; large row titles; no empty clear; single-page pager; manual generic skeleton diverged from shared directory layout; error Retry cramped. **Changes:** tabs first; search/project + Search always visible, four advanced selectors in disclosed group opened when active, preserve hidden decision value and exact href/query semantics; demote navigation, compact list, clear empty, conditional pager, shared graceful loading and error alignment. **Files:** page, loading, error, audit/queue. Source-only; no CI/browser.

## 28. Delivery review queue

**Surface:** `src/app/(authenticated)/mentor/reviews/page.tsx`, loading/error, Select/Input/PageSize, Disclosure, EmptyState/Pagination, 375/768/1280, and restricted delivery href actions. **Problems fixed (9):** six competing filters and page size hid actual reviews; two header links were large buttons; CSV export another competing action; Filter lacked stable alignment; dense row link repeated an emphasized action line; 375px required full-width Filter; empty state lacked next step; single-page pagination; error Retry gutter. **Changes:** keep search/project and Filter visible, tuck five secondary controls into a disclosure auto-open when selected, demote links, compact review rows, empty Projects recovery, conditional pager and aligned route error. Original text, filter names, export, permissions retained. **Files:** page, error, audit/queue. No browser/CI.

## 29. Mentor sprint progress

**Surface:** `src/app/(authenticated)/mentor/sprint-progress/page.tsx`; read its rendered FilterBar/ResponsiveFilterDrawer, Select/Input/Button, Disclosure, EmptyState, Pagination, loading/error, checked absent not-found/template and Mentor/authenticated layouts.

**Problems fixed (10):** six equal-weight filters bury sprint data, grid-free wrapping on tablet, mobile filters too tall, header navigation competes with Filter, export looks primary, detached count, 30–40px card headings, four KPI columns squeeze phones, empty has no next step, one-page pager and cramped route error.

**Changes:** keep Search and Assigned project prominent; place status, attention, release and order in an accessible disclosure that auto-opens for active selections. Retain original form field names, options and GET behavior inside the same form and responsive drawer, give Filter a full-width phone target, demote links, align count/export, flatten compact sprint rows into hairline separators and 2/4-column task stats, offer Clear or Projects recovery, suppress inert pager, align loading and error states. All legacy colors, permissions, routes, task counts, copy and export cap retained. Reviewed semantics for 375/768/1280 in source; no browser or CI.

**Files:** page, loading, error, queue, proof.

## 30. Mentor reviewed task history

**Surface:** `src/app/(authenticated)/mentor/task-review-history/page.tsx`; inspected route loading/error, absent not-found/template, inherited Mentor/authenticated layout and rendered shared FilterBar/ResponsiveFilterDrawer, Select/Input/Button, Disclosure, EmptyState and Pagination.

**Problems fixed (9):** four equal-weight filters and two command links obscure history, mobile form becomes a wall of controls, unmatched text/button baselines, detached export/count, oversized task headings, secondary links separated at inconsistent offsets, empty history has no recovery, one-page paginator is inert, route retry is too cramped.

**Changes:** prioritize task/project and decision, disclose priority and chronology with active auto-open, keep original GET field names and options, align full-width phone Filter and compact tablet grid, demote export and pending-review links, combine count/export, compact record titles and wrap both authorized Board/feedback actions, add conditional clear-or-pending empty action and hide one-page pager. Preserve all query semantics, security copy, permissions, roles, URLs and original labels. Existing GracefulPageLoading needed no change; error Retry realigned to 44px on phone. Checked source semantics at 375/768/1280; no browser/CI.

**Files:** page, error, queue, proof.

## 31. Mentor pending task reviews

**Surface:** `src/app/(authenticated)/mentor/task-reviews/page.tsx`; inspected full query/export models, inherited Mentor/authenticated layout, loading/error, absent not-found/template, shared Input/Select/Button/Disclosure/EmptyState/Pagination.

**Problems fixed (11):** two competing bordered navigation links, eight flat controls before reviews, page-size filter overemphasized, card-inside-canvas filter border, uneven 375px and 768px wrapping, Filter weak at phone width, export competing as a CTA, result count detached, no zero-result recovery, duplicated manual pagination, and loading/error inconsistent.

**Changes:** preserve search/project as primary fields and all six infrequent filters in auto-open native disclosure inside the same GET form; use legacy field/control styles and one hairline; responsive 375 single-column and 768 two-column grid; demote both nav links/export; align count/export; preserve exact Board task href, submitted timestamps, all sort/priority/assignment/page-size semantics and out-of-range recovery; use shared Pagination only for multiple pages and shared graceful loading. Add clear/history empty recovery, align route Retry. Source-inspected state variations at 375/768/1280; no code execution, CI or screenshots.

**Files:** page, loading, error, queue, proof.

## 32. Mentor team coverage

**Surface:** `src/app/(authenticated)/mentor/team-coverage/page.tsx`; inspected rendered FilterBar/ResponsiveFilterDrawer, Select/Input/Button, Disclosure, StatTile, Pagination/EmptyState, route loading/error, absent not-found/template, parent Mentor/authenticated layouts.

**Problems fixed (10):** five undifferentiated selectors, dense mobile wrapping, filter action misalignment, large Projects button competing with Filter, triple cards nested in one legacy canvas, oversized project heading, redundant oversized member metrics, empty assignment/filtered results without recovery, inert one-page pager, unaligned route Retry.

**Changes:** keep search and Team coverage quick filter visible, disclose state/assignment/order and auto-expand when advanced filter active; one GET form with exact original names/options/behavior in mobile filter drawer; responsive two-column tablet alignment and full-width phone Filter; demote navigation, flatten summary tiles into an unboxed metric strip, compact project row headings and metric grid, add Projects/Clear recovery for empty, hide one-page pager, realign Retry. No role, data, metrics, links, labels or status semantics changed. Shared GracefulPageLoading already conforms. Source inspection includes 375/768/1280, no browser/CI.

**Files:** page, error, queue, proof.

## 33. Learner task progress controls

**Surface:** `src/components/projects/learner-task-progress-control.tsx`; inspected rendered Button, Textarea, ToastProvider/ToastStack and projectMutation plus backend input schema for STATUS/MOVE_UP/MOVE_DOWN and blocked-note validation. Reviewed default statuses, pending, open/close blocker, success/error, disabled movement and 375/768 layouts.

**Problems fixed (8):** five equal-priority buttons obscure Start work, movement controls mixed with state changes, narrow phone buttons wrap unevenly, Report blocker lacks announced expanded state, blocker form has no visual separation or aligned actions, input allows 4000 chars while the API accepts only 2000, empty two-character notes fail only on server, error messages can overflow.

**Changes:** make Start work/Resolve blocker the only primary action; demote Move up/down to separate ghost group and retain disabled semantics, use 44px stacked full-width phone state controls and responsive blocker form, connect the disclosure trigger with aria-expanded/controls and a stable React useId, align Save/Cancel with 44px targets, match max 2000/min 3 server requirements, show count/help and invalidate incomplete notes, retain toasts, retry and exact API routes/status actions. No overlay/modal newly introduced or package added; checked JSX source and focus semantics, not live browser/CI.

**Files:** component, queue, proof.

## 34. Mentor lane board

**Surface:** `src/components/projects/mentor-lane-board.tsx`; inspected BoardColumn/legacy CSS, MentorTaskCreate and create/cancel/discard dialog, TaskDetailDialog, ProjectTaskAssigneeControl, ProjectTaskComments, MentorTaskDeleteControl, status confirmation/undo, drag/drop, empty filters and status loading/error. Checked phone 375, tablet 768 and desktop 1280 via source layout rules.

**Problems fixed (10):** Create task lost emphasis to Review submission, six flat dense board controls cramped mobile, Lane selector duplicated lane chips, clear action lacked full-width phone target, long card titles sat on center-aligned buttons, nested task detail border reproduced separate cards in one white canvas, delete/assignee controls competed with Move, no next step on empty filtered board, blank horizontal lane region still displayed when no tasks, and swipe affordance was invisible on phones.

**Changes:** Introduced optional primary treatment for Board's Create task without changing other usages; demoted Review submission and Back to project links; kept Release/Sprint visible and grouped scope/priority/assignee/lane in auto-open accessible disclosure, retaining every original URL filter key, select option and lane chip. Kept drag/drop and keyboard Move, native confirmation/blocker prompt, undo and error Alert; task actions/details/comments remain in a quieter task disclosure, task title is left-aligned and wraps, empty result offers Clear all, only nonempty board renders horizontal lanes and shows mobile sideways-scroll hint. Standardized 44px mobile targets and 768px two-column selectors, kept legacy board CSS/token values. Validated JSX by source reading only; no runtime/CI.

**Files:** board, task-create (opt-in primary prop), lane queue, proof.

## 35. Mentor product backlog

**Surface:** `src/components/projects/mentor-product-backlog.tsx`; read complete create/edit/move flow, MentorTaskDetailsEdit dialog, useProjectEditorDiscardGuard, ConfirmDialog, Input/Select/Textarea/Badge/Disclosure and alert/empty states. Reviewed mobile 375, tablet 768 and full-width semantics from source.

**Problems fixed (10):** bulky Velocity tile competing with backlog count, Add backlog task styled secondary, unlabelled expanded-state relationship, eight optional fields always filling page, double card shells inside single white canvas, lengthy Approach text breaking list scan, hidden mobile task actions next to huge content, Return buttons center-aligned in constrained columns, global error duplicated inside movement confirmation and uneven Save/Cancel width on phone.

**Changes:** compact metric into inline summary, elevate Add backlog task as the single create action with expanded/control association, keep Title/Priority directly visible and put optional fields inside an accessible disclosure within the same form, retain exact original field names/validation/guard and request. Responsive one/two-column fields and full-width mobile Save/Cancel. Backlog now presents hairline-separated task rows, full Approach content remains accessible under disclosure, existing edit action and select-to-confirm sprint move unchanged. Demote return buttons to left-aligned secondary list; show move errors in the confirm dialog rather than duplicating in parent; retain success/error notices and permanent discard guard. Source review only, no runtime/CI.

**Files:** backlog, queue, proof.

## 36. Mentor project closeout confirmation

**Surface:** `src/components/projects/mentor-project-closeout-control.tsx`; read the four persisted server readiness conditions, all three interactive acknowledgements, shared Checkbox/ConfirmDialog, pending, success, stale-write/error, keyboard/mouse behavior and legacy touch module. Reviewed 375/768 responsive shape.

**Problems fixed (7):** acknowledgement list used independent separator borders, checkbox state stayed mutable during mutation, no progress feedback before CTA, mobile CTA sized to its text, confirmation overlay vanished before API response, failure was only visible beneath a closed overlay, and completion success had no on-screen feedback while the server route refreshed.

**Changes:** one hairline acknowledgements group with each original statement, a count of completed confirmations, locked checkboxes while pending, 44px full-width phone primary control. Keep the native confirmation alertdialog open until success, surface errors inside it and outside if cancelled, use existing ToastProvider for completion feedback and refresh only on success. Preserve exactly the three flags, expectedUpdatedAt CAS, API endpoint and irreversible-confirm copy; no new package. Read source states only; no browser/CI.

**Files:** control, queue, proof.

## 37. Mentor release editor

**Surface:** `src/components/projects/mentor-release-editor.tsx`; inspected Create/Edit fields, pending/save/error/success, shipped/linked-sprints restrictions, unsaved-change unload/discard confirmation and permanent-delete confirmation with shared Input, Textarea, Button and ConfirmDialog. Reviewed 375/768/1280 source layouts.

**Problems fixed (10):** new release primary action looked secondary, disclosure button lacked expanded-state association, inline editor accepted only button clicks (not Enter submit), hand-styled fields deviated from shared legacy tokens, Save/Cancel cramped at 375, delete competed alongside Save, failed delete dismissed confirmation before API returned, delete error appeared under editor instead of dialog, no delete-success feedback, and fields stayed stale when release props changed while editor was closed.

**Changes:** opt for primary Add release and secondary Edit release, connect toggle to form via React useId, use a native submit form and shared field styles, align full-width mobile Save/Cancel. Separate irreversible Delete release behind a hairline in the editor, keep confirmation overlay mounted through API pending/errors, show error in overlay and success through existing toast, refresh only on success. Sync closed editor fields to updated release details, preserving initial values while open, existing dirty guard, delete restrictions, labels, API/CAS tokens and messages. Source inspection only; no CI/browser.

**Files:** release editor, queue, proof.

## 38. Mentor task delete confirmation

**Surface:** `src/components/projects/mentor-task-delete-control.tsx`; inspected inline dangerous action, ConfirmDialog overlay, pending/disabled/error success, CAS DELETE request and existing ToastProvider. Checked 375/768/1280 control flow, labels, focus semantics and board embedding.

**Problems fixed (6):** filled red Delete competed with the board's main task action, trigger sat in a purposeless span, previous failed error remained on reopen, pending dialog could be closed through external state callback, long error/title could break the confirmation width, and success had no immediate notice during router refresh.

**Changes:** demote destructive trigger to a clear red-text secondary link with a 44px phone hit area; maintain red destructive confirm action in the shared alertdialog, clear previous error when reopened, refuse state close while pending, wrap title/error for 375px, show persistent in-dialog failure and toast success on saved deletion. Same task ID, expectedUpdatedAt, confirm:true, irreversible copy and route behavior. Source-reviewed, no runtime/CI.

**Files:** delete control, queue, proof.

## 39. Mentor task status transition

**Surface:** `src/components/projects/mentor-task-status-transition.tsx`; inspected allowedMentorTaskTransition and Zod input schema, Select, shared ConfirmDialog, ToastProvider, PATCH, pending, invalid blocked state, current sprint gate and 375/768 layouts.

**Problems fixed (8):** status select and blocker input competed horizontally at 375, a 2000-character blocker explanation used a single-line input, Move action was visually secondary, confirmation incorrectly defaulted to destructive red, stale local selection survived parent status refresh, ConfirmDialog close callback could dismiss during pending, server requires blockerReason even if prior blocker was recorded yet component omitted it, and long errors overflowed mobile overlay.

**Changes:** stack fields/actions at 375, use multiline Textarea preserving the original accessible label/2000 limit, elevate the only action and use primary confirmation, sync selection after authoritative parent status updates, guard pending and invalid moves, reuse existing blocker reason for a BLOCKED PATCH when present (matching server schema), and let ConfirmDialog retain focus/error while pending. All task statuses, permission gating, CAS token, endpoint, wording and success/error toast behavior remain. Source-reviewed; no runtime/CI.

**Files:** status transition, queue, proof.

## 40. Project readiness manual override

**Surface:** `src/components/projects/project-readiness-override-form.tsx`; inspected legacy-copy constants, Zod schema, Select/Textarea/Alert and FormEvent guards, duplicate-write behavior, pending/error/confirmation/clear/unlock/block and hasSubmission warning, compact/noncompact use in project workspace and 375/768 widths.

**Problems fixed (7):** failure closed the confirmation even though no override saved, feedback appeared only beneath the form, dialog could close during pending, error lacked assertive semantics, stale required-note error persisted after input was corrected, textarea invalid state was not exposed, and Save lacked full-width mobile/working state.

**Changes:** retain original override choices, labels, conditional note and API payload; hold the shared primary ConfirmDialog open on failure, show request errors in the overlay and after cancellation, prevent dismissal while pending, reset stale feedback on state/note edits, expose aria-invalid for required note, preserve warning when submission exists, and align one 44px full-width phone primary button with desktop legacy control height. No permission, persistence or route changes. Source-reviewed only; no CI/browser.

**Files:** readiness override form, queue, proof.

## 41. Project resource files panel

**Surface:** `src/components/projects/project-resource-files-panel.tsx`; inspected storage declaration/grant validation, XMLHttpRequest upload/progress/abort, server reconciliation, scoped resource linking, signed download grants, edit/delete/discard confirmation, incomplete-upload RETRY, empty/limit/error and shared form/MetricBar/ConfirmDialog. Reviewed 375/768/1280 source rules.

**Problems fixed (12):** file picker buried after optional metadata, long always-visible fields displaced files, Cancel shown without an active PUT, native picker not reset after upload/discard, Edit/Delete inflated every list row, red Delete competed with Open, file names/description overflowed narrow widths, inline Edit Save/Cancel cramped on phone, plain feedback missed success/error treatment, delete failure appeared behind confirmation, inconsistent row action widths and indistinct upload/list separation.

**Changes:** file selection and Upload are primary; optional title/description/resource linkage inside a native disclosure with all original fields; live progress and Cancel enabled only during XHR, reset native file input after success/discard, group file management behind accessible disclosure while keeping Open/Retry visible, align full-width mobile actions and wrap filenames. Use shared Alerts with tone/role and surface delete errors inside confirm. Preserve MIME/size validation, safe signed URLs, grant expiry, status retries, existing labels, access and routes. Source-only review, no CI/browser.

**Files:** file panel, queue, proof.

## 42. Shared project workspace (Learner, Mentor, Admin)

**Surface:** `src/components/projects/project-workspace.tsx`; inspected complete 1,673-line composite across Summary, Overview, Team, Sprints, Tasks, Resources, Meetings, Readiness, Delivery and Audit, with PageHeader, Tabs/ScrollCue, role-gated read-only, imported editing/confirmation controls, conditional empty/error/warning, signed evidence links and 375/768/1280 source CSS. The latest main already incorporated another lane's flattening of roster, task, release, sprint, submission and meeting rows, task disclosure improvements and 44px mobile links; those changes were preserved without replacement.

**Problems fixed (5 in this pass):** four nested StatTile cards repeated the outer legacy canvas border, inconsistent KPI padding within an otherwise hairline layout, summary metrics spread into oversized single-column blocks at phone widths, long final submission statuses did not wrap predictably in tiles, and generic stat-card chrome competed with the workspace's actual actions.

**Changes:** replace only the 4-instance local Metric wrapper with a continuous two-column phone/four-column desktop hairline KPI strip, keeping every label, value, caption and number formatting. All other lane-improved row geometry, actions, statuses, routes, aria relationships, role permissions, read-only behavior and overlays remain unchanged. Static source inspection only; no runtime/CI or screenshots.

**Files:** project-workspace.tsx, lane queue, proof.

## 43. Super Admin template college bulk assignment

**Surface:** `src/components/projects/super-admin-template-college-bulk.tsx`; inspected client and parent availability listing, shared Checkbox/Button/StatusBadge/Banner/EmptyState/Disclosure/ConfirmDialog, permission and publish gates, assign/remove batch POST/DELETE, confirmation preview, partial-success retry, progress, empty/disabled and 375/768/1280 responsive CSS. The latest main had already integrated another lane's compact hairline list, published-state warning, live progress, selected-college confirmation, responsive assignment buttons and pending-close guard; all preserved. Source inspection only; no runtime/CI.

**Problems fixed (5 in this pass):** selection count lacked live announcement, Select all/Clear selection still formed cramped unequal controls at 375, their hit areas lacked full-width alignment, permission-disabled college rows retained clickable hover/cursor, and repeated checkbox check events could duplicate selected IDs.

**Changes:** add aria-live to the existing count; use full-width 44px stacked selection tools on phone and legacy 36px tools at tablet/desktop; distinguish disabled college rows without changing permission gates; deduplicate selected IDs. Preserve all original wording, names, routes, per-college safety checks, publish restrictions, failed-target retry, progress, confirmation and pinned workspace behavior. No new package or CI.

**Files:** bulk control, lane queue and proof.
