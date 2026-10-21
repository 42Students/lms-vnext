# Work packet: edit src/app/api/organizations/[organizationId]/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u026-organization-controller.md

## G2-16-026-014  [P2] MISSING  facet F07  effort S
- Legacy: OrganizationController.java:112-115 GET missing returns 404 with Failed to fetch organization. Please try again or contact support.
- vNext now: organizations/[organizationId]/route.ts:1-79 missing GET.
- Fix: Implement safe not-found body with retry guidance.

## G2-16-026-015  [P3] GAP  facet F08  effort S
- Legacy: OrganizationController.java:141 says Organization updated successfully.
- vNext now: organizations/[organizationId]/route.ts:49 returns organization only.
- Fix: Render exact success message in UI.

## G2-16-026-016  [P3] GAP  facet F08  effort S
- Legacy: OrganizationController.java:176 says Organization deleted successfully.
- vNext now: organizations/[organizationId]/route.ts:74 returns archive status.
- Fix: Use approved archive wording consistently.
