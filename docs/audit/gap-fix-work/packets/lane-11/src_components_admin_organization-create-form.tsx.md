# Work packet: edit src/components/admin/organization-create-form.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md, docs/audit/gap2/lane-3/superadmin-organizations.md, docs/audit/gap2/lane-6/organization.md

## G2-10-023-034  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:172-173 — Organization empty error 'Please enter organization name'.
- vNext now: src/components/admin/organization-create-form.tsx:59-84 — Native validation and Alert, not exact field copy.
- Fix: Show exact validation under field

## G2-3-030-029  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:81-82`
- vNext now: `src/components/admin/organization-create-form.tsx:50-54`
- Fix: Legacy Failed to create organization: <message> toast vs vNext action alert/service error mapping.

## G2-6-018-022  [P2] GAP  facet F07  effort S
- Legacy: Legacy server missing name Organization name is required (OrganizationServiceImpl.java:24-29,56-61).
- vNext now: vNext Zod/UI message Please enter organization name (organizations/validation.ts:5-10; organization-create-form.tsx:27-28).
- Fix: Preserve field-level copy and server mapping as separately observed: UI Please enter..., server Organization name is required.
