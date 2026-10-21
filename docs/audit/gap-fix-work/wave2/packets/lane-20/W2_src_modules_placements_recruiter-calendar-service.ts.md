# Work packet (wave 2): edit src/modules/placements/recruiter-calendar-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md, docs/audit/gap2/lane-5/u005-recruiter-calendar.md

## G2-14-025-002  [P2] GAP  facet F01  effort M
- Legacy: RecruiterDriveController.java:49-71 Today and calendar GET
- vNext now: src/modules/placements/recruiter-calendar-service.ts:41-95 date-only calendar query; src/app/(authenticated)/hr/home/page.tsx:1-25
- Fix: Map Today/calendar read endpoints, 30-day default and date formats.

## G2-14-025-017  [P2] GAP  facet F06  effort M
- Legacy: RecruiterDriveController.java:60-71 ISO date-time max120d, [from,to)
- vNext now: src/modules/placements/recruiter-calendar-service.ts:41-95 ISO date only max366d
- Fix: Convert calendar range with IST-safe boundary.

## G2-14-025-037  [P2] GAP  facet F11  effort M
- Legacy: RecruiterDriveController.java:49-71 Today/calendar requireCollege null capability
- vNext now: src/modules/placements/recruiter-calendar-service.ts:105-118 active grants
- Fix: Preserve read-only grant access independent of DRIVE_WORK.

## G2-14-025-039  [P2] GAP  facet F12  effort M
- Legacy: RecruiterDriveController.java:57-72 calendar default next30days
- vNext now: src/modules/placements/recruiter-calendar-service.ts:41-95 date-only and cap366
- Fix: Preserve intended 30-day default and [from,to) behavior.

## G2-5-005-069  [P2] GAP  facet F22 Data model/migrations  effort M
- Legacy: Legacy from/to ISO instants given viewer timezone (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:59-60)
- vNext now: New date-only from/to and IST day boundaries (src/modules/placements/recruiter-calendar-service.ts:41-93; src/modules/placements/recruiter-calendar-service.ts:125-137)
- Fix: Verify migrated timezone and exact window boundaries including DST.

## G2-14-025-052  [P3] GAP  facet F18  effort S
- Legacy: RecruiterDriveController.java:70 'Choose a range of up to 120 days'
- vNext now: src/modules/placements/recruiter-calendar-service.ts:90 'Calendar requests cannot exceed 366 days'
- Fix: Update exact date-range copy.
