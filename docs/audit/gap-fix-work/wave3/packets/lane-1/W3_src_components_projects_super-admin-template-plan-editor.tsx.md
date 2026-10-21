# Work packet (wave 3): edit src/components/projects/super-admin-template-plan-editor.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-template-tasks.md

## G2-10-029-011  [P1] MISSING  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:90-142 — fields Key, Priority, Title, Sprint, Estimate, Type, Due, Description, Done when, Approach.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:220-260 — key/sprint/title/priority/estimate/description/criteria; missing Type/Due/Approach.
- Fix: Extend blueprint/task schema and editor to persist Type, Due, Approach.

## G2-10-029-058  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:118-127 and docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:90-142 — backlog tasks and Type/Due/Approach available.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:211-260 — capabilities dropped with no migration rationale in code.
- Fix: Restore fields and backlog or record owner-approved removal.
