# Work packet (wave 2): edit src/modules/projects/template-subview-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u034-superadmin-template-index.md

## G2-7-034-003  [P2] GAP  facet F01  effort M
- Legacy: templates/[templateId]/index.js:17 canonical old /overview path
- vNext now: template-subview-model.ts:18-29 overview is bare /admin/projects/templates/{UUID}
- Fix: Redirect old overview and root to new canonical bare route
