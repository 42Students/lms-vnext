# Work packet (wave 3): edit src/modules/academics/college-term-mapping-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/new-program-structure.md

## G2-12-018-002  [P1] MISSING  facet F01  effort L
- Legacy: Legacy /api/v1/program-structure has create/update/delete/all/byprogram/active/status endpoints `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:26-28,66-146`
- vNext now: New semester POST/PATCH/DELETE and course mapping service, no dedicated structure route `src/modules/academics/semester-mutation-service.ts:106-232` `src/modules/academics/college-term-mapping-service.ts:60-95`
- Fix: Implement legacy structure endpoint adapter or documented equivalent UI flows.

## G2-12-018-055  [P1] MISSING  facet F23  effort L
- Legacy: Old all update/status/read endpoints and independent structure entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:66-146`
- vNext now: New semester/curriculum model only partial equivalent `src/modules/academics/semester-mutation-service.ts:106-232` `src/modules/academics/college-term-mapping-service.ts:60-95`
- Fix: Provide explicit feature-to-feature equivalence before declaring parity.
