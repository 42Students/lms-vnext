# Work packet (wave 2): edit src/app/api/placements/recruiter/conversations/[threadId]/reply/route.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-messages.md, docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-13-004-037  [P2] GAP  facet F10  effort M
- Legacy: POST /colleges/{id}/messages with jobId null sends General (`docs/legacy-source/frontend/src/api/Services/RecruiterService.js:66-67`)
- vNext now: New POST conversations/{threadId}/reply after explicit open (`src/app/api/placements/recruiter/conversations/[threadId]/reply/route.ts:10-24`)
- Fix: Preserve one-click creation of General when no existing thread.

## G2-13-004-041  [P2] GAP  facet F11  effort M
- Legacy: Old send rechecks active access and rejects other recruiter's job (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:189-200`)
- vNext now: New reply route checks recruiter and tpo-messaging permissions (`src/app/api/placements/recruiter/conversations/[threadId]/reply/route.ts:18-28`)
- Fix: Test revoked/expired grants on send and thread read, no cross-tenant messages.

## G2-14-025-005  [P2] GAP  facet F01  effort M
- Legacy: RecruiterDriveController.java:183-203 threads/pulse/detail/send
- vNext now: src/modules/placements/hr-conversation-inbox-service.ts:11-93 and src/app/api/placements/recruiter/conversations/[threadId]/reply/route.ts:10-35
- Fix: Map thread open, unread/pulse and contextual new conversation.

## G2-14-025-013  [P2] GAP  facet F04  effort M
- Legacy: RecruiterDriveController.java:47 jobId/body/changeRequestId
- vNext now: src/app/api/placements/recruiter/conversations/[threadId]/reply/route.ts:14-23 threadId/body
- Fix: Support drive/change-request context in new conversation.

## G2-14-025-035  [P2] GAP  facet F10  effort M
- Legacy: RecruiterDriveController.java:183-203 thread pulse and messages
- vNext now: src/app/api/placements/recruiter/conversations/[threadId]/reply/route.ts:10-35 own-thread reply
- Fix: Support initial new conversation and refresh/pulse.
