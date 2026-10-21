# Work packet (wave 3): edit src/modules/placements/tpo-public-join-link-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/job-slug-generator.md

## G2-8-010-020  [P1] MISSING  facet F10  effort L
- Legacy: Legacy create generates for HYBRID and EXTERNAL_ONLY only (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:491-509`)
- vNext now: VNext public recruiter join link unrelated to placementJob.visibility mode (`src/modules/placements/tpo-public-join-link-service.ts:93-105; src/db/schema/placements.ts:157-1982`)
- Fix: Reintroduce equivalent external/public application sharing for eligible drive visibility, independently of recruiter invite flow
