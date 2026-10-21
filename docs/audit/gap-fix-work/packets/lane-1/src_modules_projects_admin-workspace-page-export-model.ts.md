# Work packet: edit src/modules/projects/admin-workspace-page-export-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-7-036-011  [P1] GAP  facet F04  effort M
- Legacy: college-admin/projects/workspaces/index.js:402-418 five columns Workspace, Status, Progress, Mentor, Template ID
- vNext now: admin-workspace-page-export-model.ts:14-37 six columns Workspace, Mentor, Status, Progress %, Members, Last changed (IST)
- Fix: Match five ordered columns including templateId
