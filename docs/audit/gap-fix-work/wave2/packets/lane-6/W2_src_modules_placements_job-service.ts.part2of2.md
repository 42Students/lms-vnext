# Work packet (wave 2): edit src/modules/placements/job-service.ts (part 2 of 2)

35 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-drive-controller.md, docs/audit/gap2/lane-5/u013-admin-job-service.md, docs/audit/gap2/lane-8/admin-job-service.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md, docs/audit/gap2/lane-19/job-auto-expiry-service.md

## G2-3-023-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:93-182`
- vNext now: `src/modules/placements/job-service.ts:150-272`, `src/modules/placements/tpo-drive-lifecycle-service.ts:154-234`
- Fix: Legacy twelve CRUD/lifecycle actions under one controller now split across job, request, lifecycle and deadline routes. Add routing parity matrix.

## G2-3-023-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:77-90`
- vNext now: `src/modules/placements/job-service.ts:150-272`
- Fix: Persist shared lastSaver name/id/time; local browser draft timestamp alone cannot represent who last edited server draft.

## G2-3-023-019  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:101-110`
- vNext now: `src/modules/placements/job-service.ts:272-417`
- Fix: Legacy update audit throttles once per actor/drive/10min; verify VNext update activity does not over-log autosaves.

## G2-3-023-024  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:72-74`
- vNext now: `src/modules/placements/job-service.ts:136-149`
- Fix: Ensure authorized canceled/archived job details remain read-only and preserve historical owner scope.

## G2-3-023-037  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:56-61`
- vNext now: `src/modules/placements/job-service.ts:254-265`, `src/components/placements/placement-job-create-form.tsx:645-651`
- Fix: Legacy audit codes and Last saved by not displayed with same copy as VNext draft created/local-draft messages.

## G2-3-023-040  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:101-110`
- vNext now: `src/modules/placements/job-service.ts:272-417`
- Fix: Check how browser draft autosave and remote edits affect audit volume and update freshness.

## G2-3-023-044  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:93-182`
- vNext now: `src/modules/placements/job-service.ts:150-765`, `src/modules/placements/tpo-drive-lifecycle-service.ts:154-234`
- Fix: Ensure activity/outbox events from each VNext lifecycle action cover legacy audit/notification event set.

## G2-5-013-001  [P2] GAP  facet F01  effort M
- Legacy: The legacy AdminJobService interface is called by admin Job controller for college-owned drive management (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:112-200`)
- vNext now: vNext splits drive lifecycle and listing into scoped placement module (`src/modules/placements/job-service.ts:86-165`)
- Fix: Publish complete method-to-page route matrix for college admins and TPOs

## G2-5-013-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy resolveJobContext answers organization/college context of numeric ID (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:75-77`)
- vNext now: vNext loadJob derives scope from UUID and request context (`src/modules/placements/job-service.ts:73-85`)
- Fix: Map legacy ID resolution to tenant-scoped UUID route without exposing cross-college details

## G2-5-013-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy flow groups create, edit, deadline extension and soft deletion under one admin service (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:39-55`)
- vNext now: vNext separate create/update/publish/close/cancel/archive actions (`src/modules/placements/job-service.ts:150-766`)
- Fix: Restore legacy action grouping in consuming UI without collapsing safe persistence boundaries

## G2-5-013-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy public list emits job metadata and computed applicationCount/applicantCount (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:293-305`)
- vNext now: vNext list select returns job and company, season but not same synthetic counters (`src/modules/placements/job-service.ts:95-135`)
- Fix: Project correct application counters and badges in list API and page

## G2-5-013-012  [P2] GAP  facet F05  effort M
- Legacy: Legacy job list search matches job title/company substring case insensitive (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:21-25`)
- vNext now: vNext listPlacementJobs has no search argument; only collegeId (`src/modules/placements/job-service.ts:86-95`)
- Fix: Implement server-side search and typeahead filtering with quoted wildcard escaping

## G2-5-013-013  [P2] GAP  facet F05  effort M
- Legacy: Legacy list sort postedDate or applicationDeadline asc/desc with createdAt tie-break (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:219-229`)
- vNext now: vNext listPlacementJobs lacks sort params (`src/modules/placements/job-service.ts:86-95`)
- Fix: Expose both sortable keys and stable createdAt tie-break

