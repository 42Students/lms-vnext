# Work packet: edit src/components/admin/super-admin-company-edit.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-companies-college.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-10-004-035  [P1] GAP  facet F07  effort M
- Legacy: Old industry max100 description max2000, contact name 150 email 150 phone30 and notes2000 `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:491-518`
- vNext now: New global editor industry160 about3000 and new college create lacks most fields `src/components/admin/super-admin-company-edit.tsx:43-48` `src/components/admin/super-admin-college-company-actions.tsx:35-42`
- Fix: Apply legacy per-field length caps in college workflow and decide global caps explicitly

## G2-9-033-021  [P1] GAP  facet F07  effort M
- Legacy: Old industry max100 description max2000, contact name 150 email 150 phone30 and notes2000 `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:491-518`
- vNext now: New global editor industry160 about3000 and new college create lacks most fields `src/components/admin/super-admin-company-edit.tsx:43-48` `src/components/admin/super-admin-college-company-actions.tsx:35-42`
- Fix: Apply legacy per-field length caps in college workflow and decide global caps explicitly

## G2-10-004-038  [P2] MISSING  facet F08  effort S
- Legacy: Old global edit success Saved. Every drive of this company shows the new name and logo. `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:97-101`
- vNext now: New global editor closes and refreshes without success toast `src/components/admin/super-admin-company-edit.tsx:19-32`
- Fix: Display legacy success message after shared company edit

## G2-9-034-023  [P2] MISSING  facet F08  effort S
- Legacy: Old global edit success Saved. Every drive of this company shows the new name and logo. `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:97-101`
- vNext now: New global editor closes and refreshes without success toast `src/components/admin/super-admin-company-edit.tsx:19-32`
- Fix: Display legacy success message after shared company edit
