# Work packet (wave 2): edit src/app/api/placements/tpo/students/prep/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-4-022-037  [P2] GAP  facet F10  effort M
- Legacy: Legacy /bulk/assign-prep reaches students.bulkAssignPrep. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:91-95`)
- vNext now: New /prep route calls assignTpoPrepCourse, list choices GET. (`src/app/api/placements/tpo/students/prep/route.ts:7-18`)
- Fix: Validate old assessmentId and dueAt behavior through new service.
