# Work packet (wave 2): edit src/components/courses/college-assessment-aggregate.tsx (part 2 of 2)

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-sections-assignments.md, docs/audit/gap2/lane-3/college-admin-quizzes.md

## G2-4-010-005  [P2] GAP  facet F02  effort M
- Legacy: AdminGroupShell PageShell plus h1 Assignments, course+scope filters, Create/Export toolbar, table, drawer and builder modal. (`docs/legacy-source/frontend/src/components/admin/AdminGroupShell.jsx:25-29; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:384-430`)
- vNext now: PageHeader then inline create section, expanded multi-filter form, 3 stat tiles, list/table, pagination, explanatory footer. (`src/components/courses/college-assessment-aggregate.tsx:75-315`)
- Fix: Match exact legacy section sequence; move create into right toolbar and avoid added stats changing layout.

## G2-4-010-007  [P2] GAP  facet F02  effort M
- Legacy: Submissions open in 760px modal with student list and pagination. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-156`)
- vNext now: Submission review is row-embedded FacultyAssignmentReview with delivery selector. (`src/components/courses/college-assignment-review.tsx:76-103; src/components/courses/college-assessment-aggregate.tsx:277-284`)
- Fix: Expose modal/drawer in row Submissions action and move per-student review inside it.

## G2-4-010-009  [P2] GAP  facet F03  effort M
- Legacy: Button `Export CSV (page)` with DownloadOutlined, disabled when current page empty. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:415-419`)
- vNext now: Header `Export CSV` download link, no equivalent disabled on empty page. (`src/components/courses/college-assessment-aggregate.tsx:85-90`)
- Fix: Show download icon and page-only label/disabled state or record intentional all-filter export deviation.

## G2-4-010-013  [P2] GAP  facet F03  effort M
- Legacy: Per-row grade badges: `Published: points/max` or grading status color; class Scope uses purple/default tag. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:139-143; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:346-347`)
- vNext now: Table uses StatusBadge and plain audience string; grade status appears in nested cards. (`src/components/courses/college-assessment-aggregate.tsx:264-284; src/components/courses/faculty-assignment-review.tsx:313-327`)
- Fix: Restore scoped colored chips and inline publish status where legacy shows them.

## G2-4-010-018  [P2] GAP  facet F04  effort M
- Legacy: Table Title fallback `Untitled` and Course fallback `Course id`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:289-293; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:343-345`)
- vNext now: Renders `item.title` directly and course name/code, no visible Untitled fallback. (`src/components/courses/college-assessment-aggregate.tsx:251-262`)
- Fix: Handle null/blank historical titles with `Untitled` and unknown courses with `Course id`.

## G2-4-010-019  [P2] GAP  facet F04  effort M
- Legacy: Scope fallback `All eligible sections`, specific `Section id` or class name. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:290-293`)
- vNext now: Displays `Shared offering` or `Section-specific` without specific section name. (`src/components/courses/college-assessment-aggregate.tsx:264-265; src/modules/courses/college-assessment-aggregate-model.ts:35-37`)
- Fix: Display the actual section for scoped assignments and legacy default wording.

## G2-4-010-020  [P2] GAP  facet F04  effort M
- Legacy: Deadline uses `formatWallClock` with legacy local wall clock, export `YYYY-MM-DD HH:mm`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-339; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:348`)
- vNext now: Date column uses medium date/time formatted en-IN with explicit IST; export UTC ISO timestamp. (`src/components/courses/college-assessment-aggregate.tsx:41-48; src/components/courses/college-assessment-aggregate.tsx:272; src/modules/courses/college-assessment-export-model.ts:16-20`)
- Fix: Align local timestamp format and exported deadline timezone to legacy or record intentional IST normalization.

