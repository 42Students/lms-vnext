# Work packet: edit src/modules/placements/tpo-crm-validation.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u022-tpo-recruiter-lead-controller.md

## G2-14-022-021  [P2] GAP  facet F07  effort S
- Legacy: Legacy bad activity type returns Log a call, email, meeting or note `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:101-113`
- vNext now: New activity schema enum CALL EMAIL MEETING NOTE rejects invalid `src/modules/placements/tpo-crm-validation.ts:69-80`
- Fix: Show exact legacy validation text

## G2-14-022-022  [P2] GAP  facet F07  effort S
- Legacy: Legacy missing name says Enter the recruiter's name `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:98-99`
- vNext now: New Zod min trim name error `src/modules/placements/tpo-crm-validation.ts:48-60`
- Fix: Use exact name field message

## G2-14-022-025  [P2] GAP  facet F07  effort S
- Legacy: Legacy followup move missing date says Choose a date `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:134-139`
- vNext now: New schema rejects date parse `src/modules/placements/tpo-crm-validation.ts:87-91`
- Fix: Restore exact field wording
