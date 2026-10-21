# Work packet (wave 2): edit src/modules/colleges/readiness-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-5-024-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy readiness meta contains uniqueId, collegeName, organizationId, verified/primary/total counts and strict-domain flag. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:243-264`
- vNext now: vNext readiness evaluation is separate and lacks identical meta contract. `src/modules/colleges/readiness-service.ts:101-127`, `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx:110-118`
- Fix: Provide legacy summary and policy flag under read-only details.

## G2-5-024-035  [P2] GAP  facet F10  effort M
- Legacy: Legacy directly calculates domain blockers and warnings from normalized domain/branding/academic data. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:154-265`
- vNext now: vNext computes extended readiness evaluation with UNKNOWN relations. `src/modules/colleges/readiness-service.ts:101-127`, `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx:100-118`
- Fix: Map every legacy blocker/warning to named current check.
