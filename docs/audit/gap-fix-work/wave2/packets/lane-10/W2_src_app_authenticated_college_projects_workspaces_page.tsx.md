# Work packet (wave 2): edit src/app/(authenticated)/college/projects/workspaces/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/project-workspace-model.md

## G2-4-017-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy workspace list entry can be reached by college-admin workspaces route. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectWorkspaceRepository.java:108-159`)
- vNext now: New /college/projects/workspaces redirects to /college/projects. (`src/app/(authenticated)/college/projects/workspaces/page.tsx:1-7`)
- Fix: Preserve deep-linked workspace filters and old breadcrumb/tab semantics.
