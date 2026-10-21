# Work packet (wave 2): edit src/app/api/people/student-import/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-19-001-048  [P2] GAP  facet F10  effort M
- Legacy: Legacy bulk POST `/api/v1/learner/bulk-validate` then `/bulk-register` with college/program/class and learner rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:395-430`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:770-771`,835-848
- vNext now: vNext single POST `/api/people/student-import` with PREVIEW/IMPORT and CSV text `src/components/college/college-student-csv-import.tsx:42-54`; `src/app/api/people/student-import/route.ts:8-16`
- Fix: Verify corresponding duplicate rules and row receipt parity; preserve validation before commit.

## G2-7-036-076  [P2] GAP  facet F21  effort L
- Legacy: Students.js:842-847 legacy learner bulk create and preflight endpoints
- vNext now: student-import/route.ts:8-17 typed preview/import service
- Fix: Map old preflight and write endpoints/response and recovery
