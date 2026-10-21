# Work packet (wave 2): edit src/components/hr/hr-company-reports-grid.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-company.md

## G2-13-001-024  [P2] GAP  facet F05  effort M
- Legacy: Drive name combines linked title and lifecycle status tag (`docs/legacy-source/frontend/src/pages/recruiter/company.js:126-126`)
- vNext now: Drive column appends employment type; status occupies separate column (`src/components/hr/hr-company-reports-grid.tsx:15-17`)
- Fix: Use link plus legacy status pill in Drive cell; keep job type separately when useful.

## G2-13-001-053  [P2] GAP  facet F12  effort M
- Legacy: Offered column = awaiting + accepted + declined; unknown source counts display `Unavailable` (`docs/legacy-source/frontend/src/pages/recruiter/company.js:122-132`)
- vNext now: New grid counts outstanding+accepted+declined and defaults missing report rows to 0 (`src/components/hr/hr-company-reports-grid.tsx:24-29`)
- Fix: Do not replace unavailable data with zero; preserve explicit data-quality state.

## G2-13-001-064  [P2] GAP  facet F16  effort M
- Legacy: Report table may horizontally scroll under AntD Table defaults (`docs/legacy-source/frontend/src/pages/recruiter/company.js:122-135`)
- vNext now: Grid uses mobilePrimaryKeys=Drive/Status/Applications/Offered (`src/components/hr/hr-company-reports-grid.tsx:38-46`)
- Fix: Audit mobile hide/show against all six legacy columns and keyboard reachability.

## G2-13-001-065  [P2] GAP  facet F17  effort S
- Legacy: Drive name is keyboard-focusable Link, row click is mouse shortcut (`docs/legacy-source/frontend/src/pages/recruiter/company.js:122-126`)
- vNext now: New `Open drive` action is keyboard focusable; Drive text not link (`src/components/hr/hr-company-reports-grid.tsx:38-46`)
- Fix: Make Drive title focusable link and retain row action accessibility.
