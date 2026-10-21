# Work packet (wave 3): edit src/components/admin/super-admin-faculty-bulk-import.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-18-031-059  [P1] MISSING  facet F14  effort L
- Legacy: Legacy faculty CSV max500, header First Name Last Name Mobile Number Email, optional Faculty Type LECTURER/MENTOR and chosen department, per-row report; Faculty.js:103-104,595-754,1154-1172
- vNext now: vNext max500 max1.5MB but role FACULTY only, no department, report CREATED/FAILED/SKIPPED; faculty-bulk-import-service.ts:16-49;super-admin-faculty-bulk-import.tsx:87-117
- Fix: Add faculty department + mentor type to batch request and server preflight, preserving template semantics
