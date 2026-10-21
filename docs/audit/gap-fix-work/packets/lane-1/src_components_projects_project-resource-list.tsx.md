# Work packet: edit src/components/projects/project-resource-list.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md

## G2-16-028-013  [P1] GAP  facet F05  effort M
- Legacy: RepeatingItemEditor.jsx:87-96 reorders local array and persists only on Save; no server operation yet.
- vNext now: project-resource-list.tsx:35-69 immediately POSTs reordered IDs to `/api/projects/:id/resources/reorder`.
- Fix: Keep local unsaved reorder until section-wide save; coordinate with other edits and original token.
