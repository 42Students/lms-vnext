# Work packet: edit src/modules/placements/tpo-job-type-write-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md, docs/audit/gap2/lane-6/tpo-job-type-service.md

## G2-3-011-028  [P0] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:165-170`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:58-64`
- vNext now: `src/modules/placements/tpo-job-type-write-service.ts:114-136`, `203-221`
- Fix: Legacy renaming custom type rewrites job.job_type for all college drives, change to counts-as-placed rewrites job.counts_as_placed. VNext only updates type config, not drives. Implement tenant-scoped propagation and derived counts.

## G2-3-011-054  [P0] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:155-170`
- vNext now: `src/modules/placements/tpo-job-type-write-service.ts:99-137`, `189-221`
- Fix: Legacy safe delete of unused custom and cascade rename/placed-answer onto drives are dropped without recorded reason; implement or obtain explicit exception.

## G2-3-011-018  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:138-142`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:154-159`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:75-89`, `src/modules/placements/tpo-job-type-write-service.ts:19-223`
- Fix: Legacy permits deletion of unused custom labels, disables action for in-use type with Used by drives: switch it off instead tooltip. vNext has no removal API/button. Add safe deletion.

## G2-3-011-046  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:131-159`
- vNext now: `src/db/schema/tpo-configuration.ts:35-38`, `src/modules/placements/tpo-job-type-write-service.ts:32-40`, `121-129`
- Fix: Legacy checks names case-insensitively; vNext app lower comparison but DB unique index on literal label is case-sensitive. Add lower(label)/college unique index to prevent duplicate case under alternate writes.

## G2-6-011-011  [P1] GAP  facet F05  effort M
- Legacy: Old `countsAsPlaced` unknown or null defaults true `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:108-114`
- vNext now: New countsAsPlaced nullable in DB, explicit required for create `src/db/schema/tpo-configuration.ts:31-31` `src/modules/placements/tpo-job-type-write-service.ts:13-21`
- Fix: Define legacy unknown-type placement counting default and backfill nulls safely

## G2-6-011-024  [P1] MISSING  facet F10  effort M
- Legacy: Old save receives whole list transaction, updates renames and countsAsPlaced on existing drives `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:121-177`
- vNext now: New separate per-row POST/PATCH updates config row only `src/modules/placements/tpo-job-type-write-service.ts:19-49` `src/modules/placements/tpo-job-type-write-service.ts:99-138` `src/modules/placements/tpo-job-type-write-service.ts:189-222`
- Fix: On rename and placed-answer change transactionally update affected existing drives

## G2-6-011-042  [P1] MISSING  facet F20  effort M
- Legacy: Old name rename cascades drive rows transactionally `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:160-169`
- vNext now: New rename uses current item id CAS but no job update `src/modules/placements/tpo-job-type-write-service.ts:114-136`
- Fix: Add transactional linked job rename and race-safe concurrent write guard

## G2-3-011-021  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:123`, `140-153`, `158-159`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:32-39`, `src/modules/placements/tpo-job-type-write-service.ts:19-81`
- Fix: Legacy specific errors Send the list of job types, Up to 30 job types of your own, Keep at least one job type switched on and in-use drive count; vNext error-code wording differs. Match exact messages per failure.

## G2-6-011-018  [P2] GAP  facet F07  effort M
- Legacy: Old custom 2-40 length regex error embeds invalid name `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:140-141`
- vNext now: New show generic server schema error, client min/max `src/modules/placements/tpo-job-type-write-service.ts:13-13` `src/components/tpo/tpo-job-types-editor.tsx:47-50`
- Fix: Show original exact validation message and safe invalid-name preview
