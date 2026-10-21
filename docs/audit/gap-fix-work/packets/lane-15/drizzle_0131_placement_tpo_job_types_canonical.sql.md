# Work packet: edit drizzle/0131_placement_tpo_job_types_canonical.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/tpo-job-type-service.md

## G2-6-011-045  [P1] GAP  facet F22  effort M
- Legacy: Old `tpo_college_settings.job_types_json` stores hidden[] + custom[] `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:38-52` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:172-175`
- vNext now: New `placement_tpo_job_types` stores rows with isBuiltin and active `src/db/schema/tpo-configuration.ts:22-39` `drizzle/0131_placement_tpo_job_types_canonical.sql:1-2`
- Fix: Migrate all stored custom/hidden values to relational canonical, verify built-in defaults
