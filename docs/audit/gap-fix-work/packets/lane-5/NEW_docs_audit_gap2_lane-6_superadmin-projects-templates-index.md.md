# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/superadmin-projects-templates-index.md

4 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-projects-templates-index.md

## G2-6-029-048  [P1] GAP  facet F14  effort M
- Legacy: Legacy Export CSV downloads project-templates.csv; columns Title, Version, Lifecycle, Summary from current filtered table rows (templates/index.js:270-300).
- vNext now: vNext project-templates-page.csv; headers Title, Slug, Version, Lifecycle, Summary, only current 20 server-page rows (super-admin-template-page-export.tsx:4-17).
- Fix: Restore filename and 4-column contract; decide filtered ALL vs current-page export explicitly.

## G2-6-029-028  [P2] GAP  facet F07  effort S
- Legacy: Legacy GET failure inline Alert Templates could not be loaded with Retry (templates/index.js:242-244).
- vNext now: vNext full ErrorState Project templates unavailable with Retry loading templates link (admin/projects/templates/page.tsx:45-55).
- Fix: Keep exact inline alert and button, preserve card filters on error.

## G2-6-029-029  [P2] GAP  facet F07  effort S
- Legacy: Legacy archive failure via showProjectError fallback Failed to archive template (templates/index.js:141-149).
- vNext now: vNext local Banner error from exception or Unable to archive template (super-admin-template-archive-control.tsx:16-28).
- Fix: Restore exact fallback message and modal/toast placement.

## G2-6-029-031  [P2] GAP  facet F08  effort S
- Legacy: Legacy archive success toast Template archived; list optimistically removes row (templates/index.js:135-146).
- vNext now: vNext archives then router.refresh but has no success toast (super-admin-template-archive-control.tsx:16-23).
- Fix: Show exact Template archived success toast and update visible row/filter correctly.
