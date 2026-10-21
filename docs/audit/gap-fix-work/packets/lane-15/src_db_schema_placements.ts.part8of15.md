# Work packet: edit src/db/schema/placements.ts (part 8 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/job-service-impl.md, docs/audit/gap2/lane-19/job-auto-expiry-service.md, docs/audit/gap2/lane-20/job-application-status-history-service-impl.md, docs/audit/gap2/lane-3/job-application-status-history-service.md

## G2-18-011-014  [P1] GAP  facet F04  effort L
- Legacy: Legacy offer response accepts OFFERED only; maps accepted HIRED and declined REJECTED (`JobServiceImpl.java:1168-1196`).
- vNext now: New offer statuses ISSUED/ACCEPTED/DECLINED separate from application status (`learner-placement-offers.tsx:30-59`; `placements.ts:973-1059`).
- Fix: Define old HIRED/REJECTED vs new offer+joining state crosswalk, preserve downstream triggers.

## G2-18-011-020  [P1] GAP  facet F06  effort L
- Legacy: Legacy apply has optional resumeUrl field, profile resume fallback (`JobServiceImpl.java:389-422,651-660`).
- vNext now: New create application input requires chosen roleOption, channel and eligibility snapshot, no resume URL in placement_applications schema (`application-service.ts:570-616`; `placements.ts:973-1020`).
- Fix: Restore optional owned resume reference and profile fallback, with secure signed access.

## G2-18-011-037  [P1] GAP  facet F10  effort L
- Legacy: Legacy job application create sets status APPLIED, source INTERNAL, screens after save (`JobServiceImpl.java:640-725`).
- vNext now: New create status SUBMITTED, channel INTERNAL/EXTERNAL, eligibility snapshot, screening separate (`application-service.ts:856-870`; `placements.ts:992-1008`).
- Fix: Map APPLIED→SUBMITTED and screening transition without losing decisions.

## G2-18-011-045  [P1] GAP  facet F12  effort M
- Legacy: Legacy one application per learner/job (unique) (`JobServiceImpl.java:663-670`).
- vNext now: New unique roleOptionId+membershipId, allowing multiple role options per job (`placements.ts:1029-1035`).
- Fix: Decide multi-role application policy; avoid unintended duplicate job-level applications.

## G2-18-011-047  [P1] GAP  facet F12  effort M
- Legacy: Legacy offer decline from OFFERED sets REJECTED, clears offer letter and remains visible (`JobServiceImpl.java:1025-1050`).
- vNext now: New offer status DECLINED separate, application remains SUBMITTED unless withdrawn (`learner-placement-offers.tsx:30-59`; `placements.ts:993-1019`).
- Fix: Ensure declined offer hides valid letter/action while retaining history and application stage.

## G2-18-011-052  [P1] GAP  facet F13  effort M
- Legacy: Legacy screening failure after apply logged but application still submitted (`JobServiceImpl.java:726-819`).
- vNext now: New screening separately persisted and driven by service, no failure in initial apply path (`application-service.ts:856-870`; `placements.ts:1114-1170`).
- Fix: Ensure failed screening preserves submitted application and offers retry/FAILED state.

## G2-18-011-060  [P1] GAP  facet F18  effort M
- Legacy: Legacy stage exact copy `Not shortlisted`, `Not cleared: Assessment`, `Waitlist ended` (`JobServiceImpl.java:899-933`).
- vNext now: New status strings enum SUBMITTED/WITHDRAWN and screening/round record (`placements.ts:993-1019,1114-1170`).
- Fix: Render exact stage copy from state-history for each legacy status.

## G2-18-011-069  [P1] GAP  facet F22  effort L
- Legacy: Legacy JobApplication integer learnerId/jobId, status and isDeleted, resumeUrl/history, stage snapshots (`JobServiceImpl.java:580-618,640-666`; `JobApplication.java:20-90`).
- vNext now: New UUID applicationId, membershipId/roleOptionId, SUBMITTED/WITHDRAWN, eligibilitySnapshot, no resume column (`placements.ts:973-1061`).
- Fix: Specify full column crosswalk including historic status/withdrawal reason/resume and role mapping.

## G2-18-011-070  [P1] GAP  facet F22  effort L
- Legacy: Legacy job integer org/college/targetProgram/Class/Batch and important_dates JSON (`JobServiceImpl.java:340-368,1545-1577`).
- vNext now: New job UUID college, eligibility policies allowed Program/Cohort/Section and legacy posting details (`placements.ts:462-625,818-921`; `placement-legacy-posting-model.ts:23-25`).
- Fix: Migrate targeting hierarchy and dates losslessly, including org-wide jobs.

