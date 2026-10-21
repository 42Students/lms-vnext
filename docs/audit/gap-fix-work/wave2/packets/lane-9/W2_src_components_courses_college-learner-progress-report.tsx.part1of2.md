# Work packet (wave 2): edit src/components/courses/college-learner-progress-report.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-course-progress-controller.md, docs/audit/gap2/lane-8/college-course-progress.md

## G2-2-015-003  [P2] GAP  facet F02  effort S
- Legacy: Course Progress h1 and subtitle See measured completion for a class and course... (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-238`)
- vNext now: outer PageHeader Progress and nested h2 Course Progress with same subtitle (`src/app/(authenticated)/college/course-progress/page.tsx:64-75; src/components/courses/college-learner-progress-report.tsx:26-32`)
- Fix: Avoid duplicate/hierarchy title mismatch; choose legacy h1 Course Progress and separate section label

## G2-2-015-004  [P2] GAP  facet F02  effort S
- Legacy: info Alert Measured work only prominently above filter card (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:239-245`)
- vNext now: measurement explanation moved below table in a small paragraph (`src/components/courses/college-learner-progress-report.tsx:96-103`)
- Fix: Restore icon/banner prominence and exact placement before filters

## G2-2-015-005  [P2] GAP  facet F02  effort M
- Legacy: filters inside Card size=small, Row gutter12 with 9/9/6 columns (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:247-295`)
- vNext now: plain form grid with class/course/show progress/clear, responsive 2/4 columns (`src/components/courses/college-learner-progress-report.tsx:33-60`)
- Fix: Use legacy card background, border, and button group layout while preserving form semantics

## G2-2-015-006  [P2] GAP  facet F03  effort S
- Legacy: Refresh button with ReloadOutlined and spinner (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:284-289`)
- vNext now: Show progress submit and Clear link; no explicit Refresh control (`src/components/courses/college-learner-progress-report.tsx:51-59`)
- Fix: Add refresh affordance with loading state, or map Show progress label with exact legacy copy

## G2-2-015-007  [P2] GAP  facet F03  effort S
- Legacy: Export CSV button disabled unless learners data exists (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:285-291`)
- vNext now: Export per-learner CSV link appears for any report, including zero students (`src/components/courses/college-learner-progress-report.tsx:61-77`)
- Fix: Disable export when report rows empty to match legacy, or document download-empty policy

## G2-2-015-009  [P2] GAP  facet F04  effort S
- Legacy: per-student columns Student, Roll number, Videos, Assignments, Quizzes, Progress (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-205`)
- vNext now: new order Student, Roll number, Progress, Videos, Assignments, Quizzes (`src/components/courses/college-learner-progress-report.tsx:78-94`)
- Fix: Restore legacy column order and progress at rightmost position

## G2-2-015-010  [P2] GAP  facet F04  effort S
- Legacy: legacy progress visual AntD Progress with 0 red, <40 active, >=40 normal (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-203`)
- vNext now: new MetricBar with same percent but no corresponding explicit threshold colors (`src/components/courses/college-learner-progress-report.tsx:86-90`)
- Fix: Match low/zero progress indicators without implying ungrounded pass/fail judgment

## G2-2-015-012  [P2] GAP  facet F04  effort S
- Legacy: Items measured statistic shows total plus small textual breakout N videos · N assignments · N quizzes (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:363-368`)
- vNext now: new items measured tile shows total only, breakout in table columns/footnote (`src/components/courses/college-learner-progress-report.tsx:64-70,91-103`)
- Fix: Add video/assignment/quiz breakdown directly under metric tile

## G2-2-015-015  [P2] GAP  facet F05  effort M
- Legacy: legacy course dropdown sorts active first then most recent semester (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:113-122`)
- vNext now: new choices sort sections.name then courses.code, filtered in returned order (`src/modules/courses/college-learner-progress-service.ts:35-53; src/components/courses/college-learner-progress-report.tsx:24-25`)
- Fix: Match active/semester priority, or document persisted offering recency ordering

## G2-2-015-017  [P2] GAP  facet F05  effort M
- Legacy: legacy per-student table defaults ascending completion percentage and AntD pagination 20 with size changer (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-194,379-386`)
- vNext now: new report service sorts ascending progress but DataTable has no pagination props (`src/modules/courses/college-learner-progress-service.ts:155-162; src/components/courses/college-learner-progress-report.tsx:78-95`)
- Fix: Add 20-row size-changing table pagination, preserve ascending by progress

