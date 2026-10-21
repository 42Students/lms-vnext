# Work packet: edit src/modules/people/college-faculty-lifecycle-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md, docs/audit/gap2/lane-4/faculty-model.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-1-001-006  [P1] GAP  facet F04  effort M
- Legacy: `AdminUserLifecycleController.java:97-102,129-134` returns `{user: Learner\|Faculty}` including `suspendedAt` and `suspensionReason` (`Learner.java:21-28`; `Faculty.java:25-32`).
- vNext now: `people/[membershipId]/lifecycle/route.ts:39-45` returns `{person}` with `membership.status`; `college/faculty/[membershipId]/lifecycle/route.ts:17-19` returns `{membership}` with only id/status (`college-faculty-lifecycle-service.ts:81`).
- Fix: Standardize response for all lifecycle callers and ensure status, reason and timestamp are available to refresh the affected row.

## G2-1-001-015  [P1] GAP  facet F07  effort S
- Legacy: `AdminUserLifecycleController.java:122-125` returns 409 with full sentence in both `error` and `message` when active mentor projects remain.
- vNext now: `active-mentor-project-guard.ts:21-24` constructs same sentence but `college-faculty-lifecycle-service.ts:66-68` throws code; `route.ts:21-25` emits `FACULTY_HAS_ACTIVE_PROJECTS`; client `college-faculty-lifecycle-action.tsx:50-52` shows generic teaching-responsibilities error.
- Fix: Surface exact active-mentor count and legacy action guidance to faculty admin UI; return structured code and human message.

## G2-1-001-022  [P1] GAP  facet F10  effort L
- Legacy: `AdminUserLifecycleController.java:83-102,129-134,137-167` updates learner/faculty account rows with `LocalDateTime`, then audits and responds.
- vNext now: `repository.ts:782-897` updates `college_memberships` in a transaction and logs activity; faculty-special route `college-faculty-lifecycle-service.ts:70-99` does membership update plus event.
- Fix: Retain explicitly scoped membership semantics, but verify all access checks/auth refresh that formerly relied on account-wide suspendedAt.

## G2-1-001-023  [P1] GAP  facet F10  effort M
- Legacy: `AdminUserLifecycleController.java:178-204` bumps learner/faculty `token_version` and revokes each session on suspension.
- vNext now: `repository.ts:838-849` revokes every `identity_device_sessions` row by canonical user; faculty-specific service `college-faculty-lifecycle-service.ts:70-99` does not revoke sessions in transaction.
- Fix: Add device-session revocation to faculty-specific route or route both entrypoints through one shared lifecycle transaction; verify stale-session denial.

## G2-1-001-041  [P1] GAP  facet F19  effort M
- Legacy: `AdminUserLifecycleController.java:188-199`, `UserSessionServiceImpl.java:68-70` loads all sessions then revokes one-by-one; per-session exceptions ignored.
- vNext now: `repository.ts:842-848` uses a single scoped SQL UPDATE; faculty path has no bulk revocation (`college-faculty-lifecycle-service.ts:70-99`).
- Fix: Use set-based revocation in both paths; cover large device lists and fail-closed response.

## G2-4-020-039  [P1] GAP  facet F11  effort M
- Legacy: Legacy suspended faculty account blocks login while suspendedAt set. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:25-29`)
- vNext now: New membership status SUSPENDED and platform account status, lifecycle service toggles status. (`src/db/schema/memberships.ts:27-31`; `src/modules/people/college-faculty-lifecycle-service.ts:70-82`)
- Fix: Verify login/session invalidation for already-open faculty sessions.

## G2-15-027-040  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:664-695 DELETE faculty logs FACULTY_DELETE
- vNext now: src/modules/people/college-faculty-lifecycle-service.ts:61-99 soft lifecycle transition emits deactivated/reactivated event
- Fix: Document whether delete maps to END or suspension; retain exact audit semantic.

## G2-15-027-029  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:619-690 Faculty not found 404, conflict 409 on deletion
- vNext now: src/modules/people/college-faculty-lifecycle-service.ts:19-82 FACULTY_NOT_FOUND, STATUS_CHANGED, HAS_ACTIVE_ASSIGNMENTS/PROJECTS
- Fix: Provide typed 404/409 and explanatory UI for active-dependency deletion.
