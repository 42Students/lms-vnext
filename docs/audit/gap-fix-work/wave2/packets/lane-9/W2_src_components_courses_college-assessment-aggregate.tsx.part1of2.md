# Work packet (wave 2): edit src/components/courses/college-assessment-aggregate.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-quizzes.md, docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-3-001-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/quizzes.js:4-17`; `docs/legacy-source/frontend/src/components/admin/AdminGroupShell.jsx:14-29`; `docs/legacy-source/frontend/src/common/navGroupDefinitions.js:18-29`
- vNext now: `src/app/(authenticated)/college/quizzes/page.tsx:16-22`; `src/components/courses/college-assessment-aggregate.tsx:56-77`
- Fix: Retain Courses & Content grouping and Quizzes tab as in legacy group shell, with no extra unrelated quick links.

## G2-3-001-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:491-521`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:523-574`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:74-98`; `src/components/courses/college-assessment-aggregate.tsx:101-177`
- Fix: Restore visible legacy order: header, course filter, divider, course/lesson create selectors, export, list; keep new advanced options below.

## G2-3-001-005  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:491-503`; `docs/legacy-source/frontend/src/components/admin/AdminGroupShell.jsx:25-29`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:70-98`
- Fix: Retain shared page section/tab strip and remove expanded marketing description and cross-directory action links not in legacy.

## G2-3-001-006  [P2] GAP  facet F02  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:606-619`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:193-220`; `src/components/courses/college-assessment-aggregate.tsx:228-277`
- Fix: Use legacy centered overlay builder and submissions dialog rather than inline editor and expanded row disclosure, or record intentional redesign decision.

## G2-3-001-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:497-521`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:83-97`; `src/components/courses/college-quiz-create.tsx:97-105`
- Fix: Use legacy `Create quiz` button with Plus icon gated by course + lesson; remove always-visible `Create New Quiz` affordance.

## G2-3-001-008  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:566-574`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:85-89`
- Fix: Restore `Export CSV (page)` button text and Download icon, or explicitly label new full filtered export as different feature.

## G2-3-001-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:439-485`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:40-49`; `src/components/courses/college-assessment-aggregate.tsx:255-264`
- Fix: Match row action labels Edit/Publish/Submissions/Release results/Delete and legacy action order; new Close quiz/Archive controls remain separately specified.

## G2-3-001-010  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:412-434`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:243-254`
- Fix: Match legacy Status/Results/Audience tag vocabulary and color mapping; `Published`/`Draft`, `Released`/`Withheld`, `One section · <name>`.

## G2-3-001-012  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:409-439`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:236-260`
- Fix: Reinstate standalone `Points` field, `Due` label, and original simple Course label; avoid folding points under Quiz title.

## G2-3-001-013  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:425-431`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:170-176`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:245-253`; `src/modules/courses/college-assessment-aggregate-service.ts:274-305`
- Fix: Show resolved section name for section-specific quizzes, not only generic `Section-specific` scope.

## G2-3-001-014  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:410-411`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:263-263`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:245-251`
- Fix: Match fallback strings `Untitled quiz` and `Course <id>` where data absent; preserve new course code only as approved enhancement.

## G2-3-001-017  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:436-438`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:270-283`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:258-261`; `src/modules/courses/college-assessment-export-model.ts:13-23`
- Fix: Use legacy `Due` local wall-clock formatting for CSV/current table; vNext CSV currently exports UTC ISO.

## G2-3-001-018  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:408-485`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:232-273`
- Fix: Restore 8 legacy columns (Title, Course, Status, Results, Audience, Points, Due, Actions) in original order; new Submitted/eligible is extra.

## G2-3-001-019  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:121-125`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:596-604`
- vNext now: `src/modules/courses/college-assessment-aggregate-model.ts:3-19`; `src/components/courses/college-assessment-aggregate.tsx:281-288`
- Fix: Use server page size 20 with no page-size changer, not hard-coded 25/page.

## G2-3-001-021  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:497-505`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:177-188`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:109-137`; `src/modules/courses/college-assessment-aggregate-model.ts:7-19`
- Fix: Offer searchable, clearable college course-name dropdown; current exact course-code text input behaves differently.

## G2-3-001-022  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:601-603`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:277-284`
- Fix: Restore compact Ant-like pager label and client page-reset on course filter; new query-pager differs.

## G2-3-001-023  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:439-485`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:598-604`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:264-276`
- Fix: Keep Actions pinned right from tablet width, horizontally scrolling on phone; verify shared DataTable pinning.

## G2-3-001-058  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:583-605`
- vNext now: `src/app/(authenticated)/college/quizzes/page.tsx:29-37`; `src/components/courses/college-assessment-aggregate.tsx:205-210`
- Fix: Preserve stale-row retry on refresh and 8-row skeleton; vNext has server-rendered records and route-level error.

## G2-3-001-060  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:59-60`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:601-604`
- vNext now: `src/components/courses/college-quiz-attempts.tsx:57-63`; `src/components/courses/college-assessment-aggregate.tsx:205-210`
- Fix: Use legacy exact `No submissions yet` and `No quizzes found for this college` empty messages.