## G2-2-015-020  [P2] GAP  facet F06  effort M
- Legacy: Course placeholder varies Loading courses…/Couldn't load this class's courses/No courses.../Pick a class first (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:266-281`)
- vNext now: new select says Select Course and disables if no class; no separate per-class metadata error text (`src/components/courses/college-learner-progress-report.tsx:41-49`)
- Fix: Provide source-specific placeholder/disabled/error states and retry for class course lookup

## G2-2-015-021  [P2] GAP  facet F06  effort M
- Legacy: legacy results auto-fetch on both selections, useEffect load (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:136-164`)
- vNext now: vNext requires explicit Show progress GET submit (`src/components/courses/college-learner-progress-report.tsx:33-55`)
- Fix: Either auto-fetch after valid pair or clearly retain approved submit difference

## G2-2-015-022  [P2] GAP  facet F06  effort M
- Legacy: legacy metadata read has Retry and no selection while unresolved (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:77-95,297-315`)
- vNext now: vNext server query loads choices together with report and no inline metadata retry (`src/modules/courses/college-learner-progress-service.ts:32-64; src/components/courses/college-learner-progress-report.tsx:33-62`)
- Fix: Offer explicit retry and avoid presenting empty options as certain absence on fetch failure

## G2-2-015-031  [P2] GAP  facet F10  effort M
- Legacy: legacy GET /api/v1/admin/course-progress?courseId=&classId= (`docs/legacy-source/frontend/src/api/Services/AdminService.js:540-543`)
- vNext now: vNext GET page with offeringId+deliveryId through getCollegeLearnerProgressReport (`src/components/courses/college-learner-progress-report.tsx:33-53; src/modules/courses/college-learner-progress-service.ts:56-65`)
- Fix: Map old course/class link parameters to new offering/delivery for existing bookmarks

## G2-2-015-037  [P2] GAP  facet F12  effort S
- Legacy: legacy course filters can show all college courses if no class chosen, but data shown only for valid pair (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:129-134,331-338`)
- vNext now: vNext shows only active deliveries; report null if no valid pair (`src/components/courses/college-learner-progress-report.tsx:24-25,61-64`)
- Fix: Show class/course choice without false no-data implications

## G2-2-015-040  [P2] GAP  facet F13  effort S
- Legacy: legacy table empty No students in this section. (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-387`)
- vNext now: new No enrolled learners / No active learner enrollments for this Class and Course. (`src/components/courses/college-learner-progress-report.tsx:78-83`)
- Fix: Match legacy empty title while preserving active-scope explanation as supplementary text

## G2-2-015-041  [P2] GAP  facet F13  effort S
- Legacy: legacy no measured items may display warning note from API (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:338-340`)
- vNext now: vNext keeps 0 metrics plus No published items are available to measure. footnote (`src/components/courses/college-learner-progress-report.tsx:96-103`)
- Fix: Surface no-measurable-work warning before score tiles, avoid misleading all-zero completion

## G2-2-015-043  [P2] GAP  facet F14  effort S
- Legacy: legacy export disabled if no learners (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:207-209,289-290`)
- vNext now: new export link present whenever report exists (`src/components/courses/college-learner-progress-report.tsx:72-77`)
- Fix: Disable empty report export unless explicit zero-row CSV supported

## G2-2-015-047  [P2] GAP  facet F16  effort M
- Legacy: legacy AntD Table horizontal scroll max-content and page size changer (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-386`)
- vNext now: new DataTable with mobile priority and no explicit horizontal scroll/page size controls (`src/components/courses/college-learner-progress-report.tsx:78-95`)
- Fix: Inspect actual mobile card layout; implement table pagination/scroll parity

