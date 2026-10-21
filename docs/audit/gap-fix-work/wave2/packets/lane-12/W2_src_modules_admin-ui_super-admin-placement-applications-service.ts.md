# Work packet (wave 2): edit src/modules/admin-ui/super-admin-placement-applications-service.ts

34 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u014-job-application-search-controller.md, docs/audit/gap2/lane-8/l11-u030-superadmin-job-applications.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md

## G2-12-014-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-81`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-70`
- Fix: Legacy GET `/search?query&limit&organizationId` returns list directly; vNext scoped read uses page/pageSize/q/status/jobId and selected college.

## G2-12-014-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:83-104`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:53-67`
- Fix: Legacy GET `/stats` returns totalApplications for authorized organization; vNext count is filtered selected-college page total, not org-wide total.

## G2-12-014-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:83-104`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:53-67`
- Fix: Legacy application count is standalone status JSON, vNext count appears within list result/page navigation.

## G2-12-014-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-61`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:49-51`
- Fix: Parameter name `query` changes to `q` and searches roleTitle and users.displayName but not companyName/status text.

## G2-12-014-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:59-61`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:34-38`
- Fix: Legacy limit defaults15 and orgId optional; vNext user chooses job/status/stage/source/channel and paginated rows.

## G2-12-014-012  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:13-29`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:12-22`
- Fix: Legacy search DTO application id, learnerId/name, jobId/title, companyName, applicationStatus and organizationId; vNext projections add channel, eligibility, roleTitle, stage but omit company from list.

## G2-12-014-014  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:77-90`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:62-67`
- Fix: Legacy per-row status from JobApplication.applicationStatus rich enum, vNext application status SUBMITTED/WITHDRAWN and derived screening/pipelineStage.

## G2-12-014-015  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:27-29`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:62-67`
- Fix: Legacy displayName `learnerName - jobTitle`, vNext title learnerName and subtitle jobTitle · roleTitle.

## G2-12-014-016  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:41-46`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:49-51`
- Fix: Legacy case-insensitive substring across learnerName/jobTitle/companyName/applicationStatus; vNext SQL ilike learnerName/jobTitle/roleTitle only.

## G2-12-014-017  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:59-61`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:34-51`
- Fix: Legacy max list via `limit` with no pagination; vNext page/pageSize with stage/status/source/academic cohort.

## G2-12-014-018  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:103-117`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:53-57`
- Fix: Legacy empty query yields first `limit` insertion-order cached rows; vNext SQL list with explicit server ordering and pagination.

## G2-12-014-020  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:60-61`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-11`
- Fix: Legacy `limit` raw int (negative/0 handling delegated to stream.limit or failure), vNext Zod/strict server-read page params validate bounds.

## G2-12-014-021  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:63-78`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:11-31`
- Fix: Legacy accepts integer organizationId only for GLOBAL Super Admin; vNext selected college required, no orgId param override.

## G2-12-014-031  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-80`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-67`
- Fix: Legacy in-memory cache.searchWithinOrganization request, vNext DB select over joins with filters plus independent count query.

## G2-12-014-032  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:83-104`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:53-58`
- Fix: Legacy cache.countWithinOrganization includes all soft-active org applications, vNext filtered selected-college count only.

## G2-12-014-036  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:37-46`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-11`
- Fix: Legacy `module.placements.enabled` guard on every call except global SA refresh; vNext service relies requireSuperAdminSelectedCollege placements.read for reads and active scope.

## G2-12-014-037  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:108-114`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-11`
- Fix: Legacy refresh requires Super Admin but permits global actor without college; no parallel vNext action.

## G2-12-014-039  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:49-69`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:53-58`
- Fix: Legacy all not-deleted applications loaded on cache init/refresh; vNext SQL reads current DB directly without stale snapshot.

## G2-12-014-040  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:80-88`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:34-38`
- Fix: Legacy status direct applicationStatus; vNext DB status only SUBMITTED/WITHDRAWN and derived screenings to stage, legacy status map required.

## G2-12-014-041  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:59-60`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:53-57`
- Fix: Legacy default limit15; vNext default pageSize from superAdminReadQuerySchema is different and paged.

## G2-12-014-043  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:50-75`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-67`
- Fix: Legacy cache load failure logs error and may serve previous/empty values; vNext SQL exception shows page failure instead of silent empty.

## G2-12-014-044  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:103-104`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:53-67`
- Fix: Legacy empty search returns [] success with no hint why; vNext AdminScopedReadPage has explicit empty/error states and pagination.

## G2-12-014-052  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:60-61`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-11`
- Fix: Legacy limit/orgId malformed inputs yield backend behavior, vNext Zod validation returns controlled errors; test screen-reader announcement at admin page.

## G2-12-014-056  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:49-70`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:53-57`
- Fix: Legacy eagerly loads all global applications once per cache reload and filters in memory; vNext DB pagination/count on demand.

## G2-12-014-059  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:29-36`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-67`
- Fix: Legacy partition map ConcurrentHashMap is refreshed wholesale but other caches also mutated; vNext DB read snapshots have transaction/session consistency.

## G2-12-014-060  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:101-117`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:49-57`
- Fix: Legacy Unicode .toLowerCase default locale substring, vNext ilike + scopedSearchLike escapes wildcards; special %/_ case differs.

## G2-12-014-061  [P2] MISSING  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:106-114`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-67`
- Fix: Legacy authorized POST refresh addresses staleness, vNext live reads render no refresh action; prove external cache consumers updated before retiring endpoint.

## G2-12-014-063  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:23-24`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-11`
- Fix: Legacy explicit credentialed CORS 42lms.com wildcard/origin patterns, vNext same-origin authenticated server functions and API export, no equivalent v2 CORS surface.

## G2-12-014-067  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:106-115`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-67`
- Fix: Global Super Admin search-cache refresh API not present in vNext; removal expected as no cache but external integrations need redirect/deprecation.

## G2-11-030-050  [P2] GAP  facet F22  effort L
- Legacy: 224-246 application history, screening, offer-letter, notes separate in legacy DTOs
- vNext now: src/modules/admin-ui/super-admin-placement-applications-service.ts:13-27 list only basic fields; normalized service/model split
- Fix: Document detail schema closure with screening/notes/history/attachments.

## G2-15-026-053  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:550-551 'Notes updated successfully'
- vNext now: src/modules/admin-ui/super-admin-placement-applications-service.ts:13-21 no notes in list
- Fix: Restore note action and exact toast

## G2-15-026-055  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:437-439,475-489 max100/page and multi-field filters
- vNext now: src/modules/admin-ui/super-admin-placement-applications-service.ts:53-57 query count + page, sorted submittedAt ASC
- Fix: Use consistent bounded pagination and index filtered metrics

## G2-12-014-011  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:102-104`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:61-67`
- Fix: Legacy stats uses `totalApplications` key, vNext returns `total` and totalPages, not same public schema.

## G2-12-014-053  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:75-80`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:61-67`
- Fix: Legacy exact Applications retrieved vs vNext standard Applications heading and result count, no message.
