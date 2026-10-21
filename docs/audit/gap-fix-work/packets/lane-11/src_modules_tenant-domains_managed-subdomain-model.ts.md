# Work packet: edit src/modules/tenant-domains/managed-subdomain-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-college-subdomain.md, docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-9-031-025  [P1] GAP  facet F07  effort M
- Legacy: Exact regex requires 3–30 length and no leading/trailing hyphens `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:10,55-60`
- vNext now: Backend labelSchema likely accepts up to63, validates reserved names `src/modules/tenant-domains/managed-subdomain-model.ts:5-13` `src/components/admin/managed-college-subdomain.tsx:15-16`
- Fix: Validate old range/wording at client and server.

## G2-5-024-021  [P2] GAP  facet F07  effort M
- Legacy: Legacy invalid/reserved/taken subdomain returns 400/409 with exact code and help sentence. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:350-363`
- vNext now: vNext validation and conflict codes differ (SUBDOMAIN_CONFLICT, HOST_CONFLICT). `src/modules/tenant-domains/managed-subdomain-model.ts:5-13`, `src/modules/tenant-domains/managed-subdomain-service.ts:52-61`
- Fix: Map clear actionable messages to each field failure.
