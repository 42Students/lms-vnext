# Work packet (wave 2): edit src/components/courses/faculty-assessment-overview.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-all-quizzes.md, docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-3-006-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:197-200`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:81-101`
- Fix: Restore learn-quizzes-page class rhythm and metric popovers directly in ListingPageHeader, not separate count badges and expandable course list.

## G2-3-006-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:269-310`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:81-101`
- Fix: Legacy title+stat metrics share one top line; new creation UI and stats/divider above list changes order.

## G2-3-006-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:689-735`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:102-165`
- Fix: Legacy one narrow All courses selector then full-width table, vNext three-column filter form and cards.

## G2-3-006-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:723-734`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:163-288`
- Fix: Legacy desktop Table has grid with header row; vNext list of bordered article blocks. Rebuild table + header proportions.

## G2-3-006-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:46-55`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:163-288`
- Fix: Legacy row actions include Preview Quiz, View report icon, Edit, Delete in same action cell; new Actions Disclosure holds Manage quiz/View Report/Open Course.

## G2-3-006-010  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:46-55`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:169-190`
- Fix: Restore exact eight desktop columns Overview, Course, Lesson, Due Date, Status, Results, Submissions, Actions.

## G2-3-006-011  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:302-308`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:169-188`
- Fix: Legacy FacultyStatus tags Draft / Needs due date / Closed / Open based on deadline; vNext status badges derive persisted enum and show Needs due date for draft only.

## G2-3-006-012  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:199-217`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:183-185`
- Fix: Legacy due format MMM D, YYYY h:mm A, fallback -, new Intl en-IN medium date / time short with CREATED fallback.

## G2-3-006-015  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:689-705`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:102-119`
- Fix: Legacy Course select deduped by courseSlug only; vNext Course/Section filters by deliveryId and includes section names, different cardinality.

## G2-3-006-016  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:46-55`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:163-288`
- Fix: Legacy desktop Table with narrow fixed percentage widths/ellipsis; new articles cause column and hover title differences.

## G2-3-006-017  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:744-815`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:164-288`
- Fix: Legacy phone has labeled quiz cards plus simple Pagination; new responsive articles and button-pager differ.

## G2-3-006-040  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:265-310`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:169-186`
- Fix: Legacy Needs due date, Open/Closed computed time; vNext shows persisted Open even if deadline elapsed unless CLOSED, causing changed tag meaning.

## G2-3-006-043  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:689-705`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:102-119`
- Fix: Legacy course-filter API failure exposes Couldn't load your courses · Retry; new preloaded options have no independent Retry state.

## G2-3-006-046  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:720-815`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:163-288`
- Fix: Restore legacy desktop table/phone cards at media breakpoint plus widths 18/11/10/12/8/13/11/17% and ellipsis.

## G2-3-006-048  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:46-55`; `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:403-434`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:194-251`
- Fix: Legacy Edit/Delete icon buttons have aria-label and title matching label; vNext actions disclosure textual links. Restore keyboard order and accessible names.

## G2-3-006-050  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:269-304`
- vNext now: `src/app/(authenticated)/teacher/allQuizzes/page.tsx:17-20`; `src/components/courses/faculty-assessment-overview.tsx:85-91`
- Fix: Legacy My Quizzes with metrics total Quizzes and Courses as header pills; vNext standalone Badge totals/courses and different Assessment results overview CTA.

## G2-3-006-051  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:46-55`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:169-187`
- Fix: Legacy Status and Results wording Closed/Open/Needs due date/Released separate; new status labels and results visible in metadata line differ.

## G2-3-006-053  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:459-504`
- vNext now: `src/modules/courses/faculty-assessment-service.ts:16-79`; `src/components/courses/faculty-assessment-overview.tsx:24-57`
- Fix: Legacy server filters and reports total+submitted across pages; vNext loads all quizzes and client filters; performance/total accuracy at large faculty loads to test.

## G2-3-006-054  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:480-486`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:40-44`; `src/components/courses/faculty-quiz-review.tsx:113-118`
- Fix: Legacy URL `?content=<numeric id>` auto-opens submissions; vNext expects UUID pattern and scrolls selected page, opens review if permitted. Old deep links need redirect resolution.

