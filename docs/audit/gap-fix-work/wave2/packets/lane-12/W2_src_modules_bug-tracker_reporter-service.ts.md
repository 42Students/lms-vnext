# Work packet (wave 2): edit src/modules/bug-tracker/reporter-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/bug-tracker-access-entity.md, docs/audit/gap2/lane-3/bug-report-activity.md

## G2-19-020-051  [P2] GAP  facet F19  effort M
- Legacy: Old public report list default size20 max100 and sort ASC/DESC createdAt. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicBugTrackerController.java:37-46` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:83-99`
- vNext now: vNext admin list has richer cursor semantics, mine has 50 newest. `src/modules/bug-tracker/admin-service.ts:134-175` `src/modules/bug-tracker/reporter-service.ts:12-24`
- Fix: Match per-role pagination and sort expectations or explicitly document change.

## G2-3-021-025  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerWorkflowService.java:160-166`
- vNext now: `src/modules/bug-tracker/admin-service.ts:209-227`, `src/modules/bug-tracker/reporter-service.ts:27-46`
- Fix: Legacy missing issue publicId returns 404 Issue not found; vNext owner service nonenumerating ISSUE_NOT_FOUND and admin page notFound. Retain safe status without exposing private report existence.
