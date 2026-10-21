# Work packet: edit src/components/projects/mentor-sprint-details-edit.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l15-u028-superadmin-workspace-sprints.md

## G2-15-028-008  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:26-69,82-88 — dueLabel, title, goal, releaseKey, description and generated key.
- vNext now: src/components/projects/mentor-sprint-details-edit.tsx:16-24,101-130 — title, description, goal, definitionOfDone, start/end/dueDate; no dueLabel/key.
- Fix: Provide legacy dueLabel/key mapping and readable release selection.

## G2-15-028-027  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:91-96 — updateProject once with {sprints,sprintsToken} and original workspace snapshot.
- vNext now: src/components/projects/mentor-sprint-write.tsx:43-51 and src/components/projects/mentor-sprint-details-edit.tsx:74-83 — POST /api/projects/:id/sprints and PATCH individual with expectedUpdatedAt.
- Fix: Build atomic bulk-plan endpoint with CAS token or document deliberate granularity.

## G2-15-028-048  [P1] GAP  facet F20  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:81-96 — sprintsToken prevents cross-editor lost updates.
- vNext now: src/components/projects/mentor-sprint-details-edit.tsx:74-83 — CAS per sprint updatedAt, no plan-level CAS.
- Fix: Implement plan-level optimistic guard for atomic reorder/replace.

## G2-15-028-051  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:92-96 — updateProject accepts whole sprint array token.
- vNext now: src/components/projects/mentor-sprint-details-edit.tsx:74-83 — per-sprint write model title/goal/dates/updatedAt.
- Fix: Preserve all fields and bulk ordering or archive legacy plan representations.

## G2-15-028-019  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:81-86 — validateRepeatingItems fields, row errors.
- vNext now: src/components/projects/mentor-sprint-details-edit.tsx:61-65 — generic Enter changed sprint details within field limits.
- Fix: Restore field/row-specific validation.

## G2-15-028-022  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:86-89 — unchanged submit shows No changes to save info.
- vNext now: src/components/projects/mentor-sprint-details-edit.tsx:37-64 — unchanged edit validation generic field limits error.
- Fix: Use source no-change info for unchanged plan.

## G2-15-028-021  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:104-105 — Failed to update sprints via project error modal.
- vNext now: src/components/projects/mentor-sprint-details-edit.tsx:88-91 — Sprint update failed toast and inline error.
- Fix: Preserve source failure copy.

## G2-15-028-023  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:96-103 — Sprints updated toast and refetch with no blank edit gap.
- vNext now: src/components/projects/mentor-sprint-details-edit.tsx:84-87 — Sprint details updated toast; router.refresh.
- Fix: Restore exact success copy and stable list during refresh.
