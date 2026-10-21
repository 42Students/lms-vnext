# Work packet: edit src/modules/placements/tpo-recruiter-thread-detail-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-19-031-020  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:92-123` — Thread detail returns author IDs/names, transport, kind, event, request and readAt.
- vNext now: `src/modules/placements/tpo-recruiter-thread-detail-service.ts:10-32` — New detail selects id, senderType, body, createdAt, readAt only.
- Fix: Extend projection with sender names, via, event/request metadata.
