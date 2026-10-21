# Work packet (wave 2): edit src/modules/placements/job-service.ts (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-14/u015-job-lifecycle-status.md, docs/audit/gap2/lane-17/job-search-controller.md, docs/audit/gap2/lane-17/placement-job-service.md, docs/audit/gap2/lane-19/job-auto-expiry-service.md

## G2-10-012-054  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:136-139 — Successful GET returning no job renders null main content.
- vNext now: src/modules/placements/job-service.ts:73-83 — No job throws PLACEMENT_JOB_NOT_FOUND, handled by shared error route.
- Fix: Show scoped not-found empty and Navigate to Drives action.

## G2-10-012-078  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:181-223 — CompanyAvatar relies on job.companyName/companyLogo stored/displayed on legacy Job.
- vNext now: src/components/placements/placement-drive-workspace.tsx:269-280; src/modules/placements/job-service.ts:73-83 — Normalized placement company relationships; header uses resolved company name, no logo.
- Fix: Join/store trusted company logo and render no-fetch initials fallback.

## G2-10-012-080  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:20-41,74-90,119-131 — Job table numeric ID with separate isDraft/isActive, applicationDeadline and organization/college.
- vNext now: src/db/schema/placements.ts:560-760; src/modules/placements/job-service.ts:73-83 — UUID job, single status enum, relationship/season normalization; no equivalent dual legacy flags.
- Fix: Provide explicit legacy job status mapping including expired independent of state.

## G2-14-011-001  [P2] GAP  facet F01  effort M
- Legacy: Organization-scoped admin job and application endpoints rooted /api/v1/admin/placement/jobs `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:46-51` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:139-170`
- vNext now: New separated jobs, college applications and TPO pipeline services `src/modules/placements/job-service.ts:86-150` `src/modules/placements/tpo-applicant-pipeline-service.ts:13-30`
- Fix: Map all old endpoints to canonical new routes per role

## G2-14-011-003  [P2] GAP  facet F01  effort M
- Legacy: Jobs list includes org drafts and closed jobs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:190-215`
- vNext now: New list excludes archived jobs and sorts by title `src/modules/placements/job-service.ts:86-133`
- Fix: Expose scoped archived/closed list with legacy navigation

## G2-14-011-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy controller order jobs list/create/update/status/delete then applications and reports `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:139-170` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:205-391` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:446-514` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:579-903`
- vNext now: New lifecycle draft/publish/close/archive and separate actions `src/modules/placements/job-service.ts:150-270` `src/modules/placements/job-service.ts:417-530` `src/modules/placements/job-service.ts:616-765`
- Fix: Keep corresponding navigation and section hierarchy

## G2-14-011-006  [P2] GAP  facet F03  effort S
- Legacy: Jobs listing carries applicantCount and applicationCount `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:199-214`
- vNext now: New listing returns job/company/season without count projection `src/modules/placements/job-service.ts:95-134`
- Fix: Include per-job counts with withdrawn behavior specified

## G2-14-011-007  [P2] GAP  facet F03  effort S
- Legacy: Company name/logo hydrated from company link `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:114-140`
- vNext now: New joins placement company through relationship `src/modules/placements/job-service.ts:95-126`
- Fix: Match logo/name data placeholders using join

## G2-14-011-019  [P2] GAP  facet F06  effort M
- Legacy: Create defaults screeningVersion v1 and prevents client ID/version overwrite `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:239-267`
- vNext now: New Zod typed create generates ID and primary role `src/modules/placements/job-service.ts:150-270` `src/modules/placements/validation.ts:285-348`
- Fix: Document screening-version mapping and forbid client ID overrides

## G2-14-011-023  [P2] GAP  facet F06  effort S
- Legacy: Draft true always forces isActive false; postedDate server set `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:241-267`
- vNext now: New create enters DRAFT and has stored timestamps `src/modules/placements/job-service.ts:202-234`
- Fix: Map legacy isDraft/isActive and created/published dates

