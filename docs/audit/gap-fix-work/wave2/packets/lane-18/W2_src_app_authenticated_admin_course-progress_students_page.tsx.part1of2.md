# Work packet (wave 2): edit src/app/(authenticated)/admin/course-progress/students/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/course-progress.md, docs/audit/gap2/lane-19/course-progress.md, docs/audit/gap2/lane-2/admin-course-progress-controller.md

## G2-14-003-001  [P2] GAP  facet F01  effort S
- Legacy: Legacy title Course Progress, subtitle See measured completion for a class/course; vNext directory PageHeader Progress and detail Student Course Progress — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:233-237`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:39-43`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:36-39`
- Fix: Use Course Progress and exact subtitle for entry/detail combined view

## G2-14-003-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy entry is Superadmin section component in existing tab; vNext /admin/course-progress and /students nested route — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:32-33,231-237`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:21-26,88-90`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:13-23`
- Fix: Preserve single-screen class/course flow; keep deep-link detail as secondary

## G2-14-003-005  [P2] GAP  facet F02  effort L
- Legacy: Legacy header then Measured work only info then single filter card then 4 stats cards then Per student table; vNext offering search/filter/list then separate student detail — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-247,247-295,342-389`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:39-103`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:36-70`
- Fix: Recompose same-page selected class/course card+stats+table in correct order

## G2-14-003-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy four Ant small Cards and 16px gutter; vNext border-y definition list without card backgrounds — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:342-370`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:41-47`
- Fix: Restore compact 4-card metric grid and labels/styles at md

## G2-14-003-008  [P2] GAP  facet F02  effort S
- Legacy: Legacy Per student Card with helper paragraph; vNext DataTable directly under explanatory paragraph — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:372-379`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:48-50`
- Fix: Wrap table in titled card and exact two-sentence helper

## G2-14-003-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy class Select, course Select, Refresh and Export CSV in one filter bar; vNext q search/More filters/Filter/Clear filters and detail export link — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:247-295`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:48-68`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:66-69`
- Fix: Restore exactly four first-class controls and placement

## G2-14-003-010  [P2] MISSING  facet F03  effort S
- Legacy: Legacy disabled Refresh until both class/course selected; vNext no action-level Refresh on detail (server navigation only) — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:284-290`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:36-70`
- Fix: Add filter-scoped Refresh with busy indicator and retry

## G2-14-003-011  [P2] GAP  facet F03  effort S
- Legacy: Legacy disabled Export CSV until learner rows; vNext detail exports regardless of empty rows — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:289-290`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:64-69`
- Fix: Disable export with zero learners or show legacy empty state

## G2-14-003-014  [P2] GAP  facet F04  effort S
- Legacy: Legacy header metric Average completion rounded percentage of all roster incl zero; vNext detail same mean of per-student percentages but omits no-measure value — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:185-215`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:30-46`
- Fix: Match average value and clarify null vs 0 when nothing measurable

## G2-14-003-017  [P2] GAP  facet F04  effort M
- Legacy: Legacy per-student percent shown as progress bar with status red at0, active below40, normal at40+; vNext plain percentage or Not measured — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-203`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:59-63`
- Fix: Render Ant-like progress bar and exact 0/under40/above states

## G2-14-003-018  [P2] GAP  facet F04  effort S
- Legacy: Legacy Student #ID fallback and roll em dash; vNext studentName fallback Student and no roll — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-168`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:41-43`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:55-62`
- Fix: Use Student #ID fallback and em dash for missing roll

## G2-14-003-019  [P2] GAP  facet F04  effort S
- Legacy: Legacy one Items measured total plus videos, assignments, quizzes breakdown; vNext detail only range per learner without decomposition — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:363-368`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:45-47`
- Fix: Show measured-item total plus breakdown with secondary 12px text

## G2-14-003-020  [P2] GAP  facet F04  effort S
- Legacy: Legacy has result note when course not measurable/no active students; vNext generic no enrolled students but still shows 0 measured metrics — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:153-162`; `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:338-340`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:41-65`
- Fix: Render exact note and suppress misleading completion percentages

## G2-14-003-025  [P2] GAP  facet F05  effort M
- Legacy: Legacy table pageSize20, showSizeChanger, horizontal scroll; vNext DataTable has no explicit pagination and hard truncate500 — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-386`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-65`; `src/modules/courses/super-admin-student-course-progress.ts:112-134`
- Fix: Add 20-size pagination and horizontal column behavior

