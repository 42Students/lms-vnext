# Work packet (wave 2): edit src/modules/placements/learner-job-service.ts

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u013-job-search-cache.md, docs/audit/gap2/lane-18/job-service-impl.md, docs/audit/gap2/lane-18/u005-learner-placements-home.md, docs/audit/gap2/lane-3/job-repository.md, docs/audit/gap2/lane-6/job-visibility-cache.md, docs/audit/gap2/lane-9/l18-u013-job-search-cache.md

## G2-18-013-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy cache contributes job logo, org, college, program/department names; JobSearchCache.java:180-207
- vNext now: vNext roleOption and company shown by browse, job rows access-limited; learner-job-service.ts:68-155
- Fix: Map legacy logos, badges, target names, record IDs to new card props as permitted

## G2-18-013-013  [P2] GAP  facet F05  effort S
- Legacy: Legacy JobSearchCache.getByOrganizationId preserves repository load order, subList(0, limit); JobSearchCache.java:219-224;JobRepository.java:56-74
- vNext now: vNext learner ORDER BY deadline, title, role title; learner-job-service.ts:149-153
- Fix: Document new stable default sorting vs old job ID-derived order

## G2-18-011-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy learner Jobs lists only org-visible and targeted, active jobs before deadline (`JobServiceImpl.java:204-260`).
- vNext now: New learner placements lists PUBLISHED unarchived, eligible own college, filtered by active program/cohort/section (`learner-job-service.ts:52-65,130-207`).
- Fix: Map legacy org-wide jobs to new college drive targeting; preserve jobs visible under historic selection where permitted.

## G2-18-011-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy visible/eligible separate listings share Job DTO based on Job entity (`JobServiceImpl.java:175-260,1580-1605`).
- vNext now: New list rows join company, relationship, role options, application (`learner-job-service.ts:67-153`).
- Fix: Recreate visible vs application-status card anatomy, mapping job fields to role option fields.

## G2-18-011-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy available job list filters active, deadline and hierarchy; doesn't check GPA/skills before listing (`JobServiceImpl.java:204-216,324-368`).
- vNext now: New job listing filters target, may display not-eligible but still visible based status (`learner-job-service.ts:155-207,209-210`).
- Fix: Preserve discoverability vs apply gate distinction; audit how unqualified targeted jobs appear.

## G2-18-011-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy visible jobs cached with org/college/class/batch/program hierarchy cache key (`JobServiceImpl.java:234-258`).
- vNext now: New learner job list DB query sorted deadline,title,role with no visible in-module cache (`learner-job-service.ts:67-153`).
- Fix: Benchmark new uncached read, keep tenant-scoped deterministic listing and no stale permission cache.

## G2-18-011-016  [P2] GAP  facet F05  effort S
- Legacy: Legacy required hierarchy classId/programId or returns empty (`JobServiceImpl.java:228-232`).
- vNext now: New requires exactly one active program enrollment, retrieves active sections (`learner-job-service.ts:155-175`).
- Fix: Map incomplete hierarchy to exact no-jobs state with setup guidance.

## G2-18-011-050  [P2] GAP  facet F13  effort S
- Legacy: Legacy no org scope returns empty job list, logs warning (`JobServiceImpl.java:179-185,222-231`).
- vNext now: New no active learner placement access denies and no exactly-one enrollment returns empty (`learner-job-service.ts:52-65,155-165`).
- Fix: Restore distinct missing-org/academic-hierarchy empty messages and no-data states.

## G2-18-005-046  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET jobs/all/:learnerId and getApplyChecks for first 100 job IDs. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:39-50`
- vNext now: vNext listLearnerPlacementJobs user context and batch participation/eligibility/held-offer policy. `src/modules/placements/learner-job-service.ts:52-61`, `src/modules/placements/learner-job-service.ts:188-291`
- Fix: Confirm exact first100 cap removed safely; compare job inclusion and block reasons.

## G2-18-005-051  [P2] GAP  facet F11  effort M
- Legacy: Legacy closed/hide drive filtered by isVisible!==false. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:42-47`
- vNext now: vNext only published jobs tied to active company/relationship and targeting. `src/modules/placements/learner-job-service.ts:130-151`
- Fix: Map legacy isVisible semantics to PUBLISHED and explicit targeting for older records.

## G2-3-015-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:15-27`
- vNext now: `src/modules/placements/college-drive-read-service.ts:24-29`, `src/modules/placements/learner-job-service.ts:89-150`
- Fix: Legacy one JPA repository covers learner, college/org and recruiter-drive queries; vNext separates route-scoped Drizzle services, with no shared repository interface. Document caller mapping for every query, preserve visible defaults.

