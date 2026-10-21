# Work packet: edit src/modules/academics/college-cohort-mutation-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-batches.md

## G2-9-003-057  [P1] GAP  facet F12  effort M
- Legacy: Batch create defaults status ACTIVE, semester 1 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:68-120`)
- vNext now: New cohort has progression/lifecycle PLANNED and period dependency (`src/modules/academics/college-cohort-mutation-service.ts:125-180`)
- Fix: Map default state and semester progression on create.
