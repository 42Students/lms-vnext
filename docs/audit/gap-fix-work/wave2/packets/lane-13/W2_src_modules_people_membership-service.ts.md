# Work packet (wave 2): edit src/modules/people/membership-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/super-admin-user-admin-controller.md, docs/audit/gap2/lane-13/role.md

## G2-1-007-013  [P2] GAP  facet F04  effort M
- Legacy: `SuperAdminUserAdminController.java:263` update response full `{user: Faculty}`.
- vNext now: `src/modules/people/membership-service.ts:136-156` lifecycle result membership state; canonical user unchanged.
- Fix: Refresh membership/status not isDeleted user flag.

## G2-1-007-055  [P2] GAP  facet F22  effort M
- Legacy: `SuperAdminUserAdminController.java:201-211` ADMIN/TPO represented as legacy Faculty model row with numeric id and facultyType.
- vNext now: `src/modules/people/membership-service.ts:75-129` canonical User plus collegeMembership and membershipRoles enum.
- Fix: Map admin/TPO identity/college membership with no shared global delete.

## G2-13-016-034  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:12-15` comments 'Admin role' and 'User role'
- vNext now: `src/modules/people/validation.ts:52` exact 'At least one membership role is required' for onboarding; `src/modules/people/membership-service.ts:61-65` MEMBERSHIP_ENDED
- Fix: Define human-readable role name/help text distinct from enum and validation codes