## G2-3-006-060  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:46-55`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:163-288`
- Fix: New card list and inline disclosure/editor/change action UX diverge from legacy table; owner choose strict UI clone vs functional additions.

## G2-3-006-061  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:423-431`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:194-235`
- Fix: Legacy deletes quiz; vNext lifecycle archives. Deleting vs soft archive semantics and learner visibility differ.

## G2-4-012-003  [P2] GAP  facet F01  effort S
- Legacy: Teacher Report icon navigates from row to /teacher/report/assignment/id. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:173-183`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:427-429`)
- vNext now: View Report link uses query-scoped deliveryId URL. (`src/components/courses/faculty-assessment-overview.tsx:236-241`)
- Fix: Restore icon, Report label and row placement with secure new URL.

## G2-4-012-004  [P2] GAP  facet F02  effort M
- Legacy: PageShell displays head/metrics, banners, one assignment card list, then pagination. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:650-759`)
- vNext now: Create block, badges, disclosure, 3-filter grid, article list and inline grade review. (`src/components/courses/faculty-assessment-overview.tsx:80-165`; `src/components/courses/faculty-assessment-overview.tsx:256-310`)
- Fix: Reorder to legacy page anatomy and hide extras behind details.

## G2-4-012-005  [P2] GAP  facet F02  effort M
- Legacy: Individual horizontal rounded cards have file icon, title, metadata and right actions. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:126-193`)
- vNext now: New rows are border-divided articles with badge-first hierarchy. (`src/components/courses/faculty-assessment-overview.tsx:163-195`)
- Fix: Restore card geometry, borders, spacing and icon column.

## G2-4-012-007  [P2] GAP  facet F02  effort M
- Legacy: Teal total Assignments and green unique Courses MetricPill displayed in heading. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:650-675`)
- vNext now: Neutral badges in body and Assignments by Course disclosure. (`src/components/courses/faculty-assessment-overview.tsx:84-101`)
- Fix: Recreate MetricPill coloring, placement and course popover.

## G2-4-012-008  [P2] MISSING  facet F03  effort S
- Legacy: FileTextOutlined icon shown inside each row-card icon wrap. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:135-139`)
- vNext now: New article starts at status badge with no file icon. (`src/components/courses/faculty-assessment-overview.tsx:169-180`)
- Fix: Add document icon tile at legacy position.

## G2-4-012-009  [P2] GAP  facet F03  effort M
- Legacy: Teacher row displays View Submissions, chart-icon Report, pencil Edit and red Delete. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:157-185`; `docs/legacy-source/frontend/src/components/Assignments/ActionAssignment.js:13-49`)
- vNext now: Actions are hidden in generic Actions disclosure and text links. (`src/components/courses/faculty-assessment-overview.tsx:193-253`)
- Fix: Expose four controls inline in legacy order and icon sizes.

## G2-4-012-010  [P2] GAP  facet F03  effort S
- Legacy: Card-wide button aria-label names assignment or Untitled fallback. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:128-140`)
- vNext now: New lacks a card-wide button and printed title has no fallback. (`src/components/courses/faculty-assessment-overview.tsx:163-195`)
- Fix: Restore accessible View assignment target and Untitled fallback.

## G2-4-012-011  [P2] GAP  facet F03  effort M
- Legacy: Empty illustration, FileText glyph and Create your first assignment CTA. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:92-109`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:611-625`)
- vNext now: New generic EmptyState has title/description but no illustration or inner CTA. (`src/components/courses/faculty-assessment-overview.tsx:65-78`)
- Fix: Restore SVG illustration, icon, exact action and copy.

## G2-4-012-014  [P2] GAP  facet F04  effort S
- Legacy: Legacy row metadata is course name dot Due DD MMM YYYY, h:mm A, fallback Created D MMM YYYY or dash. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:25-51`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:140-150`)
- vNext now: New includes section, lesson, period and en-IN medium date/time. (`src/components/courses/faculty-assessment-overview.tsx:59-69`; `src/components/courses/faculty-assessment-overview.tsx:179-185`)
- Fix: Match exact compact metadata and date formats; move extra fields to drawer.

