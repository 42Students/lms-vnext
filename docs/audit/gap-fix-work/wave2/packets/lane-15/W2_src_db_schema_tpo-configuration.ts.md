# Work packet (wave 2): edit src/db/schema/tpo-configuration.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md, docs/audit/gap2/lane-6/tpo-job-type-service.md

## G2-3-011-011  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:30-35`, `75-86`
- vNext now: `src/db/schema/tpo-configuration.ts:22-38`, `src/modules/placements/tpo-configuration-read-service.ts:22-26`
- Fix: Legacy data fields id/name/builtin/countsAsPlaced/hidden/drives versus vNext id/label/isBuiltin/active/countsAsPlaced/updatedAt. Include drives and consistent hidden polarity in UI projection.

## G2-3-011-051  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:22-24`, `140-153`
- vNext now: `src/db/schema/tpo-configuration.ts:29-38`, `src/modules/placements/tpo-configuration-model.ts:6-8`
- Fix: Legacy 2-40 name grammar/explicit boolean and last-active condition; vNext DB varchar(100), nullable counts_as_placed, no grammar or last-active DB checks. Add constraints and safe compatibility migration.

## G2-6-011-007  [P2] GAP  facet F04  effort M
- Legacy: Old `Type` API returns id,name,builtin,countsAsPlaced,hidden `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:30-35`
- vNext now: New stores id,label,isBuiltin,countsAsPlaced,active,updatedAt `src/db/schema/tpo-configuration.ts:22-34`
- Fix: Map hidden=!active, label=name, include usedCount for endpoint compatibility
