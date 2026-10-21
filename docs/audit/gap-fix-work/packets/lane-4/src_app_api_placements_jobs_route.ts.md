# Work packet: edit src/app/api/placements/jobs/route.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u013-job-search-cache.md, docs/audit/gap2/lane-17/job-search-controller.md, docs/audit/gap2/lane-17/placement-job-service.md

## G2-18-013-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy JobSearchCache initializes on service startup and backs /api/v2/jobs/search and category/popular endpoints; JobSearchCache.java:32-63;JobSearchController.java:37-41,121-139
- vNext now: vNext learner /learn/placements and /api/placements/jobs, TPO drives screens, no matching /api/v2/jobs/search route identified; src/app/api/placements/jobs/route.ts:12-19;src/modules/placements/learner-job-service.ts:52-67
- Fix: Inventory legacy callers of /api/v2/jobs/* and map to new role/tenant-scoped endpoints before removing compatibility

## G2-18-013-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy controller routes /search,/popular,/organizations,/organization/{id},/department/{id},/program/{id},/job-type/{type},/categories,/category/{type},/stats and refresh; JobSearchController.java:121-407
- vNext now: vNext split learner browse, TPO lifecycle, CRUD jobs API; learner-jobs-browse-model.ts:39-51;src/app/api/placements/jobs/route.ts:12-34
- Fix: Create route-by-route compatibility sheet for permitted use cases; retire diagnostic organization catalog deliberately

## G2-18-013-017  [P1] GAP  facet F07  effort M
- Legacy: Legacy startup load failure caught/logged, cache may remain empty; JobSearchCache.java:116-143
- vNext now: vNext list query throws API error rather than a silently empty all-items; src/app/api/placements/jobs/route.ts:12-19
- Fix: Separate empty results from failed DB requests, show retry and log failure

## G2-17-013-001  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:36-41 — Dedicated /api/v2/jobs search controller with CORS and authenticated scope.
- vNext now: src/app/api/placements/jobs/route.ts:12-19 — vNext /api/placements/jobs GET lists college jobs, no /api/v2/jobs.
- Fix: Map legacy search route callers to scoped vNext filter endpoint.

## G2-17-013-027  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:121-213 — GET /search with query/limit/learnerId/deptId/programId/jobType.
- vNext now: src/app/api/placements/jobs/route.ts:12-19 — GET /api/placements/jobs?collegeId=... without those filters.
- Fix: Build /search scoped query route and filtering logic.

## G2-17-012-002  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:132-153 — Legacy GET list derives org from current principal.
- vNext now: src/app/api/placements/jobs/route.ts:12-22 — vNext jobs GET expects college scoping.
- Fix: Map super-admin organization selector/college scope explicitly.

## G2-17-012-028  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:248-273 — Legacy POST /api/v1/placement-jobs derives principal organization/user.
- vNext now: src/app/api/placements/jobs/route.ts:23-36 — vNext POST /api/placements/jobs calls college-scoped create.
- Fix: Provide organization-wide create path for authorized super admins.

## G2-17-013-021  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:159-165 — Missing org returns exact `Organization context required for job search. Provide learnerId or ensure authentication.`
- vNext now: src/app/api/placements/jobs/route.ts:12-19 — Placement errors via generic API error mapping.
- Fix: Map failure to user-friendly missing-scope message.

## G2-18-013-019  [P3] GAP  facet F08  effort S
- Legacy: Legacy success envelope success/Jobs retrieved in {ms}ms with DTO list; JobSearchController.java:208-212
- vNext now: vNext jobs API returns {jobs} or apiErrorResponse, no timing message; src/app/api/placements/jobs/route.ts:12-19
- Fix: Do not expose timing if unnecessary but update legacy API consumers expecting wrapper

## G2-17-013-024  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:210-212 — Success includes retrieval milliseconds in response message.
- vNext now: src/app/api/placements/jobs/route.ts:12-19 — GET success no toast/message.
- Fix: Document intentional removal of timing copy.

## G2-17-013-025  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:436-445 — Refresh response `Cache refreshed`.
- vNext now: src/app/api/placements/jobs/route.ts:12-19 — No refresh endpoint or message.
- Fix: Offer service-only revalidation confirmation where cache exists.
