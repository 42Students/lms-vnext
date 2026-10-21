# Work packet: edit src/modules/colleges/admin-tenant-setup-journey.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-5-024-002  [P1] MISSING  facet F01  effort M
- Legacy: Global-only `GET /onboarding/resolve-preview?host` returns tenant, canonical host and redirect preview. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:273-313`
- vNext now: Setup journey has no resolve-preview action; runtime resolver is not a privileged diagnostic endpoint. `src/modules/colleges/admin-tenant-setup-journey.ts:2-12`, `src/modules/tenant-domains/service.ts:263-269`
- Fix: Implement read-only global-admin resolve preview without DNS fetch.

## G2-5-024-038  [P1] MISSING  facet F11  effort M
- Legacy: Legacy resolve preview global-only. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:273-282`
- vNext now: vNext has no global-guarded preview endpoint. `src/modules/colleges/admin-tenant-setup-journey.ts:2-12`, `src/modules/tenant-domains/service.ts:263-269`
- Fix: Expose only behind global-scope admin check.
