# Work packet (wave 2): edit src/components/tpo/tpo-roster-verification-bulk.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-4-022-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy bulk verification response reports verified and failed per learner/section. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:170-185`)
- vNext now: New verify component submits bulk-review and displays outcomes/summary. (`src/components/tpo/tpo-roster-verification-bulk.tsx:49-59`)
- Fix: Match per-section success/failure grid and exact counts/empty reasons.

## G2-4-022-038  [P2] GAP  facet F10  effort M
- Legacy: Legacy verify/sendBack uses ProfileVerificationService every section. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:170-207`)
- vNext now: New /api/tpo/verification/bulk-review accepts selections from verification queue. (`src/components/tpo/tpo-roster-verification-bulk.tsx:49-59`)
- Fix: Align selected student vs selected section granularity.

## G2-4-022-047  [P2] GAP  facet F13  effort M
- Legacy: Legacy send-back returns Nothing waiting when none in selected section. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:200-207`)
- vNext now: New verification list only shows waiting records, may not include none cases. (`src/components/tpo/tpo-roster-verification-bulk.tsx:16-30`)
- Fix: Show nothing-waiting reason, do not claim verified if no work.

## G2-4-022-054  [P2] GAP  facet F16  effort M
- Legacy: Legacy bulk selection may target many learners, no explicit cap in controller. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:30-52`)
- vNext now: New capped bulk actions200, verification per20, preview. (`src/components/tpo/tpo-students-bulk-debar.tsx:35-43`; `src/components/tpo/tpo-roster-verification-bulk.tsx:66-75`)
- Fix: Show explicit cap and unselected count at mobile.

## G2-4-022-057  [P2] GAP  facet F18  effort S
- Legacy: Legacy send back failure says Nothing waiting in Education or Identity. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:203-205`)
- vNext now: New selected verification section screen derives rows from waiting queue. (`src/components/tpo/tpo-roster-verification-bulk.tsx:16-30`)
- Fix: Show explicit section-specific not-waiting result on no-ops.

## G2-4-022-060  [P2] GAP  facet F20  effort M
- Legacy: Legacy bulk verification deduplicates learners via LinkedHashSet. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:177-179`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:195-196`)
- vNext now: New verification checkbox selection max20 sections; duplicate selection prevented in UI. (`src/components/tpo/tpo-roster-verification-bulk.tsx:30-75`)
- Fix: Enforce duplicate elimination and role check on server too.
