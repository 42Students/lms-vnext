# Work packet: edit src/modules/placements/result-service.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md, docs/audit/gap2/lane-4/l13-u030-interview-feedback-form.md

## G2-12-022-029  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoResultsController.java:52-57 — pending GET returns only unsuperseded unapplied records
- vNext now: src/modules/placements/result-service.ts:195-218 — GET lists all versions including APPLIED and SUPERSEDED
- Fix: Expose true pending endpoint/filter for old callers; avoid applying historical rows

## G2-12-022-033  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:120-132 — two-step APPLIED → SHORTLISTED → next stage; currentRoundId updated
- vNext now: src/modules/placements/result-service.ts:744-773 — writes placement_tpo_application_stages when PASS, deletes for others
- Fix: Validate learner-facing stage transition parity for pass/hold/fail/absent

## G2-12-022-038  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:79-86,107-118 — PASS → next non-TALK bucket; TALK holds; HOLD waitlisted; default FAIL/ABSENT rejected
- vNext now: src/modules/placements/result-service.ts:744-773 — PASS next-stage only; nonpass removes progression row
- Fix: Match student-facing WAITLISTED and REJECTED messaging/status semantics

## G2-12-022-046  [P1] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:64-79 — only changed status enqueues APPLICATION_STATUS_CHANGED to learner outbox
- vNext now: src/modules/placements/result-service.ts:775-807 — per-applied event delivered as APPLICATION_STATUS_CHANGED or MARKED_ABSENT
- Fix: Prevent misleading notifications for unchanged stage; compare delivery dedupe and channel

## G2-13-030-001  [P1] MISSING  facet F01  effort M
- Legacy: Legacy Super Admin placements JobApplications opens InterviewFeedbackForm for selected interview `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:8-16`
- vNext now: New college interview workspace only schedules/edits/completes; result service is separate `src/components/placements/college-interview-appointments.tsx:94-145`; `src/modules/placements/result-service.ts:221-225`
- Fix: Add dedicated Feedback entry on completed round for authorized staff.

## G2-13-030-002  [P1] GAP  facet F01  effort M
- Legacy: Component requires interview prop and onSuccess/onCancel callbacks `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:8-19`
- vNext now: New staged results keyed by roundId/applicationId, not legacy interview ID `src/modules/placements/result-service.ts:221-233`
- Fix: Define legacy interview-to-round+application+slot mapping.

## G2-13-030-025  [P1] GAP  facet F10  effort M
- Legacy: POST /api/v1/interviews/{id}/feedback, rating/comments/recommendAction `docs/legacy-source/frontend/src/api/Services/interviewService.js:161-166`
- vNext now: New stagePlacementRoundResult(roundId, outcome, scorePercent, messages) `src/modules/placements/result-service.ts:221-234`
- Fix: Add mapped feedback action and restrict per-round candidate ownership.

## G2-13-030-026  [P1] GAP  facet F10  effort M
- Legacy: HIRE automatically moves application to OFFERED; REJECT to REJECTED when in INTERVIEW `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:1270-1335`
- vNext now: New PASS/FAIL round outcome drives separate staged apply flow `src/modules/placements/result-service.ts:579-620`; `src/modules/placements/result-service.ts:747-760`
- Fix: Explicitly handle HIRE as offer workflow and REJECT as candidate decision with safe confirmation.

## G2-13-030-027  [P1] GAP  facet F10  effort M
- Legacy: HOLD and PROCEED don't auto-advance application status `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:1274-1283`
- vNext now: New HOLD requires waitlistRank, PASS advances next round `src/modules/placements/validation.ts:1069-1089`; `src/modules/placements/result-service.ts:747-760`
- Fix: Do not silently translate legacy HOLD into ranked waitlist without consent.

## G2-13-030-036  [P1] GAP  facet F15  effort M
- Legacy: UI warns Hire/Reject will notify candidate `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:138-143`
- vNext now: New staged results not delivered until apply, in-app delivery after event `src/modules/placements/result-service.ts:579-620`
- Fix: Update confirmation text to precise stage/apply timing and notification channel.

## G2-13-030-044  [P1] GAP  facet F21  effort M
- Legacy: Legacy email/SMS status notification deferred until after commit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:1377-1393`
- vNext now: New result apply is separate operation from stage `src/modules/placements/result-service.ts:579-620`
- Fix: Define post-commit notification/worker delivery and no duplicate events.
