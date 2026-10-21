# Work packet: edit src/components/projects/project-audit-page-export.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-7-036-012  [P1] GAP  facet F04  effort M
- Legacy: superadmin/projects/audit/index.js:590-609 five columns Action, Entity type, Entity ID, Actor, When
- vNext now: project-audit-page-export.tsx:6-12 six cols Event ID, Action, Entity, Summary, Importance, Occurred at
- Fix: Export underlying event rows with actor and ID as legacy

## G2-7-036-017  [P1] GAP  facet F05  effort L
- Legacy: superadmin/projects/audit/index.js:590-609 raw event export
- vNext now: project-audit-page-export.tsx:4-9 grouped event summaries exported
- Fix: Export raw events or provide separate ungrouped parity export