## G2-3-001-066  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:408-439`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:601-603`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:211-231`; `src/components/courses/college-assessment-aggregate.tsx:233-276`
- Fix: Legacy pinned Actions from md/tablet and scrolls wide tables on phones; vNext renders mobile stacked cards and desktop unpinned table.

## G2-3-001-067  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/layouts/AdminLayout.js:336-366`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:210-232`; `src/components/courses/college-quiz-create.tsx:105-110`
- Fix: Verify 768px breakpoint behavior of inline builder and sticky footer versus legacy modal capped at min(820px,94vw).

## G2-3-001-074  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:497-505`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:540-558`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:109-137`; `src/components/courses/college-quiz-create.tsx:107-117`
- Fix: Use legacy placeholders `All courses`, `Course for new quiz`, `Lesson for new quiz` vs exact-code/search labels.

## G2-4-004-001  [P2] GAP  facet F01  effort M
- Legacy: Route `/college-admin/assignments`, Redux `loginUser.collegeId` scoping; groupKey `content` puts route under Courses & Content tabs. (`docs/legacy-source/frontend/src/pages/college-admin/assignments.js:7-30; docs/legacy-source/frontend/src/components/admin/AdminGroupShell.jsx:14-29`)
- vNext now: Route `/college/assignments`, server context membership, page header, links View quizzes and Course catalogue. (`src/app/(authenticated)/college/assignments/page.tsx:17-44; src/components/courses/college-assessment-aggregate.tsx:77-102`)
- Fix: Verify navigation alias/tab selection preserves legacy content-group route after route migration.

## G2-4-004-005  [P2] GAP  facet F02  effort M
- Legacy: AdminGroupShell PageShell plus h1 Assignments, course+scope filters, Create/Export toolbar, table, drawer and builder modal. (`docs/legacy-source/frontend/src/components/admin/AdminGroupShell.jsx:25-29; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:384-430`)
- vNext now: PageHeader then inline create section, expanded multi-filter form, 3 stat tiles, list/table, pagination, explanatory footer. (`src/components/courses/college-assessment-aggregate.tsx:75-315`)
- Fix: Match exact legacy section sequence; move create into right toolbar and avoid added stats changing layout.

## G2-4-004-007  [P2] GAP  facet F02  effort M
- Legacy: Submissions open in 760px modal with student list and pagination. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-156`)
- vNext now: Submission review is row-embedded FacultyAssignmentReview with delivery selector. (`src/components/courses/college-assignment-review.tsx:76-103; src/components/courses/college-assessment-aggregate.tsx:277-284`)
- Fix: Expose modal/drawer in row Submissions action and move per-student review inside it.

## G2-4-004-009  [P2] GAP  facet F03  effort M
- Legacy: Button `Export CSV (page)` with DownloadOutlined, disabled when current page empty. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:415-419`)
- vNext now: Header `Export CSV` download link, no equivalent disabled on empty page. (`src/components/courses/college-assessment-aggregate.tsx:85-90`)
- Fix: Show download icon and page-only label/disabled state or record intentional all-filter export deviation.

## G2-4-004-013  [P2] GAP  facet F03  effort M
- Legacy: Per-row grade badges: `Published: points/max` or grading status color; class Scope uses purple/default tag. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:139-143; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:346-347`)
- vNext now: Table uses StatusBadge and plain audience string; grade status appears in nested cards. (`src/components/courses/college-assessment-aggregate.tsx:264-284; src/components/courses/faculty-assignment-review.tsx:313-327`)
- Fix: Restore scoped colored chips and inline publish status where legacy shows them.

## G2-4-004-018  [P2] GAP  facet F04  effort M
- Legacy: Table Title fallback `Untitled` and Course fallback `Course id`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:289-293; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:343-345`)
- vNext now: Renders `item.title` directly and course name/code, no visible Untitled fallback. (`src/components/courses/college-assessment-aggregate.tsx:251-262`)
- Fix: Handle null/blank historical titles with `Untitled` and unknown courses with `Course id`.

## G2-4-004-019  [P2] GAP  facet F04  effort M
- Legacy: Scope fallback `All eligible sections`, specific `Section id` or class name. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:290-293`)
- vNext now: Displays `Shared offering` or `Section-specific` without specific section name. (`src/components/courses/college-assessment-aggregate.tsx:264-265; src/modules/courses/college-assessment-aggregate-model.ts:35-37`)
- Fix: Display the actual section for scoped assignments and legacy default wording.

## G2-4-004-020  [P2] GAP  facet F04  effort M
- Legacy: Deadline uses `formatWallClock` with legacy local wall clock, export `YYYY-MM-DD HH:mm`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-339; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:348`)
- vNext now: Date column uses medium date/time formatted en-IN with explicit IST; export UTC ISO timestamp. (`src/components/courses/college-assessment-aggregate.tsx:41-48; src/components/courses/college-assessment-aggregate.tsx:272; src/modules/courses/college-assessment-export-model.ts:16-20`)
- Fix: Align local timestamp format and exported deadline timezone to legacy or record intentional IST normalization.

