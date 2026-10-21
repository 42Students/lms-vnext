# Work packet: edit src/modules/colleges/service.ts

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-recycle-bin-controller.md, docs/audit/gap2/lane-3/college-controller.md, docs/audit/gap2/lane-4/college-search-controller.md, docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-2-023-004  [P1] MISSING  facet F01  effort M
- Legacy: AdminRecycleBinController.java:232-285 POST /restore with entityType/id/collegeId
- vNext now: src/modules/organizations/service.ts and src/modules/colleges/service.ts have individual restore actions but no generic endpoint
- Fix: Add generic restore dispatcher guarded by entity type.

## G2-2-023-023  [P1] MISSING  facet F07  effort M
- Legacy: AdminRecycleBinController.java:269-274 forbidden does not belong to specified college
- vNext now: src/modules/colleges/service.ts:137-197 scoped college listing, no generic row restore
- Fix: Recheck row ownership before changing archive flag; non-leaking forbidden outcome.

## G2-2-023-030  [P1] GAP  facet F10  effort M
- Legacy: AdminRecycleBinController.java:259-278 restore changes only `BaseModel.isDeleted=false`
- vNext now: src/modules/colleges/service.ts:578-623 archive uses status ARCHIVED; dedicated restore path may differ
- Fix: Define per-entity restore transition; never assume a uniform boolean across schema.

## G2-2-023-035  [P1] GAP  facet F11  effort M
- Legacy: AdminRecycleBinController.java:267-276 verifies record-college match and admin grant
- vNext now: src/modules/colleges/service.ts:578-623 archive service own access policy
- Fix: Verify row tenant inside mutation transaction for each entity type.

## G2-3-028-003  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:83-135`
- vNext now: `src/modules/colleges/service.ts:137-299`
- Fix: Restore authorized global college switcher source: legacy all=true lets Super Admin enumerate every college even when scoped to one.

## G2-3-028-025  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:83-135`
- vNext now: `src/modules/colleges/service.ts:169-250`
- Fix: The global all=true switcher override is missing from listColleges when a selected college scope is set.

## G2-3-028-045  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:147-190`
- vNext now: `src/modules/colleges/service.ts:540-575`
- Fix: Legacy edit allows changing uniqueId and org, updating related denormalized placements; vNext immutable parent and code. Decide parity.

## G2-3-028-050  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:93-119`
- vNext now: `src/modules/colleges/service.ts:156-209`
- Fix: Superadmin selecting one college must retain ability to switch to all others; verify dedicated global switcher endpoint.

## G2-3-028-081  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CollegeServiceImpl.java:192-235`
- vNext now: `src/modules/colleges/service.ts:578-625`
- Fix: Soft-delete boolean vs ACTIVE/ARCHIVED restorable status lifecycle; map deleted record visibility.

## G2-3-028-083  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:93-102`
- vNext now: `src/modules/colleges/service.ts:156-209`
- Fix: A global scope switcher feed overriding selected admin scope is not represented in listColleges; verify alternate switcher service.

## G2-4-014-023  [P1] GAP  facet F05  effort M
- Legacy: Legacy getPopular and search empty string ranked by usage count, not name. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-122`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:193-218`)
- vNext now: New SQL returns colleges ordered asc(name). (`src/modules/colleges/service.ts:220-249`)
- Fix: Implement popularity ranking for search picker; avoid alphabetical fallback.

## G2-4-014-042  [P1] GAP  facet F11  effort L
- Legacy: All routes require authenticated principal, with global Super Admin orgless access. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:38-63`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:86-98`)
- vNext now: New listColleges checks persisted college.read permission and selected admin scope. (`src/modules/colleges/service.ts:137-173`)
- Fix: Map roles and global/selected org/college scoping for all endpoints.

## G2-4-014-043  [P1] GAP  facet F11  effort M
- Legacy: Non-superadmin with organization may search its org, not other tenants. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:86-98`)
- vNext now: New /admin/colleges UI requires admin-scope.select, while API listColleges can support college admin only. (`src/app/(authenticated)/admin/colleges/page.tsx:91-94`; `src/modules/colleges/service.ts:252-255`)
- Fix: Check faculty/recruiter org-scoped read access, provide safe API without admin page.

## G2-4-014-047  [P1] GAP  facet F12  effort M
- Legacy: Cache stores all nondeleted colleges and excludes isDeleted true. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchCache.java:102-115`)
- vNext now: New listColleges filters ACTIVE status. (`src/modules/colleges/service.ts:238-249`)
- Fix: Confirm archived status exactly maps isDeleted, no deleted leaks.

## G2-4-014-078  [P1] GAP  facet F22  effort M
- Legacy: Legacy isDeleted flag excludes archived at cache load. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchCache.java:102-115`)
- vNext now: New status ACTIVE filter at read. (`src/modules/colleges/service.ts:238-249`)
- Fix: Confirm migration of isDeleted semantics and archive/restore consistency.

## G2-9-032-076  [P1] GAP  facet F22  effort L
- Legacy: Legacy integer org/college IDs and uniqueId string `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:45-71,83-135`
- vNext now: New UUID organizationId/collegeId and code unique case insensitive `src/modules/colleges/service.ts:90-133` `src/app/api/colleges/route.ts:25-58`
- Fix: Map ID/code migration, enforce tenant FKs

## G2-3-028-034  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:51-59`
- vNext now: `src/modules/colleges/service.ts:493-521`
- Fix: Legacy exact Clear college scope to create colleges and scoped-org mismatch messages vs vNext generic permission error.

## G2-4-014-027  [P2] GAP  facet F07  effort S
- Legacy: Non-super missing organization returns HTTP403 body error Organization context required. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:91-98`)
- vNext now: New listColleges can throw AuthorizationError via persistedPermission. (`src/modules/colleges/service.ts:137-151`)
- Fix: Match forbidden reason/copy in compatibility API response.
