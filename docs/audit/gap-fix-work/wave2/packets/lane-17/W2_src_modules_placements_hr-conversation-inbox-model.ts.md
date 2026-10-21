# Work packet (wave 2): edit src/modules/placements/hr-conversation-inbox-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-messages.md

## G2-13-004-015  [P2] GAP  facet F04  effort S
- Legacy: Backend sorted newest last_message_at DESC across all own threads (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:218-226`)
- vNext now: New defaults newest, fallback createdAt and stable id, filtered by own authorized jobs (`src/modules/placements/hr-conversation-inbox-model.ts:36-45`)
- Fix: Cross-check order when lastMessageAt null or withdrawn drive.

## G2-13-004-018  [P2] GAP  facet F05  effort M
- Legacy: Legacy no inbox pagination and always renders all matching threads (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:191-220`)
- vNext now: New paginates 20 threads, Previous/Next and page clamp (`src/modules/placements/hr-conversation-inbox-model.ts:22-29`)
- Fix: Keep correct global unread totals, nav and position despite intentional scaling.
