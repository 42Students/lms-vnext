# Work packet: edit src/app/(authenticated)/teacher/layout.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-index.md

## G2-6-007-001  [P1] MISSING  facet F01  effort S
- Legacy: Legacy GET `/teacher` checks auth cookie then redirects to `/teacher/courses` `docs/legacy-source/frontend/src/pages/teacher/index.js:1-7`
- vNext now: New has TeacherLayout but no `/teacher` index page or redirect in config `src/app/(authenticated)/teacher/layout.tsx:1-11` `next.config.ts:7-17`
- Fix: Create `src/app/(authenticated)/teacher/page.tsx` redirect `/teacher/courses` for permitted faculty

## G2-6-007-011  [P2] GAP  facet F07  effort M
- Legacy: Old checks absence of `lms_authenticated` and redirects to `/` with no error banner `docs/legacy-source/frontend/src/pages/teacher/index.js:2-5`
- vNext now: New layout redirects to dashboard when canAccessFacultyRoute false `src/app/(authenticated)/teacher/layout.tsx:8-11`
- Fix: Differentiate anonymous and authenticated unauthorized session error destinations