## G2-18-011-071  [P1] GAP  facet F22  effort L
- Legacy: Legacy application unique learner/job, active status stage (`JobServiceImpl.java:663-670,907-933`).
- vNext now: New FK role/job, unique roleOption/membership, status only SUBMITTED/WITHDRAWN (`placements.ts:1022-1061`).
- Fix: Avoid duplicate role-choice apps on migrated single-job applications, create stage crosswalk history.

## G2-19-011-005  [P1] GAP  facet F02  effort L
- Legacy: Legacy job remains in DB as inactive, not soft-deleted `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:61-62` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:185-188`
- vNext now: vNext status enum is DRAFT/PUBLISHED/CLOSED/ARCHIVED/CANCELLED `src/db/schema/placements.ts:513-515` `src/db/schema/placements.ts:566-569`
- Fix: Map old inactive semantics onto an explicit new lifecycle representation.

## G2-19-011-009  [P1] GAP  facet F04  effort L
- Legacy: Legacy field `isActive` changed false, applicationDeadline preserved `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-65` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:89-90` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:119-121`
- vNext now: vNext keeps applicationDeadline TIMESTAMPTZ while status remains PUBLISHED until manual transition `src/db/schema/placements.ts:510-515` `src/modules/placements/tpo-drive-lifecycle-list-service.ts:64-65`
- Fix: Introduce effective-application-state or persistent expiry status.

## G2-19-011-018  [P1] GAP  facet F07  effort M
- Legacy: Legacy filters out inactive/deleted/draft `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:185-188`
- vNext now: vNext status enum and archival guard can represent non-published exclusion `src/db/schema/placements.ts:566-569` `src/modules/placements/tpo-drive-lifecycle-list-service.ts:197-213`
- Fix: Sweep only published, non-archived records with safe status CAS.

## G2-19-011-031  [P1] GAP  facet F12  effort M
- Legacy: Legacy does not touch draft or deleted jobs `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:185-188`
- vNext now: vNext has DRAFT/PUBLISHED/CLOSED/ARCHIVED/CANCELLED statuses `src/db/schema/placements.ts:566-569`
- Fix: Explicitly exclude all non-PUBLISHED statuses from automated expiry.

## G2-19-011-056  [P1] GAP  facet F22  effort L
- Legacy: Legacy Job has integer ID, `isActive`,`isDraft`,`isDeleted`, nullable `applicationDeadline` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:89-100` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:119-130` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:185-188`
- vNext now: vNext placementJobs UUID, status enum, closedAt/archivedAt and TIMESTAMPTZ deadline `src/db/schema/placements.ts:510-515` `src/db/schema/placements.ts:531-545`
- Fix: Define old-to-new status/id/deadline migration semantics.

## G2-20-011-008  [P1] GAP  facet F04  effort L
- Legacy: Legacy all statuses accepted after trim `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:29-45`
- vNext now: DB constraint only SUBMITTED and WITHDRAWN `src/db/schema/placements.ts:1097-1108`
- Fix: Clarify timeline coverage for OFFERED/HIRED/REJECTED; expose split status history or migration mapping

## G2-20-011-022  [P1] GAP  facet F12  effort S
- Legacy: No hard state enumeration, all transition strings possible `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:29-45`
- vNext now: Database hard restricts SUBMITTED/WITHDRAWN `src/db/schema/placements.ts:1097-1108`
- Fix: Define business-domain split and ensure offer/screening statuses have independent auditable tables

## G2-20-011-037  [P1] GAP  facet F23  effort S
- Legacy: Legacy noncritical recorder intentionally swallows persistence errors `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:49-52`
- vNext now: New DB-integrated audit can block transitions on constraint failure `src/db/schema/placements.ts:1097-1108`
- Fix: Owner choose audited atomicity vs availability; never silently lose status under misconfigured DB

## G2-3-013-017  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:57-67`
- vNext now: `src/db/schema/placements.ts:1096-1109`
- Fix: Legacy TPO transitions may include SHORTLISTED, ASSESSMENT, INTERVIEW, WAITLISTED, OFFERED, REJECTED etc, while vNext application status history only permits SUBMITTED/WITHDRAWN. Ensure all user-visible stage transitions audited in joined timeline.

## G2-3-013-026  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:29-45`
- vNext now: `src/db/schema/placements.ts:1048-1109`
- Fix: Legacy history accepts arbitrary nonblank status labels after case-insensitive de-duplication; vNext placementApplications and history are constrained to SUBMITTED/WITHDRAWN. Use distinct stage histories but unify display.
