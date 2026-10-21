# Work packet (wave 2): edit src/modules/projects/mentor-release-write-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/project-release-entity.md

## G2-17-017-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectRelease.java:27-31 — releaseKey length64; title max220.
- vNext now: src/modules/projects/mentor-release-write-service.ts:16-19 — title max200; generated custom UUID templateKey.
- Fix: Keep 220-title legacy max or document 200 cap; preserve stable slug key.

## G2-17-017-010  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectRelease.java:53-57 — Optimistic version Long auto increments.
- vNext now: src/modules/projects/mentor-release-write-service.ts:53-57 — Timestamp expectedUpdatedAt optimistic token.
- Fix: Map version→timestamp CAS semantics for migrations.

## G2-17-017-014  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectReleaseUpsertDTO.java:9-10 — Create derives release key from title.
- vNext now: src/modules/projects/mentor-release-write-service.ts:45-50 — Create uses `custom-` + random UUID, not title slug.
- Fix: Preserve human-readable release key and de-duplication policy.
