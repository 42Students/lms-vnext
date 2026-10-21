# Work packet (wave 2): edit src/components/projects/project-template-view.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

## G2-7-035-017  [P2] GAP  facet F04  effort L
- Legacy: overview.js:193-215 parses raw JSON overview and delivery fields with preserved unknown keys
- vNext now: project-template-view.tsx:56-65 only object blueprint, cannot parse raw JSON string
- Fix: Normalize stringified legacy JSON and preserve extra overview facts

## G2-7-035-020  [P2] GAP  facet F05  effort M
- Legacy: overview.js:128-151 preview modal Sprints/Tasks/Resources tags or structured values
- vNext now: project-template-view.tsx:93-111 sections as list articles
- Fix: Restore preview modal with three compact item sections and empty placeholders

## G2-7-035-060  [P2] GAP  facet F16  effort M
- Legacy: overview.js:761-795 preview Modal width820 with responsive content
- vNext now: project-template-view.tsx:68-111 inline content only
- Fix: Restore modal width, scroll and mobile fallback
