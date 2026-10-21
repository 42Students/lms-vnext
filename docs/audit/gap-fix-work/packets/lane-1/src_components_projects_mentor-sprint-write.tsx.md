# Work packet: edit src/components/projects/mentor-sprint-write.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l15-u028-superadmin-workspace-sprints.md

## G2-15-028-027  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:91-96 — updateProject once with {sprints,sprintsToken} and original workspace snapshot.
- vNext now: src/components/projects/mentor-sprint-write.tsx:43-51 and src/components/projects/mentor-sprint-details-edit.tsx:74-83 — POST /api/projects/:id/sprints and PATCH individual with expectedUpdatedAt.
- Fix: Build atomic bulk-plan endpoint with CAS token or document deliberate granularity.
