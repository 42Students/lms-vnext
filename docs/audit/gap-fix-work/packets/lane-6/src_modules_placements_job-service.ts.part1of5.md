# Work packet: edit src/modules/placements/job-service.ts (part 1 of 5)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-14/u015-job-lifecycle-status.md, docs/audit/gap2/lane-17/job-search-controller.md, docs/audit/gap2/lane-17/placement-job-service.md

## G2-10-012-039  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:49-68; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:167-197 — GET /api/v1/admin/jobs/{jobId}?collegeId, independent GET /metrics?collegeId&jobId; errors separately settled.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/modules/placements/job-service.ts:136-147; src/modules/placements/super-admin-drive-pipeline-service.ts:15-38 — getPlacementJob and pipeline direct SQL; Super Admin page awaits pipeline before workspace.
- Fix: Use Promise.allSettled for independent drive and metrics; show hero on metrics failure.

## G2-10-012-077  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:12,49-51,76-78 — AdminService calls GET job, metrics, needs-attention (all college-scoped).
- vNext now: src/modules/placements/job-service.ts:136-147; src/modules/placements/super-admin-drive-pipeline-service.ts:15-38 — Native services replace job+metrics; missing needs-attention integration.
- Fix: Implement selected-job attention service and consistent pipeline event projection.

## G2-14-011-002  [P1] GAP  facet F01  effort M
- Legacy: Organization-scoped getJobById allows linked colleges in organization `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:219-231`
- vNext now: New read enforces placements.manage for a single college `src/modules/placements/job-service.ts:136-148`
- Fix: Implement legitimate super-admin org scope through acting college

## G2-14-011-011  [P1] GAP  facet F04  effort M
- Legacy: Job entity uses optimistic version `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:269-276`
- vNext now: New draft update has no caller expected version predicate `src/modules/placements/job-service.ts:272-288` `src/modules/placements/job-service.ts:361-372`
- Fix: Use CAS token on draft updates

## G2-14-011-020  [P1] GAP  facet F06  effort M
- Legacy: Company ID optional, linked record must exist and belong to organization `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:114-140`
- vNext now: New companyRelationshipId mandatory and active `src/modules/placements/validation.ts:285-295` `src/modules/placements/job-service.ts:150-164`
- Fix: Handle legacy unlinked or org-wide jobs during migration

## G2-14-011-022  [P1] GAP  facet F06  effort M
- Legacy: EXTERNAL_ONLY clears and rejects targeting fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:340-347` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:532-557`
- vNext now: New external-only works with eligibility policy model `src/db/schema/placements.ts:818-921` `src/modules/placements/job-service.ts:202-233`
- Fix: Define external targeting semantics and missing target fields

## G2-14-011-026  [P1] GAP  facet F06  effort L
- Legacy: Legacy can redraft or activate from explicit incoming booleans `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:558-578`
- vNext now: New edits only DRAFT, publish separate transition `src/modules/placements/job-service.ts:272-288` `src/modules/placements/job-service.ts:417-430`
- Fix: Provide deliberate published edit/re-draft workflow or mark unsupported

## G2-14-011-038  [P1] GAP  facet F10  effort M
- Legacy: Legacy org-scoped GET derives organization from authenticated context `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:465-475`
- vNext now: New job list requires collegeId and permission `src/modules/placements/job-service.ts:86-94`
- Fix: Introduce explicit acting-org read rather than user supplied org

## G2-14-011-040  [P1] GAP  facet F10  effort M
- Legacy: Legacy company link revalidated and locked when changed `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:114-140` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:591-598`
- vNext now: New draft update applies spread input within transaction `src/modules/placements/job-service.ts:272-288` `src/modules/placements/job-service.ts:361-413`
- Fix: Revalidate changed company relationship under lock

## G2-14-011-041  [P1] GAP  facet F10  effort L
- Legacy: Legacy activate/deactivate and soft delete `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:604-638`
- vNext now: New publish close cancel archive separate actions `src/modules/placements/job-service.ts:417-530` `src/modules/placements/job-service.ts:616-765`
- Fix: Define transitions mapping and audit behavior

## G2-14-011-046  [P1] GAP  facet F11  effort M
- Legacy: Legacy org access guard applies across all job CRUD `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:465-475` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:582-595`
- vNext now: New strict placements.manage plus college scope `src/modules/placements/job-service.ts:90-94` `src/modules/placements/college-application-stage-service.ts:18-35`
- Fix: Provide super-admin/org-wide role matrix

## G2-14-011-073  [P1] GAP  facet F20  effort M
- Legacy: Legacy company is pessimistically locked against concurrent deletion `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:114-140`
- vNext now: New active relationship read occurs before create transaction `src/modules/placements/job-service.ts:150-165`
- Fix: Move relationship lock inside create transaction

## G2-14-015-012  [P1] GAP  facet F06  effort M
- Legacy: Legacy new drive starts REQUEST or DRAFT only `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:38-46`
- vNext now: New created job always enters DRAFT `src/modules/placements/job-service.ts:150-269`
- Fix: Route recruiter-request intake into distinct persisted request path

## G2-14-015-026  [P1] GAP  facet F11  effort L
- Legacy: Legacy JobLifecycleService only writer of lifecycleStatus `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:10-16` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:282-291`
- vNext now: New multiple lifecycle entrypoints direct job-service and TPO service `src/modules/placements/job-service.ts:417-530` `src/modules/placements/tpo-drive-lifecycle-service.ts:154-197`
- Fix: Centralize allowed transition checks to prevent permission/path divergence

## G2-17-013-009  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchDTO.java:19-38 — JobSearchDTO fields id,title,company/logo,desc,responsibilities,type,location,CTC,postedAt,deadline,active,scope and targets.
- vNext now: src/modules/placements/job-service.ts:86-135 — Normalized placementJob fields, no identical legacy DTO envelope.
- Fix: Map all DTO fields/nullable defaults and visibility before exposing job search.

## G2-17-013-034  [P1] GAP  facet F11  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:98-119 — Global superadmin can request org; scoped superadmin derives org from principal.
- vNext now: src/modules/placements/job-service.ts:86-95 — College manage required for list.
- Fix: Support explicit authorized acting-org search scope for superadmin.

## G2-17-013-055  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchDTO.java:19-38 — Cached DTO has integer IDs, org and college, target department/program.
- vNext now: src/modules/placements/job-service.ts:86-135 — Normalized UUID job ID, college UUID, offer fields.
- Fix: Define DTO↔normalized schema data mapping and index support.

## G2-17-012-001  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:12-23 — Organization-level job management service for admin UI.
- vNext now: src/modules/placements/job-service.ts:86-95 — vNext listPlacementJobs requires collegeId, not organizationId.
- Fix: Expose organization-scoped admin job aggregate where authorized.

## G2-17-012-006  [P1] GAP  facet F03  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:60-68 — Soft-delete org job even when collegeId is NULL.
- vNext now: src/modules/placements/job-service.ts:735-766 — Archive operates on existing college-owned job.
- Fix: Support org-wide null-college legacy job archive with explicit authorization.

## G2-17-012-018  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:34-58 — Create/update Job object, Boolean isActive status toggle.
- vNext now: src/modules/placements/job-service.ts:150-274 — Create and update normalized draft/publish lifecycle.
- Fix: Expose mappings open→PUBLISHED and close→CLOSED safely.
