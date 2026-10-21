# Work packet: edit src/app/(authenticated)/admin/hr/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-recruiter-controller.md, docs/audit/gap2/lane-3/superadmin-recruiter-accounts.md

## G2-8-024-011  [P1] GAP  facet F04  effort M
- Legacy: Old grant validUntil accepts nullable ISO local date-time and capabilities array (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:56-61,136-146).
- vNext now: New grant validUntil timezone timestamp, 3-month default, verificationStatus (src/modules/placements/super-admin-hr-service.ts:1040-1058; src/app/(authenticated)/admin/hr/page.tsx:89-104).
- Fix: Preserve explicit indefinite grants or document new expiry/verification rule and migration.

## G2-3-031-028  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:430-433`
- vNext now: `src/app/(authenticated)/admin/hr/page.tsx:116-128`
- Fix: Legacy separate Recruiter accounts could not be loaded / College access options unavailable with independent Retry; vNext loadError and totals retry separated differently.
