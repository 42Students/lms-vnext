# Work packet: edit src/modules/placements/placement-legacy-posting-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/job-service-impl.md

## G2-18-011-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy important_dates can use `type` or `dateType` and UTC time (`JobServiceImpl.java:1545-1577`).
- vNext now: New legacy posting normalizes importantDates as `{label,at:iso}` max20, losing type/dateType (`placement-legacy-posting-model.ts:23-25`).
- Fix: Migrate `type/dateType` and date fields to canonical calendar event type without losing classification.

## G2-18-011-039  [P1] GAP  facet F10  effort M
- Legacy: Legacy important dates from Job.importantDates JSON keys label/date/type/dateType (`JobServiceImpl.java:1545-1572`).
- vNext now: New posting writes structured importantDates with `at` and no type (`placement-legacy-posting-model.ts:23-25`).
- Fix: Read/convert old JSON schema, do not drop date classification or UTC.

## G2-18-011-070  [P1] GAP  facet F22  effort L
- Legacy: Legacy job integer org/college/targetProgram/Class/Batch and important_dates JSON (`JobServiceImpl.java:340-368,1545-1577`).
- vNext now: New job UUID college, eligibility policies allowed Program/Cohort/Section and legacy posting details (`placements.ts:462-625,818-921`; `placement-legacy-posting-model.ts:23-25`).
- Fix: Migrate targeting hierarchy and dates losslessly, including org-wide jobs.
