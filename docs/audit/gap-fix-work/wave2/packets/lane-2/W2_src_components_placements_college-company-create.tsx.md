# Work packet (wave 2): edit src/components/placements/college-company-create.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-companies.md

## G2-9-004-007  [P2] GAP  facet F03  effort M
- Legacy: Add company button PlusOutlined (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:320-343`)
- vNext now: Add company primary button without icon toggles inline form (`src/components/placements/college-company-create.tsx:45-51`)
- Fix: Show Plus icon and open modal.

## G2-9-004-040  [P2] GAP  facet F09  effort M
- Legacy: Add Company/Edit Company modal width560 with Identity/Contact/Internal only sections (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:438-520`)
- vNext now: Inline form expands below button, no modal (`src/components/placements/college-company-create.tsx:45-79`)
- Fix: Restore modal layout, width and headings.

## G2-9-004-068  [P2] GAP  facet F16  effort M
- Legacy: Modal width560, History modal width720 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:438-475`)
- vNext now: Inline form maxWidth920; no history modal (`src/components/placements/college-company-create.tsx:45-79`)
- Fix: Use legacy modal widths on desktop and mobile sheet when narrow.

## G2-9-004-076  [P2] GAP  facet F18  effort M
- Legacy: Form section labels Identity / Contact / Internal only (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:468-480`)
- vNext now: Flat company name/website/email domain labels (`src/components/placements/college-company-create.tsx:52-78`)
- Fix: Restore grouped modal section headings.
