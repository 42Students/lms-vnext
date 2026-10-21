# Work packet (wave 2): edit src/modules/placements/college-drive-read-service.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-repository.md, docs/audit/gap2/lane-9/college-admin-jobs-all.md

## G2-3-015-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:15-27`
- vNext now: `src/modules/placements/college-drive-read-service.ts:24-29`, `src/modules/placements/learner-job-service.ts:89-150`
- Fix: Legacy one JPA repository covers learner, college/org and recruiter-drive queries; vNext separates route-scoped Drizzle services, with no shared repository interface. Document caller mapping for every query, preserve visible defaults.

## G2-3-015-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:126-146`
- vNext now: `src/modules/placements/college-drive-read-service.ts:27-94`
- Fix: Legacy downstream college dashboard reads active counts and college/org inclusive job lists; vNext college drives view is paginated status/season/query-based list. Preserve metric/list semantics on card and overview.

## G2-3-015-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:22-27`, `126-128`
- vNext now: `src/modules/placements/tpo-operations-service.ts:39-129`, `src/modules/placements/college-drive-read-service.ts:24-94`
- Fix: Legacy count of active/published college-or-org jobs and separately active college count can differ; vNext operations counts restrict collegeId. Add exact scoped counter labels to avoid confusing different totals.

## G2-3-015-010  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:56-63`, `75-97`
- vNext now: `src/modules/placements/learner-job-service.ts:89-150`, `src/modules/placements/college-drive-read-service.ts:77-83`
- Fix: Legacy learner-active and org-active lists are createdAt DESC, vNext learner list sorts applicationDeadline ASC then title; college view defaults query.sort setting with NEWEST/DEADLINE. Align default sort per surface.

## G2-3-015-012  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:141-146`
- vNext now: `src/modules/placements/college-drive-read-service.ts:57-83`
- Fix: Legacy all nondeleted college-or-org rows include inactive/draft for admin; vNext status filter ALL and archive policy may include/exclude archived differently. Define explicit visibility parity for each lifecycle.

## G2-3-015-021  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:18-27`
- vNext now: `src/modules/placements/college-drive-read-service.ts:27-94`
- Fix: Legacy findRecruiterRequests uses recruiterId and collegeId plus deleted=false id DESC; vNext separate candidate request model. Build adapter with correctly scoped request ownership and sorting.

## G2-3-015-039  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:41-59`, `181-188`
- vNext now: `src/modules/placements/learner-job-service.ts:132-150`, `src/modules/placements/college-drive-read-service.ts:27-94`
- Fix: Legacy list naming Active jobs and application-deadline expiry versus vNext Published, Closed and Archived lifecycle terms; ensure old user-facing Status chips map statuses exactly.

## G2-3-015-040  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:52-73`
- vNext now: `src/modules/placements/college-drive-read-service.ts:77-83`, `src/db/schema/placements.ts:548-559`
- Fix: Legacy sorts IDs before fetching rows to avoid MySQL JSON sort buffer overflow and restores that order; vNext SQL sorts projected joined rows, small paginated slices. Keep indices/limits for JSON-heavy records.

## G2-9-015-029  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:535-546` — Deadline date derives from applicationDeadline or importantDates label case insensitive.
- vNext now: `src/modules/placements/college-drive-read-service.ts:31-42` — Reads placementJobs.applicationDeadline only.
- Fix: Keep date migration/persisted milestone linkage.

## G2-9-015-098  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:250-267` — Legacy GET admin/jobs/search uses backend search indexed by postedDate.
- vNext now: `src/modules/placements/college-drive-read-service.ts:22-81` — SQL ilike pattern + count, relation joins and subquery applicants.
- Fix: Profile index usage at scale; keep bounded server paging.
