# Work packet: edit src/modules/placements/super-admin-hr-validation.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md

## G2-10-021-030  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:513-518 — Scoped creation requires >=1 college; global can create without grants.
- vNext now: src/modules/placements/super-admin-hr-validation.ts:34-49 — Creation requires exactly existing companyRelationshipId xor newCompany, implies relationship.
- Fix: Preserve global no-college creation if backend permits, or flag policy change explicitly.

## G2-10-021-053  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:196-226; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:84-102 — POST/PUT create/update recruiter with split name and companyName.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:316-434; src/modules/placements/super-admin-hr-validation.ts:34-66 — POST/PATCH canonical displayName/relationship fields.
- Fix: Document field migration, existing identity reuse and contact updates.

## G2-10-021-054  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:269-298; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:136-149 — POST grant and DELETE revoke by college numeric ID.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:253-357; src/modules/placements/super-admin-hr-validation.ts:68-74 — New grant by companyRelationshipId and ISO offset validUntil.
- Fix: Resolve selected company relationship to college and expiry precisely.

## G2-10-021-103  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:136-149; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:136-149 — Grants keyed collegeId and nullable validUntil.
- vNext now: src/modules/placements/super-admin-hr-validation.ts:68-74; src/components/admin/super-admin-hr-types.ts:6-17 — Grant uses UUID companyRelationshipId, ISO datetime offset and verification status.
- Fix: Map access policy, expiration behavior and verified relationship constraints.
