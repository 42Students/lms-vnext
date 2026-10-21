# Work packet: edit src/app/(authenticated)/college/departments/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-departments.md

## G2-9-006-003  [P1] GAP  facet F01  effort M
- Legacy: Missing college warning displayed in route (`docs/legacy-source/frontend/src/pages/college-admin/departments.js:19-33`)
- vNext now: Missing membership redirect dashboard (`src/app/(authenticated)/college/departments/page.tsx:16-22`)
- Fix: Preserve warning, not silent redirect.

## G2-9-006-041  [P1] GAP  facet F11  effort M
- Legacy: Warning Admin not assigned to a college (`docs/legacy-source/frontend/src/pages/college-admin/departments.js:19-33`)
- vNext now: Redirect dashboard (`src/app/(authenticated)/college/departments/page.tsx:18-22`)
- Fix: Restore exact warning and Contact administrator.
