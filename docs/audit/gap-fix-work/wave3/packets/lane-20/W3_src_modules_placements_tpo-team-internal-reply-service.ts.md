# Work packet (wave 3): edit src/modules/placements/tpo-team-internal-reply-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-19-031-048  [P1] MISSING  facet F07  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:174-178` — Private topic external mention yields ADD_PEOPLE 409 with names.
- vNext now: `src/modules/placements/tpo-team-internal-reply-service.ts:35-48` — Pair participant check denies external people, no invite-on-mention.
- Fix: Add 409 Add and send confirmation with membership mutation.
