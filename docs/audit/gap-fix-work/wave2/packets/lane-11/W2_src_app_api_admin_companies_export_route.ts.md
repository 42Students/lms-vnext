# Work packet (wave 2): edit src/app/api/admin/companies/export/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-companies-college.md

## G2-10-004-063  [P2] GAP  facet F14  effort M
- Legacy: Old college CSV exports all client-filtered records with contacts, industry, driveCount `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:385-406`
- vNext now: New export endpoint streams up to 2000 filtered relationship records without private contact columns `src/app/api/admin/companies/export/route.ts:7-28`
- Fix: Document authorized contact export difference and whether legacy export can be replicated securely

## G2-9-033-036  [P2] GAP  facet F14  effort M
- Legacy: Old college CSV exports all client-filtered records with contacts, industry, driveCount `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:385-406`
- vNext now: New export endpoint streams up to 2000 filtered relationship records without private contact columns `src/app/api/admin/companies/export/route.ts:7-28`
- Fix: Document authorized contact export difference and whether legacy export can be replicated securely

## G2-10-004-064  [P3] GAP  facet F14  effort S
- Legacy: Legacy Export CSV disabled if no matches and filenames companies.csv `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:385-407`
- vNext now: New export link always enabled; filename companies.csv `src/app/(authenticated)/admin/companies/page.tsx:225-229` `src/app/api/admin/companies/export/route.ts:20-27`
- Fix: Disable empty exports and label maximum 2000 rows clearly

## G2-9-033-037  [P3] GAP  facet F14  effort S
- Legacy: Legacy Export CSV disabled if no matches and filenames companies.csv `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:385-407`
- vNext now: New export link always enabled; filename companies.csv `src/app/(authenticated)/admin/companies/page.tsx:225-229` `src/app/api/admin/companies/export/route.ts:20-27`
- Fix: Disable empty exports and label maximum 2000 rows clearly
