# Work packet: edit src/components/projects/template-metadata-edit-control.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

## G2-7-035-023  [P1] MISSING  facet F06  effort M
- Legacy: overview.js:612-625 Title required, courseLabel max160, phase max80
- vNext now: template-metadata-edit-control.tsx:43-48 title max200, summary only
- Fix: Reintroduce courseLabel and phase fields or versioned update UI

## G2-7-035-040  [P1] GAP  facet F10  effort L
- Legacy: overview.js:270-303 updateProjectTemplate sends full overview/delivery and preserves untouched unknown keys
- vNext now: template-metadata-edit-control.tsx:25-31 PATCH /api/projects/templates/{id}/metadata only title/summary
- Fix: Expose versioned template blueprint revision endpoint for full Overview fields

## G2-7-035-047  [P1] GAP  facet F11  effort M
- Legacy: overview.js:183 useUnsavedFormGuard on form
- vNext now: template-metadata-edit-control.tsx:40-59 Dialog can close without dirty confirmation
- Fix: Implement dirty editor guard across close, tabs and refresh

## G2-7-035-061  [P1] GAP  facet F17  effort M
- Legacy: overview.js:183 dirty guard prevents keyboard navigation away with unsaved changes
- vNext now: template-metadata-edit-control.tsx:40-59 Dialog close without dirty confirm
- Fix: Add beforeunload and in-app tab guard for editor

## G2-7-035-076  [P1] GAP  facet F22  effort L
- Legacy: overview.js:277-302 overview unknown facts preserved, delivery instructions cleared explicitly
- vNext now: template-metadata-edit-control.tsx:26-29 metadata-only PATCH, blueprint unchanged
- Fix: Add versioned overview blueprint edit without destroying unknown fields

## G2-7-035-028  [P2] MISSING  facet F07  effort M
- Legacy: overview.js:600-607 Template slug is required/max80/pattern exact error
- vNext now: template-metadata-edit-control.tsx:43-48 slug not editable, title max200
- Fix: Match explicit validation/errors if slug edit restored

## G2-7-035-032  [P2] GAP  facet F08  effort S
- Legacy: overview.js:303 Overview saved toast
- vNext now: template-metadata-edit-control.tsx:30 Template metadata revised toast
- Fix: Use legacy save wording when Overview changes (not just metadata)
