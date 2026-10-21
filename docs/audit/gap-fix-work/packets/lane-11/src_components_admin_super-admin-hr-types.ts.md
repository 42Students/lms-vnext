# Work packet: edit src/components/admin/super-admin-hr-types.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md

## G2-10-021-012  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:323-323 — Status ACTIVE green, SUSPENDED orange, DELETED red Tag.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:630-638; src/components/admin/super-admin-hr-types.ts:1-4 — ACTIVE, ARCHIVED shown Suspended, DISABLED shown Disabled.
- Fix: Map status lifecycle accurately, expose DELETED separately from disabled.

## G2-10-021-065  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:335-351 — ACTIVE can suspend; SUSPENDED reactivate; DELETED displays Deleted.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:570-577; src/components/admin/super-admin-hr-types.ts:92-108 — ARCHIVED maps suspended; DISABLED separate canonical platform status.
- Fix: Define DELETED ↔ ARCHIVED/DISABLED mapping and resurrection.

## G2-10-021-102  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:318-323,365-376 — Numeric recruiter id, contactMobile/companyName, activeCollegeCount, status SUSPENDED/DELETED.
- vNext now: src/components/admin/super-admin-hr-types.ts:19-30 — UUID userId, phoneE164, companyId, grants, ARCHIVED/DISABLED.
- Fix: Map canonical identifiers, status and aggregate counts in migration-free vNext.

## G2-10-021-103  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:136-149; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:136-149 — Grants keyed collegeId and nullable validUntil.
- vNext now: src/modules/placements/super-admin-hr-validation.ts:68-74; src/components/admin/super-admin-hr-types.ts:6-17 — Grant uses UUID companyRelationshipId, ISO datetime offset and verification status.
- Fix: Map access policy, expiration behavior and verified relationship constraints.
