# Work packet: edit src/modules/placements/tpo-team-internal-reply-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-19-031-053  [P3] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoTeamThreadService.java:217-234` — Legacy Team can report notified-recipient count after send.
- vNext now: `src/modules/placements/tpo-team-internal-reply-service.ts:96-106` — Private message only notifies counterpart; no count-specific result.
- Fix: Show notified count for group mentions.
