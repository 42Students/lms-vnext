# Work packet (wave 3): edit src/db/schema/placement-public-joins.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/job-slug-generator.md

## G2-8-010-038  [P1] MISSING  facet F22  effort L
- Legacy: Old Job table contains nullable `job_slug` unique varchar(32) (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:220-236`)
- vNext now: VNext placementJobs schema uses UUID job ID; tokenHash in separate public join table, not a job slug column (`src/db/schema/placements.ts:157-1982; src/db/schema/placement-public-joins.ts:6-31`)
- Fix: Map public external job links in dedicated table keyed to job+college or add explicit slug alias with unique DB constraint
