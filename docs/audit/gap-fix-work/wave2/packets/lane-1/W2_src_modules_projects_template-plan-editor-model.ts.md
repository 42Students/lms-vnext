# Work packet (wave 2): edit src/modules/projects/template-plan-editor-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-template-tasks.md

## G2-10-029-018  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:87-94 — move row up/down across whole task array.
- vNext now: src/modules/projects/template-plan-editor-model.ts:26-42 — reordering only within same sprint group.
- Fix: Decide whether reorder across backlog/sprints; expose group constraints.

## G2-10-029-039  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:295-346 — key materialized from title with numeric collision suffix.
- vNext now: src/modules/projects/template-plan-editor-model.ts:75-81 — new task key task-N, schema requires explicit kebab-case key.
- Fix: Reproduce slug and duplicate resolution.
