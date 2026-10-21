# Work packet (wave 2): edit src/modules/bug-tracker/report-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u020-bug-tracker-access.md, docs/audit/gap2/lane-4/bug-report-model.md

## G2-19-020-012  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugTrackerAccessRepository.java:10 — case-insensitive active displayName can match multiple names; derived method optional result.
- vNext now: src/modules/bug-tracker/report-service.ts:24-29 — no duplicate/name disambiguation, creates separate row each report.
- Fix: Define duplicate reporter identity policy.

## G2-19-020-024  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugTrackerAccess.java:27-28 — access active=true default.
- vNext now: src/db/schema/db10-bug-tracker.ts:22 — active true default but src/modules/bug-tracker/report-service.ts:28 explicitly inserts false.
- Fix: Document inactive-on-intake behavior and activation workflow.

## G2-19-020-025  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugTrackerAccessRepository.java:10 — findByDisplayNameIgnoreCaseAndActiveTrue; one string id per human name.
- vNext now: src/modules/bug-tracker/report-service.ts:23-29 — random new inactive reporter row per issue.
- Fix: Decide and implement stable reporter identity.

## G2-19-020-033  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:48 — source error Select a valid reporter.
- vNext now: src/modules/bug-tracker/report-service.ts:18-29 — vNext allows free-text reporterName, so error absent.
- Fix: Align reporter selection/helper and refusal text.

## G2-4-021-007  [P2] MISSING  facet F03  effort M
- Legacy: Legacy sourceUrl/sourcePath/browser/viewport optional for automatic bug context. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:55-65`)
- vNext now: New report table has columns, but public intake validator lacks these properties and write omits them. (`src/db/schema/db10-bug-tracker.ts:69-72`; `src/modules/bug-tracker/report-input-model.ts:6-20`; `src/modules/bug-tracker/report-service.ts:31-46`)
- Fix: Capture safe browser,viewport and source context from authenticated application.

## G2-4-021-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy immutable public_id used for sharing issue lookup. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:18-19`)
- vNext now: New random LMS-numeric publicId generated at intake and returned. (`src/modules/bug-tracker/report-service.ts:20-21`; `src/modules/bug-tracker/report-service.ts:45-55`)
- Fix: Ensure collision retry, length24 cap and predictable display.

## G2-4-021-035  [P2] GAP  facet F10  effort M
- Legacy: Legacy create DTO includes evidence link, source URL/path, browser and viewport. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/bugtracker/BugReportCreateRequest.java:27-40`)
- vNext now: New create writes reporter and required issue fields, evidence only. (`src/modules/bug-tracker/report-service.ts:31-46`)
- Fix: Persist safe automatic diagnostic context, avoid raw credentials in URL.

## G2-4-021-058  [P2] GAP  facet F20  effort M
- Legacy: Legacy publicId unique varchar24 and case-insensitive lookup. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:18-19`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:12-14`)
- vNext now: New lowercase unique index and random generated decimal public ID. (`src/db/schema/db10-bug-tracker.ts:90-90`; `src/modules/bug-tracker/report-service.ts:20-21`)
- Fix: Handle public ID collision retries and format historical ids.
