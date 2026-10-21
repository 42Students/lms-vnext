# Work packet (wave 2): edit src/modules/academics/college-program-mutation-model.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md, docs/audit/gap2/lane-3/l14-u026-program-controller.md, docs/audit/gap2/lane-9/college-admin-programs.md

## G2-10-020-103  [P2] GAP  facet F22  effort undefined
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:59-83 — Program DTO name, dept_id, duration_years; `NewProgram` integer ID.
- vNext now: src/modules/academics/college-program-mutation-model.ts:8-13; src/modules/academics/program-service.ts:208-240 — UUID departmentId/programId, name, code, durationTerms.
- Fix: Map identifiers and duration years→terms.

## G2-20-029-030  [P2] GAP  facet F06  effort M
- Legacy: Edit cancel detects trimmed name, department, duration to trigger discard (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:203-211`)
- vNext now: Edit dirty helper also tracks code and raw duration representation (`src/components/academics/academics-actions.tsx:144-154`, `src/modules/academics/college-program-mutation-model.ts:29-36`)
- Fix: Align dirty checks for trimmed names and selected department

## G2-20-029-069  [P2] GAP  facet F20  effort S
- Legacy: Legacy edits trim name before submission, but can change department within same college (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:141-150`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:164-172`)
- vNext now: vNext trims via schema and prevents changing department after linked records (`src/modules/academics/college-program-mutation-service.ts:169-177`, `src/modules/academics/college-program-mutation-model.ts:3-13`)
- Fix: Clarify deliberate stronger move restriction, show reason inline

## G2-14-026-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:45-46`
- vNext now: `src/modules/academics/college-program-mutation-model.ts:3-12`
- Fix: Legacy body `name,dept_id,duration_years`; vNext JSON `name,departmentId,code,durationTerms` with mandatory code.

## G2-14-026-032  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:43-46`
- vNext now: `src/modules/academics/college-program-mutation-model.ts:6-12`
- Fix: Legacy durationYears default0 becomes terms min1; semester-count business rules and existing empty programs diverge.

## G2-14-026-041  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:43-46`
- vNext now: `src/modules/academics/college-program-mutation-model.ts:8-12`
- Fix: New mandatory Code and Duration terms inputs alter old Program create form density/column widths.

## G2-9-018-049  [P2] GAP  facet F12  effort M
- Legacy: Legacy year duration 1..10 in UI and *2 batch/semester maximum `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:282-284` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:113-136`
- vNext now: Terms stored between 1..24; create UI years 1..10 and doubled `src/modules/academics/college-program-mutation-model.ts:1-9` `src/components/admin/admin-program-directory.tsx:104-111`
- Fix: Prevent mismatched 11-12 years via other routes or explain larger model range.

## G2-9-018-072  [P2] GAP  facet F22  effort S
- Legacy: Legacy DTO @NotBlank max255 name, @Min1 dept and years `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramDTO.java:8-14`
- vNext now: Name max255, code regex/max64, UUID department, 1..24 terms `src/modules/academics/college-program-mutation-model.ts:1-19`
- Fix: Maintain exact old UI fields while enforcing modern backend validations.

## G2-14-026-044  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:45-46`
- vNext now: `src/modules/academics/college-program-mutation-model.ts:3-12`
- Fix: Legacy duration years field wording and default0 vs vNext duration terms, changes exact form labels.
