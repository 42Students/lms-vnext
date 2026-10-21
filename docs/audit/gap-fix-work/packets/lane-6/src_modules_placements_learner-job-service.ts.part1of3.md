# Work packet: edit src/modules/placements/learner-job-service.ts (part 1 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md, docs/audit/gap2/lane-14/learner-placement-jobs.md, docs/audit/gap2/lane-15/l18-u013-job-search-cache.md

## G2-18-023-001  [P1] GAP  facet F01  effort M
- Legacy: GET `/api/v1/learner/drives/{jobId}/eligibility`, `/apply-check`, bulk `/apply-checks`, `/placement-rules`, `/{jobId}/company-preview`, `/calendar-extras`; LearnerEligibilityController.java:59-155
- vNext now: vNext server read paths for job detail, rules page, and calendar, no one-to-one legacy six-endpoint REST surface in inspected mapped modules; learner-job-service.ts:41-292; learn/my-placements/rules/page.tsx:8-136; calendar/page.tsx:10-38
- Fix: Write endpoint-to-server-action/route contract matrix, including preview/extras absences and authorized fallback.

## G2-18-023-007  [P1] GAP  facet F04  effort M
- Legacy: Apply-check JSON `canApply,code,reason,action` from one gate; ApplyGate.java:38-46
- vNext now: vNext job list returns canApply, blockers array, role option eligibility + deadline; learner-job-service.ts:245-290
- Fix: Expose canonical denial codes and one actionable CTA; avoid page / server divergence.

## G2-18-023-008  [P1] GAP  facet F04  effort L
- Legacy: Bulk apply-check keyed by integer drive ID; omits invisible, max100; LearnerEligibilityController.java:79-100
- vNext now: vNext UUID job/role-option records via listLearnerPlacementJobs, eligibility per job cached; learner-job-service.ts:85-120,226-291
- Fix: Implement batched mapped canApply checks with explicit max100 and invisible-job omission for list and home.

## G2-18-023-012  [P1] GAP  facet F05  effort L
- Legacy: Bulk apply-checks deduplicates IDs via LinkedHashSet, truncates 100, omits hidden; LearnerEligibilityController.java:84-100
- vNext now: vNext learner list loops targeted rows and checks Promise per job, no public `ids` batch filter; learner-job-service.ts:192-292
- Fix: Avoid O(drives) serial/duplicate evaluate overhead, enforce 100 and stable requested ordering.

## G2-18-023-023  [P1] GAP  facet F10  effort L
- Legacy: Single eligibility uses EligibilityService.evaluate, apply-check uses ApplyGate.check with same rule check; LearnerEligibilityController.java:59-77; ApplyGate.java:31-82
- vNext now: vNext evaluatePlacementEligibility plus canShowLearnerSelfApply / blockers; learner-job-service.ts:240-290
- Fix: Centralize read & write gate, verify write service applies registration/held-offer/finished batch consistently.

## G2-18-023-024  [P1] GAP  facet F10  effort M
- Legacy: Bulk applyChecks excludes hidden drives after guard and returns per-drive map; LearnerEligibilityController.java:84-100
- vNext now: VNext broad job list filters visible and produces per-role options, no direct batch JSON; learner-job-service.ts:75-290
- Fix: Build internal bulk response keyed drive ID with per-role decisions; prevent inflated open-job counts.

## G2-18-023-031  [P1] GAP  facet F12  effort M
- Legacy: Legacy full apply gate order drive published, participation, registration, batch finished, eligibility, held offers; ApplyGate.java:45-88
- vNext now: VNext list assembles participation/debarment, registration, evidence, offer cap; learner-job-service.ts:44-76,182-291
- Fix: Produce ordered denial code table for all eight legacy codes and newer debarment exception, test same as apply POST.

## G2-18-023-041  [P1] GAP  facet F19  effort L
- Legacy: Batch apply-check max 100, dedup input and skip unseen; LearnerEligibilityController.java:79-100
- vNext now: New per-job promise cache with list query over all visible roles; learner-job-service.ts:192-290
- Fix: Implement bounded batch gate to avoid N+1 eligibility/marks and large list latency.

## G2-14-005-050  [P1] GAP  facet F10  effort L
- Legacy: Legacy parallel getAllJobsWithEligibility, saved ids, saved jobs, learner applications and follow-up getApplyChecks (100); vNext direct authorized DB joins one server fetch+saved jobs — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:385-449`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-63`; `src/modules/placements/learner-job-service.ts:52-89`; `src/modules/placements/saved-job-service.ts:72-95`
- Fix: Ensure equivalence of active visibility, applications stage and held offers in one service

