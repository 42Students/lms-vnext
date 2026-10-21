# Work packet: edit src/modules/placements/recruiter-calendar-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-14-025-055  [P1] GAP  facet F20  effort M
- Legacy: RecruiterDriveController.java:64-71 UTC ISO instants and exclusive end
- vNext now: src/modules/placements/recruiter-calendar-service.ts:41-95 IST-local dates
- Fix: Test precise midnight inclusivity and UTC conversion.

## G2-14-025-020  [P3] GAP  facet F07  effort S
- Legacy: RecruiterDriveController.java:67 Dates must be ISO date-times
- vNext now: src/modules/placements/recruiter-calendar-service.ts:41-95 z.iso.date
- Fix: Align date input and validation wording.

## G2-14-025-021  [P3] GAP  facet F07  effort S
- Legacy: RecruiterDriveController.java:70 Choose a range of up to 120 days
- vNext now: src/modules/placements/recruiter-calendar-service.ts:87-90 Calendar requests cannot exceed 366 days
- Fix: Document intended max and update user copy.
