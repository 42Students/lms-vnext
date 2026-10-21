# Work packet: edit src/components/projects/project-admin-workspace-list.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-5/u028-superadmin-projects-section.md, docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md

## G2-10-028-007  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:219-235 — gold clickable No template — attach one tag.
- vNext now: src/components/projects/project-admin-workspace-list.tsx:85-88 — missing template is inert text.
- Fix: Add click and keyboard attach-template action.

## G2-10-028-013  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:244-248; docs/legacy-source/frontend/src/components/admin/projects/adminProjectUtils.js:92-108 — ACTIVE/IN_PROGRESS/READY/BLOCKED/ARCHIVED statuses humanized.
- vNext now: src/components/projects/project-admin-workspace-list.tsx:29-39,90-91 — planned/active/completed/archived and derived blocker.
- Fix: Map status lifecycle and colors.

## G2-5-028-007  [P1] MISSING  facet F03  effort M
- Legacy: Legacy actions per row: View, Assign Mentor, Assign Learners, Archive, Delete. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:523-590`
- vNext now: vNext list only Open and Archive; mentor/learner management is separate, Delete absent. `src/components/projects/project-admin-workspace-list.tsx:101-107,128-131`
- Fix: Restore per-row mentor assignment, learners assignment and soft-delete actions.

## G2-5-028-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy 8 table columns Project, Course, Mentor, Phase, Progress, Status, Due, Actions. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:523-551`
- vNext now: vNext 6 columns Workspace, Mentor, Status, Progress, Members, Action. `src/components/projects/project-admin-workspace-list.tsx:84-108`
- Fix: Reintroduce Course, Phase and Due columns and original order.

## G2-5-028-015  [P1] GAP  facet F04  effort M
- Legacy: Legacy status stored as arbitrary uppercase status and displayed as readable words. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:34-46`
- vNext now: vNext status enum PLANNED/ACTIVE/COMPLETED/ARCHIVED, labels from current enum. `src/modules/projects/admin-projects-query-model.ts:10-16`, `src/components/projects/project-admin-workspace-list.tsx:29-51`
- Fix: Translate legacy IN_PROGRESS/NOT_STARTED/BLOCKED/DONE to vNext states and preserve blockers.

## G2-5-028-037  [P1] MISSING  facet F09  effort M
- Legacy: Legacy Assign Mentor modal with Select remote search and Role label `Project Mentor`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:715-753`
- vNext now: vNext list has no inline mentor modal; team membership editor elsewhere. `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Offer assign modal or reachable inline action linked to Team.

## G2-5-028-038  [P1] GAP  facet F09  effort M
- Legacy: Legacy Assign Learners 760px modal with replaceExisting checkbox. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:755-798`
- vNext now: vNext create checklist for learners, not replace-existing modal on list. `src/components/projects/project-create-control.tsx:340-359`, `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Restore replace-existing selected-member confirmation.

## G2-5-028-046  [P1] GAP  facet F10  effort M
- Legacy: Legacy archive and soft-delete POST, restore supported. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:399-465`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:555-630`
- vNext now: vNext project status + archive, delete lifecycle not exposed in admin listing. `src/components/projects/project-admin-workspace-list.tsx:101-107`, `src/modules/projects/instance-service.ts:148-167`
- Fix: Preserve soft delete/restore semantics and historical visibility.

## G2-5-028-074  [P1] GAP  facet F22  effort M
- Legacy: Legacy separate archive vs soft delete/restore statuses. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:555-630`
- vNext now: vNext projectInstances ARCHIVED status and member endedAt/soft relations, legacy delete action not in mapped list. `src/db/schema/projects.ts:1-110`, `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Specify deleted_at equivalent and archived/unarchived states.

## G2-5-028-077  [P1] GAP  facet F23  effort M
- Legacy: Legacy explicit replace learner roster action guarded by named confirmation. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:299-328`
- vNext now: vNext list omits replace action; team page not a direct parity affordance. `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Restore direct replace UX or visible route with exact warning.

## G2-7-019-013  [P1] GAP  facet F03  effort S
- Legacy: workspaces/index.js:219-236 interactive amber `No template — attach one` Tag
- vNext now: project-admin-workspace-list.tsx:85-88 text-only template label
- Fix: Make no-template prompt keyboard-clickable to summary template dialog.

## G2-7-019-044  [P1] MISSING  facet F09  effort S
- Legacy: workspaces/index.js:219-236 No template Tag navigates to `summary?openTemplate=1`
- vNext now: project-admin-workspace-list.tsx:85-88 Tag plain span
- Fix: Restore navigation/auto-open attach-template modal per workspace.

## G2-7-019-071  [P1] GAP  facet F17  effort S
- Legacy: workspaces/index.js:219-235 template Tag role=button tabIndex=0 Enter/Space
- vNext now: project-admin-workspace-list.tsx:85-88 passive span prompt
- Fix: Restore focusable keyboard activation and accessible label on attach-template prompt.

## G2-5-028-031  [P2] GAP  facet F07  effort M
- Legacy: Legacy archive/delete errors retain retry button with descriptive failure. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:629-650`
- vNext now: vNext archive action error feedback is separate and no Delete error state. `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Match retry on destructive actions and preserve prior rows on failed reload.

## G2-5-028-033  [P2] GAP  facet F08  effort M
- Legacy: Legacy mentor success `Mentor assigned successfully`; learner success `Learners assigned successfully`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:282-285,355-358`
- vNext now: vNext team actions not inline; list offers no matching toast. `src/modules/projects/member-service.ts:69-119`, `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Keep exact success messaging with list refresh.

## G2-5-028-034  [P2] GAP  facet F08  effort M
- Legacy: Legacy archive/delete toasts `Project archived`/`Project deleted`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:416-425`
- vNext now: vNext archive has separate control; delete toast absent from list. `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Add delete receipt or approved deletion policy.
