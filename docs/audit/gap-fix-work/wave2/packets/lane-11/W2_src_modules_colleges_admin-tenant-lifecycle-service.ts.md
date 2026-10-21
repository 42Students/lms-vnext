# Work packet (wave 2): edit src/modules/colleges/admin-tenant-lifecycle-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md, docs/audit/gap2/lane-3/college-controller.md

## G2-10-023-020  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:558-572 — College search includes name/code/city/organization.
- vNext now: src/app/(authenticated)/admin/tenants/page.tsx:66-85; src/modules/colleges/admin-tenant-lifecycle-service.ts:27-29 — Directory q searches college name/code and org name, omits city.
- Fix: Include city in tenant directory search

## G2-10-023-100  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:87-115 — College entity legacy integer org/college ids, uniqueId and address fields.
- vNext now: src/components/admin/college-create-form.tsx:50-90; src/modules/colleges/admin-tenant-lifecycle-service.ts:31-42 — UUID college/org and code with active/archived lifecycle.
- Fix: Map ID/code and address fields in parity DTO

## G2-3-028-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:138-145`
- vNext now: `src/modules/colleges/admin-tenant-lifecycle-service.ts:68-76`
- Fix: Support scoped single-college detail GET equivalent; vNext admin lifecycle detail is separate from base /api/colleges route.
