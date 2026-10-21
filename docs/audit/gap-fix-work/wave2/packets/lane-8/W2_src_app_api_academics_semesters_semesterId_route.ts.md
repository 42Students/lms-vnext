# Work packet (wave 2): edit src/app/api/academics/semesters/[semesterId]/route.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l13-u026-program-structure-controller.md, docs/audit/gap2/lane-5/u025-semester-controller.md, docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-13-026-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:26-31 — /api/v1/program-structure controller includes six routes.
- vNext now: src/app/api/academics/semesters/route.ts:9-27 and src/app/api/academics/semesters/[semesterId]/route.ts:23-52 — /api/academics/semesters and /:semesterId REST routes.
- Fix: Map compatibility routes or migrate every client link.

## G2-13-026-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:96-97,138 — human readable success strings Deleted successfully, Status updated successfully.
- vNext now: src/app/api/academics/semesters/[semesterId]/route.ts:31-47 — success JSON objects only, no message string.
- Fix: Preserve UI-level feedback texts.

## G2-13-026-014  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:90-97 — DELETE /delete/:id no JSON body.
- vNext now: src/app/api/academics/semesters/[semesterId]/route.ts:38-50 and src/modules/academics/semester-mutation-model.ts:21-23 — DELETE requires body confirm:true.
- Fix: Document changed confirm contract and all clients.

## G2-5-025-001  [P2] GAP  facet F01  effort S
- Legacy: Legacy semester CRUD at `/api/v1/semester/create`, `/update/{id}`, `/delete/{id}`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:30-34,104-106,160-162,214-216`
- vNext now: vNext POST collection and PATCH/DELETE `/api/academics/semesters/{uuid}`. `src/app/api/academics/semesters/route.ts:9-17`, `src/app/api/academics/semesters/[semesterId]/route.ts:23-47`
- Fix: Publish one-to-one verb and payload compatibility map.

## G2-9-019-044  [P2] GAP  facet F10  effort M
- Legacy: Legacy PUT /api/v1/semester/update/{id}, payload retains program_id,semester_number and is_active `docs/legacy-source/frontend/src/api/Services/SemesterService.js:8-9` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:252-260`
- vNext now: PATCH /api/academics/semesters/{id}, only name/totalCredits/isActive/expectedUpdatedAt/confirm `src/components/academics/college-semester-management.tsx:137-159` `src/app/api/academics/semesters/[semesterId]/route.ts:21-33`
- Fix: Keep disabled fields visible, don't send immutable ones.

## G2-13-026-035  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:53-59 — missing row maps 404.
- vNext now: src/app/api/academics/semesters/[semesterId]/route.ts:14-20 — 404 code with JSON error.
- Fix: Match missing semantics and recoverable UI state.

## G2-13-026-040  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:68,78,92,115 — descriptions Create a new program structure (semester), Update a program structure, Delete, Fetch all semesters.
- vNext now: src/app/api/academics/semesters/route.ts:9-17; src/app/api/academics/semesters/[semesterId]/route.ts:23-47 — API paths and models call these semesters not program structures.
- Fix: Map wording in admin UI and error catalogue.

## G2-9-019-045  [P3] GAP  facet F10  effort S
- Legacy: Legacy DELETE /api/v1/semester/delete/{id} `docs/legacy-source/frontend/src/api/Services/SemesterService.js:11-12`
- vNext now: DELETE /api/academics/semesters/{id} with confirm:true `src/components/academics/college-semester-management.tsx:165-175` `src/app/api/academics/semesters/[semesterId]/route.ts:35-48`
- Fix: Document new confirmation payload; keep deletion protection.
