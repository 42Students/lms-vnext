# Work packet (wave 2): edit src/modules/placements/recruiter-drive-search-service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-index.md, docs/audit/gap2/lane-16/u013-job-search-dto.md, docs/audit/gap2/lane-17/job-search-controller.md

## G2-11-003-054  [P2] GAP  facet F10  effort S
- Legacy: Legacy response includes roleTitle, ctc, mode, deadline, driveGroupId `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:53`
- vNext now: VNext job row loaded from placementJobs and relation joins `src/modules/placements/recruiter-drive-search-service.ts:25`
- Fix: Preserve fields/label mapping

## G2-11-003-092  [P2] GAP  facet F19  effort S
- Legacy: Client filters all returned rows `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:123`
- vNext now: SQL filters and limits 20 `src/modules/placements/recruiter-drive-search-service.ts:103`
- Fix: Ensure priority global before LIMIT

## G2-11-003-093  [P2] GAP  facet F19  effort S
- Legacy: Stable ID-desc fallback `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:126`
- vNext now: CreatedAt desc with ID ascending fallback `src/modules/placements/recruiter-drive-search-service.ts:102`
- Fix: Match tie-breaking order

## G2-11-003-099  [P2] GAP  facet F22  effort S
- Legacy: Legacy MySQL job table source, sort id descending `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:67`
- vNext now: Postgres placementJobs, sort createdAt desc, status filter `src/modules/placements/recruiter-drive-search-service.ts:103`
- Fix: Document status data migration/order

## G2-16-013-026  [P2] GAP  facet F12  effort M
- Legacy: JobSearchDTO.java:32 Boolean isActive flag.
- vNext now: recruiter-drive-search-service.ts:47-49 filters archived and PUBLISHED/CLOSED.
- Fix: Map legacy isActive to new job status and deadline states explicitly.

## G2-16-013-040  [P2] GAP  facet F21  effort L
- Legacy: JobSearchDTO.java:21-38 depends on legacy Job/Department/NewProgram and org IDs.
- vNext now: recruiter-drive-search-service.ts:5-6 placementJobs/companies/relationships/colleges joined.
- Fix: Provide translation between legacy org/company/job and vNext relationship/delivery.

## G2-16-013-041  [P2] GAP  facet F22  effort L
- Legacy: JobSearchDTO.java:21-38 integer IDs, two timestamps, active flag, logo and targeting names.
- vNext now: recruiter-drive-search-service.ts:25-37 selects placementJobs/companies and relationships, UUID IDs.
- Fix: Document field-by-field mapping (description, responsibilities, logo, ctc, datetime, scoped targets).

## G2-16-013-042  [P2] GAP  facet F22  effort M
- Legacy: JobSearchCache.java:180-207 maps FK lookups to target names.
- vNext now: recruiter-drive-search-service.ts:25-37 joins company/college but not department/program labels.
- Fix: Join target program/department for equivalent search projections.

## G2-17-013-011  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:215-234 — Popular response `Popular jobs retrieved`.
- vNext now: src/modules/placements/recruiter-drive-search-service.ts:95-110 — Recruiter rows with total counts, no popularity field.
- Fix: Implement real/popularity facet or retire explicitly.

## G2-17-013-018  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:267-318 — Department/program/jobType dedicated GET each limit 50.
- vNext now: src/modules/placements/recruiter-drive-search-service.ts:68-105 — Recruiter combined query with page/size and employment/mode/deadline.
- Fix: Provide complete filters or safe redirect from these endpoints.

## G2-17-013-049  [P2] GAP  facet F19  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:171-172 — Only first 1000 org jobs fetched before additional filtering.
- vNext now: src/modules/placements/recruiter-drive-search-service.ts:95-105 — SQL WHERE filters before page limit.
- Fix: Eliminate legacy first-1000 blind spot, preserve semantics.

## G2-11-003-091  [P3] GAP  facet F19  effort M
- Legacy: One list API request returns every job at college `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:66`
- vNext now: SQL count + page, separate deadlines and requests queries `src/modules/placements/recruiter-drive-search-service.ts:85`
- Fix: Profile public list query cost