## G2-2-015-050  [P2] GAP  facet F18  effort S
- Legacy: legacy main title Course Progress and Measured work only alert (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:233-245`)
- vNext now: vNext main heading Progress and measured-work footnote after table (`src/app/(authenticated)/college/course-progress/page.tsx:64-65; src/components/courses/college-learner-progress-report.tsx:96-103`)
- Fix: Restore exact title and banner copy/placement

## G2-2-015-053  [P2] GAP  facet F19  effort M
- Legacy: legacy per-student pagination 20 with size changer (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-386`)
- vNext now: vNext renders up to 2000 rows in DataTable without pagination props (`src/components/courses/college-learner-progress-report.tsx:78-95`)
- Fix: Add paged/virtualized learner table with page count and size changer

## G2-8-008-003  [P2] GAP  facet F02  effort S
- Legacy: Course Progress h1 and subtitle See measured completion for a class and course... (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-238`)
- vNext now: outer PageHeader Progress and nested h2 Course Progress with same subtitle (`src/app/(authenticated)/college/course-progress/page.tsx:64-75; src/components/courses/college-learner-progress-report.tsx:26-32`)
- Fix: Avoid duplicate/hierarchy title mismatch; choose legacy h1 Course Progress and separate section label

## G2-8-008-004  [P2] GAP  facet F02  effort S
- Legacy: info Alert Measured work only prominently above filter card (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:239-245`)
- vNext now: measurement explanation moved below table in a small paragraph (`src/components/courses/college-learner-progress-report.tsx:96-103`)
- Fix: Restore icon/banner prominence and exact placement before filters

## G2-8-008-005  [P2] GAP  facet F02  effort M
- Legacy: filters inside Card size=small, Row gutter12 with 9/9/6 columns (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:247-295`)
- vNext now: plain form grid with class/course/show progress/clear, responsive 2/4 columns (`src/components/courses/college-learner-progress-report.tsx:33-60`)
- Fix: Use legacy card background, border, and button group layout while preserving form semantics

## G2-8-008-006  [P2] GAP  facet F03  effort S
- Legacy: Refresh button with ReloadOutlined and spinner (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:284-289`)
- vNext now: Show progress submit and Clear link; no explicit Refresh control (`src/components/courses/college-learner-progress-report.tsx:51-59`)
- Fix: Add refresh affordance with loading state, or map Show progress label with exact legacy copy

## G2-8-008-007  [P2] GAP  facet F03  effort S
- Legacy: Export CSV button disabled unless learners data exists (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:285-291`)
- vNext now: Export per-learner CSV link appears for any report, including zero students (`src/components/courses/college-learner-progress-report.tsx:61-77`)
- Fix: Disable export when report rows empty to match legacy, or document download-empty policy

## G2-8-008-009  [P2] GAP  facet F04  effort S
- Legacy: per-student columns Student, Roll number, Videos, Assignments, Quizzes, Progress (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-205`)
- vNext now: new order Student, Roll number, Progress, Videos, Assignments, Quizzes (`src/components/courses/college-learner-progress-report.tsx:78-94`)
- Fix: Restore legacy column order and progress at rightmost position

## G2-8-008-010  [P2] GAP  facet F04  effort S
- Legacy: legacy progress visual AntD Progress with 0 red, <40 active, >=40 normal (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-203`)
- vNext now: new MetricBar with same percent but no corresponding explicit threshold colors (`src/components/courses/college-learner-progress-report.tsx:86-90`)
- Fix: Match low/zero progress indicators without implying ungrounded pass/fail judgment

## G2-8-008-012  [P2] GAP  facet F04  effort S
- Legacy: Items measured statistic shows total plus small textual breakout N videos · N assignments · N quizzes (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:363-368`)
- vNext now: new items measured tile shows total only, breakout in table columns/footnote (`src/components/courses/college-learner-progress-report.tsx:64-70,91-103`)
- Fix: Add video/assignment/quiz breakdown directly under metric tile

