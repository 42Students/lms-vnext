# Work packet (wave 3): edit src/modules/placements/application-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/job-service-impl.md

## G2-18-011-054  [P1] MISSING  facet F14  effort L
- Legacy: Legacy JobService itself no file upload, only HTTPS resumeUrl from uploaded profile (`JobServiceImpl.java:389-421`).
- vNext now: New create application does not persist resumeUrl at all (`application-service.ts:570-616`; `placements.ts:973-1020`).
- Fix: Add signed resume reference upload/selection with ownership and validation.
