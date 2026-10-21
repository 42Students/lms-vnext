# Work packet (wave 3): edit src/components/admin/super-admin-hr-detail-drawer.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md

## G2-10-021-049  [P1] MISSING  facet F09  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:531-535 — Delete account confirmation 'Delete <name>?', re-add same mobile restores.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:375-397 — Detail offers session termination, no delete action.
- Fix: Implement delete/readd canonical lifecycle or explicitly retire with owner decision.

## G2-10-021-056  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:531-535; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:129-134 — DELETE recruiter identity (soft-delete and possible reactivation).
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:560-579; src/components/admin/super-admin-hr-detail-drawer.tsx:375-397 — New UI has no Delete account.
- Fix: Surface equivalent account lifecycle or document intentional deletion removal.

## G2-10-021-108  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:531-535 — Delete account with re-add same mobile restores identity.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:375-397 — No Delete; canonical disabled separate.
- Fix: Make lifecycle deletion/restoration parity explicit.
