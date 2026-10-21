# Work packet: NEW / MISSING items from docs/audit/gap2/lane-8/tpo-applicant-controller.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/tpo-applicant-controller.md

## G2-8-023-009  [P1] GAP  facet F03  effort M
- Legacy: Legacy bulk reject action labelled Not selected and internal/student reasons separate (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:23-29; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:41-45).
- vNext now: New bulk option Reject with candidate message, note input combines review/private note/message label (src/components/tpo/tpo-bulk-action-panel.tsx:156-159,260-270).
- Fix: Split internal note from candidate-facing rejection explanation to prevent disclosure confusion.

## G2-8-023-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy bulk result keys undoGroupId, moved, skipped[{applicationId,reason}] (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:98-106).
- vNext now: New returns outcomes updated/skipped/failed and runAuditId only for STUDENTS (src/modules/placements/tpo-bulk-action-confirm-service.ts:97-129).
- Fix: Preserve all per-application reasons and application-level undo identifiers if expected.

## G2-8-023-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy AddStudentsRequest learnerIds, includeIneligible boolean, reason string (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:70-81).
- vNext now: New bulk add input membershipIds, roleOptionId, includeIneligible.reason (src/modules/placements/bulk-drive-service.ts:362-370,97-110).
- Fix: Add explicit role choice and required reason only for override; map old scalar learner IDs.

## G2-8-023-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy internal rejection reason is optional but stays private (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:41-45; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:47-49).
- vNext now: New application-action note requires >=10 chars and labelled context/private note/message (src/components/tpo/tpo-bulk-action-panel.tsx:79-83,260-270).
- Fix: Provide separate required candidate message versus private internal note with exact use.

## G2-8-023-037  [P1] MISSING  facet F10  effort M
- Legacy: Legacy Undo reverses application status/history, cancels pending notices within window (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:154-192).
- vNext now: New confirmation only grants undoRows for STUDENTS, APPLICATIONS runAuditId null (src/modules/placements/tpo-bulk-action-confirm-service.ts:97-129).
- Fix: Implement safe, bounded application bulk Undo with notification cancellation or explicitly mark feature dropped.

## G2-8-023-038  [P1] GAP  facet F10  effort M
- Legacy: Legacy applied-by-college writes source APPLIED_BY_COLLEGE, opt-out 48h, in-app notice (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveAddService.java:121-133).
- vNext now: New writes eligibilitySnapshot source TPO_BULK_ADD and in-app notification (src/modules/placements/bulk-drive-service.ts:314-350).
- Fix: Preserve 48h opt-out and source provenance in new application model and learner controls.

## G2-8-023-043  [P1] GAP  facet F12  effort M
- Legacy: Legacy bulk move only OPEN_STAGES APPLIED,SHORTLISTED,ASSESSMENT,INTERVIEW,WAITLISTED (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:35-38,115-131).
- vNext now: New stage advance requires SUBMITTED+SHORTLISTED and eligible test/interview round (src/modules/placements/tpo-bulk-application-stage-service.ts:39-70).
- Fix: Map old statuses to new screening/round stages; preserve offered/withdrawn restrictions.

## G2-8-023-044  [P1] GAP  facet F12  effort M
- Legacy: Legacy reject transitions to REJECTED but never for offered/placed/withdrawn (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:41-45; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:109-131).
- vNext now: New screening review separates REJECTED decision from placementApplications.status (src/modules/placements/tpo-applicant-review-service.ts:18-40).
- Fix: Reconcile Not selected pipeline visible status with underlying screening decision.

## G2-8-023-053  [P1] GAP  facet F15  effort M
- Legacy: Legacy bulk move/reject holds status-changed notices until Undo window ends (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:140-147,154-175).
- vNext now: New application actions commit per-row without app undoRows (src/modules/placements/tpo-bulk-action-confirm-service.ts:66-84,97-129).
- Fix: Implement held-notice grace and Undo or warn that notices may immediately deliver.

