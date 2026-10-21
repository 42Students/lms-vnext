# Work packet: edit src/modules/placements/recruiter-calendar-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u005-recruiter-calendar.md

## G2-5-005-067  [P1] GAP  facet F22 Data model/migrations  effort L
- Legacy: Legacy event DTO type ROUND/SLOT/DEADLINE/RESULTS_DUE, start/end, where, jobId (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:20-25; docs/legacy-source/frontend/src/pages/recruiter/calendar.js:30-38)
- vNext now: New PlacementCalendarEvent enum ROUND/INTERVIEW_SLOT/APPLICATION_DEADLINE plus resultsDue separate (src/modules/placements/recruiter-calendar-model.ts:76-153; src/modules/placements/recruiter-calendar-model.ts:156-177)
- Fix: Write field-by-field event mapping including stable IDs and type/status.
