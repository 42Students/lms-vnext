# Work packet (wave 2): edit src/components/courses/admin-assessment-read-directory.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-quiz-controller.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md, docs/audit/gap2/lane-3/superadmin-quizzes.md, docs/audit/gap2/lane-4/superadmin-assignments.md

## G2-2-022-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy superadmin/sections/Quizzes.js:409-465 AntD table with Title/Course/Status/Results/Audience/Due/Actions
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:63-107 article list per quiz
- Fix: Render same compact ordered columns with pinned action and selection states.

## G2-2-022-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy Quizzes.js:19-83 submissions modal title quiz and learner list
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:86-89 CollegeQuizAttempts inline component
- Fix: Restore titled review modal or match original disclosed submission surface.

## G2-2-022-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy Quizzes.js:321-347 actions publish/results release/delete with per-row pending
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:91-101 FacultyItemActions+AdminQuizResultsActions
- Fix: Show original action labels, statuses and per-row busy controls.

## G2-2-022-011  [P2] GAP  facet F04  effort M
- Legacy: QuizResponseDTO.java:14-36 id,lessonId,name,courseId,name,classId,facultyId,title,description,status,dueAt,attemptCount,submitted,score,gradePublished,questions
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:63-75 only summary per quiz
- Fix: Offer detail/read endpoint for all DTO fields without leaking answers in list.

## G2-2-022-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy Quizzes.js:121-125 PAGE_SIZE=20 and course/page scope cache
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:109-113 25 per page
- Fix: Use 20 default rows for legacy quiz oversight.

## G2-2-022-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy Quizzes.js:97-99 course filter via selected courseId
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:47-49 text courseCode
- Fix: Restore searchable course picker; retain text input only as supplementary.

## G2-2-022-027  [P2] GAP  facet F09  effort M
- Legacy: Legacy Quizzes.js:19-82 SubmissionsModal width640 with retry/empty/skeleton
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:87 inline CollegeQuizAttempts
- Fix: Match modal dialog dimensions and loading/error/empty states.

## G2-2-022-029  [P2] GAP  facet F09  effort M
- Legacy: Legacy Quizzes.js:444-465 fixed actions at tablet, Popconfirm delete/publish
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:91-101 buttons inline
- Fix: Keep destructive confirmation and keyboard operability.

## G2-2-022-038  [P2] GAP  facet F12  effort M
- Legacy: QuizService.java:17-30 publish,unpublish, grade publish
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:91-101 draft publish/published close/archive/results
- Fix: Check rollback to draft and conditions after attempts.

## G2-2-022-048  [P2] GAP  facet F16  effort M
- Legacy: Legacy Quizzes.js:444-465 fixed actions column from tablet width
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:63-107 stacked responsive articles
- Fix: Match table overflow/pinned actions at 768px+ and small-screen safe wrap.

## G2-2-022-049  [P2] GAP  facet F16  effort M
- Legacy: Legacy Quizzes.js:19-82 SubmissionsModal width640
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:87 inline attempts control
- Fix: Restore responsive modal dimensions and focus behavior.

## G2-2-022-053  [P2] GAP  facet F18  effort M
- Legacy: Legacy Quizzes.js:410-422 labels Title/Course/Status/Results
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:64-74 article headings/points
- Fix: Restore column labels and released/withheld chips.

## G2-2-022-055  [P2] GAP  facet F19  effort M
- Legacy: AdminQuizController.java:101-103 default size20 bounded paging
- vNext now: src/components/courses/admin-assessment-read-directory.tsx:109-113 fixed25
- Fix: Match 20 per page and server-side total.

## G2-3-005-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:408-438`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:63-107`
- Fix: Restore eight visible table headers and right action column; current stacked articles have no table headings.

## G2-3-005-003  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:493-521`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:31-62`
- Fix: Clone PageShell body gutter, filter bar baseline, divider and create control positions.

## G2-3-005-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:439-485`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:85-106`
- Fix: Restore compact row actions Edit / Publish / Submissions / Release results / Delete order.

## G2-3-005-009  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:409-438`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:63-75`
- Fix: Restore column order Title, Course, Status, Results, Audience, Points, Due, Actions.

## G2-3-005-010  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:418-426`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:65-70`
- Fix: Results chip must read Released or Withheld and reflect correct legacy color, separately from quiz status.

## G2-3-005-011  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:425-433`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:69-70`
- Fix: Audience must display One section plus resolved section name, not only Section-specific.

## G2-3-005-013  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:410-435`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:65-74`
- Fix: Restore Untitled quiz/Course fallback and standalone numeric Points; do not substitute course-code/lesson metadata.

