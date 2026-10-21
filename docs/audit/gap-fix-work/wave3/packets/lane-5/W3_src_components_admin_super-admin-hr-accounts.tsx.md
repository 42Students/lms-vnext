# Work packet (wave 3): edit src/components/admin/super-admin-hr-accounts.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md

## G2-10-021-056  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:531-535; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:129-134 — DELETE recruiter identity (soft-delete and possible reactivation).
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:560-579; src/components/admin/super-admin-hr-detail-drawer.tsx:375-397 — New UI has no Delete account.
- Fix: Surface equivalent account lifecycle or document intentional deletion removal.
