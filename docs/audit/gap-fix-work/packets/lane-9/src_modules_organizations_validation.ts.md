# Work packet: edit src/modules/organizations/validation.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u026-organization-controller.md

## G2-16-026-012  [P3] GAP  facet F07  effort S
- Legacy: OrganizationServiceImpl.java:26-35 says Organization name is required/Organization name already exists.
- vNext now: organizations/validation.ts:8-9 says Please enter organization name / 255 characters or less.
- Fix: Align field message and conflict mapping.