## G2-4-010-021  [P2] GAP  facet F04  effort M
- Legacy: Legacy stats may fail per-assignment; UI shows `Unavailable` badge instead of hiding assignment. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:129-137; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:350-358`)
- vNext now: vNext computes aggregated counts, no explicit per-row `Unavailable` representation. (`src/components/courses/college-assessment-aggregate.tsx:273-276; src/modules/courses/college-assessment-aggregate-service.ts:119-127`)
- Fix: Represent partial unavailable stats without silently displaying zero.

## G2-4-010-024  [P2] GAP  facet F05  effort M
- Legacy: Table column order Title, Course, Scope, Points, Deadline, Submissions, Actions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:343-382`)
- vNext now: Assignment, Course, Audience, Status, Due, Submitted/eligible, Graded, Actions. (`src/components/courses/college-assessment-aggregate.tsx:250-289`)
- Fix: Match column titles/order and combine submission badges; retain status only if intentionally added.

## G2-4-010-025  [P2] GAP  facet F05  effort M
- Legacy: 20 rows per page with server pagination, zero-based API page and 1-based UI page; page-size change disabled. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:185; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-282; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:423-425`)
- vNext now: 25/page, 1-based query, page max 1000. (`src/modules/courses/college-assessment-aggregate-model.ts:3; src/modules/courses/college-assessment-aggregate-model.ts:18; src/components/courses/college-assessment-aggregate.tsx:296-303`)
- Fix: Use 20/page or document product-approved 25/page; keep correct count and page bounds.

## G2-4-010-027  [P2] GAP  facet F05  effort M
- Legacy: Class/course filter change resets page=1 and selected section on course change. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:404-413`)
- vNext now: GET form changes query on submit; changing one filter does not visibly clear another automatically. (`src/components/courses/college-assessment-aggregate.tsx:106-188`)
- Fix: On course change reset invalid section filter; preserve page one on submit.

## G2-4-010-069  [P2] GAP  facet F13  effort M
- Legacy: Empty table says `No assignments found for this college`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:423-425`)
- vNext now: `No recorded assessments match these filters. This does not imply courses or lessons are absent.` (`src/components/courses/college-assessment-aggregate.tsx:205-211`)
- Fix: Preserve exact empty table message for unfiltered list and distinct filtered state if wanted.

## G2-4-010-077  [P2] GAP  facet F16  effort M
- Legacy: Ant Design Table `scroll x:max-content`, actions fixed right above md breakpoint; filters wrap in flex. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:360-362; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:401-425`)
- vNext now: vNext switches to mobile cards below md and desktop DataTable at md. (`src/components/courses/college-assessment-aggregate.tsx:214-245`)
- Fix: Compare tablet/phone live for table-to-card behavior; preserve action reachability and column labels.

## G2-4-010-081  [P2] GAP  facet F18  effort M
- Legacy: Header/button wording `Assignments`, `Create Assignment`, `Export CSV (page)`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:384-419`)
- vNext now: `Assignments`, `Create New Assignment`, `Export CSV`. (`src/components/courses/college-assessment-aggregate.tsx:77-90; src/components/courses/college-assignment-create.tsx:91-97`)
- Fix: Match exact action strings and page head alignment.

## G2-4-010-083  [P2] GAP  facet F18  effort M
- Legacy: Legacy table columns `Scope`, `Points`, `Deadline`, `Submissions`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:343-360`)
- vNext now: VNext `Audience`, `Status`, `Due (IST)`, `Submitted / eligible`, `Graded`. (`src/components/courses/college-assessment-aggregate.tsx:264-279`)
- Fix: Change table copy/order to legacy while retaining additional status where allowed.

## G2-4-010-090  [P2] GAP  facet F20  effort M
- Legacy: Legacy deadline is India wall-clock local date time, no timezone in payload. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:218-229; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:55-58`)
- vNext now: VNext parses IST to ISO and stores timezone-aware timestamp, formats IST to users. (`src/components/courses/college-assignment-create.tsx:65-77; src/components/courses/college-assessment-aggregate.tsx:41-48`)
- Fix: Verify midnight/DST/locale and migration interpretation of historical local deadlines; use IST consistently.

## G2-3-001-075  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:600-604`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:205-210`
- Fix: Restore exact empty text `No quizzes found for this college`.
