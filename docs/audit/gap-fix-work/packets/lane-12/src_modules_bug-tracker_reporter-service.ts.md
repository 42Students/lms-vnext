# Work packet: edit src/modules/bug-tracker/reporter-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/bug-tracker-access-entity.md, docs/audit/gap2/lane-3/bug-report-activity.md

## G2-19-020-052  [P1] GAP  facet F19  effort M
- Legacy: Old ByTokenHash and ByDisplayName repository are single-result Optional queries. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugTrackerAccessRepository.java:8-10`
- vNext now: vNext token hash unique index, displayName not unique, reporter uses immutable user association. `src/db/schema/db10-bug-tracker.ts:17-32` `src/modules/bug-tracker/reporter-service.ts:12-24`
- Fix: Handle duplicate display names safely; never resolve ownership from ambiguous name.

## G2-19-020-055  [P1] GAP  facet F21  effort L
- Legacy: Old BugReport linkage resolves reporter name against active access entity; no actor user FK. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:42-52` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:21-26`
- vNext now: vNext report owns both access ID and user ID, queries mine by user ID. `src/modules/bug-tracker/report-service.ts:31-35` `src/modules/bug-tracker/reporter-service.ts:12-24`
- Fix: Determine historical issue ownership migration without granting a name-matching stranger access.

## G2-3-021-010  [P1] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-79`
- vNext now: `src/modules/bug-tracker/reporter-service.ts:27-46`
- Fix: Legacy reporter issue detail loads activity independently and tolerates secondary fetch failure; vNext reporter detail service returns only report metadata. Add owner-scoped timeline projection.

## G2-3-021-021  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicBugTrackerController.java:54-62`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminBugTrackerController.java:75-80`
- vNext now: `src/app/api/tracker/issues/[publicId]/route.ts:20-34`, `src/modules/bug-tracker/reporter-service.ts:27-46`
- Fix: Legacy public issue activity route had anonymous read access, vNext restricts engineering history to super-admin. Define safe public/reporter exposure; never leak private root cause, evidence or actor IDs.

## G2-3-021-044  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tracker/ActivityTimeline.jsx:21-43`, `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-79`
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:139-170`, `src/modules/bug-tracker/reporter-service.ts:27-46`
- Fix: Legacy issue detail exposes full chronological Activity card to issue viewer, vNext ordinary reporter cannot access an event timeline and super-admin history is collapsed/reversed. Restore role-safe history and default placement.
