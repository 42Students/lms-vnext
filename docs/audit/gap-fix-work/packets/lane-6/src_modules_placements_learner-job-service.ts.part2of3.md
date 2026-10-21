# Work packet: edit src/modules/placements/learner-job-service.ts (part 2 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u013-job-search-cache.md, docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md, docs/audit/gap2/lane-16/u031-placements-end-to-end.md, docs/audit/gap2/lane-18/job-service-impl.md, docs/audit/gap2/lane-19/job-auto-expiry-service.md, docs/audit/gap2/lane-3/job-repository.md

## G2-18-013-045  [P1] GAP  facet F22  effort L
- Legacy: Legacy Job DB fields numeric org/college, targetDepartmentId/programId, isActive/isDeleted, text CTC; JobSearchDTO.java:19-38;JobSearchCache.java:180-207
- vNext now: vNext placementJobs plus roleOptions, company relationships, UUID scoped references; learner-job-service.ts:68-155
- Fix: Write explicit Job → placementJobs/roleOptions/targeting field and type matrix, no numeric ID reuse

## G2-15-005-067  [P1] GAP  facet F19  effort L
- Legacy: Legacy detail fetch one job visibility and applied check, then other requests as needed (JobDetailContent.jsx:220-278)
- vNext now: VNext fetches entire college published job list plus saved list and historical journey on each detail (jobs/[jobId]/page.tsx:67-73; learner-job-service.ts:67-207)
- Fix: Replace full-feed fetch with ID-scoped permission-checked detail query/targeted stored joins

## G2-15-005-074  [P1] GAP  facet F22  effort L
- Legacy: Legacy job is numeric ID, has driveMode, roleOptionsJson, candidatePreferences, JD URL and eligibility visibility (JobDetailContent.jsx:220-237,635-686,1135-1153,1256-1269)
- vNext now: VNext UUID job+roleOption, company relationship and eligibility policies, no legacy driveMode/JD projected to item (jobs/[jobId]/page.tsx:13-57; learner-job-service.ts:67-88)
- Fix: Document and implement per-field mapping with exact fallback and jurisdiction/tenant scope

## G2-16-031-095  [P1] GAP  facet F22  effort L
- Legacy: ApplyGate.java:93-110 uses legacy placement_registration and pre-invite historical application choice.
- vNext now: placements.ts:973-1109 uses placement_applications and history; learner-job-service.ts:176-187 uses placement_batch_registrations.
- Fix: Map grandfathered registration markers and historical application dates before enabling self-apply gate.

## G2-18-011-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy calendar includes visible + already-applied jobs even after deadline (`JobServiceImpl.java:1505-1539`).
- vNext now: New learner jobs listing only currently PUBLISHED/unarchived, regardless application history (`learner-job-service.ts:130-148`); own applications listed separately (`application-service.ts:955-1010`).
- Fix: Union authorized own-application dates into learner career calendar independently of live job listing.

## G2-18-011-018  [P1] MISSING  facet F05  effort M
- Legacy: Legacy learner calendar GET important date events constrained start/end inclusive (`JobServiceImpl.java:1472-1495,1545-1572`).
- vNext now: New visible-job list returns job rows, no important-date range query in mapped service (`learner-job-service.ts:52-153`).
- Fix: Expose bounded learner important-date query, include own submitted/archived jobs.

## G2-18-011-044  [P1] GAP  facet F12  effort M
- Legacy: Legacy all org-wide untargeted jobs visible when hierarchy complete (`JobServiceImpl.java:340-368`).
- vNext now: New job listing is college-specific and requires active one enrollment and section matching (`learner-job-service.ts:130-175`).
- Fix: Confirm intended per-college visibility versus legacy org-wide untargeted jobs.

## G2-19-011-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy cron at 01:00 server-time deactivates expired job rows, no UI route `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:14-17` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:33-41`
- vNext now: vNext learner view computes deadlinePassed per request rather than invoking this worker `src/modules/placements/learner-job-service.ts:257-287` `src/modules/placements/application-deadline-policy.ts:10-14`
- Fix: Record lifecycle choice: persist auto expiry or consistently derive application closure.

## G2-19-011-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy active job query omits `isActive=false` once sweep persisted `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:41-61` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-63`
- vNext now: vNext learner list retains PUBLISHED jobs and disables Apply after deadline `src/modules/placements/learner-job-service.ts:133-151` `src/modules/placements/learner-job-service.ts:257-287`
- Fix: Decide hidden vs view-only expired drives and match all entry points.

