# Work packet (wave 2): edit src/components/courses/college-learner-progress-report.tsx (part 2 of 2)

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/college-course-progress.md, docs/audit/gap2/lane-2/admin-course-progress-controller.md

## G2-8-008-050  [P2] GAP  facet F18  effort S
- Legacy: legacy main title Course Progress and Measured work only alert (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:233-245`)
- vNext now: vNext main heading Progress and measured-work footnote after table (`src/app/(authenticated)/college/course-progress/page.tsx:64-65; src/components/courses/college-learner-progress-report.tsx:96-103`)
- Fix: Restore exact title and banner copy/placement

## G2-8-008-053  [P2] GAP  facet F19  effort M
- Legacy: legacy per-student pagination 20 with size changer (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-386`)
- vNext now: vNext renders up to 2000 rows in DataTable without pagination props (`src/components/courses/college-learner-progress-report.tsx:78-95`)
- Fix: Add paged/virtualized learner table with page count and size changer

## G2-2-015-019  [P3] GAP  facet F06  effort S
- Legacy: Class select placeholder Class, search by label (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:249-262`)
- vNext now: new Class labeled select with option Select Class, native select (`src/components/courses/college-learner-progress-report.tsx:34-40`)
- Fix: Use exact placeholder Class and searchable dropdown if consistent with legacy keyboard

## G2-2-015-039  [P3] GAP  facet F13  effort S
- Legacy: legacy prompt Pick a class, then one of its courses. (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:329-333`)
- vNext now: vNext prompt Select a Class and Course to see each enrolled learner’s progress. (`src/components/courses/college-learner-progress-report.tsx:61-63`)
- Fix: Restore exact concise prompt

## G2-2-015-051  [P3] GAP  facet F18  effort S
- Legacy: legacy Export CSV and Refresh short button labels (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:284-292`)
- vNext now: new Export per-learner CSV / Show progress / Clear (`src/components/courses/college-learner-progress-report.tsx:51-77`)
- Fix: Match action wording and grouping after UX decision

## G2-8-008-019  [P3] GAP  facet F06  effort S
- Legacy: Class select placeholder Class, search by label (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:249-262`)
- vNext now: new Class labeled select with option Select Class, native select (`src/components/courses/college-learner-progress-report.tsx:34-40`)
- Fix: Use exact placeholder Class and searchable dropdown if consistent with legacy keyboard

## G2-8-008-039  [P3] GAP  facet F13  effort S
- Legacy: legacy prompt Pick a class, then one of its courses. (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:329-333`)
- vNext now: vNext prompt Select a Class and Course to see each enrolled learner’s progress. (`src/components/courses/college-learner-progress-report.tsx:61-63`)
- Fix: Restore exact concise prompt

## G2-8-008-051  [P3] GAP  facet F18  effort S
- Legacy: legacy Export CSV and Refresh short button labels (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:284-292`)
- vNext now: new Export per-learner CSV / Show progress / Clear (`src/components/courses/college-learner-progress-report.tsx:51-77`)
- Fix: Match action wording and grouping after UX decision
