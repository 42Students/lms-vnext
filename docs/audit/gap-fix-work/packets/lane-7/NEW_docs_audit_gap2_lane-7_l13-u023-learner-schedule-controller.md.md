# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/l13-u023-learner-schedule-controller.md

16 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l13-u023-learner-schedule-controller.md

## G2-13-023-007  [P1] GAP  facet F04  effort M
- Legacy: LBE/service/tpo/TpoScheduleService.java:343-357 returns roundId/name/kind, jobId, company, title, room, startsAt/endsAt, mode, meetingUrl, whatToBring, confirmedAt.
- vNext now: V/modules/placements/request-service.ts:1241-1277 returns applicationId, booked, learnerConfirmedAt, roundId/name/kind, testUrl, dueAt, sequence, duration, scheduledAt, timezone, mode, venue, meetingUrl, roleTitle/company.
- Fix: Create field-level schedule DTO parity: jobId, slot starts/ends/room, whatToBring, confirmedAt, nullable placeholders.

## G2-13-023-008  [P1] GAP  facet F04  effort M
- Legacy: LBE/service/tpo/TpoScheduleService.java:349-353 room fallback ra.room -> slot room -> round venue, treats '' and literal `null` as blank.
- vNext now: V/app/(authenticated)/learn/my-placements/schedule/page.tsx:68-73 venue uses round exception or round venue; not booked slot room.
- Fix: Use booked candidate-slot venue before round default and normalize literal null/empty.

## G2-13-023-009  [P1] GAP  facet F04  effort M
- Legacy: LBE/service/tpo/TpoScheduleService.java:349-354 schedule time uses slot.starts_at before round scheduled_date.
- vNext now: V/modules/placements/request-service.ts:1266-1271 round scheduledAt or exception; booked candidate-slot startsAt only used in exists subquery.
- Fix: Select actual booked candidate slot start/end and show it as first precedence.

## G2-13-023-010  [P1] GAP  facet F04  effort M
- Legacy: LBE/service/tpo/TpoScheduleService.java:349-357 query shows learner booked slots only and filters to open application stages, published jobs.
- vNext now: V/modules/placements/request-service.ts:1237-1313 queries SUBMITTED applications and job rounds, including planned/unbooked.
- Fix: Restrict confirmed booking list to active applications and published rounds; put planned rounds in distinct section.

## G2-13-023-013  [P1] GAP  facet F06  effort M
- Legacy: LBE/controller/tpo/LearnerScheduleController.java:40-43 map body accepts `reason` and free-form `preferredTimes` strings, no explicit validation annotation.
- vNext now: V/components/placements/learner-schedule-reschedule.tsx:39-55 reason 3-900, future datetime required, mode/venue/meetingURL fields.
- Fix: Retain free-form preferredTimes or document stricter proposal shape and migrate existing requests.

## G2-13-023-014  [P1] GAP  facet F06  effort M
- Legacy: LBE/service/tpo/TpoScheduleService.java:317-338 uses reason and preferredTimes as text, no strict dates/time or venue.
- vNext now: V/modules/placements/validation.ts:1268-1337 reason 3-2000; ISO datetime, timezone max64, venue max500, meetingURL max2000 required conditional.
- Fix: Align UI/server reason cap (900 vs 2000); decide whether preferredTimes text remains supported.

## G2-13-023-026  [P1] GAP  facet F10  effort L
- Legacy: LBE/service/tpo/TpoScheduleService.java:317-337 POST reschedule inserts reschedule_request with reason and preferred_times; no immediate booking change.
- vNext now: V/modules/placements/request-service.ts:421-530 inserts placementLearnerRequests with effectPayload, activity record, in-app notifications; booking awaits approval.
- Fix: Map legacy reschedule_request fields/status to new request schema, retain pending-approval side effect.

## G2-13-023-027  [P1] GAP  facet F10  effort M
- Legacy: LBE/service/tpo/TpoScheduleService.java:340-343 confirm updates round_assignment.student_confirmed_at by learner+round, returns false only on no booking.
- vNext now: V/modules/placements/learner-round-confirmation-service.ts:23-59 confirms booked future candidate slot with version CAS and activity event.
- Fix: Document eligibility change: past bookings and unscheduled rounds no longer confirmable.

## G2-13-023-031  [P1] GAP  facet F12  effort M
- Legacy: LBE/service/tpo/TpoScheduleService.java:316-337 reschedule only if round assignment row exists and no PENDING request.
- vNext now: V/modules/placements/request-service.ts:329-355 tests scheduled participation and unique scopeKey; duplicate same payload idempotent lines 582-607.
- Fix: Require specific booked slot where legacy does, align duplicate messaging with separate same/different payload semantics.

## G2-13-023-032  [P1] GAP  facet F12  effort M
- Legacy: LBE/service/tpo/TpoScheduleService.java:346-357 excludes non-open application statuses and non-PUBLISHED job.
- vNext now: V/modules/placements/request-service.ts:284-355 application status SUBMITTED and round scheduled, job eligibility differs.
- Fix: Add legacy completed/withdrawn/cancelled drive visibility exclusion mapping to new status model.

## G2-13-023-049  [P1] GAP  facet F22  effort L
- Legacy: LBE/service/tpo/TpoScheduleService.java:319-336 uses round_assignment and reschedule_request (round_id, application_id, reason, preferred_times, status).
- vNext now: V/modules/placements/request-service.ts:477-500 placementLearnerRequests(requestType, roundId, reason, effectPayload, scopeKey); confirmed slot separate.
- Fix: Write migration field/status map for legacy requests and booking confirmations.

## G2-13-023-050  [P1] GAP  facet F22  effort L
- Legacy: LBE/service/tpo/TpoScheduleService.java:340-354 round_assignment.student_confirmed_at on round/app; room and slot FK.
- vNext now: V/modules/placements/learner-round-confirmation-service.ts:24-50 uses placementRoundCandidateSlots.learnerConfirmedAt, version; request workspace:1246-1255.
- Fix: Migrate old booking slot identity, confirmation timestamp, room/time and version to candidate-slot records.

## G2-13-023-017  [P2] GAP  facet F07  effort S
- Legacy: LBE/controller/tpo/LearnerScheduleController.java:26-30 nonlearner rejected with `Only students have a placement schedule`.
- vNext now: V/modules/placements/request-service.ts:69-73 generic placements.read AuthorizationError.
- Fix: Restore descriptive permission error at UX boundary.

## G2-13-023-018  [P2] GAP  facet F07  effort M
- Legacy: LBE/service/tpo/TpoScheduleService.java:320-335 exact `Not found`, `You have no slot in this round to move`, `You already asked to move this slot; the placement cell will reply`.
- vNext now: V/modules/placements/request-service.ts:329-355,582-607 typed target/conflict errors.
- Fix: Map distinct no-booking and duplicate-pending errors to exact actionable legacy copy.

## G2-13-023-019  [P2] GAP  facet F07  effort S
- Legacy: LBE/service/tpo/TpoScheduleService.java:341-343 missing confirmation => `Not found`.
- vNext now: V/modules/placements/learner-round-confirmation-service.ts:41-50 missing/expired booking throws placements.read authorization.
- Fix: Return privacy-safe not-found/expired-booking error with clear retry guidance.

## G2-13-023-022  [P3] GAP  facet F08  effort S
- Legacy: LBE/controller/tpo/LearnerScheduleController.java:37-38 confirm returns `{ok:true}`.
- vNext now: V/components/placements/learner-round-confirm-attendance.tsx:13-25 sets `Confirmed` label, no toast.
- Fix: Check legacy toast and confirmation label live, map response success.
