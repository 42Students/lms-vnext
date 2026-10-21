# Work packet (wave 2): edit src/modules/tenant-domains/validation.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-5-024-016  [P2] GAP  facet F06  effort M
- Legacy: Legacy new domain accepts collegeId,host,isPrimary. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:785-790,425-459`
- vNext now: vNext POST only collegeId/host and requires later primary PATCH. `src/app/api/tenant-domains/route.ts:28-50`, `src/modules/tenant-domains/validation.ts:100-106`
- Fix: Explicitly map immediate primary choice to safe verify-then-promote path.
