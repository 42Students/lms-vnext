# Work packet (wave 2): edit src/modules/placements/tpo-remind-not-applied-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/tpo-applicant-controller.md

## G2-8-023-045  [P2] GAP  facet F12  effort M
- Legacy: Legacy remind once per drive within prior 20h, not calendar midnight (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:121-125).
- vNext now: New per IST calendar day dedupeKey (at midnight reset) (src/modules/placements/tpo-remind-not-applied-service.ts:46-51,64-85; src/modules/placements/tpo-remind-not-applied-model.ts:7-16).
- Fix: Choose 20h rolling vs IST-day policy and test 23:59/00:01 repeat reminders.
