# Work packet: NEW / MISSING items from docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md

## G2-16-028-020  [P1] GAP  facet F07  effort M
- Legacy: RepeatingItemEditor.jsx:262-274 rejects more than 500 rows with exact count; reports `Item N: Title required`.
- vNext now: validation.ts:696-727 validates individual resource only, required title and either description or URL.
- Fix: Add section-wide 500-row and per-item numbered field-error validation for a bulk editor.
