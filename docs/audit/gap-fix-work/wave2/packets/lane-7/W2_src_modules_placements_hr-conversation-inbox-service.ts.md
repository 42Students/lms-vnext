# Work packet (wave 2): edit src/modules/placements/hr-conversation-inbox-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-messages.md, docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-13-004-013  [P2] GAP  facet F04  effort S
- Legacy: Legacy thread preview stores lastBody full text in list API (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:218-226`)
- vNext now: New SQL preview truncates to left(body,160) and sanitizes (`src/modules/placements/hr-conversation-inbox-service.ts:73-84`)
- Fix: Keep safe 160-char snippet or advertise truncated previews explicitly.

## G2-13-004-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy search matches subject or lastBody, local trim+lowercase (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:152-155`)
- vNext now: New server query searches all authorized message bodies, drive title/IDs (`src/modules/placements/hr-conversation-inbox-service.ts:33-42`)
- Fix: Align search meaning; if full-text enhancement retained adjust placeholder/help.

## G2-13-004-035  [P2] GAP  facet F10  effort S
- Legacy: GET /api/v1/recruiter/messages/threads retrieves session-college inbox (`docs/legacy-source/frontend/src/api/Services/RecruiterService.js:11-12`)
- vNext now: New server listHrConversations accesses threaded SQL and services (`src/modules/placements/hr-conversation-inbox-service.ts:11-21`)
- Fix: Map response shape and ensure thread list can recover transient failure.

## G2-13-004-060  [P2] GAP  facet F19  effort M
- Legacy: Old frontend loads whole threads array then filters locally (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:38-43`)
- vNext now: New service filters and paginates server-side 20 (`src/modules/placements/hr-conversation-inbox-service.ts:55-62`)
- Fix: Keep cross-page search and unread totals correct; avoid hidden results.

## G2-14-025-005  [P2] GAP  facet F01  effort M
- Legacy: RecruiterDriveController.java:183-203 threads/pulse/detail/send
- vNext now: src/modules/placements/hr-conversation-inbox-service.ts:11-93 and src/app/api/placements/recruiter/conversations/[threadId]/reply/route.ts:10-35
- Fix: Map thread open, unread/pulse and contextual new conversation.

## G2-14-025-059  [P2] GAP  facet F21  effort M
- Legacy: RecruiterDriveController.java:187-189 messages pulse version
- vNext now: src/modules/placements/hr-conversation-inbox-service.ts:11-93 list with live-refresh separate
- Fix: Verify polling detects newly deleted/changed threads.