## G2-14-011-024  [P2] GAP  facet F06  effort M
- Legacy: Deadline derived from importantDates Application deadline label `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:269-283` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:649-689`
- vNext now: New standalone applicationDeadline used to publish `src/modules/placements/validation.ts:307-309` `src/modules/placements/job-service.ts:466-469`
- Fix: Map importantDates deadlines and preserve other milestone labels

## G2-14-015-036  [P2] GAP  facet F15  effort M
- Legacy: Legacy isOpenForApplications used for learner visibility `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:57-59`
- vNext now: New published status also checks eligibility in job service `src/modules/placements/job-service.ts:417-530`
- Fix: Align drive visibility/learner messaging after closed/reopened state

## G2-17-013-019  [P2] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:414-432 — Exists checks title ignoring case across 10000 cached org jobs.
- vNext now: src/modules/placements/job-service.ts:86-135 — List jobs by college; no exists-title endpoint.
- Fix: Offer scoped uniqueness lookup if used for create flow.

## G2-17-013-030  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:390-432 — GET stats/exists performs cache reads.
- vNext now: src/modules/placements/job-service.ts:86-135 — DB list service, no per-route cache stats/exists.
- Fix: Implement scoped counts/exists from DB with indexes.

## G2-17-012-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:18-68 — Service groups list/get/create/update/open-close/delete.
- vNext now: src/modules/placements/job-service.ts:86-150 — vNext list/get/create plus publish/close/cancel/archive transitions.
- Fix: Present legacy action grouping and map transition differences.

## G2-17-012-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:23-31 — Returns full Job entities; org ID integer and job ID integer.
- vNext now: src/modules/placements/job-service.ts:86-145 — Returns normalized UUID placementJob objects under college scope.
- Fix: Map ID/field semantics for reports and old deep links.

## G2-17-012-044  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:154-172 — Job creation schedules after-commit hook for side effects.
- vNext now: src/modules/placements/job-service.ts:205-271 — Creation uses transaction with activity event.
- Fix: Compare after-commit notifications and cache invalidation to event consumers.

## G2-19-011-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy operator only sees log lines on completion `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:64-70`
- vNext now: vNext manual close has activity event summary visible to staff `src/modules/placements/job-service.ts:669-688`
- Fix: Record expiry-specific audit log/event, not a manual-close event.

## G2-19-011-035  [P2] GAP  facet F13  effort M
- Legacy: Legacy exceptions caught, logged and return normally `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-73`
- vNext now: vNext manual close transaction throws structured failures `src/modules/placements/job-service.ts:651-654`
- Fix: Report scheduler failures via operation alert/metrics instead of silent return.

## G2-19-011-036  [P2] GAP  facet F13  effort L
- Legacy: Legacy per-job error does not abort loop `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-69`
- vNext now: vNext transactional close acts on one job only `src/modules/placements/job-service.ts:616-695`
- Fix: Batch sweep should isolate failures per job and retry without duplicates.

## G2-2-016-001  [P2] GAP  facet F01  effort L
- Legacy: Legacy college admin Job service owns list/create/edit/delete and application status mutations (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:161-290,433-583,998-1079,1217-1452`)
- vNext now: VNext splits job lifecycle, TPO edit, application service, bulk actions into separate routes (`src/modules/placements/job-service.ts:86-766; src/modules/placements/tpo-drive-edit-service.ts:10-127; src/modules/placements/tpo-bulk-application-stage-service.ts:27-110`)
- Fix: Map navigation routes and matching action availability by College Admin/TPO roles

## G2-2-016-003  [P2] GAP  facet F02  effort M
- Legacy: Paged job list sorted postedDate desc or applicationDeadline (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:186-239`)
- vNext now: VNext job list by tenant company/season with order and filter via modern UI (`src/modules/placements/job-service.ts:86-135`)
- Fix: Restore exact initial sort and table status grouping

## G2-2-016-005  [P2] GAP  facet F03  effort M
- Legacy: Bulk job status API provides updated/skipped counts (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:253-290`)
- vNext now: VNext separate visibility and drive lifecycle controls (`src/modules/placements/tpo-drive-lifecycle-service.ts:122-148; src/modules/placements/job-service.ts:616-735`)
- Fix: Display bulk count and skipped IDs with exact per-row outcomes

## G2-2-016-006  [P2] GAP  facet F03  effort M
- Legacy: Job deletion impact preview includes linked applications (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:963-997`)
- vNext now: VNext archive flow and separate cancellation impact (`src/modules/placements/job-service.ts:735-766; src/modules/placements/tpo-drive-cancel-service.ts:38-79`)
- Fix: Match impact preview and distinguish cancel vs archive before action

## G2-2-016-007  [P2] GAP  facet F04  effort L
- Legacy: Legacy Job has companyName/companyLogo, org and college, targeting and eligibility flags (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:433-531`)
- vNext now: VNext uses canonical placementCompanies/relationships/job policy/roles (`src/modules/placements/job-service.ts:40-84; src/db/schema/placements.ts:23-154`)
- Fix: Document field-to-field read model and maintain company display from canonical source

