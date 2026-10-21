# Work packet: edit src/modules/placements/job-service.ts (part 4 of 5)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-14/u015-job-lifecycle-status.md, docs/audit/gap2/lane-17/job-search-controller.md, docs/audit/gap2/lane-17/placement-job-service.md

## G2-15-026-031  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:250-288 POST org job with actor from session
- vNext now: src/modules/placements/job-service.ts:150-271 creates college+season+relationship scoped job and activity audit
- Fix: Implement explicit org-approved job creation or document mandatory selected-college conversion

## G2-15-026-033  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:388-435 open/close status
- vNext now: src/modules/placements/job-service.ts:417-558 publish,616-698 close,703-735 cancel
- Fix: Preserve nuanced open/close vs publish/cancel lifecycle and validate transitions

## G2-15-026-035  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:76-81 feature flag placements enabled required on all endpoints
- vNext now: src/modules/placements/job-service.ts:86-93 requirePlacementManageScope, src/app/(authenticated)/admin/placements/page.tsx:19-21 scope/read checks
- Fix: Verify placement module toggle at every job read/write endpoint and active tenant lock

## G2-15-026-061  [P1] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:823-842 resume stored external preview URL
- vNext now: src/modules/placements/job-service.ts:417-558 signed application/notification effects and private storage via other modules
- Fix: Verify resume object preview integration and secure access lifecycle

## G2-10-012-028  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:48-57 — parseInt(jobId,10) and failed job fetch shows 'Could not load this drive.' in Alert.
- vNext now: src/modules/placements/job-service.ts:136-147; src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:22-23 — UUID Zod service error route, not same inline message or back recovery.
- Fix: Map invalid/missing job errors to actionable legacy message and Drives back.

## G2-14-011-027  [P2] GAP  facet F07  effort S
- Legacy: Application deadline in past gets exact error `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:279-284`
- vNext now: New publish throws PLACEMENT_JOB_NOT_PUBLISHABLE `src/modules/placements/job-service.ts:466-469`
- Fix: Surface exact field-level past deadline error

## G2-14-011-029  [P2] GAP  facet F07  effort S
- Legacy: Company link failure specifies nonexistent deleted or wrong organization `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:125-139`
- vNext now: New relationship loaded in scoped service with typed error `src/modules/placements/job-service.ts:40-71`
- Fix: Map concrete failure text and correct field

## G2-14-011-033  [P2] GAP  facet F08  effort S
- Legacy: Create job controller wraps result in success response `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:250-291`
- vNext now: New draft create records activity and returns job `src/modules/placements/job-service.ts:202-269`
- Fix: Match success toast and draft status copy in UI

## G2-14-015-014  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid initial status throws New drive must start as DRAFT or REQUEST `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:39-46`
- vNext now: New status create input validates job data then inserts DRAFT `src/modules/placements/job-service.ts:150-269`
- Fix: Show comparable explicit request-vs-draft error for legacy caller

## G2-17-013-023  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:255-260 — Organization path mismatch yields `Organization mismatch` 403.
- vNext now: src/modules/placements/job-service.ts:90-95 — College-scoped permission check, different error.
- Fix: Preserve 404/403 privacy and scope-mismatch info.

## G2-17-012-023  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:147-151 — Absent authenticated organization context returns explicit error.
- vNext now: src/modules/placements/job-service.ts:86-95 — College permission guard, different error code.
- Fix: Map legacy organization-missing wording to admin UI.

## G2-19-011-021  [P2] GAP  facet F08  effort M
- Legacy: Legacy on each success log includes job id, title, deadline `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:64-65`
- vNext now: vNext manual-close activity has jobId and closed summary without explicit deadline `src/modules/placements/job-service.ts:669-688`
- Fix: Add auto-expiry event type and metadata including deadline/batch.

## G2-19-011-022  [P2] GAP  facet F08  effort M
- Legacy: Legacy failed per row logs warning and continues `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-68`
- vNext now: vNext manual closure failures are typed request exceptions `src/modules/placements/job-service.ts:651-654`
- Fix: Instrument automated retry/errors without showing false user success.

## G2-2-016-018  [P2] GAP  facet F07  effort S
- Legacy: Create error invalid org scope when college has no org_id (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:464-466`)
- vNext now: VNext requires scoped active college/company relationship (`src/modules/placements/job-service.ts:40-70`)
- Fix: Show actionable tenant assignment message not generic permission denied

## G2-3-015-017  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:99-112`
- vNext now: `src/modules/placements/job-service.ts:74-76`, `src/modules/placements/college-drive-read-service.ts:27-29`
- Fix: Legacy by-id active query excludes drafts and deleted, deleted-inclusive org query available separately; vNext generic loadJob by UUID includes any status before caller gate. Ensure errors distinguish read unavailable/forbidden vs history allowed.

## G2-5-013-021  [P2] GAP  facet F07  effort S
- Legacy: Legacy bulk update empty jobs fails jobIds is required and must not be empty (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:253-260`)
- vNext now: vNext per-job close validates jobId and status but has no corresponding list-empty validator (`src/modules/placements/job-service.ts:616-629`)
- Fix: Retain exact list validation on eventual bulk endpoint

## G2-5-013-022  [P2] GAP  facet F07  effort S
- Legacy: Legacy bulk over cap fails Maximum {N} drives per bulk update (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:257-260`)
- vNext now: vNext per-job API has no bulk cap to report (`src/modules/placements/job-service.ts:616-629`)
- Fix: Expose same configurable cap and message

## G2-5-013-026  [P2] GAP  facet F08  effort S
- Legacy: Legacy create/update status endpoints return a Job or JobApplication object to controller (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:200-238`)
- vNext now: vNext create/update throw typed PlacementsServiceError and return persisted row (`src/modules/placements/job-service.ts:150-166`)
- Fix: Match exact success/toast and errors in consuming pages, not generated in service

## G2-5-013-027  [P2] GAP  facet F08  effort M
- Legacy: Legacy delete returns controller success response with copy after preview (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:1021-1058`)
- vNext now: vNext archive returns status and data only (`src/modules/placements/job-service.ts:735-766`)
- Fix: Compare final confirmation/success wording in delete/close pages

## G2-8-012-018  [P2] GAP  facet F07  effort S
- Legacy: Create error invalid org scope when college has no org_id (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:464-466`)
- vNext now: VNext requires scoped active college/company relationship (`src/modules/placements/job-service.ts:40-70`)
- Fix: Show actionable tenant assignment message not generic permission denied
