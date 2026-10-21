# Work packet (wave 3): edit src/modules/placements/tpo-recruiter-thread-detail-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-19-031-063  [P1] MISSING  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:213-214` — Change request event posts link to request in recruiter thread.
- vNext now: `src/modules/placements/tpo-recruiter-thread-detail-service.ts:22-32` — New detail projection cannot render event/request fields.
- Fix: Wire event FK, body, request summary and safe target links.
