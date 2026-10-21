# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-8/interview-controller.md

12 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/interview-controller.md

## G2-8-027-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy list GET /interviewers suggests existing free-text interviewer names (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:301-331).
- vNext now: New appointment editor uses interviewer string in per-job model, no mapped org-wide distinct-name endpoint (src/modules/placements/college-interview-action-service.ts:89-105).
- Fix: Restore organization-scoped interviewer suggestions to prevent duplicate spellings.

## G2-8-027-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy interviewMode ONLINE/OFFLINE, location may be URL or physical venue (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:69-74).
- vNext now: New round.mode VIRTUAL/ON_CAMPUS, slot room and exceptions meetingUrl (src/modules/placements/tpo-interview-slot-service.ts:296-308).
- Fix: Map mode and meeting location/URL without conflating room and link.

## G2-8-027-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy organization list returns unpaginated or page/size max500, 0-based (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:333-349,357-385).
- vNext now: New directory filters page1..1000, scoped list pagination (src/modules/placements/college-interview-directory-service.ts:11-23).
- Fix: Map page numbering, page size and exact sortable columns.

## G2-8-027-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy upcoming learner endpoint only upcoming list (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:548-585).
- vNext now: New upcoming confirmations derived from booked future slots and learner acknowledgment (src/modules/placements/learner-round-confirmation-service.ts:17-61).
- Fix: Preserve Upcoming tab and filter date in IST.

## G2-8-027-019  [P2] GAP  facet F06  effort M
- Legacy: Legacy partial PUT not @Valid; omitted scheduledDate stays unchanged (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:635-645).
- vNext now: New EDIT writes appointment using expectedVersion and full proposed shape (src/modules/placements/college-interview-action-service.ts:122-139).
- Fix: Allow partial safe edits without requiring every unchanged field.

## G2-8-027-021  [P2] GAP  facet F06  effort M
- Legacy: Legacy reschedule request may include reason,note,windows JSON and cancel toggles (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:114-123; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:842-906,1001-1050).
- vNext now: New pending learner request stores reason, TPO accepts target future slot (src/modules/placements/tpo-interview-slot-service.ts:60-73,249-317).
- Fix: Preserve note and window preferences in request form/read model.

## G2-8-027-039  [P2] GAP  facet F13  effort M
- Legacy: Legacy org missing 403 explicit Organization or college ID not found in authenticated context (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:369-375).
- vNext now: New selected college scope required; requireCollegePlacementAdmin errors (src/modules/placements/college-interview-directory-service.ts:21-23).
- Fix: Show choose-scope empty state and explicit recovery.

## G2-8-027-040  [P2] GAP  facet F13  effort M
- Legacy: Legacy missing interview returns 404 Interview not found, stale 409 (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:595-624,672-675).
- vNext now: New stale PLACEMENT_ROUND_STALE and scoped not-found service codes (src/modules/placements/college-interview-action-service.ts:123-133).
- Fix: Differentiate invalid interview link from changed booking.

## G2-8-027-046  [P2] GAP  facet F18  effort M
- Legacy: Legacy success literal Interview updated successfully, Interview cancelled successfully, Feedback submitted successfully (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:664-667,708-711,978-981).
- vNext now: New service receipts and generic Interview update notification (src/modules/placements/college-interview-action-service.ts:178-186).
- Fix: Restore exact action-specific user messages.

## G2-8-027-047  [P2] GAP  facet F18  effort M
- Legacy: Legacy learner note Reschedule request cancelled successfully and 429 Please wait before trying again (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:881-895).
- vNext now: New request approval notice Your interview reschedule was approved... (src/modules/placements/tpo-interview-slot-service.ts:309-317).
- Fix: Compare cancelled/approved/rejected wording and button disabled state.

## G2-8-027-052  [P2] GAP  facet F21  effort M
- Legacy: Legacy notification dispatch, eventPublisher, job helper, audit log integrations (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:116-143).
- vNext now: New placement event+in-app notices and optional recruiter proposal confirm (src/modules/placements/tpo-interview-slot-service.ts:85-104,169-185).
- Fix: Map notification channels, template triggers, invites and audit taxonomy one per transition.

## G2-8-027-055  [P2] GAP  facet F22  effort M
- Legacy: Legacy global overlap policy in AppSettingsService with configurable minutes (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:50-92).
- vNext now: New slot checks explicit room/booking and round-specific period (src/modules/placements/tpo-interview-slot-service.ts:132-142,326-386).
- Fix: Surface configurable overlap buffer in new rules or record intentional move.
