# Work packet (wave 2): edit src/modules/organizations/validation.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u026-organization-controller.md, docs/audit/gap2/lane-3/superadmin-organizations.md

## G2-16-026-009  [P2] GAP  facet F05  effort M
- Legacy: OrganizationController.java:99-101 numeric organization ID for detail.
- vNext now: organizations/validation.ts:3 requires UUID.
- Fix: Map external historic IDs only if needed.

## G2-3-030-025  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:68-70`
- vNext now: `src/modules/organizations/validation.ts:5-10`
- Fix: Legacy create client strips repeated whitespace; vNext Zod transform matches normalization but validation message differs Organization name is required vs Please enter organization name.

## G2-16-026-010  [P3] GAP  facet F06  effort S
- Legacy: OrganizationDTO.java:11-12 @NotBlank max255.
- vNext now: organizations/validation.ts:5-10 trim and collapse all whitespace.
- Fix: Document changed internal whitespace normalization.
