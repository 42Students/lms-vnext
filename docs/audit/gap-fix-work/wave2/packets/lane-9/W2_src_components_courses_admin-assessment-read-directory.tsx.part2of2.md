# Work packet (wave 2): edit src/components/courses/admin-assessment-read-directory.tsx (part 2 of 2)

24 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md, docs/audit/gap2/lane-2/admin-quiz-controller.md

## G2-4-007-009  [P2] GAP  facet F03  effort M
- Legacy: Row action buttons Submissions, Publish grades, Edit, Delete with icons. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:360-380`)
- vNext now: Actions embedded in card; Submissions in Disclosure; Edit/Publish/Delete via CollegeAssignmentActions. (`src/components/courses/admin-assessment-read-directory.tsx:76-103`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-011  [P2] GAP  facet F03  effort M
- Legacy: Row tag Scope purple when specific class. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:345-347`)
- vNext now: Audience displayed in item card, no purple exact scope tag. (`src/components/courses/admin-assessment-read-directory.tsx:64-75`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy list response fields courseId,classId,lessonId,points,deadline,stats. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:114-139`)
- vNext now: New directory uses courseCode, audienceLabel, dueAt/status, submission stats. (`src/components/courses/admin-assessment-read-directory.tsx:62-76`)
- Fix: Expose class name/lesson mapping and review legacy unavailable stats state.

## G2-4-007-013  [P2] GAP  facet F04  effort M
- Legacy: Missing title fallback Untitled. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:343-345`)
- vNext now: Item title direct in card with no fallback. (`src/components/courses/admin-assessment-read-directory.tsx:64-73`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-014  [P2] GAP  facet F04  effort M
- Legacy: Unavailable assignment stats shown Unavailable. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:350-358`)
- vNext now: Counts shown in card; no unavailable badge. (`src/components/courses/admin-assessment-read-directory.tsx:73-76`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-015  [P2] GAP  facet F04  effort M
- Legacy: Deadline visible local wallclock, export YYYY-MM-DD HH:mm. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:348`)
- vNext now: Directory shows formatted due and export service uses UTC ISO. (`src/components/courses/admin-assessment-read-directory.tsx:21-25;src/modules/courses/college-assessment-export-model.ts:16-20`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-016  [P2] GAP  facet F05  effort M
- Legacy: Table columns Title, Course, Scope, Points, Deadline, Submissions, Actions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:343-382`)
- vNext now: Card layout with status, due and counts, no column headings. (`src/components/courses/admin-assessment-read-directory.tsx:62-108`)
- Fix: Restore a table with exact columns and layout.

## G2-4-007-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy page size20 server and AntD pagination, no page-size changer. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:185;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-287;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:423-425`)
- vNext now: New aggregate fixed25 records with Pagination. (`src/modules/courses/college-assessment-aggregate-model.ts:3;src/components/courses/admin-assessment-read-directory.tsx:108-114`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-018  [P2] GAP  facet F05  effort M
- Legacy: Course and class filter reset page and clear class on course change. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:403-414`)
- vNext now: New search/status/courseCode/scope form submitted as GET. (`src/components/courses/admin-assessment-read-directory.tsx:34-61`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-032  [P2] GAP  facet F09  effort M
- Legacy: Submissions modal 760px, title assignment title or id, paginated 20. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-156`)
- vNext now: Inline review embedded Disclosure inside item card. (`src/components/courses/admin-assessment-read-directory.tsx:76-83`)
- Fix: Restore modal with page controls and grade actions.

