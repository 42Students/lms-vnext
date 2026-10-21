# Work packet: edit src/modules/people/membership-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/super-admin-user-admin-controller.md, docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-1-007-032  [P1] GAP  facet F10  effort L
- Legacy: `SuperAdminUserAdminController.java:249-263` toggles global isDeleted and increments tokenVersion when deleted.
- vNext now: `membership-service.ts:136-156` suspends/ends college membership; separate platform-status and device revocation services.
- Fix: Ensure admin role disable immediately blocks sign-in and revokes all sessions across permitted scopes.

## G2-18-031-030  [P1] GAP  facet F06  effort M
- Legacy: Legacy register Faculty Type includes protected ADMIN/TPO and Mentor plus department; Faculty.js:1038-1078;FacultyController.java:137-154
- vNext now: vNext roles checkbox and forced faculty Mentor addition; person-onboard-dialog.tsx:215-225;membership-service.ts:82-100
- Fix: Ensure only SA can grant protected roles and faculty type/department remain independently mapped

## G2-18-031-043  [P1] GAP  facet F10  effort M
- Legacy: Legacy suspend PUT /api/v1/admin/users/{userType}/{id}/suspend and reactivate; AdminUserLifecycleController.java:83-167
- vNext now: vNext PATCH /api/people/{membershipId}/lifecycle with {action,reason}; api/people/[membershipId]/lifecycle/route.ts:15-49;membership-service.ts:136-156
- Fix: Explicitly distinguish account-wide vs college membership effects and user ID vs membership ID in API clients
