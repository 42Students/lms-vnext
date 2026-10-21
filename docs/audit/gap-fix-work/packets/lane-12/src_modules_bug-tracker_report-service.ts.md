# Work packet: edit src/modules/bug-tracker/report-service.ts

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u020-bug-tracker-access.md, docs/audit/gap2/lane-19/bug-tracker-access-entity.md, docs/audit/gap2/lane-4/bug-report-model.md

## G2-19-020-002  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugTrackerAccessRepository.java:8-10 — callers can find active reporter by tokenHash or displayName.
- vNext now: src/modules/bug-tracker/report-service.ts:18-29 — authenticated report creates a new inactive access row, not a selectable reporter account.
- Fix: Restore approved reporter selection/enrollment or document owner-approved authenticated alternative.

## G2-19-020-005  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:43-48 — create form selects valid active reporter, rejects bad name.
- vNext now: src/modules/bug-tracker/report-service.ts:23-29 — creates reporter identity from reporterName automatically, marks inactive.
- Fix: Replace freeform reporter acceptance with verified actor provenance.

## G2-19-020-010  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:44-52 — report’s reporterName replaced by trusted selected displayName.
- vNext now: src/modules/bug-tracker/report-service.ts:24-37 — report uses user-submitted name, inserted into newly generated inactive access.
- Fix: Bind report display name to authenticated active user's allowed identity.

## G2-19-020-014  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugTrackerAccessRepository.java:10 and docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:44-48 — active reporter required to create report.
- vNext now: src/modules/bug-tracker/report-service.ts:18-29 — only platform ACTIVE checked, access row always inactive.
- Fix: Use authorized reporter session or bind only platform user to report.

## G2-19-020-020  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:43-52 — SELECT active access by displayName then write BugReport reporterAccess FK.
- vNext now: src/modules/bug-tracker/report-service.ts:23-46 — INSERT inactive access every submission then INSERT bug report with FK.
- Fix: Avoid unbounded inactive identity creation; associate with authenticated reporter identity.

## G2-19-020-023  [P1] GAP  facet F11  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:43-48 — only active named reporter may submit legacy issue.
- vNext now: src/modules/bug-tracker/report-service.ts:18-29 — platform user ACTIVE grants report creation, no reporter-access-active check.
- Fix: Document deliberate requirement to authenticate platform user.

## G2-19-020-055  [P1] GAP  facet F21  effort L
- Legacy: Old BugReport linkage resolves reporter name against active access entity; no actor user FK. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:42-52` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:21-26`
- vNext now: vNext report owns both access ID and user ID, queries mine by user ID. `src/modules/bug-tracker/report-service.ts:31-35` `src/modules/bug-tracker/reporter-service.ts:12-24`
- Fix: Determine historical issue ownership migration without granting a name-matching stranger access.

## G2-19-020-061  [P1] GAP  facet F23  effort L
- Legacy: Old named external reporters authenticate by active displayName for issue creation; no stable per-issue user ID. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:42-52`
- vNext now: vNext inserts inactive record and ties issue to authenticated user ID. `src/modules/bug-tracker/report-service.ts:24-35`
- Fix: Treat reporter-auth behavior as intentional redesign requiring owner acceptance and UI onboarding.

## G2-4-021-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy BugReport JPA entity backs bug tracker report intake and Super Admin issue views. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:10-23`)
- vNext now: New db10BugReports plus report/admin services, guarded by DB10_TRACKER_READY runtime flag. (`src/db/schema/db10-bug-tracker.ts:52-89`; `src/modules/bug-tracker/report-service.ts:18-31`; `src/modules/bug-tracker/readiness.ts:1-13`)
- Fix: Verify migration applied and runtime flag active before claiming equivalent read/write.

## G2-4-021-003  [P1] GAP  facet F01  effort L
- Legacy: Legacy reporters access issue using BugTrackerAccess association. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:21-23`)
- vNext now: New report binds access ID and authenticated reporterUserId; reporter token access not enabled in intake. (`src/modules/bug-tracker/report-service.ts:12-16`; `src/modules/bug-tracker/report-service.ts:24-35`)
- Fix: Provide approved reporter-specific status view without exposing manager notes.

## G2-4-021-038  [P1] GAP  facet F11  effort M
- Legacy: Legacy reporterAccess relation establishes reporter ownership. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:21-23`)
- vNext now: New report intake creates inactive access record but authenticates actor, preventing token-based access. (`src/modules/bug-tracker/report-service.ts:12-16`; `src/modules/bug-tracker/report-service.ts:24-35`)
- Fix: Enable approved reporter status lookup or clearly document intentionally disabled external access.

## G2-4-021-040  [P1] GAP  facet F11  effort L
- Legacy: Legacy reporterAccess may be external link-based session. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:21-23`)
- vNext now: New schema designs hashed tokens and sessions, but intake intentionally issues none. (`src/db/schema/db10-bug-tracker.ts:17-50`; `src/modules/bug-tracker/report-service.ts:12-16`)
- Fix: Do not grant unverified external reporter access; seek owner-approved auth design.

## G2-19-020-015  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:45-48 — invalid reporter returns 400 Select a valid reporter.
- vNext now: src/modules/bug-tracker/report-service.ts:24-30 — reporter row auto-created; no matching validation error.
- Fix: Restore precise reporter validation or explain new auth model.

## G2-19-020-017  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:43-48 — create succeeds after known active reporter selected.
- vNext now: src/modules/bug-tracker/report-service.ts:23-55 — records issue and returns publicId, reporter identity inactive.
- Fix: Provide truthful acknowledgement and clear reporter access limitation.

## G2-4-021-029  [P2] GAP  facet F08  effort S
- Legacy: Legacy report create success has publicId and workflow initial state. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:18-19`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:67-68`)
- vNext now: New creates status NEW and returns publicId only. (`src/modules/bug-tracker/report-service.ts:20-55`; `src/db/schema/db10-bug-tracker.ts:73-74`)
- Fix: Include created state and user-facing confirmation for old consumer.
