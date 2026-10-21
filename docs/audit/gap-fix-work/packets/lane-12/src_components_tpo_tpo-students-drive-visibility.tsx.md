# Work packet: edit src/components/tpo/tpo-students-drive-visibility.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-4-022-011  [P1] GAP  facet F04  effort L
- Legacy: Legacy learnerIds are integer list, jobId/courseId/assessmentId numeric in BulkRequest. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:30-46`)
- vNext now: New selection and API use UUID membership/drive identifiers. (`src/components/tpo/tpo-students-spreadsheet.tsx:98-104`; `src/components/tpo/tpo-students-drive-visibility.tsx:38-56`)
- Fix: Map old numeric identifiers to scoped UUID membership, job and content.

## G2-4-022-033  [P1] GAP  facet F09  effort M
- Legacy: Legacy bulk override restore supports both previous INCLUDE and EXCLUDE state. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:153-167`)
- vNext now: New undo implementation only deletes fresh INCLUDE/EXCLUDE action, not restore older override. (`src/components/tpo/tpo-students-drive-visibility.tsx:70-90`)
- Fix: Restore prior override for exact previous state or explicitly document safer clear-only undo.

## G2-4-022-041  [P1] GAP  facet F11  effort M
- Legacy: Legacy override checks job writable plus all learner scopes. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:139-145`)
- vNext now: New drive visibility reads expected override and writes through job-specific eligibility API. (`src/components/tpo/tpo-students-drive-visibility.tsx:38-57`)
- Fix: Verify API enforces writable drive and enrollment/cohort targeting server-side.

## G2-4-022-067  [P1] GAP  facet F22  effort M
- Legacy: Legacy job eligibility override reversible by restoring before state. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:139-168`)
- vNext now: New versioned eligibility override identifiers with CAS and undo audit. (`src/components/tpo/tpo-students-drive-visibility.tsx:38-90`)
- Fix: Define exactly which historic override state must survive undo and persistence.

## G2-4-022-025  [P2] GAP  facet F07  effort S
- Legacy: Legacy restore with absent job or rows says Nothing to undo. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:153-158`)
- vNext now: New undo can report stale/no current override, no exact old generic copy. (`src/components/tpo/tpo-students-drive-visibility.tsx:70-90`)
- Fix: Display precise undo-unavailable feedback while retaining history.
