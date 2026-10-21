# Work packet (wave 3): edit src/components/projects/template-metadata-edit-control.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

## G2-7-035-022  [P1] MISSING  facet F06  effort L
- Legacy: overview.js:597-609 slug required max80 regex lowercase-hyphen
- vNext now: template-metadata-edit-control.tsx:42-56 only title, summary, change note (slug not editable)
- Fix: Decide immutable slug policy and explicitly list loss of overview slug editing
