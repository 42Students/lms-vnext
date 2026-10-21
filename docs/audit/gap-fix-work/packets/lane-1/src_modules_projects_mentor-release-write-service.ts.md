# Work packet: edit src/modules/projects/mentor-release-write-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/project-release-entity.md

## G2-17-017-016  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectRelease.java:27-31 — Non-null key/title and lengths 64/220.
- vNext now: src/modules/projects/mentor-release-write-service.ts:16-19 — Title trim min1 max200; DB title TEXT.
- Fix: Align validation and DB constraints 220 / 64.
