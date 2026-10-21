# Work packet (wave 2): edit src/components/projects/project-audit-page-export.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u030-superadmin-project-audit.md, docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-7-030-012  [P2] GAP  facet F03  effort S
- Legacy: audit/index.js:585-614 Export CSV small DownloadOutlined action
- vNext now: project-audit-page-export.tsx:14-17 Export shown audit groups · CSV no Download icon
- Fix: Use exact Export CSV wording/icon/size

## G2-7-030-056  [P2] GAP  facet F14  effort M
- Legacy: audit/index.js:590-609 exports page rows as Action, Entity type, Entity ID, Actor, When
- vNext now: project-audit-page-export.tsx:6-16 Event ID, Action, Entity, Summary, Importance, Occurred at from groups
- Fix: Match exact five ordered CSV fields and raw row values

## G2-7-030-069  [P2] GAP  facet F18  effort S
- Legacy: audit/index.js:612 Export CSV
- vNext now: project-audit-page-export.tsx:16 Export shown audit groups · CSV
- Fix: Restore exact visible export copy

## G2-7-036-009  [P2] GAP  facet F03  effort S
- Legacy: superadmin/projects/audit/index.js:585-614 Export CSV compact header button
- vNext now: project-audit-page-export.tsx:14-17 Export shown audit groups · CSV
- Fix: Show exact visible label and action position
