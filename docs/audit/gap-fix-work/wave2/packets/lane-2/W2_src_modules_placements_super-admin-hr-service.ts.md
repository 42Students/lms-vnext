# Work packet (wave 2): edit src/modules/placements/super-admin-hr-service.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md, docs/audit/gap2/lane-3/superadmin-recruiter-accounts.md, docs/audit/gap2/lane-8/super-admin-recruiter-controller.md

## G2-10-021-051  [P2] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:97-122; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:67-73 — GET recruiter accounts q/page/size25, backend applies org/college.
- vNext now: src/app/(authenticated)/admin/hr/page.tsx:71-114; src/modules/placements/super-admin-hr-service.ts:278-426 — Direct scoped DB server list with URL query/status.
- Fix: Verify same grant-history inclusion and filter semantics.

## G2-10-021-055  [P2] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:338-358; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:103-129 — Suspend/reactivate/revoke-sessions endpoints.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:500-547; src/modules/placements/super-admin-hr-service.ts:1342-1388 — New mutation through HR endpoints and canonical sessions.
- Fix: Cross-check status transaction and global session invalidation.

## G2-3-031-019  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:365-399`
- vNext now: `src/modules/placements/super-admin-hr-service.ts:218-276`
- Fix: Legacy college access status ACTIVE/REVOKED/EXPIRED with optional until; vNext grants include verificationStatus and relationship scope, preserve effective expiry.

## G2-3-031-021  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:97-123`
- vNext now: `src/modules/placements/super-admin-hr-service.ts:278-424`
- Fix: Legacy debounced client query refresh; vNext SSR page search applies DB scoped status filter. Confirm query race and expected sort.

## G2-3-031-045  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:68-73`
- vNext now: `src/modules/placements/super-admin-hr-service.ts:485-495`
- Fix: Legacy college grant picker includes all scoped college options; vNext filters company–college relationships and active org/company.

## G2-3-031-053  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:83-133`
- vNext now: `src/modules/placements/super-admin-hr-service.ts:647-765`
- Fix: Legacy create/update audit events RECRUITER_* and session revoke logged via AuditService; vNext platform activity events, ensure correlation and notification semantics.

## G2-3-031-054  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:269-296`
- vNext now: `src/modules/placements/super-admin-hr-service.ts:780-930`
- Fix: Legacy grant/revoke has linked college audit events, vNext grant/relationship mutation emits different activity names; mapping needed.

## G2-3-031-062  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:97-123`
- vNext now: `src/modules/placements/super-admin-hr-service.ts:278-424`
- Fix: Legacy list returns 25 rows with nested colleges; vNext paginates SQL but separately loads grant summaries, ensure efficient N+1 avoidance.

## G2-3-031-066  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:83-155`
- vNext now: `src/modules/placements/super-admin-hr-service.ts:647-761`
- Fix: Legacy recruiter identity records and sessions integrate with legacy OTP/SMS; vNext platform identity with E164 and central session termination. Specify provider/ID mapping.

## G2-8-024-002  [P2] GAP  facet F01  effort M
- Legacy: Old recruiter detail GET /{id} by integer (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:79-82).
- vNext now: New account detail keyed canonical UUID user ID in client drawer (src/app/(authenticated)/admin/hr/page.tsx:78-104; src/modules/placements/super-admin-hr-service.ts:426-477).
- Fix: Provide account-ID resolution for old deep links.
