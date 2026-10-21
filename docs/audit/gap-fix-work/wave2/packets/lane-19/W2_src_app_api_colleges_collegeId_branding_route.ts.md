# Work packet (wave 2): edit src/app/api/colleges/[collegeId]/branding/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l15-u020-college-branding.md, docs/audit/gap2/lane-9/superadmin-college-branding.md

## G2-15-020-036  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:57 GET and :97 upsertCollegeBranding
- vNext now: src/app/api/colleges/[collegeId]/branding/route.ts:24-49 GET+PUT with expectedVersion
- Fix: Map input/output shape and UUID identity.

## G2-9-030-036  [P2] GAP  facet F10  effort M
- Legacy: GET/PUT /api/v1/superadmin/tenant/branding/{id} with logoUrl `docs/legacy-source/frontend/src/api/Services/TenantAdminService.js:18-22`
- vNext now: GET/PUT /api/colleges/{uuid}/branding with expectedVersion and ten fields `src/app/api/colleges/[collegeId]/branding/route.ts:21-65`
- Fix: Document ID and payload crosswalk
