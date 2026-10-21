# Work packet: edit src/modules/projects/instance-restore-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md, docs/audit/gap2/lane-3/l18-u017-project-member-entity.md, docs/audit/gap2/lane-7/l17-u031-projects-end-to-end.md

## G2-2-020-011  [P1] GAP  facet F03  effort M
- Legacy: Legacy frontend workspaces/deleted.js:83-89 warns mentor may not recover on restore
- vNext now: src/modules/projects/instance-restore-service.ts:33-42 rejects restore if no active primary mentor
- Fix: Expose mentor-missing condition and recovery guidance; reconcile reject-versus-blocked behavior.

## G2-11-028-025  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:69-75`
- vNext now: `src/modules/projects/instance-restore-service.ts:30-42`
- Fix: Legacy restore can return BLOCKED due to missing mentor and warns to assign one; vNext refuses restoration unless active primary mentor exists, surfaces PROJECT_INVALID_STATE.

## G2-11-028-041  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:70-74`
- vNext now: `src/modules/projects/instance-restore-service.ts:43-54`
- Fix: Legacy soft-deleted workspace restores to BLOCKED mentorless if membership missing; vNext ARCHIVED returns PLANNED/ACTIVE/COMPLETED previous status only when primary mentor is active.

## G2-11-028-071  [P1] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:69-83`
- vNext now: `src/modules/projects/instance-restore-service.ts:15-76`
- Fix: Legacy destructive delete/restore semantics require product decision or explicit separate UI; do not silently claim archive/restore is parity.

## G2-18-017-050  [P1] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:38-39`
- vNext now: `src/modules/projects/instance-restore-service.ts:33-42`
- Fix: Workspace deletion owner-marked members not restored with old deletedByWorkspace semantics; explicit migration/business decision.

## G2-17-031-029  [P1] GAP  facet F10  effort M
- Legacy: LBE/controller/AdminProjectController.java:555-630 Archive/Delete/Restore separate lifecycle operations.
- vNext now: V/modules/projects/instance-service.ts:39-41 and instance-restore-service.ts:1-100 manage archived restoration.
- Fix: Verify distinct archive vs delete semantics and exact restoration of membership.
