# Work packet: edit src/modules/placements/company-drive-facts-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-repository.md

## G2-3-015-008  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:173-179`
- vNext now: `src/modules/placements/company-drive-facts-service.ts:50-68`
- Fix: Legacy historic company drive match uses companyId OR same companyName when companyId null; vNext normalized relationship requires ID. Provide tenant-safe historic fallback for unlinked old drives.

## G2-3-015-028  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:190-214`
- vNext now: `src/modules/placements/company-drive-facts-service.ts:26-74`
- Fix: Legacy unscoped aggregate exists for global/no college and college-specific variant excludes other-college rows; vNext company facts is college scoped relationship. Preserve org/global views only with explicit super-admin access.
