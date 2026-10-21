# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/l13-u023-learner-schedule-controller.md

11 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l13-u023-learner-schedule-controller.md

## G2-13-023-001  [P2] GAP  facet F01  effort M
- Legacy: LBE/controller/tpo/LearnerScheduleController.java:12-16,34-44 learner `/api/v1/learner/schedule` GET, round-scoped confirm and reschedule POST.
- vNext now: V/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-112 learner Schedule with Coming up/Past/Calendar; V/app/api/placements/learner/rounds/confirm/route.ts:7-14 and V/app/api/placements/requests/route.ts:7-30 POST JSON.
- Fix: Document endpoint migration, keep learner entry link and route compatibility.

## G2-13-023-004  [P2] MISSING  facet F03  effort M
- Legacy: LBE/service/tpo/TpoScheduleService.java:346-357 rows include whatToBring and room/meetingURL/confirmed time.
- vNext now: V/app/(authenticated)/learn/my-placements/schedule/page.tsx:62-102 displays mode, duration, venue, links, result and confirmation; no whatToBring field displayed.
- Fix: Project and show round what-to-bring field with exact empty state.

## G2-13-023-011  [P2] GAP  facet F05  effort S
- Legacy: LBE/service/tpo/TpoScheduleService.java:352-357 ORDER BY COALESCE(slot startsAt, round date) ascending.
- vNext now: V/modules/placements/learner-placement-schedule-model.ts:28-45 separates ahead ascending and past descending, undated appended.
- Fix: Match chronological list where expected; document new Past reverse sort and undated treatment.

## G2-13-023-015  [P2] GAP  facet F06  effort S
- Legacy: LBE/controller/tpo/LearnerScheduleController.java:37-38 confirm POST carries no body and uses session learner id, roundId from path.
- vNext now: V/modules/placements/learner-round-confirmation-service.ts:13-22 body requires applicationId/roundId/confirmed true.
- Fix: Preserve session-owned confirmation, explain new applicationId+boolean contract.

## G2-13-023-016  [P2] GAP  facet F06  effort S
- Legacy: LBE/service/tpo/TpoScheduleService.java:317-334 request allows same reason/pref times strings, but only scheduled round.
- vNext now: V/components/placements/learner-schedule-reschedule.tsx:14-17 future time enforced client; no disabled when absent booking in page:124-127.
- Fix: Disable reschedule where user not booked or round ended; server already checks participation.

## G2-13-023-025  [P2] GAP  facet F10  effort M
- Legacy: LBE/controller/tpo/LearnerScheduleController.java:34-35 GET delegates to assignmentsForLearner(principal.id).
- vNext now: V/app/(authenticated)/learn/my-placements/schedule/page.tsx:22-32 server loads request workspace and results.
- Fix: Provide equivalent own learner-only filtered API for clients requiring legacy feed.

## G2-13-023-041  [P2] GAP  facet F18  effort S
- Legacy: LBE/service/tpo/TpoScheduleService.java:330-333 duplicate text `You already asked to move this slot; the placement cell will reply`.
- vNext now: V/components/placements/learner-schedule-reschedule.tsx:27-29 generic `Request not sent...` error.
- Fix: Map API duplicate/conflict cause to actionable legacy specific message.

## G2-13-023-044  [P2] GAP  facet F20  effort M
- Legacy: LBE/service/tpo/TpoScheduleService.java:320-336 SELECT application FOR UPDATE and checks PENDING requests under lock to avoid double-submit.
- vNext now: V/modules/placements/request-service.ts:447-490 insert on conflict do nothing plus scopeKey; lines 582-607 exact-payload replay returns existing.
- Fix: Preserve single active request while documenting retry idempotency vs legacy duplicate failure.

## G2-13-023-046  [P2] GAP  facet F20  effort M
- Legacy: LBE/service/tpo/TpoScheduleService.java:348-356 LocalDateTime from SQL projected as site local.
- vNext now: V/app/(authenticated)/learn/my-placements/schedule/page.tsx:46-61 renders Asia/Kolkata explicit calendar day/time.
- Fix: Verify old round timezone and convert legacy local timestamps without double IST offset.

## G2-13-023-047  [P2] GAP  facet F21  effort M
- Legacy: LBE/service/tpo/TpoScheduleService.java:23-25,304-315 uses NotificationOutboxService and TpoAuditService for schedule assignment/decision.
- vNext now: V/modules/placements/request-service.ts:501-555 activity and inAppNotifications; no same legacy outbox API.
- Fix: Map event idempotency/delivery timing and audit taxonomy from legacy to vNext.

## G2-13-023-052  [P2] GAP  facet F23  effort S
- Legacy: LBE/service/tpo/TpoScheduleService.java:346-357 booked-only schedule and whatToBring response.
- vNext now: V/app/(authenticated)/learn/my-placements/schedule/page.tsx:62-102 includes extra result/test/absent warnings, omits whatToBring.
- Fix: Restore omitted whatToBring and preserve new useful result extensions.
