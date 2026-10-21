# Work packet (wave 2): edit src/modules/placements/tpo-drive-deadline-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-3/job-repository.md, docs/audit/gap2/lane-3/tpo-drive-controller.md, docs/audit/gap2/lane-8/admin-job-service.md

## G2-2-016-049  [P2] GAP  facet F20  effort M
- Legacy: Legacy importantDates picks first case-insensitive Application deadline and warns on duplicates (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2145-2182`)
- vNext now: VNext explicit timestamp-based deadline, no same important-dates JSON parser (`src/modules/placements/tpo-drive-deadline-service.ts:1-150`)
- Fix: Support old imported important dates with deterministic first-deadline behavior

## G2-2-016-109  [P2] GAP  facet F10  effort M
- Legacy: Extend deadline changes derived importantDates entry `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:349-399`
- vNext now: New extends placementJobs.applicationDeadline directly and emits TPO audit event `src/modules/placements/tpo-drive-deadline-service.ts:25-60`
- Fix: Sync legacy important-date mirrors used by downstream UI or explicitly retire derivation

## G2-3-015-009  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:181-188`
- vNext now: `src/modules/placements/tpo-drive-deadline-service.ts:10-23`
- Fix: Legacy deadline-expired active published list is computed by deadline < now; vNext deadline service reads a single drive and flags extendable by status+season. Add bulk expiry candidate query/transition.

## G2-3-015-025  [P2] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:181-188`
- vNext now: `src/modules/placements/tpo-drive-deadline-service.ts:10-23`, `src/modules/placements/tpo-operations-service.ts:39-129`
- Fix: Legacy scheduled auto-expiry uses findActiveJobsPastApplicationDeadline across all jobs, excluding drafts; vNext shows per-drive deadline read, no matching candidate list in cited service. Add scheduled expiry query/transition or explicit decision.

## G2-3-015-032  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:181-188`
- vNext now: `src/modules/placements/tpo-drive-deadline-service.ts:12-23`
- Fix: Legacy strict deadline < now and null excluded; vNext direct read includes any job with nullable deadline and extendability based status/season. Candidate expiry needs strict cutoff and timezone consistency.

## G2-3-015-045  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:181-188`
- vNext now: `src/modules/placements/tpo-operations-service.ts:39-129`, `src/modules/placements/tpo-drive-deadline-service.ts:10-23`
- Fix: Legacy expiry jobs can be consumed by a background scheduler; vNext deadline read supports per-drive UI but scheduled expiry processing not established by these sources. Verify task and event wiring.

## G2-3-023-012  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:177-182`
- vNext now: `src/modules/placements/tpo-drive-deadline-service.ts:25-60`
- Fix: Legacy newDeadline LocalDateTime vs VNext newDeadlineIso with reason/strict timestamp/season guard. Explain IST and validation.

## G2-3-023-027  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:169-182`
- vNext now: `src/modules/placements/tpo-drive-lifecycle-service.ts:38-49`, `src/modules/placements/tpo-drive-deadline-service.ts:38-55`
- Fix: VNext close after season end allowed, extension requires active season; document legacy-to-new state constraints.

## G2-8-012-049  [P2] GAP  facet F20  effort M
- Legacy: Legacy importantDates picks first case-insensitive Application deadline and warns on duplicates (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2145-2182`)
- vNext now: VNext explicit timestamp-based deadline, no same important-dates JSON parser (`src/modules/placements/tpo-drive-deadline-service.ts:1-150`)
- Fix: Support old imported important dates with deterministic first-deadline behavior