## G2-4-004-021  [P2] GAP  facet F04  effort M
- Legacy: Legacy stats may fail per-assignment; UI shows `Unavailable` badge instead of hiding assignment. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:129-137; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:350-358`)
- vNext now: vNext computes aggregated counts, no explicit per-row `Unavailable` representation. (`src/components/courses/college-assessment-aggregate.tsx:273-276; src/modules/courses/college-assessment-aggregate-service.ts:119-127`)
- Fix: Represent partial unavailable stats without silently displaying zero.

## G2-4-004-024  [P2] GAP  facet F05  effort M
- Legacy: Table column order Title, Course, Scope, Points, Deadline, Submissions, Actions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:343-382`)
- vNext now: Assignment, Course, Audience, Status, Due, Submitted/eligible, Graded, Actions. (`src/components/courses/college-assessment-aggregate.tsx:250-289`)
- Fix: Match column titles/order and combine submission badges; retain status only if intentionally added.

## G2-4-004-025  [P2] GAP  facet F05  effort M
- Legacy: 20 rows per page with server pagination, zero-based API page and 1-based UI page; page-size change disabled. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:185; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-282; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:423-425`)
- vNext now: 25/page, 1-based query, page max 1000. (`src/modules/courses/college-assessment-aggregate-model.ts:3; src/modules/courses/college-assessment-aggregate-model.ts:18; src/components/courses/college-assessment-aggregate.tsx:296-303`)
- Fix: Use 20/page or document product-approved 25/page; keep correct count and page bounds.

## G2-4-004-027  [P2] GAP  facet F05  effort M
- Legacy: Class/course filter change resets page=1 and selected section on course change. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:404-413`)
- vNext now: GET form changes query on submit; changing one filter does not visibly clear another automatically. (`src/components/courses/college-assessment-aggregate.tsx:106-188`)
- Fix: On course change reset invalid section filter; preserve page one on submit.

## G2-4-004-069  [P2] GAP  facet F13  effort M
- Legacy: Empty table says `No assignments found for this college`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:423-425`)
- vNext now: `No recorded assessments match these filters. This does not imply courses or lessons are absent.` (`src/components/courses/college-assessment-aggregate.tsx:205-211`)
- Fix: Preserve exact empty table message for unfiltered list and distinct filtered state if wanted.

## G2-4-004-077  [P2] GAP  facet F16  effort M
- Legacy: Ant Design Table `scroll x:max-content`, actions fixed right above md breakpoint; filters wrap in flex. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:360-362; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:401-425`)
- vNext now: vNext switches to mobile cards below md and desktop DataTable at md. (`src/components/courses/college-assessment-aggregate.tsx:214-245`)
- Fix: Compare tablet/phone live for table-to-card behavior; preserve action reachability and column labels.

## G2-4-004-081  [P2] GAP  facet F18  effort M
- Legacy: Header/button wording `Assignments`, `Create Assignment`, `Export CSV (page)`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:384-419`)
- vNext now: `Assignments`, `Create New Assignment`, `Export CSV`. (`src/components/courses/college-assessment-aggregate.tsx:77-90; src/components/courses/college-assignment-create.tsx:91-97`)
- Fix: Match exact action strings and page head alignment.

## G2-4-004-083  [P2] GAP  facet F18  effort M
- Legacy: Legacy table columns `Scope`, `Points`, `Deadline`, `Submissions`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:343-360`)
- vNext now: VNext `Audience`, `Status`, `Due (IST)`, `Submitted / eligible`, `Graded`. (`src/components/courses/college-assessment-aggregate.tsx:264-279`)
- Fix: Change table copy/order to legacy while retaining additional status where allowed.

## G2-4-004-090  [P2] GAP  facet F20  effort M
- Legacy: Legacy deadline is India wall-clock local date time, no timezone in payload. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:218-229; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:55-58`)
- vNext now: VNext parses IST to ISO and stores timezone-aware timestamp, formats IST to users. (`src/components/courses/college-assignment-create.tsx:65-77; src/components/courses/college-assessment-aggregate.tsx:41-48`)
- Fix: Verify midnight/DST/locale and migration interpretation of historical local deadlines; use IST consistently.

## G2-4-010-001  [P2] GAP  facet F01  effort M
- Legacy: Route `/college-admin/assignments`, Redux `loginUser.collegeId` scoping; groupKey `content` puts route under Courses & Content tabs. (`docs/legacy-source/frontend/src/pages/college-admin/assignments.js:7-30; docs/legacy-source/frontend/src/components/admin/AdminGroupShell.jsx:14-29`)
- vNext now: Route `/college/assignments`, server context membership, page header, links View quizzes and Course catalogue. (`src/app/(authenticated)/college/assignments/page.tsx:17-44; src/components/courses/college-assessment-aggregate.tsx:77-102`)
- Fix: Verify navigation alias/tab selection preserves legacy content-group route after route migration.
