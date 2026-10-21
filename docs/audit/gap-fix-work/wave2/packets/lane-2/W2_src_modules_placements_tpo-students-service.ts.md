# Work packet (wave 2): edit src/modules/placements/tpo-students-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md, docs/audit/gap2/lane-4/tpo-students-hub-controller.md, docs/audit/gap2/lane-5/u022-tpo-student-controller.md

## G2-14-001-022  [P2] GAP  facet F05  effort M
- Legacy: Legacy ?q= quick search across all fields including hidden values; vNext search param and server max150 — `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:94-101`
- vNext now: `src/modules/placements/tpo-students-service.ts:142-145`; `src/app/(authenticated)/tpo/students/page.tsx:908-911`
- Fix: Retain q deep-link alias and all searchable fields within authorized scope

## G2-4-022-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy admin table placement status uses college rules countsAsPlacedAt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:58-68`)
- vNext now: New roster computes journey/placed derived from placement tables and season settings. (`src/modules/placements/tpo-students-service.ts:240-273`; `src/modules/placements/tpo-students-service.ts:660-686`)
- Fix: Align counts-as-placed threshold and offer exclusion in summary.

## G2-4-022-059  [P2] GAP  facet F19  effort M
- Legacy: Legacy requestsQueue can include all decided or last30 days. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:220-225`)
- vNext now: New listTpoStudentRequests builds filtered list and pages after loaded results. (`src/modules/placements/tpo-students-service.ts:1057-1071`; `src/modules/placements/tpo-students-service.ts:1221-1271`)
- Fix: Add date filter before expensive aggregation, match legacy decidedDays.

## G2-4-022-066  [P2] GAP  facet F22  effort M
- Legacy: Legacy request queue returned List<Map> and decisions. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:220-225`)
- vNext now: New typed placementLearnerRequests and role-scoped page service. (`src/modules/placements/tpo-students-service.ts:1057-1120`)
- Fix: Verify decision history and index/pagination parity.

## G2-5-022-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy list all college learners under TPO Students without season constraint `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:37-48`
- vNext now: VNext explicit college TPO intelligence roster, active cohort/season scope `src/modules/placements/tpo-students-service.ts:140-165,195-213`
- Fix: Make population definition explicit in UI and reports.

## G2-5-022-010  [P2] GAP  facet F05  effort M
- Legacy: Legacy GET loads PageRequest.of(0,5000) with no UI pagination or query `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:40-48`
- vNext now: VNext defaults page1/pageSize25, max100 and many filters `src/modules/placements/tpo-students-service.ts:47-114`
- Fix: Preserve access to entire college roster with clear total/count and pages.

## G2-5-022-025  [P2] GAP  facet F10  effort L
- Legacy: Legacy list GET endpoint no write, `findByCollegeId` scoped to 5000 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:40-48`
- vNext now: New intelligence reads multiple scoped tables and derives eligibility/season `src/modules/placements/tpo-students-service.ts:140-280`
- Fix: Document source population and join semantics to prevent missing records.

## G2-5-022-030  [P2] GAP  facet F11  effort S
- Legacy: Legacy list relies on principal collegeId; missing returns empty array `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:40-47`
- vNext now: VNext missing/invalid college or inactive role throws authorization `src/modules/placements/tpo-students-service.ts:140-165`
- Fix: Present scope-change UX instead of misleading empty roster.
