# Work packet (wave 2): edit src/modules/placements/hr-today-live-drive-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-home.md

## G2-13-002-019  [P2] GAP  facet F04  effort M
- Legacy: Live panel picks largest non-withdrawn applied count (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:194-209`)
- vNext now: New sorts live jobs by earliest deadline (`src/modules/placements/hr-today-live-drive-model.ts:5-15`)
- Fix: Use shared/total applicant count to choose primary busiest item consistently.

## G2-13-002-024  [P2] GAP  facet F05  effort S
- Legacy: Live drive one row, descending applicant count (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:195-209`)
- vNext now: Live-drive list max 3, ascending deadline (`src/modules/placements/hr-today-live-drive-model.ts:5-15`)
- Fix: Restore primary card metric/order; distinguish expanded list.
