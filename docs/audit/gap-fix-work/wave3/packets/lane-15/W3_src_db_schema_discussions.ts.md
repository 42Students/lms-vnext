# Work packet (wave 3): edit src/db/schema/discussions.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l17-u020-classroom-message.md

## G2-17-020-051  [P1] MISSING  facet F23  effort L
- Legacy: Legacy retains soft-deleted records for history, restores by no documented endpoint. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:148`
- vNext now: vNext no deletion history columns; draft exists but is not registered. `src/db/schema/discussions.ts:46`
- Fix: Register, deploy and use verified soft-delete+snapshot migration; no data migration assumed.
