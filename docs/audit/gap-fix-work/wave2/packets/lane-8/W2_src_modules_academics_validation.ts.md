# Work packet (wave 2): edit src/modules/academics/validation.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/new-program.md, docs/audit/gap2/lane-2/class-schedule-controller.md

## G2-13-018-010  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:18-19` deptId int required via primitive, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramDTO.java:13-14` >=1
- vNext now: `src/db/schema/academics.ts:33-37` department UUID FK restrict, `src/modules/academics/validation.ts:4` uuid
- Fix: Resolve old department numeric IDs to current UUID and reject dangling links

## G2-13-018-015  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramDTO.java:11-16` @NotBlank max255; dept and years @Min(1), no upper bound
- vNext now: `src/modules/academics/validation.ts:40-41` years 1..10 and terms1..24
- Fix: Validate legacy duration upper bound in migration, explicitly report programs >10 years

## G2-13-018-018  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramDTO.java:13-16` department>=1, years>=1, no required code
- vNext now: `src/modules/academics/validation.ts:78-87` requires code schema plus department UUID and duration
- Fix: Ensure generated code defaults in UI and API callers, not fail legacy imports without code

## G2-13-018-049  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:21-22` signed Java int durationYears, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramDTO.java:15` Min1
- vNext now: `src/db/schema/academics.ts:40` durationTerms integer CHECK 1..24, `src/modules/academics/validation.ts:41` years1..10
- Fix: Use exact integer conversion and flag unsupported >10-year legacy values

## G2-2-032-033  [P2] GAP  facet F06  effort M
- Legacy: ClassScheduleDTO.java:14-27 requires classId/facultyId positive and start/end nonblank.
- vNext now: src/modules/academics/validation.ts schedule event Zod schema consumes UUID section/faculty and offset datetime.
- Fix: Convert field-name validation and show errors at exact inputs.
