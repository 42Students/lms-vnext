# Work packet (wave 2): edit src/app/api/colleges/route.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-controller.md, docs/audit/gap2/lane-4/college-search-controller.md, docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-3-028-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:65-81`
- vNext now: `src/app/api/colleges/route.ts:12-22`
- Fix: Preserve separate full college and names-only org list contracts; vNext GET supplies one active-college projection.

## G2-4-014-003  [P2] GAP  facet F01  effort S
- Legacy: Legacy endpoint documents in-memory fuzzy/synonym search under Swagger College Search API v2. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:22-26`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:72-74`)
- vNext now: New route has no versioned search API docs, uses listColleges JSON. (`src/app/api/colleges/route.ts:12-23`)
- Fix: Document new API interface and deprecation/compatibility map.

## G2-4-014-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy search errors return HTTP Response status and body with status/message/data. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:93-98`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:161-163`)
- vNext now: New success JSON colleges property and standardized apiErrorResponse. (`src/app/api/colleges/route.ts:12-23`)
- Fix: Provide wrapper adapter for legacy consumers.

## G2-4-014-008  [P2] MISSING  facet F03  effort M
- Legacy: Popular response says Popular colleges retrieved. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:166-185`)
- vNext now: No popular endpoint or counter display. (`src/app/api/colleges/route.ts:12-23`)
- Fix: Expose popular list and exact response copy for picker.

## G2-4-014-010  [P2] MISSING  facet F03  effort S
- Legacy: Existence response message Checked and boolean data. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:332-353`)
- vNext now: New listing has no exact college name existence result. (`src/app/api/colleges/route.ts:12-23`)
- Fix: Add scoped college name existence check endpoint.

## G2-4-014-020  [P2] MISSING  facet F05  effort M
- Legacy: /state/:state /city/:city /category/:state each default limit50. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:211-245`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:271-286`)
- vNext now: No corresponding vNext endpoints or limit50 browse. (`src/app/api/colleges/route.ts:12-23`)
- Fix: Add route aliases with result-limit semantics.

## G2-4-014-041  [P2] MISSING  facet F10  effort S
- Legacy: GET /exists/:collegeName exact comparison scoped by org. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:332-353`)
- vNext now: No equivalent exact scoped existence endpoint. (`src/app/api/colleges/route.ts:12-23`)
- Fix: Implement case-insensitive same-org name exact check, keep UUID identifiers.

## G2-4-014-052  [P2] GAP  facet F12  effort M
- Legacy: Popularity usageCounts reset when process restarts, no persisted counter. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:47-48`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:255-262`)
- vNext now: New no usage counter. (`src/app/api/colleges/route.ts:12-63`)
- Fix: Decide ephemeral vs durable popularity and document migration.

## G2-4-014-054  [P2] GAP  facet F13  effort M
- Legacy: Cache load failure catches/logs and can leave empty cache; no explicit 503 response. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchCache.java:102-121`)
- vNext now: New DB failure throws to apiErrorResponse. (`src/app/api/colleges/route.ts:18-22`)
- Fix: Differentiate true zero from unavailable search data.

## G2-4-014-065  [P2] GAP  facet F18  effort S
- Legacy: API copy: Colleges retrieved in Nms, Popular colleges retrieved, States retrieved. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:161-183`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:206-209`)
- vNext now: New response has colleges list only, UI title Colleges. (`src/app/api/colleges/route.ts:18-20`; `src/app/(authenticated)/admin/colleges/page.tsx:131-134`)
- Fix: Map exact machine messages where legacy clients show feedback.

## G2-4-014-066  [P2] MISSING  facet F18  effort S
- Legacy: API copy: Categories retrieved, Selection recorded, Cache refreshed. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:266-268`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:300-303`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:362-365`)
- vNext now: No matching endpoints/messages. (`src/app/api/colleges/route.ts:12-23`)
- Fix: Define v2 aliases preserving response keys/wording.

## G2-4-014-076  [P2] MISSING  facet F21  effort M
- Legacy: Legacy usage popularity is in-memory across requests per instance, not durable/job based. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:47-48`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:255-262`)
- vNext now: No equivalent background popularity reconciliation. (`src/app/api/colleges/route.ts:12-23`)
- Fix: Choose counter store or explicitly deprecate popularity endpoint.

## G2-9-032-044  [P2] GAP  facet F10  effort M
- Legacy: POST /api/v1/college/create body org_id,name,unique_id,address,city,state,country,pin `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:8-15,87-119`
- vNext now: POST /api/colleges organizationId,name,code,addresses; response HTTP201 `src/components/admin/college-create-form.tsx:54-60` `src/app/api/colleges/route.ts:25-58`
- Fix: Document API/field crosswalk

## G2-4-014-007  [P3] GAP  facet F03  effort S
- Legacy: Legacy search response message Colleges retrieved in Nms. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:157-163`)
- vNext now: New GET /api/colleges returns no duration text, only colleges array. (`src/app/api/colleges/route.ts:18-20`)
- Fix: Match message if compatibility endpoint retained; omit duration only if callers migrated.
