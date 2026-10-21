# Work packet (wave 2): edit src/app/api/college/companies/export/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-companies.md

## G2-9-004-062  [P2] GAP  facet F14  effort M
- Legacy: Export fields id,name,industry,website,contact,driveCount,isDeleted (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:353-370`)
- vNext now: Exports college company relationship CSV via collegeCompanyCsv (`src/app/api/college/companies/export/route.ts:6-22`)
- Fix: Compare exact header/order including contact fields; preserve needed exports.
