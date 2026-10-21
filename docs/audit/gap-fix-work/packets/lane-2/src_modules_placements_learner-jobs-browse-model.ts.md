# Work packet: edit src/modules/placements/learner-jobs-browse-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md, docs/audit/gap2/lane-15/l18-u013-job-search-cache.md, docs/audit/gap2/lane-17/job-search-controller.md

## G2-14-005-026  [P1] GAP  facet F05  effort M
- Legacy: Legacy Eligible only based on visibleFlag; vNext canApply and deadline checks also used, changing matching population — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:584-592,615-629`
- vNext now: `src/modules/placements/learner-jobs-browse-model.ts:94-106`; `src/components/placements/learner-jobs-browse.tsx:172-192`
- Fix: Define equivalent eligibility filter with visibility plus college policy and closure

## G2-14-005-056  [P1] GAP  facet F12  effort M
- Legacy: Legacy status closed includes job.isActive false OR expired deadline; vNext source only PUBLISHED and deadlinePassed with status at job level — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:144-151,658-662`
- vNext now: `src/modules/placements/learner-job-service.ts:131-153`; `src/modules/placements/learner-jobs-browse-model.ts:54-58`
- Fix: Show past closed saves and approved nonactive historical jobs where access permitted

## G2-18-013-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy controller routes /search,/popular,/organizations,/organization/{id},/department/{id},/program/{id},/job-type/{type},/categories,/category/{type},/stats and refresh; JobSearchController.java:121-407
- vNext now: vNext split learner browse, TPO lifecycle, CRUD jobs API; learner-jobs-browse-model.ts:39-51;src/app/api/placements/jobs/route.ts:12-34
- Fix: Create route-by-route compatibility sheet for permitted use cases; retire diagnostic organization catalog deliberately

## G2-18-013-011  [P1] GAP  facet F05  effort M
- Legacy: Legacy org-scoped search controller first takes 1000 org jobs, then filters substring query and caps limit default15; JobSearchController.java:169-203
- vNext now: vNext learner client filter joins name/title etc then sorts deadline/CTC/title/newest; learner-jobs-browse-model.ts:88-146
- Fix: Avoid first-1000 truncation, preserve scoped search and accepted default limit semantics

## G2-18-013-038  [P1] GAP  facet F19  effort L
- Legacy: Legacy loads all jobs+reference data in process memory at startup, partitions per organization; JobSearchCache.java:52-63,116-175
- vNext now: vNext DB query by college and client-side filtering of returned jobs; learner-job-service.ts:52-155;learner-jobs-browse-model.ts:88-146
- Fix: Benchmark 10k concurrent users and large college jobs; add server paging/search if list grows, no global cache leakage

## G2-17-013-013  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:173-189 — Optional deptId/programId exact int and jobType case-insensitive.
- vNext now: src/modules/placements/learner-jobs-browse-model.ts:88-118 — Client filters employment type, location, availability, eligibility.
- Fix: Support organization-safe dept/program/type facet on relevant admin search.
