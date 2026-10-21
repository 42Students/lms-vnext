# Work packet: edit src/db/schema/colleges.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u020-college.md, docs/audit/gap2/lane-3/college-controller.md, docs/audit/gap2/lane-4/college-search-controller.md

## G2-16-020-002  [P1] GAP  facet F01  effort M
- Legacy: College.java:36-41 chair/vice chair/org IDs.
- vNext now: colleges.ts:18-20 org FK, no chair fields.
- Fix: Provide chair and vice-chair via optional scoped memberships/role assignments.

## G2-16-020-008  [P1] GAP  facet F04  effort M
- Legacy: College.java:36-41 numeric chair,viceChair,org.
- vNext now: colleges.ts:17-20 UUID ID/org, no chairs.
- Fix: Reconcile historic numeric actors and organization membership.

## G2-16-020-034  [P1] GAP  facet F20  effort M
- Legacy: College.java:36-39 numeric chair could refer to another college.
- vNext now: colleges.ts:14-43 lacks assignment.
- Fix: Use composite membership college scope and transaction for chair edits.

## G2-16-020-036  [P1] GAP  facet F22  effort M
- Legacy: College.java:15-41 MySQL college table, BaseModel numeric ID and three actor IDs.
- vNext now: colleges.ts:14-43 UUID PK/FK, no chair fields, status column new.
- Fix: Write field mapping and role association migration incl chairs and linkable old code.

## G2-16-020-038  [P1] MISSING  facet F23  effort M
- Legacy: College.java:36-39 chair/viceChair are top-level columns.
- vNext now: colleges.ts:14-43 omitted.
- Fix: Restore optional leadership assignment contract.

## G2-3-028-080  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CollegeDTO.java:11-55`
- vNext now: `src/db/schema/colleges.ts:14-44`
- Fix: Numeric old college and org IDs, chair IDs, uniqueId, plain logo vs UUID, code, archive/status, object path: document explicit ETL.

## G2-4-014-012  [P1] GAP  facet F04  effort L
- Legacy: Legacy DTO fields id,name,logo,uniqueId,addressLine1/2,landmark,city,state,country,pinCode,chairId,viceChairId,orgId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchDTO.java:19-32`)
- vNext now: New college object has UUID id,code,logoObjectPath,addressLine1/2,landmark,city,state,country,postalCode,organizationId; no chair fields. (`src/db/schema/colleges.ts:14-34`)
- Fix: Map every legacy DTO property and document chair/vice chair omission.

## G2-4-014-015  [P1] GAP  facet F04  effort L
- Legacy: Legacy college id and orgId are integers. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchDTO.java:19-32`)
- vNext now: New colleges.id/organizationId are UUID columns. (`src/db/schema/colleges.ts:17-22`)
- Fix: Document stable ID migration or compatibility resolver for old consumers.

## G2-4-014-016  [P1] GAP  facet F04  effort M
- Legacy: Legacy pinCode string, first/last college-chair IDs. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchDTO.java:29-32`)
- vNext now: New postalCode string and no collegeChairId/collegeViceChairId on table. (`src/db/schema/colleges.ts:23-34`)
- Fix: Map pinCode rename and handle optional chair relationships in new schema.

## G2-4-014-077  [P1] GAP  facet F22  effort L
- Legacy: Legacy College entity fields are projected to DTO including chair/vice chair, orgId and pinCode. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchCache.java:123-143`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchDTO.java:19-32`)
- vNext now: New colleges schema has UUID, code, postalCode, logo path, no chair IDs. (`src/db/schema/colleges.ts:14-34`)
- Fix: Create exact schema field mapping and preserve optional contact/leadership if needed.

## G2-4-014-079  [P1] GAP  facet F22  effort L
- Legacy: Legacy cache has exact/prefix/category indexes and mutable usageCounts outside DB schema. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:33-48`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:354-401`)
- vNext now: New DB only code unique index, organization/status indexes, no full-text/fuzzy index. (`src/db/schema/colleges.ts:35-42`)
- Fix: Plan PostgreSQL trigram/fts or equivalent scoped prefix ranking indexes.
