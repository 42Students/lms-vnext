# Work packet (wave 2): edit src/components/admin/super-admin-company-identities.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-10-004-030  [P2] GAP  facet F06  effort S
- Legacy: Old domain manager modal with closable Tag chips and single domain input `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:110-132`
- vNext now: New domain manager inline list with Remove buttons and Add field `src/components/admin/super-admin-company-identities.tsx:34-58`
- Fix: Restore old domain dialog chip layout and label

## G2-10-004-031  [P2] GAP  facet F06  effort S
- Legacy: Old aliases modal separate Add Other name up to 150 chars and tags `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:135-158`
- vNext now: New inline field has maxLength160 and plain list with Remove buttons `src/components/admin/super-admin-company-identities.tsx:36-55` `src/modules/placements/company-curation-alias-model.ts:2-5`
- Fix: Use 150-character alias cap and legacy modal/chip presentation

## G2-10-004-072  [P2] GAP  facet F17  effort S
- Legacy: Old global action labels Verify Unverify Edit Domains Other names Merge `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:70-80`
- vNext now: New per-company subactions require disclosure; control labels are descriptive but more hidden `src/app/(authenticated)/admin/companies/page.tsx:159-175` `src/components/admin/super-admin-company-identities.tsx:34-59`
- Fix: Keep keyboard reachability and visible focus/order for high-frequency actions

## G2-9-034-018  [P2] GAP  facet F06  effort S
- Legacy: Old domain manager modal with closable Tag chips and single domain input `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:110-132`
- vNext now: New domain manager inline list with Remove buttons and Add field `src/components/admin/super-admin-company-identities.tsx:34-58`
- Fix: Restore old domain dialog chip layout and label

## G2-9-034-019  [P2] GAP  facet F06  effort S
- Legacy: Old aliases modal separate Add Other name up to 150 chars and tags `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:135-158`
- vNext now: New inline field has maxLength160 and plain list with Remove buttons `src/components/admin/super-admin-company-identities.tsx:36-55` `src/modules/placements/company-curation-alias-model.ts:2-5`
- Fix: Use 150-character alias cap and legacy modal/chip presentation

## G2-9-034-041  [P2] GAP  facet F17  effort S
- Legacy: Old global action labels Verify Unverify Edit Domains Other names Merge `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:70-80`
- vNext now: New per-company subactions require disclosure; control labels are descriptive but more hidden `src/app/(authenticated)/admin/companies/page.tsx:159-175` `src/components/admin/super-admin-company-identities.tsx:34-59`
- Fix: Keep keyboard reachability and visible focus/order for high-frequency actions

## G2-9-034-074  [P2] GAP  facet F06  effort S
- Legacy: Legacy domain dialog title 'Domains of <name>' `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:111-133`
- vNext now: Domains inline in details under header Domains `src/components/admin/super-admin-company-identities.tsx:34-55`
- Fix: Restore separate domain modal with exact dynamic heading.

## G2-9-034-076  [P2] GAP  facet F06  effort S
- Legacy: Legacy alias input 'TCS, L&T, an old or longer name' cap150 `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:148-151`
- vNext now: New input 'e.g. TCS' cap160 `src/components/admin/super-admin-company-identities.tsx:40-44`
- Fix: Restore exact alias placeholder and max150.

## G2-9-034-077  [P2] GAP  facet F06  effort S
- Legacy: Alias add button disabled until trim >=2; Enter adds `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:53-57,148-152`
- vNext now: Add enabled for any nonempty input, client required only `src/components/admin/super-admin-company-identities.tsx:26-46`
- Fix: Disable until 2 nonspace chars and retain Enter handling.

## G2-9-034-087  [P2] GAP  facet F09  effort S
- Legacy: Old Domains modal contains tags closable if >1 `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:111-133`
- vNext now: New inline list with per-item Remove buttons `src/components/admin/super-admin-company-identities.tsx:48-55`
- Fix: Render tags and closable affordance in dialog; keep singleton protection.

## G2-9-034-088  [P2] GAP  facet F09  effort S
- Legacy: Old Other names modal empty 'None yet' then alias tags `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:135-159`
- vNext now: New empty alias list has no 'None yet' cue `src/components/admin/super-admin-company-identities.tsx:36-55`
- Fix: Add exact empty alias helper and tag list.

## G2-9-034-106  [P2] GAP  facet F17  effort M
- Legacy: Old modal inputs handled via Antd focus/focus trap and accessible Tag close `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:97-159`
- vNext now: New inline controls and disclosure with no modal focus restoration `src/components/admin/super-admin-company-identities.tsx:34-55`
- Fix: Restore keyboard focus trapping, Escape cancellation and accessible label on modal triggers.

## G2-9-034-110  [P2] GAP  facet F18  effort S
- Legacy: Aliases modal helper explains short/old/full name and conflicts `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:153-156`
- vNext now: New identity edit has no helper `src/components/admin/super-admin-company-identities.tsx:34-59`
- Fix: Add the full legacy alias-help explanation.
