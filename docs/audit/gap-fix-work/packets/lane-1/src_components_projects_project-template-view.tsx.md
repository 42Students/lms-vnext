# Work packet: edit src/components/projects/project-template-view.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

## G2-7-035-029  [P1] GAP  facet F07  effort M
- Legacy: overview.js:666-671 Add at least one deliverable. on empty
- vNext now: project-template-view.tsx:80-83 list read-only; publish server gate
- Fix: Show required deliverable validation in matching form before Publish

## G2-7-035-075  [P1] GAP  facet F22  effort L
- Legacy: overview.js:193-215 legacy template stores scalar courseLabel/phase/status/lifecycleStatus, overview JSON and delivery JSON
- vNext now: template-service.ts:111-155 versioned blueprint, project-template-view.tsx:3-34 only overview/release/task/resource
- Fix: Define field-to-blueprint migration including submission settings and raw enum preservation
