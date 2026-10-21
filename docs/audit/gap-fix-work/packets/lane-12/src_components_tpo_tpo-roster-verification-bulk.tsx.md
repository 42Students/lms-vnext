# Work packet: edit src/components/tpo/tpo-roster-verification-bulk.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-4-022-042  [P1] GAP  facet F11  effort M
- Legacy: Legacy verify obtains verifier college from current principal. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:171-180`)
- vNext now: New verification queue review route relies on selected scoped student sections. (`src/components/tpo/tpo-roster-verification-bulk.tsx:49-59`)
- Fix: Ensure role-based profile-verifier permissions and no mixed-college list.

## G2-4-022-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy bulk verify catches each section failure and continues, returns partial failure list. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:177-185`)
- vNext now: New verification component sends batch action and presents outcomes; batching cap20 selected sections. (`src/components/tpo/tpo-roster-verification-bulk.tsx:30-59`; `src/components/tpo/tpo-roster-verification-bulk.tsx:66-111`)
- Fix: Preserve per-section partial failure and retry failed only.

## G2-4-022-031  [P2] GAP  facet F08  effort M
- Legacy: Legacy bulk send-back returns sentBack and list failed with Nothing waiting explanation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:188-207`)
- vNext now: New verification review outputs outcomes and attempted/succeeded/failed. (`src/components/tpo/tpo-roster-verification-bulk.tsx:49-59`)
- Fix: Preserve explicit Nothing waiting per selected student and section.