## G2-2-016-011  [P2] GAP  facet F05  effort M
- Legacy: Legacy job paged list searches string and filters status (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:186-235`)
- vNext now: VNext get placement jobs returns scoped rows with UI-layer filters (`src/modules/placements/job-service.ts:86-135`)
- Fix: Match casefold, wildcard escaping, default page size and filter state

## G2-2-016-036  [P2] GAP  facet F14  effort M
- Legacy: Legacy deletion handles attachment references and learner notifications (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:998-1079`)
- vNext now: VNext archive/cancel triggers domain-specific cleanup; no same raw offer-letter URL mutation (`src/modules/placements/job-service.ts:699-766`)
- Fix: Document file retention policy and safe signed-link expiry

## G2-2-016-042  [P2] MISSING  facet F18  effort S
- Legacy: Specific collision error after 50 tries, exact string (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:495-505`)
- vNext now: No `smr-` job slug generator in VNext job creation (`src/modules/placements/job-service.ts:150-272`)
- Fix: Restore meaningful external-link error semantics if external slug capability is required

## G2-2-016-050  [P2] GAP  facet F21  effort L
- Legacy: Legacy events ApplicationStatusChangedEvent and notifications published after status change (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1418-1445`)
- vNext now: VNext activityEvents emitted within transactions, notification dispatch separate (`src/modules/placements/job-service.ts:150-272`)
- Fix: Map event type, deduplication and after-commit side effects, avoid email before commit

## G2-2-016-058  [P2] GAP  facet F01  effort M
- Legacy: Legacy jobs list is shared Super Admin/College Admin and can show a scoped college selector `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:45-64`
- vNext now: New tenant-specific placement jobs list gets college from context and UUID `src/modules/placements/job-service.ts:86-95`
- Fix: Preserve role-appropriate college selector, named scope and remembered filter state

## G2-2-016-068  [P2] GAP  facet F04  effort M
- Legacy: Job DTO exposes raw companyName, companyLogo, jobTitle and description up to 5000 chars `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:29-51`
- vNext now: Job query joins canonical company, season and job values; description schema allows 15000 `src/modules/placements/job-service.ts:95-133`
- Fix: Map company display/logo and explicitly decide description max length policy

## G2-2-016-075  [P2] GAP  facet F05  effort M
- Legacy: Legacy job page persists q/status/page/size and accepts 10,20,50,100 page sizes `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:95-116`
- vNext now: Mapped basic listing has no these query args; listing ignores client page options `src/modules/placements/job-service.ts:86-135`
- Fix: Persist and validate query page/size/search/status across back/refresh

## G2-2-016-110  [P2] GAP  facet F10  effort M
- Legacy: POST /{jobId}/status changes isActive flag on job `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:401-439`
- vNext now: New close changes status PUBLISHED to CLOSED and records closedAt `src/modules/placements/job-service.ts:616-639`
- Fix: Map isActive lifecycle semantics and status time to new typed state

## G2-3-015-015  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:148-171`
- vNext now: `src/modules/placements/tpo-delete-draft-service.ts:12-43`, `src/modules/placements/job-service.ts:740-766`
- Fix: Legacy deletes job by ID via isActive=false,isDeleted=true,version bump; vNext TPO draft delete accepts expected version and only DRAFT, archives row. Match caller-facing confirmation and reject unsupported delete.

## G2-3-015-030  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:99-102`
- vNext now: `src/modules/placements/job-service.ts:74-76`
- Fix: Legacy active-by-id excludes draft/soft-deleted but does not additionally filter EXTERNAL_ONLY, unlike list query. VNext generic loadJob no such filter. Enforce policy on per-role read route.

## G2-3-015-034  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:99-112`
- vNext now: `src/modules/placements/job-service.ts:74-76`, `src/modules/placements/tpo-delete-draft-service.ts:19-22`
- Fix: Legacy deleted-inclusive org lookup returns stored job for history even after deletion, vNext archive lookup may fail active routes; preserve read-only archived history.

## G2-13-019-021  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:348-356`
- vNext now: `src/modules/placements/job-service.ts:235-251`
- Fix: Legacy one-entity save with JSON role options; vNext separate job and role option writes.

## G2-13-019-027  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:269-275`
- vNext now: `src/modules/placements/job-service.ts:277-318`
- Fix: Stale JPA @Version handling differs from service status and timestamp concurrency checks.

## G2-13-019-028  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:43-48`
- vNext now: `src/modules/placements/job-service.ts:46-69`
- Fix: Old unlinked companyName valid, vNext creation depends on an ACTIVE college-company relationship.

## G2-13-019-041  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:269-275`
- vNext now: `src/modules/placements/job-service.ts:277-318`
- Fix: Legacy JPA version lock vs vNext status/date optimistic checks across multiple rows.
