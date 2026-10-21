# Work packet (wave 2): edit src/modules/placements/tpo-team-internal-reply-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-19-031-092  [P2] GAP  facet F15  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoTeamThreadService.java:267-270` — Team mention follow/unread per-person state.
- vNext now: `src/modules/placements/tpo-team-internal-reply-service.ts:96-106` — New private message emits only counterpart notice.
- Fix: Create mentions/add people/ask notifications and read state.
