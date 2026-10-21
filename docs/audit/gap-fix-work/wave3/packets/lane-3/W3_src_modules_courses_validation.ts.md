# Work packet (wave 3): edit src/modules/courses/validation.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/l18-u018-lesson.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md

## G2-18-018-016  [P1] MISSING  facet F06  effort L
- Legacy: Legacy update can move lesson to a different course, with content following subject to class-specific check (`LessonServiceImpl.java:273-326`).
- vNext now: `src/modules/courses/validation.ts:265-288` update only name/description/sequence; `lesson-service.ts:196-215` keeps same path.
- Fix: Implement guarded move between eligible paths/courses or document intentional exclusion; reject class-targeted content with exact conflict copy.

## G2-18-003-041  [P1] MISSING  facet F06  effort L
- Legacy: Legacy Visible to students Switch ON default, warning when hidden. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:549-554`
- vNext now: vNext Create course has no visibility state; new status ACTIVE by default. `src/modules/courses/validation.ts:28-45`, `src/db/schema/courses.ts:51-54`
- Fix: Provide create-time visible switch and equivalent warning, map OFF to hidden status without deleting.
