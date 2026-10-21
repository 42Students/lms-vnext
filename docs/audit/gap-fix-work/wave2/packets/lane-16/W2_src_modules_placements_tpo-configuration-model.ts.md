# Work packet (wave 2): edit src/modules/placements/tpo-configuration-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md

## G2-3-011-045  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypes.java:29-38`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:93-105`
- vNext now: `src/modules/placements/tpo-configuration-model.ts:6-8`, `src/modules/placements/tpo-job-type-write-service.ts:99-125`
- Fix: Legacy case-insensitive type normalization and collapse of repeated whitespace; vNext builtins normalize but custom create/rename only trim. Canonicalize spaces, case and Unicode consistently.

## G2-3-011-051  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:22-24`, `140-153`
- vNext now: `src/db/schema/tpo-configuration.ts:29-38`, `src/modules/placements/tpo-configuration-model.ts:6-8`
- Fix: Legacy 2-40 name grammar/explicit boolean and last-active condition; vNext DB varchar(100), nullable counts_as_placed, no grammar or last-active DB checks. Add constraints and safe compatibility migration.