## G2-3-015-010  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:56-63`, `75-97`
- vNext now: `src/modules/placements/learner-job-service.ts:89-150`, `src/modules/placements/college-drive-read-service.ts:77-83`
- Fix: Legacy learner-active and org-active lists are createdAt DESC, vNext learner list sorts applicationDeadline ASC then title; college view defaults query.sort setting with NEWEST/DEADLINE. Align default sort per surface.

## G2-3-015-029  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:41-59`, `75-82`
- vNext now: `src/modules/placements/learner-job-service.ts:132-150`, `src/db/schema/placements.ts:513-619`
- Fix: Legacy active learner-visible job requires active=true,deleted=false,not draft,visibilityType != EXTERNAL_ONLY; vNext PUBLISHED + archivedAt null and related company status, but no external-only visibilityType. Define explicit ATS-only exclusion.

## G2-3-015-039  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:41-59`, `181-188`
- vNext now: `src/modules/placements/learner-job-service.ts:132-150`, `src/modules/placements/college-drive-read-service.ts:27-94`
- Fix: Legacy list naming Active jobs and application-deadline expiry versus vNext Published, Closed and Archived lifecycle terms; ensure old user-facing Status chips map statuses exactly.

## G2-6-010-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy `getVisibleJobsForLearner` checks cache before querying repository `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:218-259`
- vNext now: vNext has no central job-visibility cache call in listLearnerPlacementJobs `src/modules/placements/learner-job-service.ts:52-70` `src/modules/placements/learner-job-service.ts:72-151`
- Fix: Add performance benchmark and document deliberate no-cache policy

## G2-6-010-028  [P2] GAP  facet F19  effort M
- Legacy: Old caches unbounded map of all org/college/hierarchy entries with per-entry TTL `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobVisibilityCache.java:33-49`
- vNext now: New SQL per request joins roles/company/application and policy lists `src/modules/placements/learner-job-service.ts:72-155` `src/modules/placements/learner-job-service.ts:194-205`
- Fix: Benchmark typical 20-college 10k learners, indexes and query plans; consider bounded request cache

## G2-18-013-051  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchCache.java:149-174 reference data failure logs but continues with old/empty labels
- vNext now: src/modules/placements/learner-job-service.ts:155-209 academic scope resolved live
- Fix: Surface stale department/program labels rather than silently omit.

## G2-18-013-055  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchCache.java:180-207 denormalized string department/program columns in snapshot
- vNext now: src/modules/placements/learner-job-service.ts:155-209 joined/enforced cohort, not denormalized names
- Fix: Create authorized lookup only for legacy filter labels without new storage duplication.

## G2-18-023-062  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerEligibilityController.java:84-100 max100 visible requested IDs, ignores hidden
- vNext now: src/modules/placements/learner-job-service.ts:52-155 full learner job list with several scoped joins
- Fix: Bound list/lookup window and paginate without losing pending checks.

## G2-18-023-063  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerEligibilityController.java:90-100 LinkedHashSet deterministic distinct input IDs
- vNext now: src/modules/placements/learner-job-service.ts:149-152,225-287 list sorted deadline/title, not request order
- Fix: For apply-checks preserve first-seen IDs; keep UI drive sort independent.

## G2-18-011-017  [P3] GAP  facet F05  effort S
- Legacy: Legacy returned Job list cache or repository order, no explicit frontend sort contract (`JobServiceImpl.java:234-260`).
- vNext now: New list explicitly sorts applicationDeadline,title,role title ASC (`learner-job-service.ts:149-153`).
- Fix: Verify legacy default order in repo & live list; mark intentional sort change if applicable.

## G2-6-010-005  [P3] GAP  facet F03  effort M
- Legacy: Old cache logs HIT/MISS/INVALIDATED to debug/info `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobVisibilityCache.java:78-83` `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobVisibilityCache.java:110-114`
- vNext now: New learner job list uses no analogous cache logs `src/modules/placements/learner-job-service.ts:52-69`
- Fix: Provide query instrumentation while respecting PII/log verbosity

## G2-6-010-037  [P3] GAP  facet F23  effort M
- Legacy: Old `getCacheSize` and `clearAll` operational debugging hooks `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobVisibilityCache.java:137-152`
- vNext now: New has no cache metrics/maintenance controls `src/modules/placements/learner-job-service.ts:52-70`
- Fix: Add query timing/metrics rather than artificially recreating map
