# Work packet (wave 2): edit src/modules/admin-ui/super-admin-semesters-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l13-u026-program-structure-controller.md

## G2-13-026-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:100-120,141-147 — fetchAll, fetchAllSemesters?programId and fetchActiveSemesters.
- vNext now: src/modules/admin-ui/super-admin-semesters-service.ts:12-39 — list scoped selected-college query with status filter; no matching public fetchAll URL.
- Fix: Provide equivalent program-scoped readers and active filter.

## G2-13-026-008  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:114-120 — fetchAllSemesters returns bare list NewProgramStructure.
- vNext now: src/modules/admin-ui/super-admin-semesters-service.ts:12-39 — listAdminSemesters returns items/total/pagination with name/number/credits.
- Fix: Preserve program-specific bare list where clients need it.

## G2-13-026-011  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:100-111 — global endpoint returns accessible structures, no pagination.
- vNext now: src/modules/admin-ui/super-admin-semesters-service.ts:31-38 — capped LIMIT/OFFSET, scope-selected.
- Fix: Preserve full authorized collection semantics or clearly bounded paging.

## G2-13-026-028  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:102-111 — fetchAll filters canAccessProgram per returned item.
- vNext now: src/modules/admin-ui/super-admin-semesters-service.ts:12-28 — SQL tenant scope requires Super Admin selected college.
- Fix: Preserve multi-college authorized reads where relevant.

## G2-13-026-029  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:116-119,141-145 — fetch program semesters requireAccessProgram.
- vNext now: src/modules/admin-ui/super-admin-semesters-service.ts:12-28 — requires admin scoped college, no general program access path.
- Fix: Expose authorized program reader for learner/faculty consumers.

## G2-13-026-009  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:100-112 — fetchAll returns Response status OK, message OK, data list.
- vNext now: src/modules/admin-ui/super-admin-semesters-service.ts:36-39 — typed result items envelope.
- Fix: Translate old response wrapper and error format.