## G2-8-023-054  [P1] GAP  facet F15  effort M
- Legacy: Legacy added on behalf enqueues APPLIED_ON_BEHALF and allows 48h opt-out (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveAddService.java:121-133).
- vNext now: New added student gets in-app notice with /learn/my-placements action (src/modules/placements/bulk-drive-service.ts:314-350).
- Fix: Restore exact opt-out due time and candidate-facing explanation.

## G2-8-023-059  [P1] GAP  facet F18  effort M
- Legacy: Legacy internalReason kept private and student-facing label Not shortlisted (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:23-29; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:41-45).
- vNext now: New single note labelled Review context / private note / message (src/components/tpo/tpo-bulk-action-panel.tsx:260-270).
- Fix: Separate private note label from candidate message with clear visibility note.

## G2-8-023-069  [P1] MISSING  facet F22  effort M
- Legacy: Legacy undo metadata stored in NotificationOutboxEntry with group and pending event (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:160-175).
- vNext now: New application bulk run does not persist undoRows in aggregate event (src/modules/placements/tpo-bulk-action-confirm-service.ts:97-125).
- Fix: Add durable per-application prior status and notification hold references for reversibility.

## G2-8-023-070  [P1] GAP  facet F22  effort M
- Legacy: Legacy add source APPLIED_BY_COLLEGE plus optOutUntil (+48h) (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveAddService.java:121-133).
- vNext now: New eligible snapshot source TPO_BULK_ADD, role option & membership, no visible +48h in inspected insert (src/modules/placements/bulk-drive-service.ts:314-350).
- Fix: Backfill provenance and candidate opt-out SLA from old applications.

## G2-8-023-024  [P2] GAP  facet F07  effort M
- Legacy: Legacy empty add list: Choose at least one student (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveAddService.java:63-68).
- vNext now: New UI disables preview when selected count zero (src/components/tpo/tpo-bulk-action-panel.tsx:74-78,341-342).
- Fix: Use same validation wording when direct API receives zero IDs.

## G2-8-023-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy debarred result Debarred from drives and already result Already on this drive (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveAddService.java:52-60).
- vNext now: New outcome may say Drive eligibility requirements not met and prior application status (src/modules/placements/bulk-drive-service.ts:151-160,261-269).
- Fix: Preserve distinct debarred/already/ineligible row messages.

## G2-8-023-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy Undo conflict: Too late to undo: the students have already been told (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:108-114).
- vNext now: New student-batch undo UI generic This batch cannot be undone ... window expired (src/components/tpo/tpo-bulk-action-panel.tsx:160-172).
- Fix: Provide exact cause and deadline for application undo refusal.

## G2-8-023-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy not-applied reminder after deadline: The deadline has passed, so they can no longer apply. Extend it first. (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:115-125).
- vNext now: New preview reason Application deadline has passed and write PLACEMENT_APPLICATION_DEADLINE_PASSED (src/modules/placements/tpo-remind-not-applied-service.ts:41-54).
- Fix: Include remedial Extend it first guidance in UI.

## G2-8-023-028  [P2] GAP  facet F07  effort M
- Legacy: Legacy once-per-day reminder explicit Students ... were already reminded today. One reminder a day at most. (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:121-125).
- vNext now: New reason This drive has already been reminded today. (src/modules/placements/tpo-remind-not-applied-service.ts:76-85).
- Fix: Align daily reminder disabled-state copy and exact business-day rule.

## G2-8-023-029  [P2] GAP  facet F08  effort M
- Legacy: Legacy apply-on-behalf returns HTTP201 with {added, skipped, results} (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:58-68).
- vNext now: New bulk add returns counts/result object through service (src/modules/placements/bulk-drive-service.ts:362-405).
- Fix: Keep confirmation per learner Added/Skipped and correct 201/200 semantics.

## G2-8-023-030  [P2] GAP  facet F08  effort M
- Legacy: Legacy bulk-move/reject return undoGroupId, moved, skipped (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:90-105).
- vNext now: New bulk returns outcomes and separate summary-warning if aggregate audit failed (src/modules/placements/tpo-bulk-action-confirm-service.ts:97-129).
- Fix: Show updated/skipped/failed distinct totals and explicit undo availability.
