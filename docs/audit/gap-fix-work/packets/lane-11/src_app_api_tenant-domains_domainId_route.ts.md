# Work packet: edit src/app/api/tenant-domains/[domainId]/route.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-5-024-017  [P1] MISSING  facet F06  effort M
- Legacy: Legacy PUT domain supports changing hostname and primary flag, resets verification on changed host. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:462-505`
- vNext now: vNext PATCH only SET_PRIMARY, no edit-host endpoint. `src/app/api/tenant-domains/[domainId]/route.ts:20-54`
- Fix: Implement safe hostname change with verification reset and audit.

## G2-5-024-031  [P1] MISSING  facet F09  effort M
- Legacy: Legacy edit custom host in same domain form as primary toggle. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:462-505`
- vNext now: vNext has set-primary confirmation but no host-edit control. `src/app/api/tenant-domains/[domainId]/route.ts:20-54`, `src/components/admin/tenant-domain-manager.tsx:112-115`
- Fix: Add edit control with confirm and DNS-proof reset.

## G2-5-024-032  [P1] GAP  facet F10  effort M
- Legacy: Legacy create/update/delete/token/verify mutations save domain and audit each step. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:425-565`
- vNext now: vNext create/set-primary/delete/verify route family lacks host edit and ensure-token. `src/app/api/tenant-domains/route.ts:28-54`, `src/app/api/tenant-domains/[domainId]/route.ts:20-78`, `src/app/api/tenant-domains/[domainId]/verify/route.ts:15-38`
- Fix: Implement missing actions and tenant-scoped audit receipts.

## G2-5-024-058  [P1] GAP  facet F20  effort M
- Legacy: Legacy soft delete mutates stored host with tombstone to free original. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:507-538`
- vNext now: vNext lacks isDeleted and deletes domain row. `src/db/schema/tenant-domains.ts:15-31`, `src/app/api/tenant-domains/[domainId]/route.ts:56-78`
- Fix: Preserve deletion history/tombstone in separate immutable event.

## G2-5-024-066  [P1] GAP  facet F23  effort M
- Legacy: Legacy allows host edit and optional unverified primary under relaxed policy. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:462-505`
- vNext now: vNext forbids both unsafe primary and custom host edit. `src/app/api/tenant-domains/[domainId]/route.ts:20-54`, `src/modules/tenant-domains/service.ts:227-242`
- Fix: Restore safe host edit; require owner signoff on always-verified primary.

## G2-5-024-027  [P3] GAP  facet F08  effort S
- Legacy: Legacy delete returns `{ok:true}` even missing managed address. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:386-396,507-538`
- vNext now: vNext deletes custom `{deleted:true}` and managed REMOVE requires present record. `src/app/api/tenant-domains/[domainId]/route.ts:56-78`, `src/modules/tenant-domains/managed-subdomain-service.ts:52-55`
- Fix: Map repeat/remove action receipts and user copy.
