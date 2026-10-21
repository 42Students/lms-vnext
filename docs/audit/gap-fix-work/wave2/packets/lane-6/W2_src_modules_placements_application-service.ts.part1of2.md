# Work packet (wave 2): edit src/modules/placements/application-service.ts (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u021-apply-to-job-request.md, docs/audit/gap2/lane-12/job-application.md, docs/audit/gap2/lane-14/u010-job-application-source-validator.md, docs/audit/gap2/lane-18/job-service-impl.md, docs/audit/gap2/lane-19/apply-to-job-request.md, docs/audit/gap2/lane-20/job-application-status-history-service-impl.md

## G2-19-021-024  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:533-548 — existing APPLIED idempotent, rejected blocks, withdrawn may reactivate
- vNext now: src/modules/placements/application-service.ts:641-643,810-853 — existing returns, WITHDRAWN reactivation guarded by prior offers/rounds
- Fix: Reconcile retries, withdrawn/resubmit state conditions

## G2-19-021-028  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:593-620 — reapplied resume history retains prior URL
- vNext now: src/modules/placements/application-service.ts:839-853 — restores withdrawn application but no resume history
- Fix: Keep resume version/history while ensuring old links are safe

## G2-19-021-029  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:680-715 — APPLIED status event then screening trigger
- vNext now: src/modules/placements/application-service.ts:874-919 — SUBMITTED history, activity, learner status event, pending screening
- Fix: Map status terminology to legacy learner notifications

## G2-19-021-037  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:454-457 — duplicate caught and returned 409
- vNext now: src/modules/placements/application-service.ts:810-847,929-949 — transaction resolves existing and withdrawn CAS
- Fix: Match user-facing duplicate behavior for race

## G2-19-021-042  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:377-405 — single INTERNAL job apply path
- vNext now: src/modules/placements/application-service.ts:408-452,606-617 — INTERNAL/EXTERNAL/HYBRID application channels
- Fix: Map legacy INTERNAL default to new channel rules

## G2-12-019-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy job application drives Learner My Applications, admin/TPO stage controls `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-46,139-171`
- vNext now: New listOwnPlacementApplications and college stage pipeline service with separate workflows `src/modules/placements/application-service.ts:955-1056` `src/modules/placements/college-application-stage-service.ts:18-31`
- Fix: Maintain legacy stage fields and navigation semantics in all actor views.

## G2-12-019-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy appliedAt immutable creation timestamp `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:35-37`
- vNext now: New submittedAt modifiable on withdrawal reapply `src/db/schema/placements.ts:1007-1011` `src/modules/placements/application-service.ts:840-846`
- Fix: Retain firstAppliedAt/history timestamps on reapplication.

## G2-12-019-023  [P2] GAP  facet F05  effort S
- Legacy: Legacy stage list can sort/filter persisted applicationStatus `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30`
- vNext now: New list sorted submittedAt desc and stage joined from screening/candidate flags `src/modules/placements/application-service.ts:955-1056` `src/modules/placements/college-application-stage-service.ts:25-31`
- Fix: Provide stable stage label/sort and source status mapping.

## G2-12-019-034  [P2] GAP  facet F10  effort L
- Legacy: Legacy entity persisted direct applicationStatus and actor/time `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-46`
- vNext now: New submit/withdraw mutate status and history; business stage in screening/offer tables `src/modules/placements/application-service.ts:840-879,1245-1273`
- Fix: Document composite state machine and transitions for all sources.

## G2-14-010-002  [P2] GAP  facet F01  effort M
- Legacy: Comment binds INTERNAL to LMS students and EXTERNAL to placements page `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:7-10`
- vNext now: Application source selected by job applicationMode rather than caller page `src/modules/placements/application-service.ts:408-452`
- Fix: Crosswalk page-origin semantics when migrating source values

## G2-14-010-018  [P2] GAP  facet F10  effort M
- Legacy: Pure normalization has no database/network effects `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:32-47`
- vNext now: Service resolves channel then applies to persisted application `src/modules/placements/application-service.ts:408-452` `src/modules/placements/application-service.ts:570-613`
- Fix: Expose pure compatibility mapper separately from DB service

## G2-14-010-035  [P2] GAP  facet F18  effort S
- Legacy: Legacy documentation says external default for placements page `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:21-24`
- vNext now: Mode-based rules and external confirmation `src/modules/placements/application-service.ts:423-450`
- Fix: Document changed wording and source semantics

## G2-18-011-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy JobDetails endpoint `getJobById` active job and uses integer ID (`JobServiceImpl.java:198-202`).
- vNext now: New job IDs UUID with get/loadJob and published status precondition (`application-service.ts:570-595`).
- Fix: Preserve legacy numeric-ID deep-link compatibility only when migration requires.

## G2-18-011-009  [P2] GAP  facet F03  effort S
- Legacy: Legacy targeting denial `This job is not available for your department/program/batch/class` (`JobServiceImpl.java:283-308`).
- vNext now: New throws generic PLACEMENT_APPLICATION_INELIGIBLE after eligibility model (`application-service.ts:647-654`).
- Fix: Map targeting failure to exact safe denial, without leaking restricted drives.

