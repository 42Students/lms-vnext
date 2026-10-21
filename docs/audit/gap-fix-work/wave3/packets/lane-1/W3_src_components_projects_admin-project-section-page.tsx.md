# Work packet (wave 3): edit src/components/projects/admin-project-section-page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l13-u028-superadmin-workspace-tasks.md

## G2-13-028-035  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:58-63 updateProject(workspaceId,collegeId,{tasks,tasksToken})
- vNext now: src/components/projects/admin-project-section-page.tsx:38-47 GET workspace view and no bulk write in route
- Fix: Implement authorized transactional admin task-plan mutation with CAS token.
