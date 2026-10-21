# Work packet (wave 2): edit src/modules/placements/saved-job-service.ts

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md, docs/audit/gap2/lane-17/learner-saved-jobs-service.md, docs/audit/gap2/lane-19/learner-saved-job-service.md, docs/audit/gap2/lane-20/learner-saved-job-repository.md, docs/audit/gap2/lane-3/learner-saved-job.md

## G2-14-005-051  [P2] GAP  facet F10  effort S
- Legacy: Legacy saveJob/unsaveJob optimistic UI rollback; vNext POST/DELETE with success-after-server and no optimistic toggle — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:481-515`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:16-29`; `src/modules/placements/saved-job-service.ts:29-69`
- Fix: Flip heart immediately under lock, rollback on API fail, no success toast

## G2-17-011-012  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:51-53 — Repository sorted by createdAt desc before collecting IDs Set; set loses guaranteed order.
- vNext now: src/modules/placements/saved-job-service.ts:75-94 — Ordered savedAt desc and current feed membership; stable sorting tie-break absent.
- Fix: Add savedAt,id tie-break and document order.

## G2-17-011-043  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:51-59 — Two-step get IDs then full jobs, all saved IDs without pagination.
- vNext now: src/modules/placements/saved-job-service.ts:73-95 — SQL ordered select + full feed load, no pagination.
- Fix: Add bounded/paginated saved-list and avoid expensive full-feed scan for large volume.

## G2-19-012-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy saved list returns complete Job entity via getSavedJobs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/LearnerSavedJobService.java:34-36` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:57-63`
- vNext now: vNext list returns id, jobId, savedAt, title after authorized feed filter `src/modules/placements/saved-job-service.ts:72-95`
- Fix: Use authorized job detail/view model when saved tab needs full card content.

## G2-19-012-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy saved Job list contains full Job fields (title, deadlines, targeting) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/LearnerSavedJobService.java:34-36` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:57-63`
- vNext now: vNext saved job list restricts to `{id,jobId,savedAt,title}` `src/modules/placements/saved-job-service.ts:75-82`
- Fix: Render full authorized job cards via feed join; avoid exposing unpublished payload.

## G2-19-012-013  [P2] GAP  facet F05  effort M
- Legacy: Legacy no pagination in saved-jobs service `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/LearnerSavedJobService.java:29-36`
- vNext now: vNext saved jobs returns all rows; browse handles filtering and 20-page UI `src/modules/placements/saved-job-service.ts:73-95` `src/components/placements/learner-jobs-browse.tsx:28-28`
- Fix: Verify savedOnly paging/counts remain correct at >20 saved drives.

## G2-19-012-032  [P2] GAP  facet F13  effort S
- Legacy: Legacy null saved-job service returns 503 on mutation, empty list on read `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:764-765` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:841-842` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:873-874`
- vNext now: vNext installed service calls DB and error handler, no optional disabled-injection pathway `src/modules/placements/saved-job-service.ts:29-53` `src/app/api/placements/learner/saved-jobs/route.ts:7-12`
- Fix: Show feature-unavailable response if storage not provisioned.

## G2-19-012-042  [P2] GAP  facet F19  effort M
- Legacy: Legacy database index by learner and by job; saved list full scan per learner no LIMIT `docs/legacy-source/backend/src/main/resources/db/migration/V44__learner_saved_jobs.sql:2-9` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerSavedJobRepository.java:18-18`
- vNext now: vNext college+membership index and savedAt DESC order, no list cap `src/db/schema/placement-external.ts:93-109` `src/modules/placements/saved-job-service.ts:73-90`
- Fix: Add savedAt sort index/pagination for large bookmarks if needed.

## G2-20-014-001  [P2] GAP  facet F01  effort S
- Legacy: Repository findByLearnerIdAndJobId, exists, delete, list ordered createdAt DESC `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerSavedJobRepository.java:11-18`
- vNext now: New save/unsave/list service scoped current membership/college `src/modules/placements/saved-job-service.ts:29-95`
- Fix: Map old numeric learnerId API to verified membership ID and latest job state

## G2-20-014-007  [P2] GAP  facet F04  effort S
- Legacy: Legacy saved list returns full Job entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:56-63`
- vNext now: New projection only id,jobId,savedAt,title `src/modules/placements/saved-job-service.ts:73-90`
- Fix: Ensure saved job detail information available via separately scoped job route

## G2-20-014-019  [P2] GAP  facet F11  effort S
- Legacy: Legacy list hides deleted jobs only in repository service `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:57-63`
- vNext now: New list also requires PUBLISHED job and current feed `src/modules/placements/saved-job-service.ts:83-94`
- Fix: Explain why saved drafts/expired/untargeted jobs disappear; offer safe archived indicator if allowed

## G2-20-014-030  [P2] GAP  facet F19  effort S
- Legacy: Legacy service loads all matching jobs by ID with no paging `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:56-63`
- vNext now: New reads bookmark rows JOIN job, filters feed in memory `src/modules/placements/saved-job-service.ts:73-95`
- Fix: For large saved sets, scope/paginate DB and feed efficiently

