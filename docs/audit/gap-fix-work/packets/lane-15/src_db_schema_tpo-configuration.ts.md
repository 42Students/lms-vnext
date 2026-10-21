# Work packet: edit src/db/schema/tpo-configuration.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md, docs/audit/gap2/lane-6/tpo-job-type-service.md

## G2-3-011-046  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:131-159`
- vNext now: `src/db/schema/tpo-configuration.ts:35-38`, `src/modules/placements/tpo-job-type-write-service.ts:32-40`, `121-129`
- Fix: Legacy checks names case-insensitively; vNext app lower comparison but DB unique index on literal label is case-sensitive. Add lower(label)/college unique index to prevent duplicate case under alternate writes.

## G2-3-011-050  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:42-53`, `172-176`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:58-64`, `74-76`
- vNext now: `src/db/schema/tpo-configuration.ts:22-38`, `src/db/schema/placements.ts:496-498`, `570-573`
- Fix: Legacy tpo_college_settings.job_types_json stores hidden/custom and job.job_type/counts_as_placed; vNext type table stores row-based label/active/is_builtin/version while jobs have restricted enum and no placed flag. Map models, retain historical values.

## G2-3-011-052  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:75-86`, `155-170`
- vNext now: `src/db/schema/tpo-configuration.ts:22-38`, `src/db/schema/placements.ts:462-574`
- Fix: Legacy usage guard and rename join by job_type string; new employmentType cannot represent custom label or FK to job type, so in-use safety cannot be enforced. Add stable type reference/backward compatible bridge.

## G2-6-011-011  [P1] GAP  facet F05  effort M
- Legacy: Old `countsAsPlaced` unknown or null defaults true `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:108-114`
- vNext now: New countsAsPlaced nullable in DB, explicit required for create `src/db/schema/tpo-configuration.ts:31-31` `src/modules/placements/tpo-job-type-write-service.ts:13-21`
- Fix: Define legacy unknown-type placement counting default and backfill nulls safely

## G2-6-011-045  [P1] GAP  facet F22  effort M
- Legacy: Old `tpo_college_settings.job_types_json` stores hidden[] + custom[] `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:38-52` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:172-175`
- vNext now: New `placement_tpo_job_types` stores rows with isBuiltin and active `src/db/schema/tpo-configuration.ts:22-39` `drizzle/0131_placement_tpo_job_types_canonical.sql:1-2`
- Fix: Migrate all stored custom/hidden values to relational canonical, verify built-in defaults

## G2-6-011-046  [P1] MISSING  facet F22  effort M
- Legacy: Old drive table `job.job_type` and `job.counts_as_placed` updated on rename/answer `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:160-170`
- vNext now: New config row separate from job's current employment fields `src/db/schema/tpo-configuration.ts:22-39` `src/components/tpo/tpo-job-types-editor.tsx:57-58`
- Fix: Establish FK/reference or transactionally sync drive copies
