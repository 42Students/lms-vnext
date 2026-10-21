# Work packet: edit src/app/api/tenant-domains/[domainId]/verify/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-5-024-032  [P1] GAP  facet F10  effort M
- Legacy: Legacy create/update/delete/token/verify mutations save domain and audit each step. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:425-565`
- vNext now: vNext create/set-primary/delete/verify route family lacks host edit and ensure-token. `src/app/api/tenant-domains/route.ts:28-54`, `src/app/api/tenant-domains/[domainId]/route.ts:20-78`, `src/app/api/tenant-domains/[domainId]/verify/route.ts:15-38`
- Fix: Implement missing actions and tenant-scoped audit receipts.

## G2-5-024-026  [P2] GAP  facet F08  effort M
- Legacy: Legacy verify returns `{ok,domain}` even if DNS mismatches. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:556-566`
- vNext now: vNext returns `{domain}`, with verification status in domain. `src/app/api/tenant-domains/[domainId]/verify/route.ts:15-38`, `src/modules/tenant-domains/service.ts:196-224`
- Fix: Show explicit success/failure and diagnostic reason.
