# Work packet (wave 2): edit src/modules/placements/tpo-operations-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-all.md, docs/audit/gap2/lane-10/superadmin-jobs-index.md, docs/audit/gap2/lane-3/job-repository.md

## G2-10-016-078  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:45-80,233-283 — Job list via AdminService searchAdminJobs and college membership.
- vNext now: src/modules/placements/tpo-operations-service.ts:25-47; src/modules/placements/admin-drive-directory-model.ts:15-29 — Modern getPlacementTpoOperations and filtered normalized list.
- Fix: Document direct old/new field mapping and ordering.

## G2-10-017-084  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:55-60,197-215 — Old activeTotal/allTotal/job applicant counts based on legacy isActive/isDraft, numeric IDs.
- vNext now: src/modules/placements/tpo-operations-service.ts:737-746 — New placement status enum, UUID and normalized data with different count buckets.
- Fix: Map deleted/archived, active/expired, applicant-count nullability.

## G2-3-015-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:22-27`, `126-128`
- vNext now: `src/modules/placements/tpo-operations-service.ts:39-129`, `src/modules/placements/college-drive-read-service.ts:24-94`
- Fix: Legacy count of active/published college-or-org jobs and separately active college count can differ; vNext operations counts restrict collegeId. Add exact scoped counter labels to avoid confusing different totals.

## G2-3-015-025  [P2] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:181-188`
- vNext now: `src/modules/placements/tpo-drive-deadline-service.ts:10-23`, `src/modules/placements/tpo-operations-service.ts:39-129`
- Fix: Legacy scheduled auto-expiry uses findActiveJobsPastApplicationDeadline across all jobs, excluding drafts; vNext shows per-drive deadline read, no matching candidate list in cited service. Add scheduled expiry query/transition or explicit decision.

## G2-3-015-031  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:122-128`
- vNext now: `src/modules/placements/tpo-operations-service.ts:39-129`
- Fix: Legacy active college count includes active drafts, while published college-org count excludes drafts. VNext lifecycle counts by status. Keep count definitions distinct and label accurately.

## G2-3-015-045  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:181-188`
- vNext now: `src/modules/placements/tpo-operations-service.ts:39-129`, `src/modules/placements/tpo-drive-deadline-service.ts:10-23`
- Fix: Legacy expiry jobs can be consumed by a background scheduler; vNext deadline read supports per-drive UI but scheduled expiry processing not established by these sources. Verify task and event wiring.
