# Work packet (wave 2): edit src/modules/projects/project-resource-audit-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md, docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-4-029-008  [P2] GAP  facet F03  effort S
- Legacy: Actions Saved/Added/Edited/Removed colored AntD Tag (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:7-12`)
- vNext now: Classifies resource events but feed not action-tag rendered (`src/modules/projects/project-resource-audit-model.ts:2-10`)
- Fix: Map four statuses to legacy badge colors.

## G2-4-029-038  [P2] GAP  facet F12  effort S
- Legacy: Edited count includes UPDATE and UPSERT; Removed counts DELETE; Added CREATE (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:56-61`)
- vNext now: New event mapping only updated/edited => Edited, saved=>Saved (`src/modules/projects/project-resource-audit-model.ts:6-10`)
- Fix: Aggregate Saved under Edited metric as legacy.

## G2-4-029-039  [P2] GAP  facet F12  effort S
- Legacy: Unknown action fallback uses raw action text (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:18-29`)
- vNext now: Unknown event types return null (`src/modules/projects/project-resource-audit-model.ts:3-10`)
- Fix: Preserve raw unknown action values in audit history.

## G2-15-017-015  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:121-132 ALL CREATE UPDATE UPSERT DELETE selection
- vNext now: src/modules/projects/project-resource-audit-model.ts:3-14 derived Added/Edited/Saved/Removed categories
- Fix: Preserve raw actions and exact action options

## G2-15-017-019  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:31-34,121-132 ALL default, five fixed options
- vNext now: src/modules/projects/project-resource-audit-model.ts:12-14 derived filter model only
- Fix: Use fixed original action-select values, independent of global filters

## G2-15-017-040  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:125-131 Saved and Edited distinct labels
- vNext now: src/modules/projects/project-resource-audit-model.ts:3-11 derived activity labels may collapse UPSERT
- Fix: Keep UPSERT as separate Saved filter/tag
