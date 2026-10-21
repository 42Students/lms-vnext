# Work packet (wave 2): edit src/modules/projects/admin-workspace-page-export-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md

## G2-7-019-064  [P2] GAP  facet F14  effort S
- Legacy: workspaces/index.js:402-418 five CSV headings Workspace, Status, Progress, Mentor, Template ID
- vNext now: admin-workspace-page-export-model.ts:14-37 six headings Workspace, Mentor, Status, Progress %, Members, Last changed (IST)
- Fix: Match exact five-column ordered export including templateId; do not substitute metadata.
