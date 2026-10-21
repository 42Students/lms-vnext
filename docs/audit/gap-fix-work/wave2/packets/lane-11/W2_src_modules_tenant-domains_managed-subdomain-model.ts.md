# Work packet (wave 2): edit src/modules/tenant-domains/managed-subdomain-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u024-tenant-admin-controller.md, docs/audit/gap2/lane-9/superadmin-college-subdomain.md

## G2-5-024-020  [P2] GAP  facet F06  effort M
- Legacy: Managed name length 3–30 and reserved subdomains blocked. `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:10-10`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:317-323`
- vNext now: vNext validates action, expectedHost and available label. `src/modules/tenant-domains/managed-subdomain-model.ts:3-13,27-29`
- Fix: Keep field-level 3–30/forbidden-name text.

## G2-9-031-042  [P2] GAP  facet F12  effort S
- Legacy: 3–30 letters/digits/hyphen with fixed ends `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:10,55-59`
- vNext now: 1–63 UX pattern + shared available label checks `src/components/admin/managed-college-subdomain.tsx:15-16` `src/modules/tenant-domains/managed-subdomain-model.ts:5-14`
- Fix: Enforce exact bounds or owner approve loosening.
