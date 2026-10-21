# Work packet: edit src/app/api/academics/programs/[programId]/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md, docs/audit/gap2/lane-9/college-admin-programs.md, docs/audit/gap2/lane-3/l14-u026-program-controller.md

## G2-10-020-057  [P1] GAP  facet F10  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:175-194; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:185-211 — DELETE /api/v1/new-program/delete/:id.
- vNext now: src/components/academics/academics-actions.tsx:292-310; src/app/api/academics/programs/[programId]/route.ts:39-49 — DELETE archives via archiveCollegeProgram.
- Fix: Document contract: hard delete vs soft archive and linked-content policy.

## G2-20-029-045  [P1] GAP  facet F10  effort L
- Legacy: Edit PUT new-program/update/{id}; hard delete DELETE new-program/delete/{id} (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:145-177`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:185-212`)
- vNext now: PATCH update and DELETE archive/soft-hide (`src/app/api/academics/programs/[programId]/route.ts:24-49`, `src/modules/academics/college-program-mutation-service.ts:196-245`)
- Fix: Decide hard-delete versus archive parity and document data retention effect explicitly

## G2-9-018-044  [P1] GAP  facet F10  effort L
- Legacy: DELETE hard-removes only if unreferenced `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:149-179`
- vNext now: DELETE endpoint soft-archives with confirm true `src/app/api/academics/programs/[programId]/route.ts:39-48` `src/modules/academics/college-program-mutation-model.ts:22-24`
- Fix: Document intentional retention policy; ensure legacy deletion expectations communicated.

## G2-14-026-022  [P3] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:88-88`
- vNext now: `src/app/api/academics/programs/[programId]/route.ts:32-35`
- Fix: Legacy GET detail success status OK/message OK vs vNext PATCH success `{program}`; no GET detail.
