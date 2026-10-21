# Work packet: edit src/app/api/placements/tpo/students/academic-import/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-4-022-065  [P1] GAP  facet F22  effort L
- Legacy: Legacy API uses integer learner/drive/course references, Maps and separate POST endpoints. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:30-46`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:56-62`)
- vNext now: New UUID memberships/jobs, strict Zod and separate domain tables/routes. (`src/modules/placements/tpo-students-service.ts:81-110`; `src/app/api/placements/tpo/students/academic-import/route.ts:16-25`)
- Fix: Create per-action legacy/new input/output and data FK mapping.
