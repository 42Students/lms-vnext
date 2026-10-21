# Work packet (wave 2): edit src/modules/placements/drive-day-coordinator-policy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-index.md

## G2-11-009-090  [P2] GAP  facet F22  effort M
- Legacy: Legacy scheduled_date drives query. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- vNext now: vNext coordinator policy uses IST scheduledAt duty date and statuses. `src/modules/placements/drive-day-coordinator-policy.ts:16`
- Fix: Normalize persisted date/time and null scheduling rules.
