# Work packet (wave 2): edit src/modules/placements/tpo-applicant-pipeline-service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-application-search-cache.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-3/l12-u014-job-application-search-controller.md

## G2-13-014-010  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:54-57` learner display name from firstName + ' ' + lastName trimmed
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:97` users.displayName, learnerProfiles.rollNumber separate
- Fix: Choose canonical searchable learner name and migration display-name fallback; test single/blank names

## G2-13-014-012  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:103-105` blank query returns orgList insertion order, limit first N
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:160-163` sorts newest/oldest/name by requested option default NEWEST
- Fix: For legacy search endpoint preserve defined stable insertion/order replacement or document new default newest

## G2-13-014-029  [P2] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-103` response wrapper (success/message/data)
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:177-190` returns typed pipeline object in page, no search API wrapper
- Fix: Provide old result envelope only at compatibility route; preserve new page data model

## G2-13-014-051  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:65-69` null organizationId apps are present in global index but absent org partitions
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:26-30` job must be in college and membership present
- Fix: Decide handling of legacy null-org imported applications and audit orphan rates

## G2-14-011-001  [P2] GAP  facet F01  effort M
- Legacy: Organization-scoped admin job and application endpoints rooted /api/v1/admin/placement/jobs `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:46-51` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:139-170`
- vNext now: New separated jobs, college applications and TPO pipeline services `src/modules/placements/job-service.ts:86-150` `src/modules/placements/tpo-applicant-pipeline-service.ts:13-30`
- Fix: Map all old endpoints to canonical new routes per role

## G2-14-011-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy filters status/source/date/score search `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:449-465` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:795-861`
- vNext now: TPO pipeline stage/channel/eligibility/search flags `src/modules/placements/tpo-applicant-pipeline-service.ts:33-90` `src/modules/placements/tpo-applicant-pipeline-service.ts:158-176`
- Fix: Add score ranges, date bounds, source compatibility filters

## G2-14-011-016  [P2] GAP  facet F05  effort L
- Legacy: Legacy filters academic department/program/batch/class and skills `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:743-760` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:768-837`
- vNext now: New TPO pipeline joins enrollments, programs, departments `src/modules/placements/tpo-applicant-pipeline-service.ts:31-63` `src/modules/placements/tpo-applicant-pipeline-service.ts:100-160`
- Fix: Reintroduce missing batch/class/skill filters with authorized counts

## G2-14-011-071  [P2] GAP  facet F19  effort M
- Legacy: Legacy screening scores fetched only for page rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:892-915`
- vNext now: New TPO pipeline projects screening stage without corresponding score `src/modules/placements/tpo-applicant-pipeline-service.ts:127-163`
- Fix: Join bounded score projection

## G2-12-014-019  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-61`
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:59-67`
- Fix: TPO alternative search scopes to one job + college and includes roll/email/phone/batch as match; not org-wide replacement.

## G2-12-014-057  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:101-117`
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:94-163`
- Fix: Legacy org-level in-memory scanning and limit15 vs vNext indexed per-job SQL with JOIN and page cap; benchmark wide-campus data loads.

## G2-13-014-014  [P3] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:107-116` single compound string permits matches spanning name/job/company boundaries
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:64-67` OR per-field predicates; cross-field substring cannot match
- Fix: If exact legacy search matching needed, concatenate normalized fields in SQL or record deliberate semantic change

## G2-13-014-050  [P3] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:107-116` concatenates fields with spaces, can match across field boundaries
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:64-67` OR across separate field ILIKE
- Fix: Document cross-field matching exception and add SQL normalized concatenation only if required