## G2-3-019-009  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:56-64`
- vNext now: `src/modules/placements/saved-job-service.ts:73-95`
- Fix: Legacy saved full Jobs entities including historical nondeleted jobs regardless lifecycle, vNext returns only id/jobId/savedAt/title from published visible feed. Return safe historical role, company, deadline/status metadata.

## G2-3-019-015  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:768-781`
- vNext now: `src/modules/placements/saved-job-service.ts:33-38`
- Fix: Legacy save requires job exists, org access and detailed learner targeting `checkJobVisibility`; vNext requires actual row in listLearnerPlacementJobs, published feed. Preserve equivalent targeting and safe historical save prevention.

## G2-3-019-023  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:830-885`
- vNext now: `src/app/api/placements/learner/saved-jobs/route.ts:7-13`, `src/modules/placements/saved-job-service.ts:73-95`
- Fix: Legacy separate saved IDs and complete saved jobs GET endpoints, recheck visibility per bookmark; vNext one GET returns limited joined items, no IDs-only route. Preserve efficient IDs projection for card badges.

## G2-3-019-028  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:56-64`
- vNext now: `src/modules/placements/saved-job-service.ts:73-95`
- Fix: Legacy getSavedJobs allows nondeleted closed jobs but excludes isDeleted; vNext requires PUBLISHED and learner feed. Match eligibility of read-only expired records or deliberate exemption.

## G2-3-019-038  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerSavedJobRepository.java:18-18`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:57-63`
- vNext now: `src/modules/placements/saved-job-service.ts:73-95`
- Fix: Legacy getSavedJobs loads IDs then findAllById and filters deleted per record (possible unstable order); vNext joins and filters published then loads full visible feed. Query should avoid unnecessarily loading entire feed and preserve predictable savedAt sort.

## G2-3-019-043  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:56-64`
- vNext now: `src/modules/placements/saved-job-service.ts:73-95`
- Fix: Legacy saved historical job data can still render closed rows, vNext only published, current feed. Preserve old nondeleted historical bookmark summaries with precise scope.

## G2-17-011-027  [P3] GAP  facet F10  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:45-64 — isSaved, getSavedJobIds and getSavedJobs are dedicated service methods.
- vNext now: src/modules/placements/saved-job-service.ts:73-95 — Only listOwnPlacementSavedJobs; IDs derived by caller.
- Fix: Reuse one safe list and derive ID Set without extra request.

## G2-19-012-045  [P3] GAP  facet F20  effort S
- Legacy: Legacy unsave repeated DELETE harmless but returns saved:false always `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:38-42` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:817-820`
- vNext now: vNext delete returns removed:false on already absent `src/modules/placements/saved-job-service.ts:56-69`
- Fix: Treat repeated DELETE as idempotent success in UI.

## G2-19-012-046  [P3] GAP  facet F21  effort M
- Legacy: Legacy JPA Spring repositories and Java interface `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/LearnerSavedJobService.java:11-36` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:16-24`
- vNext now: vNext Next route + Zod/Drizzle service `src/modules/placements/saved-job-service.ts:1-11` `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:1-23`
- Fix: Map Java DTO semantics to TypeScript API contract.

## G2-20-014-005  [P3] GAP  facet F03  effort S
- Legacy: Controller response text 'Job saved', 'Job removed from saved' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:784-785,819-820`
- vNext now: New save/unsave service returns row or {removed:boolean} without authored toast `src/modules/placements/saved-job-service.ts:47-69`
- Fix: Map exact toast strings in LearnerJobsBrowse consumer

## G2-20-014-008  [P3] GAP  facet F05  effort S
- Legacy: Ordered by created_at DESC in repository `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerSavedJobRepository.java:18`
- vNext now: Ordered by saved_at DESC but no id tie-breaker `src/modules/placements/saved-job-service.ts:73-90`
- Fix: Add stable id secondary sort to avoid tie order

## G2-20-014-017  [P3] GAP  facet F10  effort S
- Legacy: Unsave deletes by learnerId+jobId and returns void `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:38-43`
- vNext now: New deletes scoped college+member+job returns {removed:boolean} `src/modules/placements/saved-job-service.ts:56-69`
- Fix: Make repeated unsave idempotent and preserve visual false state

## G2-20-014-028  [P3] GAP  facet F18  effort S
- Legacy: Success 'Job saved' and 'Job removed from saved' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:784-785,819-820`
- vNext now: No service-level status string `src/modules/placements/saved-job-service.ts:29-69`
- Fix: Set exact toast labels and cancel old status

## G2-20-014-033  [P3] GAP  facet F21  effort S
- Legacy: Spring JPA repository with entity fetches `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerSavedJobRepository.java:11-18`
- vNext now: PostgreSQL Drizzle and user-scoped job feed `src/modules/placements/saved-job-service.ts:1-9`
- Fix: No external integration; map API compatibility only