## G2-4-012-015  [P2] GAP  facet F04  effort M
- Legacy: Deadline comes from deadline or contentDataDTO due_date/dueDate; array/ISO createdAt supported. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:25-61`)
- vNext now: New uses dueAt timestamp and createdAt Date. (`src/db/schema/assessments.ts:41-44`; `src/components/courses/faculty-assessment-overview.tsx:59-69`)
- Fix: Specify canonical legacy date parsing/transfer with timezone.

## G2-4-012-016  [P2] GAP  facet F04  effort M
- Legacy: Teacher total uses server totalElements, distinct courses counted from currently loaded page. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:303-312`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:360-374`)
- vNext now: New totals use all aggregated rows and unique course codes. (`src/components/courses/faculty-assessment-overview.tsx:84-91`; `src/modules/courses/faculty-assessment-service.ts:114-139`)
- Fix: Match page vs total denominator and course distinctness.

## G2-4-012-018  [P2] GAP  facet F05  effort M
- Legacy: PAGE_SIZE20 with numbered AntD pagination when total >20 and no size changer. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:23-23`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:750-759`)
- vNext now: PAGE_SIZE20 with Previous/Next buttons and Page X of Y. (`src/components/courses/faculty-assessment-overview.tsx:24-24`; `src/components/courses/faculty-assessment-overview.tsx:292-310`)
- Fix: Restore numeric paging controls and placement.

## G2-4-012-020  [P2] GAP  facet F05  effort S
- Legacy: Legacy course Select min-width 200, allowClear, spinner, All courses placeholder. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:517-532`)
- vNext now: New native Select occupies 3-column grid, no separate lookup loading spinner. (`src/components/courses/faculty-assessment-overview.tsx:102-120`)
- Fix: Match control geometry, allowClear, placeholder, retry and loading.

## G2-4-012-043  [P2] MISSING  facet F09  effort M
- Legacy: ViewAssignmentDrawer on row click shows resources, student submissions and Report. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:397-400`; `docs/legacy-source/frontend/src/components/Assignments/ViewAssignmentModal.jsx:255-301`; `docs/legacy-source/frontend/src/components/Assignments/ViewAssignmentModal.jsx:373-398`)
- vNext now: New list has no preview drawer, separate report/submission links. (`src/components/courses/faculty-assessment-overview.tsx:218-284`)
- Fix: Restore view drawer and its teacher actions.

## G2-4-012-044  [P2] GAP  facet F09  effort M
- Legacy: View Submissions launches modal from row. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:423-425`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:638-644`)
- vNext now: New sends user to report #submissions or inline review. (`src/components/courses/faculty-assessment-overview.tsx:242-246`; `src/components/courses/faculty-assessment-overview.tsx:278-284`)
- Fix: Recreate modal entry point with new grade services.

## G2-4-012-051  [P2] GAP  facet F10  effort M
- Legacy: Legacy Report and Submissions as row actions. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:423-429`)
- vNext now: New routes to report and embeds faculty review. (`src/components/courses/faculty-assessment-overview.tsx:236-246`; `src/components/courses/faculty-assignment-review.tsx:514-547`)
- Fix: Preserve modal and click outcomes.

## G2-4-012-062  [P2] GAP  facet F13  effort M
- Legacy: Legacy empty state illustration and embedded first-create button. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:92-109`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:611-625`)
- vNext now: New generic EmptyState without illustration/embedded action. (`src/components/courses/faculty-assessment-overview.tsx:65-78`)
- Fix: Restore illustration, copy, button and spacing.

## G2-4-012-063  [P2] GAP  facet F13  effort M
- Legacy: Course options fail independently and have Couldn't load your courses · Retry. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:517-535`)
- vNext now: New course options are part of server result, no separate retry. (`src/components/courses/faculty-assessment-overview.tsx:102-120`)
- Fix: Show filter-specific failure/retry.

## G2-4-012-066  [P2] MISSING  facet F14  effort M
- Legacy: Preview resource links offer Open PDF/Open file/Download or external open noopener. (`docs/legacy-source/frontend/src/components/Assignments/ViewAssignmentModal.jsx:47-85`)
- vNext now: New list offers report/course/review but no resource preview. (`src/components/courses/faculty-assessment-overview.tsx:218-284`)
- Fix: Add secure resource preview with open and download.
