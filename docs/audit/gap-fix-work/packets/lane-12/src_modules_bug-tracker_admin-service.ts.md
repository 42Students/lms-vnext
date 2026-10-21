# Work packet: edit src/modules/bug-tracker/admin-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l18-u025-public-tracker-logs-access.md, docs/audit/gap2/lane-3/bug-report-activity.md, docs/audit/gap2/lane-10/l17-u024-superadmin-bug-tracker-controller.md

## G2-18-025-012  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java:53-54,76-85 — bcrypt-hash configured secret, null hash 503, mismatch 401
- vNext now: src/modules/bug-tracker/admin-service.ts:48-52 — user role and status based authorization
- Fix: Document intentionally nonparity; use standard account credentials and MFA

## G2-18-025-028  [P1] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java:78-88 — logs IP on denied/allowed password attempt; no actor identity
- vNext now: src/modules/bug-tracker/admin-service.ts:318-321 — actor ID written to tracker workflow
- Fix: Ensure log-view access events capture actual actor (and redact sensitive source)

## G2-3-021-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicBugTrackerController.java:58-62`, `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-52`
- vNext now: `src/app/api/tracker/issues/[publicId]/route.ts:10-34`, `src/modules/bug-tracker/admin-service.ts:209-289`
- Fix: Legacy public activity GET by issue publicId is readable on issue detail, while vNext issue activity fetch requires super-admin. Add a privacy-filtered, authenticated reporter-owned history read without making engineering notes public.

## G2-3-021-013  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerWorkflowService.java:199-209`
- vNext now: `src/modules/bug-tracker/admin-service.ts:291-328`
- Fix: Legacy unsupported workflow values return `Invalid status` or field-specific BAD_REQUEST, vNext typed validation/error response differs. Map visible copy to accepted values.

## G2-3-021-014  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerWorkflowService.java:122-125`
- vNext now: `src/modules/bug-tracker/admin-service.ts:361-394`
- Fix: Legacy retest when not READY_FOR_RETEST returns 409 `Issue is not ready for retest`. Ensure new TrackerAdminError mapping preserves status and wording.

## G2-17-024-018  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminBugTrackerController.java:75-79 — forbidden Super Admin access required.
- vNext now: src/modules/bug-tracker/admin-service.ts:47-54 — TrackerAdminError FORBIDDEN.
- Fix: Map security copy but avoid role disclosure.
