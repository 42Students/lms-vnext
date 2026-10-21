# Work packet: edit src/modules/placements/round-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/job-round-repository.md

## G2-15-014-034  [P1] GAP  facet F10  effort M
- Legacy: Round insertion locks drive row then max sequence. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:53-59`)
- vNext now: New job lock and max active sequence, but canceled rows excluded. (`src/modules/placements/round-service.ts:154-189`)
- Fix: Guard historical unique sequence even for canceled and audit references.

## G2-15-014-042  [P1] GAP  facet F12  effort M
- Legacy: Saving non-null schedule auto-sets status SCHEDULED. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:72-73`)
- vNext now: New requires explicit schedule action with mode/timezone. (`src/modules/placements/round-service.ts:305-352`)
- Fix: Enable create+schedule equivalent and handle missing venue/link via guided validation.

## G2-15-014-060  [P1] GAP  facet F20  effort M
- Legacy: MAX(seq)+1 includes all rounds, even those pending removal before hard delete. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:53-59`)
- vNext now: MAX sequence excludes CANCELLED rows; partial unique allows reuse. (`src/modules/placements/round-service.ts:180-189`)
- Fix: Prevent sequence reuse if histories link to cancelled round positions.

## G2-15-014-022  [P2] GAP  facet F07  effort S
- Legacy: Exact A round needs a type and a name, Unknown round type. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:35-40`)
- vNext now: New Zod schema/PLACEMENT_ROUND errors, no exact old strings. (`src/modules/placements/round-service.ts:147-149`)
- Fix: Map name/type validation errors into old field-level wording.

## G2-15-014-023  [P2] GAP  facet F07  effort S
- Legacy: Missing kind Choose a type for round N. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java:377-379`)
- vNext now: New create invalid kind fails schema, without indexed multi-round copy. (`src/modules/placements/round-service.ts:147-149`)
- Fix: Display indexed error when saving multi-round drive form.

## G2-15-014-024  [P2] GAP  facet F07  effort M
- Legacy: Foreign drive round Not found; locked kind change names student-dependent reason. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:43-48`)
- vNext now: New generic PLACEMENT_ROUND_NOT_EDITABLE on nonpending. (`src/modules/placements/round-service.ts:233-242`)
- Fix: Keep clear ownership error and kind-change reason when dependent rows exist.

## G2-15-014-026  [P2] GAP  facet F07  effort M
- Legacy: Reorder error Send every round of this drive exactly once or rounds cannot reorder in use. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:110-121`)
- vNext now: New uses validation schema and service-specific errors. (`src/modules/placements/round-service.ts:290-301`)
- Fix: Ensure exact full-set and in-use errors reach cloned UI.
