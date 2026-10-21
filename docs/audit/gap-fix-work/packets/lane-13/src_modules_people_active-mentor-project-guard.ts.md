# Work packet: edit src/modules/people/active-mentor-project-guard.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md, docs/audit/gap2/lane-1/super-admin-user-admin-controller.md

## G2-1-001-015  [P1] GAP  facet F07  effort S
- Legacy: `AdminUserLifecycleController.java:122-125` returns 409 with full sentence in both `error` and `message` when active mentor projects remain.
- vNext now: `active-mentor-project-guard.ts:21-24` constructs same sentence but `college-faculty-lifecycle-service.ts:66-68` throws code; `route.ts:21-25` emits `FACULTY_HAS_ACTIVE_PROJECTS`; client `college-faculty-lifecycle-action.tsx:50-52` shows generic teaching-responsibilities error.
- Fix: Surface exact active-mentor count and legacy action guidance to faculty admin UI; return structured code and human message.

## G2-1-001-030  [P1] GAP  facet F12  effort M
- Legacy: `AdminUserLifecycleController.java:113-127` checks faculty projects with `findProjectIdsForUser` and non-ARCHIVED active workspaces.
- vNext now: `active-mentor-project-guard.ts:10-18` checks role MENTOR, endedAt null and project status exactly ACTIVE.
- Fix: Verify legacy active-project inclusion and role variants against workspace states; align guard where 'active' means not ARCHIVED.

## G2-1-007-025  [P1] GAP  facet F07  effort M
- Legacy: `SuperAdminUserAdminController.java:242-246` mentor project guard detailed 409 including active count.
- vNext now: `src/modules/people/active-mentor-project-guard.ts:10-24` similar guard; generic membership UI may hide count.
- Fix: Surface exact active project count and reassignment remedy.
