# Work packet: edit src/app/api/people/student-import/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u027-learner-controller.md, docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-5-027-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy single create, bulk validate/register/history/undo all under `/api/v1/learner`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-469`
- vNext now: vNext has POST student register and POST CSV preview/import in separate scoped APIs. `src/app/api/college/students/register/route.ts:8-15`, `src/app/api/people/student-import/route.ts:8-19`
- Fix: Map five operations including bulk history and undo; restore missing undo if business parity required.

## G2-7-036-038  [P1] GAP  facet F10  effort L
- Legacy: Students.js:842-847 bulkRegisterLearners POST with college/program/class and learners
- vNext now: student-import/route.ts:8-18 POST /api/people/student-import PREVIEW or IMPORT
- Fix: Map all old payloads/results and preserve two-stage contract