## G2-14-003-026  [P2] GAP  facet F05  effort S
- Legacy: Legacy 6 columns Student, Roll, Videos, Assignments, Quizzes, Progress; vNext 5 missing Roll — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-205`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-64`
- Fix: Reintroduce Roll and match widths 90,110,90,220

## G2-14-003-028  [P2] GAP  facet F06  effort M
- Legacy: Legacy required Class and Course selection default null; vNext offeringId UUID detail route is required, selected by external list — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:35-40,97-134`
- vNext now: `src/modules/courses/super-admin-course-progress-query.ts:19-24`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:13-23`
- Fix: Use class→course controlled selector, clear dependent fields on change

## G2-14-003-048  [P2] GAP  facet F12  effort S
- Legacy: Legacy items 0 returns null average and one note; vNext percent null when total0 but admin detail computes mean only among measurable rows — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:153-162`
- vNext now: `src/modules/courses/super-admin-student-progress-model.ts:7-13`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:30-35`
- Fix: Show exact no-work note and blank summary, not mixed metric display

## G2-14-003-053  [P2] GAP  facet F13  effort M
- Legacy: Legacy 4-summary + 8-row table skeleton and Refreshing status preserving same-scope rows; vNext SSR full render and no stale state banner — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:317-337`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:24-49`
- Fix: Implement initial/refresh skeletons and preserve scoped data while retrying

## G2-14-003-055  [P2] GAP  facet F13  effort S
- Legacy: Legacy no active learners produces This class has no active learners; vNext No enrolled students — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:153-162`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:63-65`
- Fix: Match exact wording and reason; preserve zero-measure distinction

## G2-14-003-058  [P2] GAP  facet F14  effort S
- Legacy: Legacy export disabled when no learners; vNext details link present regardless rows — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:207-209,284-290`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:64-69`
- Fix: Disable no-row export and show help

