# Work packet (wave 2): edit src/modules/bug-tracker/admin-service.ts

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/bug-tracker-access-entity.md, docs/audit/gap2/lane-20/bug-report-attachment.md, docs/audit/gap2/lane-3/bug-report-activity.md, docs/audit/gap2/lane-4/bug-report-model.md

## G2-19-020-051  [P2] GAP  facet F19  effort M
- Legacy: Old public report list default size20 max100 and sort ASC/DESC createdAt. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicBugTrackerController.java:37-46` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:83-99`
- vNext now: vNext admin list has richer cursor semantics, mine has 50 newest. `src/modules/bug-tracker/admin-service.ts:134-175` `src/modules/bug-tracker/reporter-service.ts:12-24`
- Fix: Match per-role pagination and sort expectations or explicitly document change.

## G2-20-020-002  [P2] GAP  facet F02  effort S
- Legacy: List old-first `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportAttachmentRepository.java:9-12`
- vNext now: Admin new-first cursor50 `src/modules/bug-tracker/admin-service.ts:265-283`
- Fix: Align order

## G2-20-020-005  [P2] GAP  facet F05  effort S
- Legacy: No pagination ASC `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerAttachmentService.java:139-145`
- vNext now: Cursor50 DESC `src/modules/bug-tracker/admin-service.ts:265-283`
- Fix: Show Load more

## G2-3-021-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerWorkflowService.java:103-109`, `143-149`
- vNext now: `src/modules/bug-tracker/admin-service.ts:89-106`, `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:152-154`
- Fix: Legacy actor display Engineering or reporterName per event, vNext admin service stores actorName=null and UI says Platform administrator. Restore historical actor text mapping without leaking user IDs.

## G2-3-021-009  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportActivityRepository.java:8-10`
- vNext now: `src/modules/bug-tracker/admin-service.ts:229-262`
- Fix: Legacy chronological ASC repository returns full list; vNext DESC cursor up to 50. Offer order conversion and unambiguous older-history continuation.

## G2-3-021-011  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerWorkflowService.java:73-109`
- vNext now: `src/modules/bug-tracker/admin-service.ts:291-356`
- Fix: Legacy partial workflow update logs only status/resolution changes; vNext typed transition may emit WORKFLOW_UPDATED for fields. Keep extra activity but distinguish changes rather than present false status event.

## G2-3-021-025  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerWorkflowService.java:160-166`
- vNext now: `src/modules/bug-tracker/admin-service.ts:209-227`, `src/modules/bug-tracker/reporter-service.ts:27-46`
- Fix: Legacy missing issue publicId returns 404 Issue not found; vNext owner service nonenumerating ISSUE_NOT_FOUND and admin page notFound. Retain safe status without exposing private report existence.

## G2-3-021-035  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V153__bug_tracker_workflow.sql:23-25`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportActivityRepository.java:8-10`
- vNext now: `src/db/schema/db10-bug-tracker.ts:130-131`, `src/modules/bug-tracker/admin-service.ts:246-262`
- Fix: Legacy index issue+createdAt ASC and full fetch; VNext same index but cursor ORDER BY createdAt/id DESC, no compound tie-breaker index. Add index for stable keyset paging.

## G2-3-021-038  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportActivityRepository.java:8-10`
- vNext now: `src/modules/bug-tracker/admin-service.ts:229-289`
- Fix: Legacy ascending chronology via timestamp, vNext DESC createdAt plus UUID tie and cursor. Ensure records with equal timestamps never repeat/disappear on next-page navigation.

## G2-4-021-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy repo search filters status,environment,exact reporter,free search across publicId,description,page,screen,section. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:18-32`)
- vNext now: New list adds several filters but reporter uses substring and free text omits screen/section. (`src/modules/bug-tracker/admin-service.ts:140-169`)
- Fix: Restore exact reporter filter and screen/section search for parity.

## G2-4-021-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy repository Page Pageable for offset pagination. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:18-32`)
- vNext now: New uses (createdAt,id) keyset cursor, limit default50 max100. (`src/modules/bug-tracker/admin-service.ts:170-206`; `src/modules/bug-tracker/admin-validation.ts:20-37`)
- Fix: Provide accessible pagination/count semantics or documented cursor enhancement.

## G2-4-021-020  [P2] GAP  facet F05  effort S
- Legacy: Legacy default sort follows pageable passed by caller. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:18-32`)
- vNext now: New explicitly newest/oldest createdAt then UUID tie break. (`src/modules/bug-tracker/admin-service.ts:186-206`)
- Fix: Match initial order and tie semantics of legacy issue grid.

## G2-4-021-034  [P2] GAP  facet F10  effort M
- Legacy: Legacy repository lookup by publicId and filtered pageable list. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:12-32`)
- vNext now: New admin service list/detail keyset cursor and scope. (`src/modules/bug-tracker/admin-service.ts:134-227`)
- Fix: Preserve search/list contract and report detail fields across routes.

## G2-4-021-039  [P2] GAP  facet F11  effort M
- Legacy: Legacy admin/manager can edit workflow after access check in service. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:67-110`)
- vNext now: New workflow requires active Super Admin only. (`src/modules/bug-tracker/workflow.ts:103-107`; `src/modules/bug-tracker/admin-service.ts:47-54`)
- Fix: Compare old manager role permissions, retain least privilege.

## G2-4-021-055  [P2] GAP  facet F19  effort M
- Legacy: Legacy search Pageable can count all matches and page. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:18-32`)
- vNext now: New keyset cursor limit<=100, no total count. (`src/modules/bug-tracker/admin-service.ts:186-206`)
- Fix: Restore approximate/exact total count where original UI depends on it.

## G2-20-020-019  [P3] GAP  facet F19  effort S
- Legacy: Legacy three images ascending `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportAttachmentRepository.java:9-12`
- vNext now: New 50 DESC then id `src/modules/bug-tracker/admin-service.ts:265-283`
- Fix: Align sort
