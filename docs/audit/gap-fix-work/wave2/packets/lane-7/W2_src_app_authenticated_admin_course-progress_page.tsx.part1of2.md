# Work packet (wave 2): edit src/app/(authenticated)/admin/course-progress/page.tsx (part 1 of 2)

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

## G2-14-003-003  [P2] GAP  facet F01  effort S
- Legacy: Legacy selected college required shows Select a college to view course progress warning; vNext generic Select a college to continue empty — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:227-229`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:32-35`
- Fix: Use warning text/status exactly

## G2-14-003-005  [P2] GAP  facet F02  effort L
- Legacy: Legacy header then Measured work only info then single filter card then 4 stats cards then Per student table; vNext offering search/filter/list then separate student detail — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-247,247-295,342-389`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:39-103`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:36-70`
- Fix: Recompose same-page selected class/course card+stats+table in correct order

## G2-14-003-006  [P2] GAP  facet F02  effort S
- Legacy: Legacy info Alert margin-bottom16 width full; vNext info after PageHeader but copy different — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:239-245`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:44-46`
- Fix: Match panel icon/spacing and exact heading/description

## G2-14-003-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy class Select, course Select, Refresh and Export CSV in one filter bar; vNext q search/More filters/Filter/Clear filters and detail export link — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:247-295`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:48-68`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:66-69`
- Fix: Restore exactly four first-class controls and placement

## G2-14-003-022  [P2] GAP  facet F05  effort M
- Legacy: Legacy class options display className/name/Class ID fallback, searchable; vNext Cohort dropdown rather than classes — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:249-263`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:55-61`
- Fix: Fetch class list from college and show searchable labels

## G2-14-003-023  [P2] GAP  facet F05  effort M
- Legacy: Legacy course options active-first, semester descending, suffix Sem N / past; vNext only offering code/status via directory filters — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:107-123`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:55-61,72-82`
- Fix: Generate offering options from class teaching assignments, preserve Sem/past sorting

## G2-14-003-029  [P2] GAP  facet F06  effort M
- Legacy: Legacy class choice clears course/results/error; vNext filter GET can preserve courseCode/cohortCode independently — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:97-105,265-278`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:48-63`; `src/modules/courses/super-admin-course-progress-query.ts:6-16`
- Fix: Reset course when class changes, clear stale report

## G2-14-003-030  [P2] GAP  facet F06  effort M
- Legacy: Legacy course disabled until class course list ready, with explicit reason placeholders; vNext offering click available independently — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:265-282`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:72-91`
- Fix: Disable Course until taught options loaded, show exact loading/failure/none text

## G2-14-003-037  [P2] GAP  facet F09  effort M
- Legacy: Legacy no modal/drawer for main view, uses antd Select dropdown; vNext no dialog, uses native disclosure filters and drill-in link — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:247-295`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:48-63`
- Fix: Match select popovers/trigger/keyboard, avoid moving selection into separate page

## G2-14-003-040  [P2] GAP  facet F10  effort M
- Legacy: Legacy metadata GET courses, classes and teaching assignments; vNext listCollegeCourseProgress and filters options instead — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:57-134`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:36-38`; `src/modules/courses/college-learning-directory-service.ts:213-235`
- Fix: Add class/course metadata queries with permission/tenant enforcement

## G2-14-003-051  [P2] GAP  facet F13  effort S
- Legacy: Legacy metadata error banner with retry; vNext filter-choice error only warns applied filters still work — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:297-306`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:64-66`
- Fix: Add Retry for course/class option fetch; block course choice only

## G2-14-003-052  [P2] MISSING  facet F13  effort S
- Legacy: Legacy class courses failed has exact warning and Retry; vNext no class taught-course load state — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:307-315`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:48-63`
- Fix: Add class-course failed alert and Retry without fallback

## G2-14-003-054  [P2] GAP  facet F13  effort S
- Legacy: Legacy initially Pick a class then one of its courses; vNext No recorded course progress when directory empty — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:329-332`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:92-93`
- Fix: Restore unselected guidance and distinct empty-collection state

