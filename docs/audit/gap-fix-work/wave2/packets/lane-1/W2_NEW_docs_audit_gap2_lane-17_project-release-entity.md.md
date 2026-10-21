# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-17/project-release-entity.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-17/project-release-entity.md

## G2-17-017-026  [P2] GAP  facet F10  effort M
- Legacy: src/modules/projects/mentor-release-write-service.ts:65-73 — vNext hard deletes unshipped release only if no sprints.
- vNext now: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectReleaseRepository.java:15-23 — Legacy repository default soft deletion and reserved keys.
- Fix: Decide soft-delete parity or migration retention and reserved keys.