## G2-14-003-061  [P2] GAP  facet F16  effort M
- Legacy: Legacy selector layout xs24 md9/md9/md6 and stats xs12/md6, table overflow x; vNext card metrics grid2/md4 and vertically stacked controls — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:248-293,342-370,379-386`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:48-63`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:41-50`
- Fix: Use legacy breakpoint column widths and horizontal table

## G2-14-003-062  [P2] GAP  facet F16  effort S
- Legacy: Legacy AntD small Progress bar; vNext plain text percent mobile/desktop — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-203`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:59-63`
- Fix: Use responsive bar component with adjacent numeric label

## G2-14-003-069  [P2] GAP  facet F18  effort S
- Legacy: Legacy Per student description Sorted furthest-behind first; retakes current attempt; vNext generic persisted explanation — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:372-379`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:48-49`
- Fix: Restore helper sentences after sorting logic

## G2-19-003-006  [P2] GAP  facet F02  effort M
- Legacy: Four AntD small Cards in 2-up mobile/4-up md `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:342-370`
- vNext now: Four border-grid stats only on student detail `src/app/(authenticated)/admin/course-progress/students/page.tsx:41-47`
- Fix: Show summary immediately after class+course controls with card styling.

## G2-19-003-009  [P2] GAP  facet F03  effort M
- Legacy: Per student Card and colored Progress bars `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:372-387`
- vNext now: Drilldown DataTable has percentage as text `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-65`
- Fix: Use progress meter/bar status as in old table.

## G2-19-003-012  [P2] GAP  facet F04  effort S
- Legacy: Student name fallback Student #learnerId and roll number dash `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-168`
- vNext now: DB coalesce display name Student, no roll cell `src/modules/courses/super-admin-student-course-progress.ts:40-43` `src/app/(authenticated)/admin/course-progress/students/page.tsx:55-58`
- Fix: Use safe identifiable fallback and em-dash missing roll.

## G2-19-003-014  [P2] GAP  facet F04  effort M
- Legacy: Progress visual colored by 0/under40/else `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:188-203`
- vNext now: Detail gives Not measured or numeric percentage text `src/app/(authenticated)/admin/course-progress/students/page.tsx:59-62`
- Fix: Implement accessible colored progressbar using same thresholds.

## G2-19-003-016  [P2] GAP  facet F04  effort S
- Legacy: Items measured shows counts videos, assignments, quizzes `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:363-368`
- vNext now: Items measured min-max range per learner, no type breakdown `src/app/(authenticated)/admin/course-progress/students/page.tsx:45-48`
- Fix: Expose three separate measurable item counts.

## G2-19-003-046  [P2] GAP  facet F13  effort M
- Legacy: Legacy skeletons for filters, four stats, learner 8x6 `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:329-338`
- vNext now: vNext server page no matching report-specific loading skeleton `src/app/(authenticated)/admin/course-progress/page.tsx:36-72` `src/app/(authenticated)/admin/course-progress/students/page.tsx:24-36`
- Fix: Restore skeleton and RefreshStatus transitions.

## G2-19-003-056  [P2] GAP  facet F16  effort S
- Legacy: Legacy Stat Card xs12 md6 `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:342-370`
- vNext now: vNext detail grid 2 mobile, 4 desktop but no Cards `src/app/(authenticated)/admin/course-progress/students/page.tsx:41-47`
- Fix: Match card padding, borders and font size.

## G2-19-003-057  [P2] GAP  facet F16  effort M
- Legacy: Legacy table scroll x=max-content `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-386`
- vNext now: vNext DataTable has mobile priorities and no matching six-column scroll `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-65`
- Fix: Audit 375px overflow and retain all data columns.

## G2-19-003-058  [P2] GAP  facet F17  effort M
- Legacy: Legacy Progress bar and sortable completion `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:188-203`
- vNext now: vNext text completion only `src/app/(authenticated)/admin/course-progress/students/page.tsx:59-62`
- Fix: Add accessible aria-valuenow progress meters and sort.

## G2-19-003-062  [P2] MISSING  facet F18  effort S
- Legacy: Legacy note Sorted furthest-behind first and retakes current attempt only `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:372-378`
- vNext now: vNext absent from student DataTable `src/app/(authenticated)/admin/course-progress/students/page.tsx:48-50`
- Fix: Restore explanatory note once sort/attempt parity implemented.

## G2-2-015-063  [P2] GAP  facet F03  effort M
- Legacy: Per student table draws colored AntD Progress and zero red/under40 active `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-203`
- vNext now: Super Admin student detail prints plain percentage text with no progressbar `src/app/(authenticated)/admin/course-progress/students/page.tsx:54-63`
- Fix: Use an accessible shared progress meter with matching 0/under40 thresholds

## G2-2-015-066  [P2] GAP  facet F04  effort M
- Legacy: Legacy Items measured shows a single total and breakdown by videos, assignments, quizzes `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:362-368`
- vNext now: Super Admin tile shows per-learner min–max total but no breakdown `src/app/(authenticated)/admin/course-progress/students/page.tsx:45-48`
- Fix: Show measured video/assignment/quiz counts, clearly mark audience variation

## G2-2-015-068  [P2] GAP  facet F05  effort M
- Legacy: Default table sorted by completion ascending; AntD pager 20 with size chooser `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-194,379-386`
- vNext now: Super Admin rows sorted student name in SQL, DataTable no progress sorter/page control `src/modules/courses/super-admin-student-course-progress.ts:112-114` `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-65`
- Fix: Sort by computed progress ascending and add 20-row paged view

## G2-2-015-082  [P2] GAP  facet F13  effort M
- Legacy: Legacy shows exact no-work note if no videos/assignments/quizzes `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:153-161`
- vNext now: Super Admin displays Not measured but no exact explanation `src/app/(authenticated)/admin/course-progress/students/page.tsx:41-48,59-65`
- Fix: Show original no-work message and avoid generic empty students inference

## G2-2-015-087  [P2] GAP  facet F17  effort M
- Legacy: AntD Progress component conveys colored progressbar status `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:188-203`
- vNext now: Super Admin uses plain numerical string for percent `src/app/(authenticated)/admin/course-progress/students/page.tsx:59-62`
- Fix: Restore role=progressbar and accessible value text

## G2-14-003-064  [P3] GAP  facet F17  effort S
- Legacy: Legacy Progress bar accessible via AntD percent rendered; vNext text progress is accessible but loses state color cue — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:194-203`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:59-63`
- Fix: Preserve percentage accessible name and visual stage without color-only meaning

## G2-19-003-010  [P3] GAP  facet F03  effort S
- Legacy: Not started stat text turns red when count nonzero `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:353-360`
- vNext now: Not started raw stat has no conditional red `src/app/(authenticated)/admin/course-progress/students/page.tsx:44`
- Fix: Use red number emphasis only for positive count.
