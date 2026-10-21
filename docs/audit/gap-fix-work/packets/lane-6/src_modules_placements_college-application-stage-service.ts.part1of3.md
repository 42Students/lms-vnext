# Work packet: edit src/modules/placements/college-application-stage-service.ts (part 1 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md, docs/audit/gap2/lane-12/job-application.md, docs/audit/gap2/lane-13/job-application-status-validator.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md

## G2-10-011-033  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-694 — Status writes reject absent applicationStatus and concurrent changes with clean 400/409 responses.
- vNext now: src/app/api/placements/college/jobs/[jobId]/pipeline/route.ts:14-20; src/modules/placements/college-application-stage-service.ts:47-83 — Zod action validation and per-row skipped result; no identical stale-write 409 surfaced in UI.
- Fix: Preserve actionable stale-edit conflict/error response with retry/read-back.

## G2-10-011-045  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:445-514 — GET /api/v1/admin/jobs/{jobId}/applications, 0-based page+size max100, status/source/academic filters and user names.
- vNext now: src/modules/placements/college-application-stage-service.ts:18-31; src/modules/placements/college-drive-applications-service.ts:25-111 — Server services directly query scoped UUID applications and normalized pipeline; no legacy response shape.
- Fix: Create exact field mapping/status projection, especially actor names, for page parity.

## G2-10-011-047  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-703 — PUT /api/v1/admin/jobs/{jobId}/applications/{id}/status writes canonical applicationStatus and history.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:64-78; src/modules/placements/college-application-stage-service.ts:152-165 — POST /api/placements/college/jobs/{jobId}/pipeline writes separate college stage/history.
- Fix: Preserve effective applicant status/business outcomes and audit semantics in projection.

## G2-10-011-055  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-40 — Single canonical applicationStatus updated with timestamp/actor.
- vNext now: src/db/schema/placement-college-application-stages.ts:5-22; src/modules/placements/college-application-stage-service.ts:152-165 — New stage lives apart from base placementApplications.status, with separate move event and history.
- Fix: Display/persist consistent canonical status vs stage and explain current pipeline projection.

## G2-10-011-067  [P1] GAP  facet F15  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-703 — Status-update service publishes ApplicationStatusChangedEvent; downstream email templates depend on event.
- vNext now: src/modules/placements/college-application-stage-service.ts:166-179 — Creates audit event and in-app notification in same transaction; no email notification in stage move.
- Fix: Map event→email template recipients/timing and avoid sending before DB commit.

## G2-10-011-079  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:718-750; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:687-699 — Duplicate UI writes blocked by loading refs; status optimistic lock conflicts return 409.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:64-79; src/modules/placements/college-application-stage-service.ts:49-70 — Busy flag + transaction row lock; list stages versioned separately.
- Fix: Review edit-version/CAS for repeated stage requests and display conflict reconciliation.

## G2-10-015-043  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:445-514 — Legacy GET list filters applicationStatus and hierarchy, size20 default, numeric IDs.
- vNext now: src/modules/placements/college-application-stage-service.ts:18-31; src/modules/placements/college-drive-applications-model.ts:3-17 — New UUID stage projection and fixed25, separate raw status/screening.
- Fix: Map canonical status and status counts per shortlist context.

## G2-10-015-044  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:516-603 — Bulk POST validates per-application transition and returns failures/notification outcomes.
- vNext now: src/modules/placements/college-application-stage-service.ts:70-98; src/components/placements/college-application-pipeline-controls.tsx:64-78 — New POST pipeline with reason and confirmed flag, different state writes.
- Fix: Reconcile side effects, partial errors and stage history.

## G2-10-015-084  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:516-603 — Legacy bulk service operates canonical status/history and notifies by email event.
- vNext now: src/modules/placements/college-application-stage-service.ts:70-98 — Modern stage update writes separate audit/notifications.
- Fix: Reconcile stage effect and event contract.

## G2-12-019-005  [P1] GAP  facet F03  effort L
- Legacy: Legacy string status APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/REJECTED/HIRED `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30`
- vNext now: New status SUBMITTED/WITHDRAWN only; screening and college stages derive business stage `src/db/schema/placements.ts:993-995,1048-1059` `src/modules/placements/college-application-stage-service.ts:25-31`
- Fix: Map each old status to canonical pipeline stage in every list, badge and notification.

