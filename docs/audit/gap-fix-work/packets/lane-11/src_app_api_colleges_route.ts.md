# Work packet: edit src/app/api/colleges/route.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-search-controller.md, docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-4-014-025  [P1] MISSING  facet F06  effort M
- Legacy: POST /:collegeId/select takes path integer and no request body. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:289-303`)
- vNext now: No popularity selection API in new GET/POST /api/colleges. (`src/app/api/colleges/route.ts:12-63`)
- Fix: Create scoped POST usage endpoint with UUID college ID.

## G2-4-014-036  [P1] GAP  facet F10  effort L
- Legacy: GET /search chooses state first, city second, org third, global cache else. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:104-155`)
- vNext now: GET /api/colleges calls listColleges(context,organizationId), no state/city/ranking. (`src/app/api/colleges/route.ts:12-20`)
- Fix: Add scoped v2 search endpoint with parameter parity.

## G2-4-014-046  [P1] MISSING  facet F11  effort M
- Legacy: Stats and Refresh require requireSuperAdmin, selection requires requireAccessCollege. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:289-310`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:355-360`)
- vNext now: No equivalent stats/selection/refresh endpoints with role checks. (`src/app/api/colleges/route.ts:12-63`)
- Fix: Add permission gates on newly mapped routes.

## G2-9-032-076  [P1] GAP  facet F22  effort L
- Legacy: Legacy integer org/college IDs and uniqueId string `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:45-71,83-135`
- vNext now: New UUID organizationId/collegeId and code unique case insensitive `src/modules/colleges/service.ts:90-133` `src/app/api/colleges/route.ts:25-58`
- Fix: Map ID/code migration, enforce tenant FKs

## G2-4-014-030  [P2] MISSING  facet F07  effort M
- Legacy: Missing/nonexistent college selection scope checked via requireAccessCollege before recordUsage. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:289-298`)
- vNext now: No recordSelection endpoint, so no equivalent scoped-not-found error. (`src/app/api/colleges/route.ts:12-63`)
- Fix: Validate tenant scope and found ID before recording selection.

## G2-4-014-032  [P2] MISSING  facet F08  effort S
- Legacy: Selection responds Selection recorded and no data. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:289-303`)
- vNext now: No usage action/no confirmation. (`src/app/api/colleges/route.ts:12-63`)
- Fix: Return exact success response from new selection route.

## G2-4-014-031  [P3] GAP  facet F08  effort S
- Legacy: Successful search message embeds actual duration. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:157-163`)
- vNext now: GET /api/colleges has no status or message envelope. (`src/app/api/colleges/route.ts:18-20`)
- Fix: Retain response message for versioned clients if needed.