## G2-14-005-056  [P1] GAP  facet F12  effort M
- Legacy: Legacy status closed includes job.isActive false OR expired deadline; vNext source only PUBLISHED and deadlinePassed with status at job level — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:144-151,658-662`
- vNext now: `src/modules/placements/learner-job-service.ts:131-153`; `src/modules/placements/learner-jobs-browse-model.ts:54-58`
- Fix: Show past closed saves and approved nonactive historical jobs where access permitted

## G2-14-005-087  [P1] GAP  facet F22  effort L
- Legacy: Legacy one job listing object with free-form ctcRange/location/jobType; vNext normalized job + roleOption, company and application join — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:132-151,220-245`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:12-56`; `src/modules/placements/learner-job-service.ts:67-89`
- Fix: Provide typed translation of all legacy card fields per role and group legacy job cards

## G2-14-005-089  [P1] GAP  facet F22  effort M
- Legacy: Legacy applicationStage from job.applicationStatus; vNext placementApplications.status plus eligibility, different enum semantics — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:418-431`
- vNext now: `src/modules/placements/learner-job-service.ts:78-88`; `src/components/placements/learner-placement-jobs.tsx:286-293`
- Fix: Map statuses to legacy application-stage chip vocabulary

## G2-18-013-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy JobSearchCache initializes on service startup and backs /api/v2/jobs/search and category/popular endpoints; JobSearchCache.java:32-63;JobSearchController.java:37-41,121-139
- vNext now: vNext learner /learn/placements and /api/placements/jobs, TPO drives screens, no matching /api/v2/jobs/search route identified; src/app/api/placements/jobs/route.ts:12-19;src/modules/placements/learner-job-service.ts:52-67
- Fix: Inventory legacy callers of /api/v2/jobs/* and map to new role/tenant-scoped endpoints before removing compatibility

## G2-18-013-008  [P1] GAP  facet F04  effort L
- Legacy: Legacy DTO fields id, title, companyName/companyLogo, description/responsibilities, type/location, CTC, dates, active, org/college, target department/program IDs/names; JobSearchDTO.java:19-38;JobSearchCache.java:188-207
- vNext now: vNext placementJobs, role options, company separate joined models; learner-job-service.ts:68-155
- Fix: Create per-field DTO adapter with safe datetime/CTC, target names and explicit unavailable semantics

## G2-18-013-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy departmentCache loads all Department names by ID and programCache filters deleted NewProgram; JobSearchCache.java:148-175
- vNext now: vNext program/section targeting resolves learner active enrollments, role options; learner-job-service.ts:155-209
- Fix: Verify program/department naming consistency across legacy old and vNext new academic model

## G2-18-013-022  [P1] GAP  facet F10  effort L
- Legacy: Legacy source includes all active and not deleted jobs from JobRepository.findAllActiveJobs; JobSearchCache.java:121-135;JobRepository.java:42-74
- vNext now: vNext learner only published non-archived active-company jobs in membership college; learner-job-service.ts:130-149
- Fix: Declare new source of truth and map old isActive/isDeleted into published/archived semantics

## G2-18-013-029  [P1] GAP  facet F12  effort M
- Legacy: Legacy category from jobType, active jobs only; JobSearchCache.java:109-111,121-135
- vNext now: vNext published jobs and active roleOptions; learner-job-service.ts:90-103,130-149
- Fix: Define mapping of status/jobType to roleOption employmentType, validate null

## G2-18-013-030  [P1] GAP  facet F13  effort M
- Legacy: Legacy no jobs yields empty list; loadJobs silently catches backend errors; JobSearchCache.java:116-143
- vNext now: vNext filter returns [] for no active enrollment or no matched rows; learner-job-service.ts:155-165,200-209
- Fix: Distinguish no placement access/enrollment from genuinely no jobs, preserve actionable empty-state explanation

## G2-18-013-038  [P1] GAP  facet F19  effort L
- Legacy: Legacy loads all jobs+reference data in process memory at startup, partitions per organization; JobSearchCache.java:52-63,116-175
- vNext now: vNext DB query by college and client-side filtering of returned jobs; learner-job-service.ts:52-155;learner-jobs-browse-model.ts:88-146
- Fix: Benchmark 10k concurrent users and large college jobs; add server paging/search if list grows, no global cache leakage

## G2-18-013-044  [P1] GAP  facet F21  effort M
- Legacy: Legacy cache depends DepartmentRepository, NewProgramRepository, JobRepository and GenericSearchCache; JobSearchCache.java:6-11,36-50
- vNext now: vNext PostgreSQL joins on placementJobs, companies, roleOptions and policies; learner-job-service.ts:68-209
- Fix: Map joins/indexes and cache removal effects for load and publish
