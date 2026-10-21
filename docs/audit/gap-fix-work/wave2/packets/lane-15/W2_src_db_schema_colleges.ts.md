# Work packet (wave 2): edit src/db/schema/colleges.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u020-college.md, docs/audit/gap2/lane-3/college-controller.md, docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md, docs/audit/gap2/lane-4/college-search-controller.md

## G2-16-020-003  [P2] GAP  facet F02  effort S
- Legacy: College.java:16-41 name, logo, unique ID, address, chair and org.
- vNext now: colleges.ts:21-31 same profile except chairs in separate role model.
- Fix: Show all original college fields in admin detail, including optional chairs.

## G2-16-020-006  [P2] GAP  facet F04  effort S
- Legacy: College.java:16-21 name/logo/uniqueId.
- vNext now: colleges.ts:21-23 name/code/logoObjectPath.
- Fix: Map uniqueId→code and logo URL→object path, retaining link/preview.

## G2-16-020-020  [P2] GAP  facet F10  effort S
- Legacy: College.java:18-19 string logo, possible URL.
- vNext now: colleges.ts:23 stores logoObjectPath and branding table logoUrl.
- Fix: Bridge old logo storage and new signed preview, no raw uncontrolled URL.

## G2-16-020-022  [P2] GAP  facet F11  effort S
- Legacy: College.java:36-39 chair IDs without active staff check in model.
- vNext now: colleges.ts:14-43 no chair fields.
- Fix: Validate active faculty membership in chair role when adding.

## G2-3-028-060  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CollegeDTO.java:13-14`
- vNext now: `src/db/schema/colleges.ts:20-25`
- Fix: Legacy logo URL max255 vs logoObjectPath in vNext; map safe display/upload.

## G2-3-028-082  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CollegeServiceImpl.java:155-190`
- vNext now: `src/db/schema/colleges.ts:14-44`
- Fix: Legacy domains in separate tenant_domain with primary/verified flags; vNext separate tenantDomains schema and verification workflow.

## G2-3-032-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:46-63`
- vNext now: `src/db/schema/colleges.ts:14-44`
- Fix: Legacy CollegeDTO chair/vice-chair and domainHost, one numeric orgId; vNext normalized college UUID + object logo + separate domain and membership tables.

## G2-3-032-070  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:46-63`
- vNext now: `src/db/schema/colleges.ts:14-44`
- Fix: Legacy CollegeDTO uniqueId and chair IDs vs new code, UUID, object path/status. Map all tenant fields.

## G2-4-014-080  [P2] GAP  facet F22  effort M
- Legacy: Legacy DTO uniqueId may be null but display fallback; new code varchar64 unique. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchDTO.java:19-43`)
- vNext now: New colleges.code notNull with lowercase unique index. (`src/db/schema/colleges.ts:21-22`; `src/db/schema/colleges.ts:35-37`)
- Fix: Specify legacy null uniqueId conversion and collision handling.

## G2-16-020-023  [P3] GAP  facet F12  effort S
- Legacy: College.java:20-21 uniqueId unique but no lowercase normalization.
- vNext now: colleges.ts:36 lower(code) global unique.
- Fix: Preserve case-folded match for historical uniqueId URLs.

## G2-16-020-037  [P3] GAP  facet F22  effort S
- Legacy: College.java:22-35 address text fields unspecified max.
- vNext now: colleges.ts:24-30 varchar limits city/state/country128, postal32.
- Fix: Handle long legacy addresses safely with field-specific errors.
