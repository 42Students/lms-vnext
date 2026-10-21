# Work packet: edit src/modules/placements/hr-conversation-inbox-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-messages.md

## G2-13-004-014  [P1] GAP  facet F04  effort M
- Legacy: Legacy unread excludes kind EVENT and counts unread TPO MESSAGE (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:221-226`)
- vNext now: New unread counts TPO sender, readAt null, without kind filter (`src/modules/placements/hr-conversation-inbox-service.ts:63-71`)
- Fix: Exclude non-user message kinds from unread tallies; verify DB message schema.

## G2-13-004-039  [P1] GAP  facet F11  effort M
- Legacy: College session required by RecruiterSelfController requireSelectedCollege (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:109-120`)
- vNext now: New request resolves one grant or Choose college; explicit collegeId (`src/modules/placements/hr-conversation-inbox-service.ts:14-21`)
- Fix: Validate no cross-college leakage across all authorized grants.

## G2-13-004-068  [P1] GAP  facet F22  effort L
- Legacy: Old tables tpo_message_thread/tpo_message, recruiter_id, college_id, job_id, kind, read_at (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:218-226`)
- vNext now: New placement_tpo_message_threads/messages with UUID IDs, senderType, readAt, jobId (`src/modules/placements/hr-conversation-inbox-service.ts:4-10`)
- Fix: Verify migrations/status mappings for kind EVENT vs MESSAGE, read receipt and uniqueness.

## G2-13-004-070  [P1] GAP  facet F22  effort M
- Legacy: Legacy TPO reply unread only kind MESSAGE, not EVENT (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:223-225`)
- vNext now: New unread counts all TPO rows where readAt null (`src/modules/placements/hr-conversation-inbox-service.ts:63-71`)
- Fix: Match messageKind/status filter or explicitly mark events read/non-unread.
