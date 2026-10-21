# Work packet: edit src/app/api/projects/[projectId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md

## G2-2-020-023  [P1] GAP  facet F06  effort M
- Legacy: ProjectWorkspaceUpdateDTO.java:9-48 fields plus section tokens
- vNext now: src/app/api/projects/[projectId]/route.ts:35-42 PATCH only summary
- Fix: Map whole legacy update contract to section-specific versioned APIs.
