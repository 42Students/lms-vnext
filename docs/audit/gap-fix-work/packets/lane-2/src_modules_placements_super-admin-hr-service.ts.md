# Work packet: edit src/modules/placements/super-admin-hr-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md, docs/audit/gap2/lane-3/superadmin-recruiter-accounts.md, docs/audit/gap2/lane-8/super-admin-recruiter-controller.md

## G2-10-021-099  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:11-21; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:67-149 — Old SuperAdminRecruiterService with endpoints lifecycle/grants.
- vNext now: src/modules/placements/super-admin-hr-service.ts:278-1388 — New single super-admin HR service with canonical users and scoped grants.
- Fix: Compare mutation outcomes status by status and all backend service validations.

## G2-3-031-038  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:196-228`
- vNext now: `src/modules/placements/super-admin-hr-service.ts:647-761`
- Fix: Legacy creates account identity and optionally cross-college access; vNext first requires active company relationship and can create company before recruiter. Rejects previously valid invites lacking company binding.

## G2-8-024-020  [P1] GAP  facet F06  effort M
- Legacy: Legacy grant validUntil blank means no expiry (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:56-61,177-183).
- vNext now: New blank grant expires in three months (src/components/admin/super-admin-hr-detail-drawer.tsx:296-302; src/modules/placements/super-admin-hr-service.ts:1054-1058).
- Fix: Prominently disclose changed default and migrate indefinite access intentionally.

## G2-8-024-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy invalid grant datetime INVALID_VALID_UNTIL with ISO example (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:177-183).
- vNext now: New date-only Until (optional) field and server ISO timestamp (src/components/admin/super-admin-hr-detail-drawer.tsx:296-302; src/modules/placements/super-admin-hr-service.ts:1054-1058).
- Fix: Specify timezone and acceptable date format in field-level error.

## G2-8-024-027  [P2] GAP  facet F08  effort M
- Legacy: Legacy Revoke Sessions returns message All sessions revoked (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:122-127).
- vNext now: New drawer action label Terminate all sessions and service executes canonical revocation (src/components/admin/super-admin-hr-detail-drawer.tsx:375-395; src/modules/placements/super-admin-hr-service.ts:1027-1031).
- Fix: Preserve exact post-action confirmation and affected account scope.
