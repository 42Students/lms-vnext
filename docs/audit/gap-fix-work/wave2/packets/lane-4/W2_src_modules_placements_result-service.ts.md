# Work packet (wave 2): edit src/modules/placements/result-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md, docs/audit/gap2/lane-4/l13-u030-interview-feedback-form.md

## G2-12-022-018  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoResultsController.java:46-49 — null source default TPO; fixed submittedByType FACULTY
- vNext now: src/modules/placements/result-service.ts:472-492 — source derives HR or TPO from permission
- Fix: Keep source provenance for Excel/panelist/drive-day import paths

## G2-12-022-032  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:91-101 — terminal applicants marked applied but unchanged in application stage
- vNext now: src/modules/placements/result-service.ts:627-710 — require active application + shortlisted before applying; reports generic skip
- Fix: Report terminal/withdrawn status explicitly, preserve forensic result as reviewed

## G2-12-022-034  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoResultsController.java:62-70 — writes ROUND_RESULTS_APPLIED drive audit with applied/skipped counts
- vNext now: src/modules/placements/result-service.ts:775-800 — per-applied result activity event; no same aggregate action in bulk path
- Fix: Record a whole-round aggregate audit event with applied/skipped/unchanged count

## G2-12-022-056  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:64-79 — uses NotificationOutboxService and job application history writer
- vNext now: src/modules/placements/result-service.ts:775-807 — activity event and learner event delivery under DB transaction
- Fix: Document delivery retry/outbox parity and prevent duplicate notifications

## G2-13-030-043  [P2] GAP  facet F20  effort M
- Legacy: Backend optimistic conflict message 'This interview was updated by someone else...' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:986-992`
- vNext now: New result version conflict semantics distinct `src/modules/placements/result-service.ts:221-250`
- Fix: Surface stale feedback conflict and refresh state.