## G2-14-003-061  [P2] GAP  facet F16  effort M
- Legacy: Legacy selector layout xs24 md9/md9/md6 and stats xs12/md6, table overflow x; vNext card metrics grid2/md4 and vertically stacked controls — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:248-293,342-370,379-386`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:48-63`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:41-50`
- Fix: Use legacy breakpoint column widths and horizontal table

## G2-14-003-063  [P2] GAP  facet F17  effort M
- Legacy: Legacy Select showSearch optionFilterProp label and disabled while metadata loading; vNext native Select/no class courses — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:249-282`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:49-61`
- Fix: Add accessible searchable listbox, keyboard typeahead, disabled reasons

## G2-14-003-066  [P2] GAP  facet F18  effort S
- Legacy: Legacy title Course Progress vs vNext Progress — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:233-237`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:39-43`
- Fix: Use Course Progress verbatim

## G2-14-003-067  [P2] GAP  facet F18  effort S
- Legacy: Legacy subtitle See measured completion for a class and course ... vs vNext Read-only recorded learner content activity by offering — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:233-237`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:39-43`
- Fix: Restore exact subtitle sentence

## G2-14-003-068  [P2] GAP  facet F18  effort S
- Legacy: Legacy info heading Measured work only and full self-click explanation vs vNext unnamed Alert with shorter phrasing — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:239-245`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:44-46`
- Fix: Use exact heading and description

## G2-14-003-070  [P2] GAP  facet F18  effort S
- Legacy: Legacy fallback course picker strings Pick a class first / Loading courses… / No courses are taught ...; vNext none — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:265-282`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:48-63`
- Fix: Copy exact disabled and empty labels

## G2-19-003-002  [P2] GAP  facet F01  effort M
- Legacy: Grouped in legacy Courses & Content shell `docs/legacy-source/frontend/src/pages/superadmin/course-progress.js:23-27`
- vNext now: Separate page with Courses backlink `src/app/(authenticated)/admin/course-progress/page.tsx:39-43`
- Fix: Mirror group-tab navigation; keep legacy route redirect.

## G2-19-003-005  [P2] GAP  facet F02  effort M
- Legacy: Controls in card Row gutter12 md Col9/9/6 `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:247-295`
- vNext now: Border-bottom form with Disclosure and md grid `src/app/(authenticated)/admin/course-progress/page.tsx:48-63`
- Fix: Recreate compact filter Card and legacy responsive columns.

## G2-19-003-007  [P2] MISSING  facet F03  effort S
- Legacy: Refresh with reload icon, disabled until course and class selected `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:284-288`
- vNext now: Filter submit button but no independent Refresh `src/app/(authenticated)/admin/course-progress/page.tsx:48-63`
- Fix: Add conditional Refresh with loading spinner and icon.

## G2-19-003-008  [P2] GAP  facet F03  effort S
- Legacy: Export CSV alongside Refresh, disabled without learners `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:288-292`
- vNext now: Export course-progress.csv in footer regardless of learner rows `src/app/(authenticated)/admin/course-progress/page.tsx:94-102`
- Fix: Move export next to Refresh and disable while empty.

## G2-19-003-018  [P2] GAP  facet F05  effort S
- Legacy: Course labels include semester number and past suffix `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:105-133`
- vNext now: Offering cards use cohort/period, no comparable dropdown labels `src/app/(authenticated)/admin/course-progress/page.tsx:73-83`
- Fix: Preserve Sem N / past in course option text.

## G2-19-003-019  [P2] GAP  facet F05  effort S
- Legacy: Course disabled with Pick a class first when no selected class `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:265-282`
- vNext now: Course filter available without class context `src/app/(authenticated)/admin/course-progress/page.tsx:53-61`
- Fix: Disable dependent Course until Class chosen; show exact placeholder.

## G2-19-003-023  [P2] GAP  facet F06  effort M
- Legacy: Class/Course selectors use exact placeholders and disabled/loading states `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:249-282`
- vNext now: Search label Course or cohort, More filters `src/app/(authenticated)/admin/course-progress/page.tsx:48-61`
- Fix: Build two legacy selectors with correct cascade and keyboard support.

## G2-19-003-024  [P2] GAP  facet F06  effort S
- Legacy: Changing Course clears data/error state `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:271-278`
- vNext now: vNext form submits URL filter without client report-reset handling `src/app/(authenticated)/admin/course-progress/page.tsx:48-63`
- Fix: Reset stale report on scope change, show loading state.

## G2-19-003-025  [P2] GAP  facet F06  effort S
- Legacy: No class/course chosen initially; placeholder tells select order `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:35-40` `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:329-333`
- vNext now: vNext loads overview instantly without selection `src/app/(authenticated)/admin/course-progress/page.tsx:36-39` `src/app/(authenticated)/admin/course-progress/page.tsx:72-93`
- Fix: Show legacy instructional empty state by default.

## G2-19-003-046  [P2] GAP  facet F13  effort M
- Legacy: Legacy skeletons for filters, four stats, learner 8x6 `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:329-338`
- vNext now: vNext server page no matching report-specific loading skeleton `src/app/(authenticated)/admin/course-progress/page.tsx:36-72` `src/app/(authenticated)/admin/course-progress/students/page.tsx:24-36`
- Fix: Restore skeleton and RefreshStatus transitions.

## G2-19-003-047  [P2] GAP  facet F13  effort S
- Legacy: Legacy no selection says Pick a class, then one of its courses `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:329-333`
- vNext now: vNext instantly lists matching offerings `src/app/(authenticated)/admin/course-progress/page.tsx:72-93`
- Fix: Render instructional empty state until scope chosen.

## G2-19-003-048  [P2] GAP  facet F13  effort S
- Legacy: Legacy class-course fetch failure has specific Retry banner `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:307-315`
- vNext now: vNext choices warning lacks Retry `src/app/(authenticated)/admin/course-progress/page.tsx:64-66`
- Fix: Provide retry fetch action without losing chosen class.

## G2-19-003-051  [P2] GAP  facet F14  effort S
- Legacy: Legacy disables export with empty learners `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:288-291`
- vNext now: vNext export href always visible `src/app/(authenticated)/admin/course-progress/page.tsx:99-101`
- Fix: Disable empty report export.

## G2-19-003-052  [P2] GAP  facet F14  effort S
- Legacy: Legacy filename includes courseId and classId `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:207-225`
- vNext now: vNext static course-progress.csv href `src/app/(authenticated)/admin/course-progress/page.tsx:99-101`
- Fix: Use specific filename and downloaded scope.

## G2-19-003-055  [P2] GAP  facet F16  effort M
- Legacy: Legacy toolbar at xs24/md9+9+6 `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:247-294`
- vNext now: vNext query form md and 1200px grid `src/app/(authenticated)/admin/course-progress/page.tsx:48-63`
- Fix: Match responsive filter widths and gutters.

## G2-19-003-059  [P2] GAP  facet F17  effort S
- Legacy: Legacy searchable class/course selects disabled until prerequisite `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:249-281`
- vNext now: vNext labelled filters but no dependent disable `src/app/(authenticated)/admin/course-progress/page.tsx:48-61`
- Fix: Preserve input state for keyboard/screenreader.

## G2-19-003-061  [P2] GAP  facet F18  effort S
- Legacy: Legacy measured banner heading Measured work only `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:239-245`
- vNext now: vNext unheaded Alert with different caveat copy `src/app/(authenticated)/admin/course-progress/page.tsx:44-46`
- Fix: Restore heading and resource self-click explanation.

## G2-19-003-066  [P2] GAP  facet F20  effort M
- Legacy: Legacy changing course clears error/loading/report snapshot `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:271-278`
- vNext now: vNext form state may retain stale cohort/course across edits `src/app/(authenticated)/admin/course-progress/page.tsx:48-61`
- Fix: Reset dependent filters and cached report.

## G2-2-015-088  [P2] GAP  facet F18  effort M
- Legacy: Exact header title is `Course Progress` and subtitle is per-class/per-course measured completion `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:233-237`
- vNext now: Super Admin outer header `Progress` and explanatory copy describes offering event rows instead `src/app/(authenticated)/admin/course-progress/page.tsx:39-46`
- Fix: Restore header and subtitle when switching to original report
