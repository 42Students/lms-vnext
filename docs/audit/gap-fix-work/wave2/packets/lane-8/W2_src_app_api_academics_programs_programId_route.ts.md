# Work packet (wave 2): edit src/app/api/academics/programs/[programId]/route.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-3/l14-u026-program-controller.md, docs/audit/gap2/lane-9/college-admin-programs.md

## G2-10-020-056  [P2] GAP  facet F10  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:141-161; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:140-183 — PUT /api/v1/new-program/update/:id.
- vNext now: src/components/academics/academics-actions.tsx:210-224; src/app/api/academics/programs/[programId]/route.ts:24-36 — PATCH /api/academics/programs/:id with code, deptId, durationTerms.
- Fix: Translate update schema and guard cross-college department moves.

## G2-14-026-003  [P2] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:79-89`
- vNext now: `src/app/api/academics/programs/[programId]/route.ts:24-51`
- Fix: Legacy GET detail by programId; vNext dynamic [programId] route only PATCH/DELETE, clients should use service or compatibility GET.

## G2-14-026-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:81-88`
- vNext now: `src/app/api/academics/programs/[programId]/route.ts:24-35`
- Fix: Legacy GET fetchProgramDetails returns full NewProgramResponseDTO; vNext PATCH returns changed program, no same detail endpoint.

## G2-14-026-017  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:79-84`
- vNext now: `src/app/api/academics/programs/[programId]/route.ts:24-35`
- Fix: Legacy numeric programId; vNext UUID route params with validation, deep links require ID adapter.

## G2-14-026-036  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:85-87`
- vNext now: `src/app/api/academics/programs/[programId]/route.ts:15-21`
- Fix: Legacy explicit Program not found 404 from query by id, vNext no detail GET. Add supported redirect or detail route.

## G2-14-026-043  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:79-89`
- vNext now: `src/app/api/academics/programs/[programId]/route.ts:24-35`
- Fix: Legacy query by numeric id returns typed DTO; vNext missing detail GET prevents focusable program detail link without separate UI route.

## G2-14-026-054  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:79-89`
- vNext now: `src/app/api/academics/programs/[programId]/route.ts:24-51`
- Fix: Legacy program-by-ID detail GET not in vNext dynamic API.

## G2-9-018-043  [P3] GAP  facet F10  effort S
- Legacy: PUT /api/v1/new-program/update/{id} `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:145-177`
- vNext now: PATCH /api/academics/programs/{uuid} `src/components/academics/academics-actions.tsx:209-220` `src/app/api/academics/programs/[programId]/route.ts:24-36`
- Fix: Map mutation semantics and errors in parity reference.
