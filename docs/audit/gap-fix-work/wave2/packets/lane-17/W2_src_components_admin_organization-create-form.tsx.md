# Work packet (wave 2): edit src/components/admin/organization-create-form.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md, docs/audit/gap2/lane-3/superadmin-organizations.md, docs/audit/gap2/lane-6/organization.md

## G2-10-023-050  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:34-62 — GET organizations on mount; create/update/delete via AdminService.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:51-58; src/components/admin/organization-create-form.tsx:23-58 — Server organizations list, separate organization mutation routes.
- Fix: Document new routes, preserve independent refresh and CRUD paths

## G2-3-030-056  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:172-175`
- vNext now: `src/components/admin/organization-create-form.tsx:64-85`
- Fix: Legacy Ant Form.Item validation per input vs vNext form error Alert. Link aria-describedby and focused error.

## G2-6-018-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy fetch response status,message,data envelope (OrganizationController.java:92-96).
- vNext now: vNext service returns projected id,name,timestamps, API frontend consumes payload (organizations/service.ts:130-149; organization-create-form.tsx:31-43).
- Fix: Document equivalent response mapping; do not break clients expecting envelope.

## G2-3-030-012  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:172-174`
- vNext now: `src/components/admin/organization-create-form.tsx:64-76`
- Fix: Legacy Organization Name capitalization and placeholder e.g., ABC University; vNext label Organization name and missing/other placeholder.

## G2-3-030-028  [P3] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:173-174`
- vNext now: `src/components/admin/organization-create-form.tsx:64-78`
- Fix: Legacy e.g., ABC University exact placeholder absent or different, and required asterisk differs.
