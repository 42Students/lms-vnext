# Work packet (wave 2): edit src/modules/bug-tracker/admin-validation.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l17-u024-superadmin-bug-tracker-controller.md, docs/audit/gap2/lane-4/bug-report-model.md

## G2-17-024-011  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/bugtracker/BugReportStatusRequest.java:9-10 — nonblank status max32.
- vNext now: src/modules/bug-tracker/admin-validation.ts:52-55 — status nullable/optional enum and mandatory expectedVersion.
- Fix: Translate requiredness and version token.

## G2-17-024-043  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminBugTrackerController.java:50 — publicId path string; trackerService.get returns legacy DTO.
- vNext now: src/modules/bug-tracker/admin-validation.ts:50 — regex LMS-[0-9]{4,}; src/app/api/tracker/issues/[publicId]/route.ts:31-32 — admin issue DTO.
- Fix: Map legacy IDs/response fields via crosswalk.

## G2-4-021-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy repository Page Pageable for offset pagination. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:18-32`)
- vNext now: New uses (createdAt,id) keyset cursor, limit default50 max100. (`src/modules/bug-tracker/admin-service.ts:170-206`; `src/modules/bug-tracker/admin-validation.ts:20-37`)
- Fix: Provide accessible pagination/count semantics or documented cursor enhancement.

## G2-4-021-046  [P2] GAP  facet F13  effort S
- Legacy: Legacy search accepts blank optional filters. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:18-32`)
- vNext now: New list input strict optional filters, invalid cursor rejected. (`src/modules/bug-tracker/admin-validation.ts:20-48`)
- Fix: Map empty strings in query to omitted filters, preserve clear filters action.

## G2-17-024-008  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/bugtracker/BugReportStatusRequest.java:9-10 — standalone status string max32.
- vNext now: src/modules/bug-tracker/admin-validation.ts:54 — workflow status enum nullable/optional, no standalone model.
- Fix: Expose same status selection in UI.
