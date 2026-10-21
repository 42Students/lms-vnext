# Work packet: edit src/modules/tenant-domains/validation.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-5-024-022  [P2] GAP  facet F07  effort M
- Legacy: Legacy 400 invalid host and 409 HOST_ALREADY_EXISTS/DOMAIN_NOT_VERIFIED. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:435-446,470-495`
- vNext now: vNext uses Zod host detail, HOST_CONFLICT and DOMAIN_NOT_VERIFIED. `src/modules/tenant-domains/validation.ts:4-61`, `src/modules/tenant-domains/service.ts:168-175,237-240`
- Fix: Keep exact duplicate/unverified guidance and prevention.