## G2-3-005-014  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:121-124`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:237-246`
- vNext now: `src/modules/courses/admin-assessment-directory-model.ts:3-10`; `src/components/courses/admin-assessment-read-directory.tsx:109-114`
- Fix: Legacy page size=20 and page starts at backend 0; new size=25 and page starts at URL 1.

## G2-3-005-015  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:497-522`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:34-61`
- Fix: Use searchable clearable course name dropdown All courses; new exact code text and advanced status/scope/results are different.

## G2-3-005-016  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:408-487`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:63-108`
- Fix: Pin Actions at tablet width and scroll wide 8-column table on mobile, instead of article lists.

## G2-3-005-047  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:408-485`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:63-107`
- Fix: Legacy tablet table/Actions pinned, vNext articles flow vertically; match 375/768/1280 structure.

## G2-3-005-062  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:439-485`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:85-106`
- Fix: New Close/Archive actions are additions/replacements for Delete and change lifecycle semantics.

## G2-3-004-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:493-521`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:52-59`; `src/components/courses/admin-assessment-read-directory.tsx:34-62`
- Fix: Legacy places simple course filter before divider + creation selectors; vNext creation panel precedes a six-field FilterBar. Reorder to exact legacy hierarchy.

## G2-3-004-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:437-485`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:85-106`
- Fix: Legacy row actions Edit/Publish/Submissions/Release results/Delete in compact single right cell; new vertical actions include Close/Archive/open offering and generic transitions.

## G2-3-004-009  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:408-438`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:63-75`
- Fix: Legacy 8-column Table (`Title`,`Course`,`Status`,`Results`,`Audience`,`Points`,`Due`,`Actions`); new stacked articles and count metadata omit standalone Results/Audience columns.

## G2-3-004-010  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:416-432`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:65-75`
- Fix: Match `Released`/`Withheld` tag and `One section · <sectionName>` audience rather than only `Section-specific` label.

## G2-3-004-011  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:408-439`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:63-75`
- Fix: Legacy Points column numeric total and `Due` formatted wall-clock; vNext `maximum points` metadata changes labels/position.

## G2-3-004-012  [P2] GAP  facet F05  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:435-485`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:598-605`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:63-115`
- Fix: Recreate legacy compact data table, tablet-pinned actions, horizontal scrolling on phone rather than list-style records.

## G2-3-004-013  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:120-127`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:596-605`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:109-114`; `src/modules/courses/college-assessment-aggregate-service.ts:166-177`
- Fix: Legacy page size 20 with pager, vNext 25. Align page size and label.

## G2-3-004-014  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:497-522`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:34-61`; `src/modules/admin-ui/super-admin-quiz-query-model.ts:7-18`
- Fix: Legacy one searchable clearable course dropdown and page reset; vNext courseCode plain input plus status/results/scope filters. Preserve simple primary course selector.

## G2-3-004-022  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:45-82`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:85-90`
- Fix: Legacy Submissions opens 640px modal with 6-row loading skeleton; vNext inline paginated disclosure within list. Recreate dialog and row presentation.

## G2-3-004-023  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:475-485`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:85-101`
- Fix: Legacy delete Popconfirm warning, vNext archive/JS confirmation and different disable states. Restore destructive semantics or document authorized retention policy.

## G2-3-004-036  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:439-485`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:63-109`
- Fix: Restore compact table and pinned right action from md, not full-width multi-line record list on tablet/desktop.

## G2-3-004-041  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:449-471`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:91-101`
- Fix: Legacy `Release after deadline`/`Release results`/`Withhold results`; vNext `Publish results`/`Hide results`, mismatch exact button text.

## G2-3-004-045  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:287-317`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:85-101`
- Fix: Protect against concurrent publish/delete/result toggles with row-level disabled/loading and mutation lock, matching legacy behavior.

## G2-4-007-004  [P2] GAP  facet F02  effort M
- Legacy: PageShell content group tabs, heading Assignments, filters/actions, AntD Table, modal builder. (`docs/legacy-source/frontend/src/pages/superadmin/assignments.js:23-27;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:384-435`)
- vNext now: PageHeader, inline create, directory FilterBar, record cards, export bottom. (`src/app/(authenticated)/admin/assignments/page.tsx:50-62;src/components/courses/admin-assessment-read-directory.tsx:26-116`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy table action bar sits top right of filter row. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:401-421`)
- vNext now: Export below record list; create above filters. (`src/app/(authenticated)/admin/assignments/page.tsx:50-62;src/components/courses/admin-assessment-read-directory.tsx:34-61`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.
