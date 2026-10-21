# Work packet (wave 2): edit src/db/schema/organizations.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u026-organization-controller.md, docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md

## G2-16-026-024  [P2] GAP  facet F12  effort M
- Legacy: OrganizationServiceImpl.java:30-35 rejects same name even when historical row soft deleted.
- vNext now: organizations.ts:15-17 enforces active-only unique lower(name).
- Fix: Decide reuse-after-archive and restore conflicts.

## G2-16-026-038  [P2] GAP  facet F22  effort M
- Legacy: Organization.java:10-16 numeric primary key and BaseModel isDeleted.
- vNext now: organizations.ts:5-19 UUID id, status enum and partial unique index.
- Fix: Create field and ID/soft-delete migration mapping.

## G2-16-026-039  [P2] GAP  facet F22  effort M
- Legacy: OrganizationServiceImpl.java:30-35 duplicate search includes deleted rows.
- vNext now: organizations.ts:15-17 unique only ACTIVE.
- Fix: Test restoration after duplicate reuse and handle explicit conflict.

## G2-3-032-071  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/OrganizationController.java:68-97`
- vNext now: `src/db/schema/organizations.ts:5-19`
- Fix: Legacy Organization soft-delete boolean/numeric ID vs new status and UUID; explicit lifecycle migration.
