# Work packet (wave 2): edit src/modules/organizations/service.ts

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u026-organization-controller.md, docs/audit/gap2/lane-2/admin-recycle-bin-controller.md, docs/audit/gap2/lane-3/superadmin-organizations.md

## G2-16-026-019  [P2] GAP  facet F10  effort M
- Legacy: OrganizationServiceImpl.java:85-87 soft deletes isDeleted.
- vNext now: organizations/service.ts:258-269 archives using status ARCHIVED plus audit event.
- Fix: Map deletion semantics to archive for all reads.

## G2-16-026-026  [P2] GAP  facet F13  effort S
- Legacy: OrganizationController.java:86-90 unknown org scope returns empty list.
- vNext now: organizations/service.ts:136-142 may require permission or return empty.
- Fix: Differentiate authorized empty from forbidden.

## G2-16-026-027  [P2] GAP  facet F13  effort S
- Legacy: OrganizationController.java:105-115 not-found status ERROR with 404.
- vNext now: organizations/service.ts:42-63 typed ORGANIZATION_NOT_FOUND.
- Fix: Map into safe HTTP404 and action copy.

## G2-16-026-032  [P2] GAP  facet F18  effort S
- Legacy: OrganizationController.java:53 exact Clear scope (GLOBAL mode) to create organizations.
- vNext now: organizations/service.ts:159-166 generic permission error.
- Fix: Render explicit Global scope guidance on rejection.

## G2-2-023-057  [P2] GAP  facet F21  effort M
- Legacy: AdminRecycleBinController.java:61-74 nine repositories, scoped resolver and audit
- vNext now: src/modules/organizations/service.ts, colleges/service.ts, announcements/service.ts separate implementations
- Fix: Centralize registry dispatch; delegate to domain-specific restore services rather than generic bool update.

## G2-3-030-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/OrganizationController.java:68-97`
- vNext now: `src/modules/organizations/service.ts:92-150`
- Fix: Legacy Organization model numeric ID / isDeleted; vNext UUID, createdAt and status. Document DTO translation.

## G2-3-030-024  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/OrganizationController.java:73-95`
- vNext now: `src/modules/organizations/service.ts:92-150`
- Fix: Legacy global org list preserves repository order; vNext orders active organizations by name.

## G2-3-030-039  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:66-83`
- vNext now: `src/modules/organizations/service.ts:153-184`
- Fix: Legacy create returns 200 and full Organization; vNext insert uses 201 `{organization}` and logged activity.

## G2-3-030-040  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:93-110`
- vNext now: `src/modules/organizations/service.ts:186-231`
- Fix: Legacy updateOrganization PATCH? UI calls legacy PUT with name, vNext rename only; preserve semantics via adapter.

## G2-3-030-041  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:113-126`
- vNext now: `src/modules/organizations/service.ts:232-271`
- Fix: Legacy soft-delete isDeleted; vNext status ARCHIVED and separate restoration.

## G2-3-030-044  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/OrganizationController.java:71-95`
- vNext now: `src/modules/organizations/service.ts:92-150`
- Fix: Legacy global SA gets global orgs; non-SA gets resolved current org, vNext permission and selected scope can narrow list differently.

## G2-3-030-048  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/OrganizationServiceImpl.java:30-36`
- vNext now: `src/modules/organizations/service.ts:66-88`
- Fix: Legacy case-insensitive org-name uniqueness includes any record findByNameIgnoreCase, vNext unique index only ACTIVE names; allows reuse archived name.

## G2-3-030-061  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:43-62`
- vNext now: `src/modules/organizations/service.ts:92-150`
- Fix: Legacy one GET + local filter, vNext one list DB read followed by in-memory filter/pagination; large tenant counts require DB paging.

## G2-3-030-064  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/OrganizationServiceImpl.java:30-36`
- vNext now: `src/modules/organizations/service.ts:66-88`
- Fix: Legacy database duplicate name policy includes soft deleted, vNext partial unique index permits archived duplicate name.

## G2-3-030-068  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/OrganizationServiceImpl.java:73-88`
- vNext now: `src/modules/organizations/service.ts:232-271`
- Fix: Legacy delete checks nondeleted college child FK; vNext archive checks ACTIVE child colleges, allowing different orphaned archived descendants.

## G2-16-026-033  [P3] GAP  facet F18  effort S
- Legacy: OrganizationController.java:134 exact Scoped superadmin can only edit the selected organization.
- vNext now: organizations/service.ts:196-207 generic target permission.
- Fix: Preserve specific denial reason and safe error.