## G2-12-019-015  [P1] GAP  facet F04  effort L
- Legacy: Legacy internalNotes and internalReason hidden with @JsonIgnore `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:83-96,151-160`
- vNext now: New core has no notes/reason, college stage stores reason in stage history and generic notice `src/modules/placements/college-application-stage-service.ts:152-179`
- Fix: Keep staff-only reason isolated from learner-facing candidate message.

## G2-12-019-029  [P1] GAP  facet F07  effort M
- Legacy: Old @Version prevents stale writes with optimistic-lock error `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:127-133`
- vNext now: New application status row has no version, some staff stage models track separate version `src/db/schema/placements.ts:973-1020` `src/modules/placements/college-application-stage-service.ts:67-80`
- Fix: Use one canonical state/version gate when updating application and stage together.

## G2-12-019-053  [P1] GAP  facet F20  effort L
- Legacy: Old optimistic-lock version on root application `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:127-133`
- vNext now: New concurrency token is updatedAt, no canonical CAS for stage+offer write `src/db/schema/placements.ts:1015-1020` `src/modules/placements/college-application-stage-service.ts:51-82`
- Fix: Introduce explicit version in state transitions and prove serializable edits.

## G2-13-010-001  [P1] GAP  facet F01  effort L
- Legacy: Utility is called by ApplicationTransitionService transitioning JobApplication (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:54-68`)
- vNext now: New per-college stage service uses COLLEGE_APPLICATION_TRANSITIONS and separate screening/status facts (`src/modules/placements/college-application-stage-service.ts:73-81`)
- Fix: Consolidate one vetted transition policy or document intentionally distinct coarse-status and stage model.

## G2-13-010-005  [P1] GAP  facet F02  effort L
- Legacy: Legacy group has two layers: application status and round result (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:54-78`)
- vNext now: New schema separates application status, screening, stage and round (`src/modules/placements/college-application-stage-service.ts:67-91`)
- Fix: Document which pipeline label/status is authoritative in each screen.

## G2-13-010-030  [P1] GAP  facet F09  effort L
- Legacy: Old bulk can hold notices and undo within outbox window (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:115-160`)
- vNext now: New college stage service supports REINSTATE only if current REJECTED (`src/modules/placements/college-application-stage-service.ts:75-80`)
- Fix: Restore general undo group for open-stage bulk moves or document limited-only behavior.

## G2-13-010-036  [P1] GAP  facet F12  effort L
- Legacy: Old HIRED→OFFERED allowed for mistaken hire correction (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:52-57`)
- vNext now: New HIRED→none and HIRED stage requires accepted JOINED offer (`src/modules/placements/college-application-stage-service.ts:82-91`)
- Fix: Reconcile reversal policy with joined outcome and audit trail.

## G2-14-011-012  [P1] GAP  facet F04  effort L
- Legacy: Eight legacy applicant pipeline labels include WAITLISTED and HIRED `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:44-46`
- vNext now: New separates SUBMITTED/WITHDRAWN, screening, round, offers, joining `src/db/schema/placements.ts:973-1060` `src/modules/placements/college-application-stage-service.ts:73-90`
- Fix: Document exact combined stage crosswalk

## G2-14-011-042  [P1] GAP  facet F10  effort L
- Legacy: Legacy application status mutation writes history and publishes status event `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1258-1273`
- vNext now: New college stage writes screening/stage history `src/modules/placements/college-application-stage-service.ts:109-157`
- Fix: Preserve reporting history and event consumers

## G2-14-011-043  [P1] GAP  facet F10  effort L
- Legacy: Legacy rejection/leaving interview stage cancels active interviews `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:163-187` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1245-1247`
- vNext now: New stage service has offer gating and persisted rounds `src/modules/placements/college-application-stage-service.ts:74-110` `src/modules/placements/tpo-bulk-application-stage-service.ts:76-132`
- Fix: Implement associated interview cancellations and notifications
