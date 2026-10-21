# Work packet (wave 2): edit src/app/api/academics/sections/route.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u014-class-search-controller.md

## G2-5-014-023  [P2] GAP  facet F06  effort S
- Legacy: Legacy /search request query, limit, programId are optional GET parameters (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:71-79`)
- vNext now: vNext sections GET requires cohortId and optionally academicPeriodId (`src/app/api/academics/sections/route.ts:12-22`)
- Fix: Preserve query program/limit shapes or update all affected callers

## G2-5-014-038  [P2] MISSING  facet F10  effort M
- Legacy: GET /api/v2/classes/popular returns top usage-frequency selection scoped to tenant (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:119-134`)
- vNext now: vNext sections API no popular query parameter (`src/app/api/academics/sections/route.ts:12-25`)
- Fix: Support popular suggestion query with scoped storage

## G2-5-014-044  [P2] MISSING  facet F10  effort S
- Legacy: GET /api/v2/classes/exists/{name} is case-insensitive exact name within tenant (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:220-229`)
- vNext now: vNext no class existence GET under /api/academics/sections (`src/app/api/academics/sections/route.ts:12-51`)
- Fix: Build existence check with correct tenant and Unicode handling

## G2-5-014-058  [P2] GAP  facet F13  effort S
- Legacy: Legacy no programId for normal principal returns 403, not empty list (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:102-106`)
- vNext now: vNext missing cohort throws parse error, not empty list (`src/app/api/academics/sections/route.ts:12-25`)
- Fix: Match 403 invalid scope states

## G2-5-014-066  [P2] GAP  facet F18  effort S
- Legacy: Legacy search docs name programId, query, limit; /categories called programs (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:71-79`)
- vNext now: vNext names cohortId/academicPeriodId and uses sections (`src/app/api/academics/sections/route.ts:15-20`)
- Fix: Audit frontend labels and rename back only where old chooser expects programs vs cohorts

## G2-5-014-071  [P2] MISSING  facet F20  effort M
- Legacy: Legacy usageCounts concurrent map increments per select; repeated clicks count repeatedly (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:255-262`)
- vNext now: vNext no selection counter API (`src/app/api/academics/sections/route.ts:12-51`)
- Fix: Introduce at-most-once analytics policy or match repeated-click weighting

## G2-5-014-045  [P3] GAP  facet F10  effort S
- Legacy: POST /api/v2/classes/refresh superadmin triggers reload of DB cached classes (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:231-240`)
- vNext now: vNext sections reads DB fresh each GET, no analogous refresh action (`src/app/api/academics/sections/route.ts:12-25`)
- Fix: Document intentional no-cache design; retire refresh with explicit response

## G2-5-014-065  [P3] GAP  facet F18  effort M
- Legacy: Legacy successful messages Popular classes retrieved, Classes retrieved, Categories retrieved, Selection recorded, Stats retrieved, Checked, Cache refreshed (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:119-241`)
- vNext now: vNext API uses direct {sections} or {section} and codes on failure (`src/app/api/academics/sections/route.ts:12-47`)
- Fix: Provide exact response-envelope message mapping in compatibility layer
