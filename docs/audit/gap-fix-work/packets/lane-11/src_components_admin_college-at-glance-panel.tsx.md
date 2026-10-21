# Work packet: edit src/components/admin/college-at-glance-panel.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-dashboard.md, docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-10-005-030  [P2] GAP  facet F08  effort S
- Legacy: Old summary error banner Couldn't load college summary; refresh failed warning and Retry `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:61-73`
- vNext now: New summary uses COLLEGE_GLANCE_LOAD_ERROR or REFRESH_ERROR and error alert; Retry always visible `src/components/admin/college-at-glance-panel.tsx:17-53`
- Fix: Align exact old failure/retry copy and show retry only per meaningful state

## G2-9-035-030  [P2] GAP  facet F08  effort S
- Legacy: Old summary error banner Couldn't load college summary; refresh failed warning and Retry `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:61-73`
- vNext now: New summary uses COLLEGE_GLANCE_LOAD_ERROR or REFRESH_ERROR and error alert; Retry always visible `src/components/admin/college-at-glance-panel.tsx:17-53`
- Fix: Align exact old failure/retry copy and show retry only per meaningful state

## G2-9-035-099  [P2] GAP  facet F08  effort S
- Legacy: Old scoped Summary refresh failure 'Summary refresh failed', last successful totals `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:61-73`
- vNext now: New error Alert and 'Showing the last available college summary.' `src/components/admin/college-at-glance-panel.tsx:43-53`
- Fix: Match both original strings and warning tone.
