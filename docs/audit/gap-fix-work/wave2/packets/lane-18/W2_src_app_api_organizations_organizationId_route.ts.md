# Work packet (wave 2): edit src/app/api/organizations/[organizationId]/route.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u026-organization-controller.md, docs/audit/gap2/lane-3/superadmin-organizations.md

## G2-16-026-001  [P2] GAP  facet F01  effort M
- Legacy: OrganizationController.java:26-30 base /api/v1/organization with create/fetch/update/delete paths.
- vNext now: organizations/route.ts:12-23 GET/POST and organizations/[organizationId]/route.ts:18-79 PATCH/DELETE.
- Fix: Provide API compatibility or document deprecation.

## G2-16-026-006  [P2] MISSING  facet F04  effort M
- Legacy: OrganizationController.java:99-117 GET /fetch/{id} returns organization by id.
- vNext now: organizations/[organizationId]/route.ts:1-79 no GET operation.
- Fix: Add scoped GET by ID API or equivalent route.

## G2-16-026-041  [P2] MISSING  facet F23  effort M
- Legacy: OrganizationController.java:99-117 scoped detail GET exists.
- vNext now: organizations/[organizationId]/route.ts:1-79 lacks GET.
- Fix: Restore detail endpoint and tenant ownership verification.

## G2-3-030-004  [P2] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/OrganizationController.java:99-117`
- vNext now: `src/app/api/organizations/[organizationId]/route.ts:18-50`
- Fix: Legacy organization-by-ID HTTP GET present; vNext dynamic [organizationId] route only PATCH/DELETE. Link to admin detail or restore authorized GET.

## G2-3-030-005  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/OrganizationController.java:119-154`
- vNext now: `src/app/api/organizations/[organizationId]/route.ts:18-53`
- Fix: Legacy PUT full update vs vNext PATCH rename only. Old callers need adapter.

## G2-3-030-006  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/OrganizationController.java:156-189`
- vNext now: `src/app/api/organizations/[organizationId]/route.ts:55-79`
- Fix: Legacy DELETE soft deletes; vNext archives.

## G2-16-026-007  [P3] GAP  facet F04  effort S
- Legacy: OrganizationController.java:139-143 update returns status OK, success message, data.
- vNext now: organizations/[organizationId]/route.ts:43-49 returns {organization} without message.
- Fix: Preserve response message on legacy route.

## G2-16-026-011  [P3] GAP  facet F06  effort S
- Legacy: OrganizationController.java:119-123 PUT complete name.
- vNext now: organizations/[organizationId]/route.ts:18-49 PATCH name.
- Fix: Adapt historic PUT method on compatibility route.