## G2-18-011-019  [P2] GAP  facet F05  effort M
- Legacy: Legacy getLearnerApplicationsWithInterviews selects earliest upcoming interview (date ascending) (`JobServiceImpl.java:828-845`).
- vNext now: New applications own list separate from offers, no single nextInterview DTO evident (`application-service.ts:955-1010`).
- Fix: Add earliest authorized next interview to per-application view with correct time zone.

## G2-18-011-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy withdrawn APPLIED reactivates same job application after statusBeforeWithdrawal check (`JobServiceImpl.java:555-637`).
- vNext now: New WITHDRAWN reapply only if same channel and no prior offer/round/screening conflicting (`application-service.ts:819-853`).
- Fix: Map allowed early withdrawn reapply and give explicit failure text for advanced history.

## G2-18-011-023  [P2] GAP  facet F06  effort M
- Legacy: Legacy learner withdrawal by jobId or applicationId (`JobServiceImpl.java:963-977`).
- vNext now: New POST `/api/placements/applications/{uuid}/actions` with reason required by route (`applications/[applicationId]/actions/route.ts:14-35`; `application-service.ts:1094-1103`).
- Fix: Support existing jobId deep links while mandating audit reason in new form.

## G2-18-011-042  [P2] GAP  facet F11  effort M
- Legacy: Legacy apply accepts targeting-only visibility then checks TPO drive rules (`JobServiceImpl.java:37-45,483-500,1276-1325`).
- vNext now: New job targeting plus placement participation/debarment/college offer rules are required (`application-service.ts:583-591,647-654,688-752`).
- Fix: Distinguish seen-but-not-eligible from hidden; explain college-specific gates to learner.

## G2-18-011-056  [P2] GAP  facet F15  effort M
- Legacy: Legacy confirmation dispatches NotificationEvent.JOB_APPLICATION_CONFIRMATION with learnerName/jobTitle/companyName/date (`JobServiceImpl.java:1608-1649`).
- vNext now: New activity+event delivery mechanism with different template shape (`application-service.ts:10-13,856-870`).
- Fix: Verify exact email/SMS/in-app channels, wording and recipient after commit.

## G2-18-011-057  [P2] GAP  facet F15  effort M
- Legacy: Legacy withdrawal notifies college admin after commit (`JobServiceImpl.java:1085-1165`).
- vNext now: New DB event notification after transaction service (`application-service.ts:1094-1134,1240-1320`).
- Fix: Confirm admin recipient role, cascade-related notifications and retry.

## G2-18-011-062  [P2] GAP  facet F18  effort S
- Legacy: Legacy withdrawal booked round error `You're already scheduled into a round for this drive. Ask the placement cell to withdraw instead.` (`JobServiceImpl.java:1007-1017`).
- vNext now: New PlacementsServiceError/deny with per-slot rules; literal text not in service (`application-service.ts:1198-1220`).
- Fix: Map withdraw-required-request code to exact learner instructions and Request action.

## G2-18-011-064  [P2] GAP  facet F19  effort M
- Legacy: Legacy getter returns all applied apps and next interview N+1 avoided by bulk (`JobServiceImpl.java:828-893`).
- vNext now: New separate applicant list and queries, not one DTO including next interview (`application-service.ts:955-1010`).
- Fix: Use joined batch read for upcoming interview and stage label to avoid per-app requests.

## G2-18-011-065  [P2] GAP  facet F20  effort M
- Legacy: Legacy simultaneous apply Job PESSIMISTIC_WRITE lock, unique learner/job fallback (`JobServiceImpl.java:502-543,663-670`).
- vNext now: New lock job/role, unique role/membership + ON CONFLICT (`application-service.ts:656-679,808-870`).
- Fix: Audit simultaneous apply across two role options; dedupe per intended job policy.

## G2-18-011-066  [P2] GAP  facet F20  effort S
- Legacy: Legacy deadline comparison UTC LocalDateTime, isBefore(now) exact (`JobServiceImpl.java:476-481`).
- vNext now: New timestamp withTimezone and `isPlacementApplicationDeadlinePassed`, now Date (`application-service.ts:599-604,674-679`).
- Fix: Verify inclusive deadline instant vs legacy strict before, IST display of UTC.

## G2-18-011-067  [P2] GAP  facet F20  effort M
- Legacy: Legacy post-withdrawal statusBeforeWithdrawal used to block advanced reapply (`JobServiceImpl.java:555-575`).
- vNext now: New historical offer/round/screening rows drive reapply deny (`application-service.ts:819-837`).
- Fix: Crosscheck old advanced stage vs current history presence and reactivation exceptions.

## G2-18-011-068  [P2] GAP  facet F21  effort L
- Legacy: Legacy eventPublisher ApplicationStatusChangedEvent and screeningService, NotificationDispatcher (`JobServiceImpl.java:622-636,726-819,1608-1649`).
- vNext now: New activityEvents, learner placement delivery and normalized screening DB (`application-service.ts:10-13,856-870`; `placements.ts:1114-1170`).
- Fix: Build event/topic routing matrix, ensure exactly-once post-commit observer behavior.