## G2-8-008-015  [P2] GAP  facet F05  effort M
- Legacy: legacy course dropdown sorts active first then most recent semester (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:113-122`)
- vNext now: new choices sort sections.name then courses.code, filtered in returned order (`src/modules/courses/college-learner-progress-service.ts:35-53; src/components/courses/college-learner-progress-report.tsx:24-25`)
- Fix: Match active/semester priority, or document persisted offering recency ordering

## G2-8-008-017  [P2] GAP  facet F05  effort M
- Legacy: legacy per-student table defaults ascending completion percentage and AntD pagination 20 with size changer (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-194,379-386`)
- vNext now: new report service sorts ascending progress but DataTable has no pagination props (`src/modules/courses/college-learner-progress-service.ts:155-162; src/components/courses/college-learner-progress-report.tsx:78-95`)
- Fix: Add 20-row size-changing table pagination, preserve ascending by progress

## G2-8-008-020  [P2] GAP  facet F06  effort M
- Legacy: Course placeholder varies Loading courses…/Couldn't load this class's courses/No courses.../Pick a class first (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:266-281`)
- vNext now: new select says Select Course and disables if no class; no separate per-class metadata error text (`src/components/courses/college-learner-progress-report.tsx:41-49`)
- Fix: Provide source-specific placeholder/disabled/error states and retry for class course lookup

## G2-8-008-021  [P2] GAP  facet F06  effort M
- Legacy: legacy results auto-fetch on both selections, useEffect load (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:136-164`)
- vNext now: vNext requires explicit Show progress GET submit (`src/components/courses/college-learner-progress-report.tsx:33-55`)
- Fix: Either auto-fetch after valid pair or clearly retain approved submit difference

## G2-8-008-022  [P2] GAP  facet F06  effort M
- Legacy: legacy metadata read has Retry and no selection while unresolved (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:77-95,297-315`)
- vNext now: vNext server query loads choices together with report and no inline metadata retry (`src/modules/courses/college-learner-progress-service.ts:32-64; src/components/courses/college-learner-progress-report.tsx:33-62`)
- Fix: Offer explicit retry and avoid presenting empty options as certain absence on fetch failure

## G2-8-008-031  [P2] GAP  facet F10  effort M
- Legacy: legacy GET /api/v1/admin/course-progress?courseId=&classId= (`docs/legacy-source/frontend/src/api/Services/AdminService.js:540-543`)
- vNext now: vNext GET page with offeringId+deliveryId through getCollegeLearnerProgressReport (`src/components/courses/college-learner-progress-report.tsx:33-53; src/modules/courses/college-learner-progress-service.ts:56-65`)
- Fix: Map old course/class link parameters to new offering/delivery for existing bookmarks

## G2-8-008-037  [P2] GAP  facet F12  effort S
- Legacy: legacy course filters can show all college courses if no class chosen, but data shown only for valid pair (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:129-134,331-338`)
- vNext now: vNext shows only active deliveries; report null if no valid pair (`src/components/courses/college-learner-progress-report.tsx:24-25,61-64`)
- Fix: Show class/course choice without false no-data implications

## G2-8-008-040  [P2] GAP  facet F13  effort S
- Legacy: legacy table empty No students in this section. (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-387`)
- vNext now: new No enrolled learners / No active learner enrollments for this Class and Course. (`src/components/courses/college-learner-progress-report.tsx:78-83`)
- Fix: Match legacy empty title while preserving active-scope explanation as supplementary text

## G2-8-008-041  [P2] GAP  facet F13  effort S
- Legacy: legacy no measured items may display warning note from API (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:338-340`)
- vNext now: vNext keeps 0 metrics plus No published items are available to measure. footnote (`src/components/courses/college-learner-progress-report.tsx:96-103`)
- Fix: Surface no-measurable-work warning before score tiles, avoid misleading all-zero completion

## G2-8-008-043  [P2] GAP  facet F14  effort S
- Legacy: legacy export disabled if no learners (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:207-209,289-290`)
- vNext now: new export link present whenever report exists (`src/components/courses/college-learner-progress-report.tsx:72-77`)
- Fix: Disable empty report export unless explicit zero-row CSV supported

## G2-8-008-047  [P2] GAP  facet F16  effort M
- Legacy: legacy AntD Table horizontal scroll max-content and page size changer (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-386`)
- vNext now: new DataTable with mobile priority and no explicit horizontal scroll/page size controls (`src/components/courses/college-learner-progress-report.tsx:78-95`)
- Fix: Inspect actual mobile card layout; implement table pagination/scroll parity
