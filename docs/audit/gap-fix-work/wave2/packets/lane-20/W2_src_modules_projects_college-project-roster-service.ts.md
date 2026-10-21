# Work packet (wave 2): edit src/modules/projects/college-project-roster-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md

## G2-12-028-035  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:215-225 counts unique selected already on roster before append-cap validation
- vNext now: src/modules/projects/college-project-roster-service.ts:35-39 deduplicates selected existing IDs and additions but max100 in schema
- Fix: Apply capacity to union(existing,current additions), not raw selected array

## G2-12-028-053  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:215-225 member roles FACULTY/LEARNER and workspace mentorId linkage
- vNext now: src/modules/projects/college-project-roster-service.ts:19-35 joins projectInstances/projectMembers with membership UUID roles and endedAt
- Fix: Document legacy role/User ID to projectMembers membership UUID mapping, maintain role labels

## G2-12-028-056  [P2] GAP  facet F23  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:251-260 delete confirmation only on removing old learner
- vNext now: src/components/projects/college-project-student-roster-dialog.tsx:120-123 confirmation always, including add-only; src/modules/projects/college-project-roster-service.ts:68-72 idempotent no-op
- Fix: Keep idempotent back end but restore conditional confirmation semantics
