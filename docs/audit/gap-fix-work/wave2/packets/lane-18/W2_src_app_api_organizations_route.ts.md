# Work packet (wave 2): edit src/app/api/organizations/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u026-organization-controller.md, docs/audit/gap2/lane-3/superadmin-organizations.md

## G2-16-026-001  [P2] GAP  facet F01  effort M
- Legacy: OrganizationController.java:26-30 base /api/v1/organization with create/fetch/update/delete paths.
- vNext now: organizations/route.ts:12-23 GET/POST and organizations/[organizationId]/route.ts:18-79 PATCH/DELETE.
- Fix: Provide API compatibility or document deprecation.

## G2-16-026-005  [P2] GAP  facet F04  effort S
- Legacy: OrganizationController.java:55-65 create response status,message,data with HTTP200.
- vNext now: organizations/route.ts:44-52 returns organization and HTTP201.
- Fix: Map historic response envelope on compatibility API.

## G2-3-030-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/OrganizationController.java:44-66`
- vNext now: `src/app/api/organizations/route.ts:23-57`
- Fix: Legacy POST /api/v1/organization/create returns status OK envelope; vNext /api/organizations returns 201 and organization.

## G2-3-030-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/OrganizationController.java:68-97`
- vNext now: `src/app/api/organizations/route.ts:12-20`
- Fix: Legacy GET /fetch may return full organizations for global SA or scoped-one; vNext GET returns only active scoped list JSON.