## G2-19-011-057  [P1] GAP  facet F22  effort M
- Legacy: Legacy expiry repository predicate excludes inactive/soft deleted/draft `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:185-188`
- vNext now: vNext requires status PUBLISHED and archivedAt IS NULL for active queries `src/modules/placements/learner-job-service.ts:133-140`
- Fix: Preserve draft/deleted exclusion in all read and write paths.

## G2-3-015-022  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:29-39`
- vNext now: `src/modules/placements/job-service.ts:478-487`, `src/modules/placements/learner-job-service.ts:89-150`
- Fix: Legacy apply locks job row immediately before application write, serializes with soft delete; vNext job write paths lock on publish/close but learner read list not proof application apply always locks. Verify apply transaction row locking and enforce.

## G2-6-027-010  [P1] GAP  facet F05  effort M
- Legacy: GET /active accepts page default0 and size default50 clamped1..100, computes bounded sublist (JobController.java:108-132).
- vNext now: GET /jobs/me accepts no paging/search query and returns whole filtered collection (jobs/me/route.ts:8-14; learner-job-service.ts:67-153,225-291).
- Fix: Implement stable DB-backed page, size max100 and total count for large learner drive feeds.

## G2-6-027-063  [P1] GAP  facet F23  effort M
- Legacy: Legacy optional resume URL, status history DTO, saved IDs and explicit feedback strings are part of controller API (JobController.java:395-405,475-483,830-852).
- vNext now: vNext intentional UUID/role-based feed and strict action schemas differ (validation.ts:659-672; learner-job-service.ts:78-88).
- Fix: List separately approved removals vs regressions; obtain owner decision for resume and status history parity.

## G2-6-010-004  [P1] GAP  facet F02  effort M
- Legacy: Old cache key is `visibility:org:college:class:batch:program` `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobVisibilityCache.java:60-67`
- vNext now: New SQL scope is collegeId + active enrollment cohort/program/sections `src/modules/placements/learner-job-service.ts:124-200`
- Fix: Create mapping test for old targeting dimensions, especially class versus sections

## G2-6-010-006  [P1] GAP  facet F04  effort M
- Legacy: Old key includes nullable organizationId and collegeId/learner hierarchy IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobVisibilityCache.java:60-67`
- vNext now: New memberships use college UUID and enrollments cohort/program/section IDs `src/modules/placements/learner-job-service.ts:52-60` `src/modules/placements/learner-job-service.ts:159-193`
- Fix: Document precise schema ID translation and edge cases

## G2-6-010-008  [P1] GAP  facet F05  effort M
- Legacy: Old visible jobs loaded org-wide active, then hierarchy filter in memory `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:246-259`
- vNext now: New SQL where published, same college, active company/relationship, then targeting filter `src/modules/placements/learner-job-service.ts:128-151` `src/modules/placements/learner-job-service.ts:200-208`
- Fix: Test org-wide jobs targeting all colleges and cross-college visibility explicitly

## G2-6-010-010  [P1] GAP  facet F05  effort M
- Legacy: Old visibility list deadline filter excludes passed deadline entirely `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:329-334`
- vNext now: New list retains published jobs but marks `deadlinePassed` when building cards `src/modules/placements/learner-job-service.ts:255-285`
- Fix: Decide expired-card visibility versus old list exclusion, preserve apply block

## G2-6-010-034  [P1] GAP  facet F22  effort M
- Legacy: Old Job entity and targeting relies on orgId,collegeId,classId,batchId,programId `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobVisibilityCache.java:60-67` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:340-360`
- vNext now: New placementJobs and placementJobEligibilityPolicies reference membership college/cohort/program/section `src/modules/placements/learner-job-service.ts:124-200`
- Fix: Record migration mapping class/batch/program to cohort/section and verify all targeting policies

## G2-18-023-061  [P1] GAP  facet F19  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:112-164 bulk evaluateAll one marks/batch read, no per-student N+1
- vNext now: src/modules/placements/learner-job-service.ts:220-255 per-job promise memo but loads eligibility individually
- Fix: Implement batched eligibility SQL across all displayed jobs and one candidate read.

## G2-18-023-066  [P1] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerEligibilityController.java:38-39,69-77 Spring ApplyGate reused for list and apply
- vNext now: src/modules/placements/learner-job-service.ts:270-287 assembled blocker model
- Fix: Synchronize write-path checks with read model and revalidate under locks.
