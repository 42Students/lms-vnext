# Work packet: edit src/components/courses/admin-course-actions.tsx (part 2 of 2)

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-3/college-admin-courses.md, docs/audit/gap2/lane-4/superadmin-faculty-assignment.md, docs/audit/gap2/lane-6/course-home-edit-drawer.md

## G2-18-003-045  [P2] GAP  facet F07  effort S
- Legacy: Legacy Course Name validation `Enter a course name` and `Maximum 255 characters`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:46-49`
- vNext now: vNext schema min1 max255, generic validation error text via API model. `src/modules/courses/validation.ts:11-15`, `src/components/courses/admin-course-actions.tsx:196-205`
- Fix: Translate field errors into exact copy and inline location.

## G2-18-003-047  [P2] GAP  facet F07  effort M
- Legacy: Legacy duplicate/delete/create errors shown field-level via applyServerFieldErrors, Alert Course was not created/edited/deleted. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:363-381`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:546-550`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:572-574`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:644-647`
- vNext now: vNext API errors mapped by academicSetupErrorMessage and toast `Course update failed`. `src/components/courses/admin-course-actions.tsx:34-64`, `src/modules/courses/course-service.ts:51-126`
- Fix: Render per-field errors and exact Alert headings in appropriate form/list.

## G2-18-003-048  [P2] GAP  facet F07  effort S
- Legacy: Legacy delete dependency failed shows `Course was not deleted` with Retry delete. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:387-402`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:572-574`
- vNext now: vNext Archive Course requires no active offering, shows own confirm description. `src/components/courses/admin-course-actions.tsx:254-260`
- Fix: Show dependency-specific Retry after refresh and accurate blocked reason.

## G2-18-003-052  [P2] GAP  facet F08  effort S
- Legacy: Legacy delete success `Deleted course “NAME”.`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:387-402`
- vNext now: vNext archive action toasts different label/semantics. `src/components/courses/admin-course-actions.tsx:254-260`, `src/app/api/courses/[courseId]/route.ts:43-65`
- Fix: Use accurate `Archived course “NAME”.` confirmation and retention detail.

## G2-3-008-035  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:545-548`
- vNext now: `src/components/courses/admin-course-actions.tsx:34-61`
- Fix: Legacy create error Alert `Course was not created` dismissible, vNext toast `Course update failed` and generic description.

## G2-3-008-037  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:571-574`
- vNext now: `src/components/courses/admin-course-actions.tsx:34-61`
- Fix: Old failed delete alert `Course was not deleted` + Retry delete; vNext toast and Archive can differ.

## G2-3-008-039  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:355-370`
- vNext now: `src/components/courses/admin-course-actions.tsx:34-61`
- Fix: Legacy update toast `Updated course “<name>”.`, new generic `Course update failed`/success action title and archive phrasing.

## G2-3-008-040  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:387-405`
- vNext now: `src/components/courses/admin-course-actions.tsx:34-61`
- Fix: Legacy delete success `Deleted course “<name>”.`, new archive success differs. Ensure exact lifecycle semantics.

## G2-4-008-034  [P2] GAP  facet F08  effort M
- Legacy: Updated toast `Updated assignment #ID.`; Delete `Deleted assignment #ID.`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:279-286;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:319-327`)
- vNext now: Edit role closes without success notice; End toast `Teaching assignment removed; history retained.`. (`src/components/admin/super-admin-faculty-assignment-create.tsx:133-148;src/components/courses/admin-course-actions.tsx:566-575`)
- Fix: Restore mutation ID/copy for equivalent actions and nonblocking toast.

## G2-4-008-035  [P2] GAP  facet F08  effort M
- Legacy: Delete failure banner `Teaching assignment was not deleted` with Retry delete. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:319-337;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:492-494`)
- vNext now: New generic course action toast error, no corresponding roster retry delete. (`src/components/courses/admin-course-actions.tsx:566-575`)
- Fix: Add retryable per-row deletion error.

## G2-6-009-016  [P2] GAP  facet F07  effort S
- Legacy: Old title blank error exact `Enter Course name` (lowercase name) `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/HomeEditDrawer.js:38-45`
- vNext now: New Save simply disabled when !name.trim(), error toast on API failure `src/components/courses/admin-course-actions.tsx:159-163` `src/components/courses/admin-course-actions.tsx:54-59`
- Fix: Show legacy field-level error when attempting invalid Save

## G2-6-009-017  [P2] GAP  facet F07  effort S
- Legacy: Old info blank error exact `Enter Course info` `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/HomeEditDrawer.js:54-61`
- vNext now: New description can be blank/null, no required validation `src/components/courses/admin-course-actions.tsx:171-179`
- Fix: Add exact required message only if restoring historical stub form semantics

## G2-18-003-049  [P3] GAP  facet F08  effort S
- Legacy: Legacy duplicate starts `Duplicating “NAME” — review the copy before creating it.` info toast. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:306-323`
- vNext now: vNext duplicate href prefills via URL, no explicit info toast apparent. `src/components/courses/admin-course-actions.tsx:136-140`, `src/components/courses/admin-course-create-panel.tsx:111-129`
- Fix: Show duplicate intro toast and Cancel copy button with focus management.

## G2-6-009-020  [P3] GAP  facet F08  effort S
- Legacy: Old info message uses `message.info`, duration inherited from Ant Message `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/HomeEditDrawer.js:9-13`
- vNext now: New showToast tone success from useToast `src/components/courses/admin-course-actions.tsx:44-52`
- Fix: Compare notification placement/duration only if dormant drawer reinstated
