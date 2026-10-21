# Work packet: edit src/app/api/academics/sections/route.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u014-class-search-controller.md

## G2-5-014-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy public authenticated class discovery API lives at /api/v2/classes (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:20-25`)
- vNext now: vNext sections API is /api/academics/sections GET/POST (`src/app/api/academics/sections/route.ts:1-28`)
- Fix: Provide compatibility route for existing /api/v2/classes consumers or mapped redirects

## G2-5-014-025  [P1] GAP  facet F06  effort M
- Legacy: Legacy cache refresh accepts no body and superadmin role (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:231-240`)
- vNext now: vNext POST sections parses JSON createSection (different operation) (`src/app/api/academics/sections/route.ts:28-47`)
- Fix: Prevent old POST /refresh clients creating sections; provide separate controlled refresh

## G2-5-014-037  [P1] GAP  facet F10  effort M
- Legacy: GET /api/v2/classes/search accepts query,limit,programId and returns Response<List<ClassSearchDTO>> (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:71-117`)
- vNext now: GET /api/academics/sections accepts cohortId,academicPeriodId returns {sections} (`src/app/api/academics/sections/route.ts:12-25`)
- Fix: Implement API contract mapping and caller rollout test plan

## G2-5-014-042  [P1] GAP  facet F10  effort M
- Legacy: POST /api/v2/classes/{classId}/select increments cached usage, no DB write (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:186-200`)
- vNext now: vNext sections POST creates persisted academic section (`src/app/api/academics/sections/route.ts:28-47`)
- Fix: Add idempotent select usage endpoint with explicit audit/analytics policy

## G2-5-014-082  [P1] GAP  facet F23  effort L
- Legacy: Legacy has eight extra search, category, popularity, existence and refresh endpoints (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:119-241`)
- vNext now: vNext primary section CRUD API has only GET and POST (`src/app/api/academics/sections/route.ts:12-51`)
- Fix: Deliver endpoint-by-endpoint compatibility matrix before retiring legacy API

## G2-5-014-026  [P2] GAP  facet F07  effort S
- Legacy: Legacy search without programId for non-global user returns 403 and exact message (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:102-106`)
- vNext now: vNext missing cohortId fails cohortIdSchema.parse and apiErrorResponse (`src/app/api/academics/sections/route.ts:12-25`)
- Fix: Restore actionable scope-required error and HTTP 403 for unauthorized global searches

## G2-5-014-030  [P3] GAP  facet F08  effort S
- Legacy: Legacy /search success message Classes retrieved in {duration}ms (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:110-116`)
- vNext now: vNext sections GET returns {sections} without message or elapsedMs (`src/app/api/academics/sections/route.ts:12-25`)
- Fix: Maintain old envelope/copy only on compatibility route

## G2-5-014-031  [P3] MISSING  facet F08  effort S
- Legacy: Legacy /popular responds Popular classes retrieved (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:119-134`)
- vNext now: vNext no popular endpoint or toast in GET sections (`src/app/api/academics/sections/route.ts:12-25`)
- Fix: Preserve API success envelope if old consumer requires it

## G2-5-014-032  [P3] GAP  facet F08  effort S
- Legacy: Legacy /program and /category respond Classes retrieved (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:136-183`)
- vNext now: vNext sections GET bare JSON object without status/message (`src/app/api/academics/sections/route.ts:12-25`)
- Fix: Adapt response envelope or migrate callsites explicitly

## G2-5-014-033  [P3] MISSING  facet F08  effort S
- Legacy: Legacy /select responds Selection recorded (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:186-200`)
- vNext now: vNext sections has no usage-recording response (`src/app/api/academics/sections/route.ts:12-51`)
- Fix: Add telemetry receipt response if user-facing search popularity depends on clicks

## G2-5-014-034  [P3] MISSING  facet F08  effort S
- Legacy: Legacy /refresh responds Cache refreshed (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:231-240`)
- vNext now: vNext route lacks equivalent cache refresh success (`src/app/api/academics/sections/route.ts:12-51`)
- Fix: Add refresh acknowledgement if feature retained