## G2-5-013-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy bulk open/close drives cap defaults to 100 and returns updated/failed rows (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:31-37`)
- vNext now: vNext job-service exports per-job close and cancel methods, no bulk method in same module (`src/modules/placements/job-service.ts:616-735`)
- Fix: Add bulk preview/apply with partial failures and 100 cap, if not elsewhere already implemented

## G2-5-013-030  [P2] GAP  facet F10  effort M
- Legacy: Legacy getAllJobs unbounded loads all college jobs then filters external-only (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:160-181`)
- vNext now: vNext listPlacementJobs fetches scoped jobs including normalized application modes (`src/modules/placements/job-service.ts:86-135`)
- Fix: Match external-only visibility and separate All Drives from LMS-visible jobs

## G2-5-013-031  [P2] GAP  facet F10  effort M
- Legacy: Legacy paginated list getAllJobsPaginated supports status+sort+search (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:18-29`)
- vNext now: vNext listPlacementJobs accepts only context and college ID (`src/modules/placements/job-service.ts:86-95`)
- Fix: Implement paginated endpoint with filter contract

## G2-5-013-032  [P2] GAP  facet F10  effort L
- Legacy: Legacy bulkUpdateJobStatus loops per job and invalidates visibility cache after one successful batch (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:252-290`)
- vNext now: vNext closePlacementJob is one-job transaction (`src/modules/placements/job-service.ts:616-641`)
- Fix: Provide safe transaction/partial-failure semantics and one invalidation event

## G2-5-013-034  [P2] GAP  facet F10  effort M
- Legacy: Legacy createJob sets org,college,createdBy and defaults visibility (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:433-488`)
- vNext now: vNext createPlacementJob enforces active season and company relationship (`src/modules/placements/job-service.ts:150-175`)
- Fix: Record changed defaults and required inputs for old job import/parity

## G2-5-013-043  [P2] GAP  facet F10  effort M
- Legacy: Legacy getJobBySlug fetches a job via public slug (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:75-75`)
- vNext now: vNext getPlacementJob expects placementJobIdSchema UUID (`src/modules/placements/job-service.ts:136-149`)
- Fix: Expose approved public slug lookup and redirect

## G2-5-013-073  [P2] GAP  facet F18  effort M
- Legacy: Legacy UI contract labels All Drives and methods fields postedDate/applicationDeadline (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:18-29`)
- vNext now: vNext job-service uses title/applicationDeadline and seasonal records (`src/modules/placements/job-service.ts:86-135`)
- Fix: Match field labels and list copy to legacy catalogue in UI pages

## G2-8-012-001  [P2] GAP  facet F01  effort L
- Legacy: Legacy college admin Job service owns list/create/edit/delete and application status mutations (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:161-290,433-583,998-1079,1217-1452`)
- vNext now: VNext splits job lifecycle, TPO edit, application service, bulk actions into separate routes (`src/modules/placements/job-service.ts:86-766; src/modules/placements/tpo-drive-edit-service.ts:10-127; src/modules/placements/tpo-bulk-application-stage-service.ts:27-110`)
- Fix: Map navigation routes and matching action availability by College Admin/TPO roles

## G2-8-012-003  [P2] GAP  facet F02  effort M
- Legacy: Paged job list sorted postedDate desc or applicationDeadline (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:186-239`)
- vNext now: VNext job list by tenant company/season with order and filter via modern UI (`src/modules/placements/job-service.ts:86-135`)
- Fix: Restore exact initial sort and table status grouping

## G2-8-012-005  [P2] GAP  facet F03  effort M
- Legacy: Bulk job status API provides updated/skipped counts (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:253-290`)
- vNext now: VNext separate visibility and drive lifecycle controls (`src/modules/placements/tpo-drive-lifecycle-service.ts:122-148; src/modules/placements/job-service.ts:616-735`)
- Fix: Display bulk count and skipped IDs with exact per-row outcomes

## G2-8-012-006  [P2] GAP  facet F03  effort M
- Legacy: Job deletion impact preview includes linked applications (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:963-997`)
- vNext now: VNext archive flow and separate cancellation impact (`src/modules/placements/job-service.ts:735-766; src/modules/placements/tpo-drive-cancel-service.ts:38-79`)
- Fix: Match impact preview and distinguish cancel vs archive before action

