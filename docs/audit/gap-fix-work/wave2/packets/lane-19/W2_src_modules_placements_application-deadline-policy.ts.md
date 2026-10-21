# Work packet (wave 2): edit src/modules/placements/application-deadline-policy.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/job-auto-expiry-service.md, docs/audit/gap2/lane-6/job-visibility-cache.md

## G2-19-011-010  [P2] GAP  facet F04  effort S
- Legacy: Legacy match condition deadline `< now` strictly `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:181-188`
- vNext now: vNext `isPlacementApplicationDeadlinePassed` checks `now >= deadline` `src/modules/placements/application-deadline-policy.ts:10-14`
- Fix: Align exact cutoff instant for apply, label and sweep predicates.

## G2-6-010-021  [P2] GAP  facet F12  effort M
- Legacy: Old deadline predicate `isBefore(now)` (at exact deadline, not passed) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:302-303`
- vNext now: New deadline passed when `now>=deadline` `src/modules/placements/application-deadline-policy.ts:9-13`
- Fix: Document exact-boundary change and test equality (new safer deny)