## G2-19-021-045  [P2] GAP  facet F20  effort M
- Legacy: Old client status reconciliation runs after lost network response. `docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:598-615`
- vNext now: vNext server idempotence is present but client error toast is immediate. `src/modules/placements/application-service.ts:808-818` `src/components/placements/learner-placement-jobs.tsx:232-239`
- Fix: Reconcile client state with server after ambiguous response.

## G2-20-011-018  [P2] GAP  facet F10  effort S
- Legacy: recordStatusChange persists a history row and logs debug `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:37-49`
- vNext now: Embedded operation writes history through Drizzle and activity events `src/modules/placements/application-service.ts:21-24`
- Fix: Trace each transition writer and ensure exactly-once history per state change

## G2-20-012-005  [P2] GAP  facet F03  effort S
- Legacy: Visible job decision reports reason via VisibilityResult `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:177-195`
- vNext now: Service error typed PLACEMENT_JOB_NOT_FOUND, placement access guards `src/modules/placements/application-service.ts:74-99`
- Fix: Expose explicit visible=false reason from backend to disabled job card CTA

## G2-20-012-012  [P2] GAP  facet F06  effort S
- Legacy: Apply accepts learnerId, jobId and optional resumeUrl `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:88-94`
- vNext now: New create input Zod schema and request context membership `src/modules/placements/application-service.ts:67-99`
- Fix: Carry optional resume choice through new request, no arbitrary external attachment keys

## G2-20-012-013  [P2] GAP  facet F06  effort S
- Legacy: Withdraw two overloads: inferred job or explicit applicationId `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:138-150`
- vNext now: New membership-scoped UUID application operation with separate withdrawal models `src/modules/placements/application-service.ts:52-54,67-72`
- Fix: Map legacy job-based withdraw path to explicit ID and preserve deep links

## G2-20-012-029  [P2] GAP  facet F14  effort S
- Legacy: Resume URL optional, legacy can use learner profile `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:84-91`
- vNext now: New private storage/receipt model, no raw URLs in secure design `src/modules/placements/application-service.ts:67-72`
- Fix: Use scoped media receipt download grants and redact URL from application API

## G2-20-012-030  [P2] GAP  facet F15  effort S
- Legacy: Apply triggers screening async per interface spec but sync in impl [L:86-87,I:715-740]
- vNext now: New deliverRecordedLearnerPlacementEvent is called by placement mutations `src/modules/placements/application-service.ts:11-12`
- Fix: Verify candidate receives correctly timed in-app/email event and screening status

## G2-20-012-037  [P2] GAP  facet F20  effort S
- Legacy: Apply uses transaction isolation READ_COMMITTED and app lock `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:388-389,502-536`
- vNext now: New membership and job locks for policy changes `src/modules/placements/application-service.ts:107-176`
- Fix: Validate read ordering against job deactivation and deadline during submit

## G2-20-012-038  [P2] GAP  facet F21  effort S
- Legacy: Legacy JobService depends ScreeningService and repos, jobs dates consumed by calendar [I:79-82,L:210-238]
- vNext now: New modules separate offer/eligibility/rounds/calendar and notifications `src/modules/placements/application-service.ts:11-12,22-40`
- Fix: Trace API caller graph including calendar/event notification adapters; avoid missing edges

## G2-3-013-021  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/event/ApplicationStatusChangedEventListener.java:17-29`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:57-71`
- vNext now: `src/modules/placements/application-service.ts:848-882`, `1267-1275`
- Fix: Legacy after-commit event listener records changes and TPO transition service calls writer for each change; vNext writes inline in transaction. Confirm one ledger event per successful status update, avoid split retry duplicates.

## G2-3-013-028  [P2] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:69-77`
- vNext now: `src/modules/placements/application-service.ts:848-882`, `src/modules/placements/learner-application-detail-service.ts:102-129`
- Fix: Legacy empty ledger synthesizes current status at appliedAt else statusUpdatedAt else now, includes rejection reason only when REJECTED; vNext lacks baseline and has no current REJECTED status in main application enum.

## G2-3-013-032  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:23-29`, `70-95`
- vNext now: `src/modules/placements/application-service.ts:1278-1308`
- Fix: Legacy TPO stage updates queue notification in transition service distinct from history writer; vNext withdrawal emits activity and learner placement notice but generic status-only history does not trigger every legacy TPO stage notice. Audit event-mapping separately.

## G2-3-013-039  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:34-36`
- vNext now: `src/db/schema/placements.ts:1105-1109`, `src/modules/placements/application-service.ts:848-882`
- Fix: Legacy repeated identical status case-insensitively no-op; vNext strict enum/history CHECK prevents duplicate but may surface DB failure for two concurrent writes. Add expected-state compare and typed conflict.

## G2-3-013-040  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/event/ApplicationStatusChangedEventListener.java:17-29`
- vNext now: `src/modules/placements/application-service.ts:848-882`, `1267-1275`
- Fix: Legacy after-commit listener schedules noncritical history write after status commits, vNext synchronous write in transaction. Define ordered exactly-once recording under rollback/retry/race.
