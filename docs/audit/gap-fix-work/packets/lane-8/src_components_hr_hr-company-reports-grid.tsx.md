# Work packet: edit src/components/hr/hr-company-reports-grid.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-company.md

## G2-13-001-021  [P1] GAP  facet F05  effort M
- Legacy: Reports table column order: Drive, Applied, Offered, Accepted, Declined, Joined (`docs/legacy-source/frontend/src/pages/recruiter/company.js:122-132`)
- vNext now: AG Grid adds Status, Published, Submitted, Withdrawn; renames Applied to Applications and Accepted to Accepted offers (`src/components/hr/hr-company-reports-grid.tsx:14-31`)
- Fix: Default column set/order to six legacy columns; place additional metrics behind Columns preference if retained.

## G2-13-001-023  [P1] GAP  facet F05  effort S
- Legacy: Table clickable anywhere in row; Drive name is separate keyboard link (`docs/legacy-source/frontend/src/pages/recruiter/company.js:122-126`)
- vNext now: Grid has dedicated `Open drive` row action; no row click visible in wrapper (`src/components/hr/hr-company-reports-grid.tsx:38-46`)
- Fix: Preserve row-click affordance and accessible Drive title link without losing explicit action.
