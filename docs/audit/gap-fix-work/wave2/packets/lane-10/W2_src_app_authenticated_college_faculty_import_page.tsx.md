# Work packet (wave 2): edit src/app/(authenticated)/college/faculty/import/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/college-admin-teachers.md

## G2-6-001-058  [P2] GAP  facet F16  effort M
- Legacy: Old registration cards half-width at lg and full-width at xs `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:975-981` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1110-1114`
- vNext now: New modal grid becomes two columns at md and import is another page `src/components/admin/person-onboard-dialog.tsx:150-164` `src/app/(authenticated)/college/faculty/import/page.tsx:15-20`
- Fix: Match card/panel stacking and desktop 50/50 layout
