# Work packet: edit src/app/(authenticated)/college/companies/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-companies.md

## G2-9-004-003  [P1] GAP  facet F01  effort M
- Legacy: No-college warning with contact administrator (`docs/legacy-source/frontend/src/pages/college-admin/companies/index.js:19-31`)
- vNext now: Without College Admin role redirects dashboard (`src/app/(authenticated)/college/companies/page.tsx:23-27`)
- Fix: Show original warning and reason.

## G2-9-004-049  [P1] GAP  facet F11  effort M
- Legacy: College guard based on authenticated loginUser.collegeId (`docs/legacy-source/frontend/src/pages/college-admin/companies/index.js:18-30`)
- vNext now: College Admin membership required, other roles dashboard redirect (`src/app/(authenticated)/college/companies/page.tsx:24-29`)
- Fix: Check Super Admin acting-college scope parity.