## G2-4-007-040  [P2] GAP  facet F12  effort M
- Legacy: Legacy list size20 and submission stats fetched separate per row. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:105-139`)
- vNext now: vNext list25 with eligible counts and graded counts. (`src/components/courses/admin-assessment-read-directory.tsx:62-76`)
- Fix: Compare count definitions, lock errors and exact page size.

## G2-4-007-044  [P2] GAP  facet F13  effort M
- Legacy: Submissions modal Loading submissions..., No submissions yet, Retry. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:93-100`)
- vNext now: Inline FacultyAssignmentReview loading/empty handling. (`src/components/courses/admin-assessment-read-directory.tsx:76-83`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-048  [P2] GAP  facet F16  effort M
- Legacy: Table horizontal x:max-content, right fixed action column at md; builder widths720/760. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:343-382;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:423-425`)
- vNext now: Responsive item cards, inline form and inline review. (`src/components/courses/admin-assessment-read-directory.tsx:62-108;src/components/courses/college-assignment-create.tsx:91-163`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-052  [P2] GAP  facet F18  effort M
- Legacy: Submissions, Publish grades, Edit, Delete in row. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:360-380`)
- vNext now: Submissions Disclosure and assignment Publish vs grade publish in review. (`src/components/courses/admin-assessment-read-directory.tsx:76-103`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-053  [P2] GAP  facet F19  effort M
- Legacy: Legacy 20/p page with per-row stats potential N+1. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:105-139`)
- vNext now: New 25/p query and totals on filtered page. (`src/components/courses/admin-assessment-read-directory.tsx:62-76`)
- Fix: Verify count cost and 20/page parity.

## G2-4-010-104  [P2] GAP  facet F02  effort M
- Legacy: Shared list Ant Design table is within same card with right aligned Create/Export toolbar. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:384-435`)
- vNext now: SA AdminAssessmentDirectory renders header, filter, stacked assessment cards and bottom Export link. (`src/app/(authenticated)/admin/assignments/page.tsx:50-62;src/components/courses/admin-assessment-read-directory.tsx:26-116`)
- Fix: Move Create/Export into same top-right toolbar, restore table card and controls.

## G2-4-010-107  [P2] GAP  facet F04  effort M
- Legacy: Grade stat `Unavailable` per assignment still leaves row displayed. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:350-358`)
- vNext now: New SA item card renders submission/graded count, no per-assignment Unavailable chip. (`src/components/courses/admin-assessment-read-directory.tsx:73-76`)
- Fix: Represent partial stats fetch failure distinctly from zeros.

## G2-4-010-108  [P2] GAP  facet F05  effort M
- Legacy: List columns Title/Course/Scope/Points/Deadline/Submissions/Actions and sorting from Table. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:343-382`)
- vNext now: SA generic record cards have status, due and activity but no labeled columns. (`src/components/courses/admin-assessment-read-directory.tsx:62-109`)
- Fix: Replace SA cards with exact 7-column Table and maintain fixed Actions column.

## G2-4-010-111  [P2] GAP  facet F05  effort M
- Legacy: Old server list 20 per page and pagination arrows with total. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:185;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-287`)
- vNext now: SA new aggregate service uses 25 per page, generic Pagination. (`src/modules/courses/college-assessment-aggregate-model.ts:3;src/components/courses/admin-assessment-read-directory.tsx:108-114`)
- Fix: Set SA assignment list size20 and match page count/range.

## G2-4-010-126  [P2] GAP  facet F16  effort M
- Legacy: Old Table scroll x max-content, fixed actions right; builder modal720 and submission modal760. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:343-382;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:423-425`)
- vNext now: New SA card layout removes horizontal scroll and overlays. (`src/components/courses/admin-assessment-read-directory.tsx:62-109;src/components/courses/college-assignment-create.tsx:91-163`)
- Fix: Restore responsive fixed-action table and modal sizes, compare at 680/1120px.

## G2-4-010-129  [P2] GAP  facet F19  effort M
- Legacy: Legacy 20 rows with per-item stats RPC, page-level bounded; client requests 1 page. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-287`)
- vNext now: New aggregate 25 rows, joins eligible learners and activity counts. (`src/modules/courses/college-assessment-aggregate-model.ts:3;src/components/courses/admin-assessment-read-directory.tsx:62-76`)
- Fix: Validate query pressure and exact total/eligible denominator; restore page size20.

## G2-2-022-012  [P3] GAP  facet F04  effort S
- Legacy: QuizResponseDTO.java:24-26 IndiaLocalDateTimeSerializer wall-clock
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:21-25 Intl en-IN/Asia-Kolkata with IST suffix
- Fix: Validate same displayed due wall-clock and punctuation at DST/UTC boundaries.

## G2-2-022-063  [P3] GAP  facet F23  effort S
- Legacy: QuizResponseDTO.java:24-26 India wall-clock dueAt
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:21-25 IST date formatting
- Fix: Verify exact parser for legacy due fields and timezone round-trip.

## G2-4-010-123  [P3] GAP  facet F13  effort S
- Legacy: Legacy unfiltered empty displays No assignments found for this college and table stays mounted. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:423-425`)
- vNext now: New empty matches heading but uses EmptyState with additional message Try adjusting your filters. (`src/components/courses/admin-assessment-read-directory.tsx:108-110`)
- Fix: Match old empty-state placement and icon; keep heading.
