# Work packet (wave 2): edit src/components/courses/faculty-course-home-signals.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md, docs/audit/gap2/lane-8/shared-course-home.md

## G2-18-001-009  [P2] GAP  facet F02  effort M
- Legacy: Home order: optional course-about card, Next action, warning, Pending work, course activity. `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:323-429`, `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:460-500`
- vNext now: vNext renders faculty signals first, credits/instructor, read-only description, teaching class details, five metric tiles. `src/components/courses/faculty-course-workspace.tsx:423-490`, `src/components/courses/faculty-course-home-signals.tsx:36-140`
- Fix: Restore legacy section hierarchy/order; place vNext-only modules behind secondary section if retained.

## G2-18-001-016  [P2] GAP  facet F03  effort S
- Legacy: Legacy Next action CTA is a single primary Button with icon, disabled when course context absent. `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:369-396`
- vNext now: vNext Next action is styled Link, enabled only when server-resolved authorized delivery renders. `src/components/courses/faculty-course-home-signals.tsx:47-89`, `src/modules/courses/faculty-course-service.ts:204-241`
- Fix: Match button icon, caption, sizing, pending/disabled treatment; keep server auth guard.

## G2-18-001-017  [P2] GAP  facet F03  effort M
- Legacy: Legacy faculty dashboard includes Reviews and Attendance number cards and richer at-risk/performance details. `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:286-320`, `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:422-494`
- vNext now: vNext shows 4 stat tiles for Reviews, Attendance, At-risk Students, Performance and separate rich sections. `src/components/courses/faculty-course-home-signals.tsx:92-142`, `src/components/courses/faculty-course-home-signals.tsx:143-257`
- Fix: Retain detail depth but match first-row two-card priority layout and card captions.

## G2-18-001-088  [P2] GAP  facet F18  effort S
- Legacy: Legacy `Review work` CTA text is tied to pending ungraded submissions. `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:202-217`
- vNext now: vNext signal CTA derives from pending array, with own wording and generic card. `src/components/courses/faculty-course-home-signals.tsx:50-89`
- Fix: Use legacy singular/plural copy and button label in pending/clear/loading states.

## G2-8-009-006  [P2] GAP  facet F02  effort M
- Legacy: legacy faculty next action then Pending work and insight cards (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:369-395,422-474`)
- vNext now: vNext faculty course home signals rendered as independent sections under workspace (`src/components/courses/faculty-course-home-signals.tsx:35-101`)
- Fix: Compare faculty section order and card grouping, preserve two-column insights hierarchy

## G2-8-009-040  [P2] GAP  facet F16  effort M
- Legacy: legacy About and Next action wrapped ln-module-card; faculty insight side-by-side below (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:336-472`)
- vNext now: new sections border-bottom plus separate responsive faculty signals and learner sticky mobile jump nav (`src/components/courses/learner-course-overview.tsx:231-240; src/components/courses/faculty-course-home-signals.tsx:35-101`)
- Fix: Compare legacy desktop card widths and responsive mobile stacking; avoid new sticky overlay covering tab strip

## G2-8-009-046  [P2] GAP  facet F18  effort S
- Legacy: legacy failure Faculty course signals could not be loaded. You can still use the other course tabs. (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:399-409`)
- vNext now: vNext Some faculty course signals are incomplete, Unknown metrics ... not zero. (`src/components/courses/faculty-course-home-signals.tsx:37-45`)
- Fix: Use exact failure-vs-partial wording based on which source failed

## G2-8-009-045  [P3] GAP  facet F18  effort S
- Legacy: legacy faculty no-grading message No submissions pending review. Jump back into course content. (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:214-221`)
- vNext now: vNext No submitted assignments currently need grading. Continue with course content or review class health. (`src/components/courses/faculty-course-home-signals.tsx:73-78`)
- Fix: Restore exact copy if legacy wording policy is strict
