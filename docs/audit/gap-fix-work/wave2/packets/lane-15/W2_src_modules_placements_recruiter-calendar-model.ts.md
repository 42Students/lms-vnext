# Work packet (wave 2): edit src/modules/placements/recruiter-calendar-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u005-recruiter-calendar.md

## G2-5-005-009  [P2] GAP  facet F03 Visible elements  effort M
- Legacy: EVENT_STYLE Round blue, Interview slot green, Deadline orange, Results due gold (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:20-25)
- vNext now: EventCard gives deadline warning, all other kinds info; statuses separate (src/app/(authenticated)/hr/calendar/page.tsx:197-217; src/modules/placements/recruiter-calendar-model.ts:83-151)
- Fix: Restore per-category legacy palette and results-due gold labels.

## G2-5-005-014  [P2] GAP  facet F04 Data shown/formatting  effort M
- Legacy: Secondary text jobTitle · where · N interview slots (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:113-115)
- vNext now: Job, venue separate lines; slots projected separately (src/app/(authenticated)/hr/calendar/page.tsx:178-194; src/modules/placements/recruiter-calendar-model.ts:141-150)
- Fix: Fold slot child count into round's compact secondary line.

## G2-5-005-068  [P2] GAP  facet F22 Data model/migrations  effort M
- Legacy: Folded slot counts from legacy grouped event list (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:100-117)
- vNext now: Separate hrInterviewSlots data and round records, no fold metadata (src/modules/placements/recruiter-calendar-service.ts:213-222; src/modules/placements/recruiter-calendar-model.ts:141-150)
- Fix: Derive per-round slot count from DB and pass into calendar day row.
