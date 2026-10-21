# Work packet (wave 2): edit src/modules/placements/placement-legacy-posting-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/job-service-impl.md

## G2-18-011-055  [P2] GAP  facet F14  effort M
- Legacy: Legacy important dates available as calendar event JSON export (`JobServiceImpl.java:1472-1577`).
- vNext now: New legacy posting details saved in extra field with at ISO only (`placement-legacy-posting-model.ts:23-25`).
- Fix: Expose bounded ICS/calendar read and retain label/type.
