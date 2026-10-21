# Work packet (wave 3): edit src/components/projects/project-workspace.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l15-u028-superadmin-workspace-sprints.md, docs/audit/gap2/lane-2/l13-u028-superadmin-workspace-tasks.md, docs/audit/gap2/lane-7/u027-mentor-project-detail.md, docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md

## G2-15-028-052  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:25-30,33-103 — legacy distinct Sprint plan editor with metrics, retry and reorder.
- vNext now: src/components/projects/project-workspace.tsx:835-966 — vNext per-release CRUD, no bulk plan editor.
- Fix: Add Super Admin sprint-plan editor maintaining legacy visual/functional parity.

## G2-13-028-009  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:100-103 Save task plan action
- vNext now: src/components/projects/project-workspace.tsx:971-983 MentorTaskCreate only when mode MENTOR
- Fix: Add explicit ADMIN task plan authoring/save workflow; don't grant via mentor UI automatically.

## G2-13-028-010  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:92-97 Add task dynamic repeating editor
- vNext now: src/components/projects/project-workspace.tsx:1011-1026 shows existing tasks under sprint, no ADMIN bulk add
- Fix: Restore bulk Add task and row edit/reorder controls for authorized admin.

## G2-13-028-066  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:90-105 legacy ADMIN bulk plan editor
- vNext now: src/components/projects/project-workspace.tsx:1011-1142 ADMIN read-only task rows; Mentor-only creation at :971-983
- Fix: Owner decision: restore exact admin bulk planning or intentionally retire with replacement workflow.

## G2-7-027-031  [P1] MISSING  facet F06  effort L
- Legacy: PDC:9632-9651 role label required and Error Role is required
- vNext now: project-workspace.tsx:401-470 mentor member edit absent
- Fix: Document intentional admin-only role mutation and lost mentor validation

## G2-7-027-032  [P1] MISSING  facet F06  effort L
- Legacy: PDC:9671-9732 Add member Member type Learner/Faculty, Person required, optional display name/role
- vNext now: project-workspace.tsx:401-470 mentor Add member absent
- Fix: Restore action or cite owner decision for removing mentor membership management

## G2-7-027-036  [P1] MISSING  facet F07  effort L
- Legacy: PDC:9633 Role is required; :9693-9712 select person required and No matches
- vNext now: project-workspace.tsx:401-470 mentor member form not available
- Fix: Record missing form errors or restore member editor with matching messages

## G2-7-027-045  [P1] MISSING  facet F09  effort L
- Legacy: PDC:9611-9653 Edit member role modal width760 named user
- vNext now: project-workspace.tsx:401-470 mentor actions absent
- Fix: Record owner decision or expose editable role dialog

## G2-7-027-046  [P1] MISSING  facet F09  effort L
- Legacy: PDC:9654-9734 Add team member modal width520 with searchable person
- vNext now: project-workspace.tsx:401-470 mentor actions absent
- Fix: Record owner decision or expose scoped add dialog

## G2-7-027-049  [P1] MISSING  facet F10  effort L
- Legacy: PDC:9671-9734 member add/edit/remove via project API
- vNext now: project-workspace.tsx:401-470 member controls admin-only
- Fix: List removed mentor endpoints and cite explicit owner decision

## G2-7-027-067  [P1] MISSING  facet F15  effort L
- Legacy: PDC:9671-9734 mentor member edits/adds trigger role notifications
- vNext now: project-workspace.tsx:401-470 mentor membership writes absent
- Fix: Record intentional role restriction and affected notifications

## G2-7-027-096  [P1] MISSING  facet F23  effort L
- Legacy: PDC:7109-7146 mentor add/edit/remove member
- vNext now: project-workspace.tsx:401-470 mentor member management intentionally admin-only
- Fix: Explicitly document product permission change and displaced workflow

## G2-12-028-030  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/workspaceRowMeta.jsx:149-164 reconcileProjectTeam service and reload
- vNext now: src/components/projects/project-workspace.tsx:725-730 text only, no API call
- Fix: Add role-scoped 'Check roster' reconciliation endpoint plus audit event