## G2-8-012-007  [P2] GAP  facet F04  effort L
- Legacy: Legacy Job has companyName/companyLogo, org and college, targeting and eligibility flags (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:433-531`)
- vNext now: VNext uses canonical placementCompanies/relationships/job policy/roles (`src/modules/placements/job-service.ts:40-84; src/db/schema/placements.ts:23-154`)
- Fix: Document field-to-field read model and maintain company display from canonical source

## G2-8-012-011  [P2] GAP  facet F05  effort M
- Legacy: Legacy job paged list searches string and filters status (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:186-235`)
- vNext now: VNext get placement jobs returns scoped rows with UI-layer filters (`src/modules/placements/job-service.ts:86-135`)
- Fix: Match casefold, wildcard escaping, default page size and filter state

## G2-8-012-036  [P2] GAP  facet F14  effort M
- Legacy: Legacy deletion handles attachment references and learner notifications (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:998-1079`)
- vNext now: VNext archive/cancel triggers domain-specific cleanup; no same raw offer-letter URL mutation (`src/modules/placements/job-service.ts:699-766`)
- Fix: Document file retention policy and safe signed-link expiry

## G2-8-012-042  [P2] MISSING  facet F18  effort S
- Legacy: Specific collision error after 50 tries, exact string (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:495-505`)
- vNext now: No `smr-` job slug generator in VNext job creation (`src/modules/placements/job-service.ts:150-272`)
- Fix: Restore meaningful external-link error semantics if external slug capability is required

## G2-8-012-050  [P2] GAP  facet F21  effort L
- Legacy: Legacy events ApplicationStatusChangedEvent and notifications published after status change (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1418-1445`)
- vNext now: VNext activityEvents emitted within transactions, notification dispatch separate (`src/modules/placements/job-service.ts:150-272`)
- Fix: Map event type, deduplication and after-commit side effects, avoid email before commit

## G2-15-026-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:388-435 job Open/Close status action
- vNext now: src/modules/placements/job-service.ts:417-558 publish and 616-698 close plus 703-735 cancel
- Fix: Show explicit Open/Close legacy controls mapped to lifecycle transitions

## G2-15-026-008  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:31-55 jobTitle, companyName, companyLogo, description, recordedOutside
- vNext now: src/db/schema/placements.ts:23-112 company registry + relationship and placementJobs; src/modules/placements/job-service.ts:95-126 join company/season
- Fix: Display old job title/company/logo and recorded-outside flag via split entities

## G2-15-026-032  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:294-344 PUT job and 352-387 soft delete
- vNext now: src/modules/placements/job-service.ts:272-416 update,735-766 archive
- Fix: Map archived state to soft-delete and preserve conflict/status responses

## G2-19-011-047  [P3] GAP  facet F18  effort S
- Legacy: Legacy log `Job auto-expiry complete: N jobs deactivated` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:70-70`
- vNext now: vNext manual-close summary `<job title> closed` `src/modules/placements/job-service.ts:669-687`
- Fix: Use auto-expiry-specific action wording and batch receipt.

## G2-5-013-064  [P3] GAP  facet F13  effort S
- Legacy: Legacy getAllJobsPaginated empty produces content=[] and total zero (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:214-237`)
- vNext now: vNext list returns empty row array with no page count metadata (`src/modules/placements/job-service.ts:86-135`)
- Fix: Add explicit empty page/count metadata and UI states

## G2-15-026-060  [P3] GAP  facet F21  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:205-243 dev-only explicit organization/createdBy POST with active dev profile only
- vNext now: src/modules/placements/job-service.ts:150-271 normal scoped create API only
- Fix: Keep dev fixture route disabled in production or retire intentionally with test fixture replacement
