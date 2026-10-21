# Work packet (wave 2): edit src/app/api/placements/tpo/calendar/follow-ups/[followupId]/complete/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-058  [P2] GAP  facet F10  effort M
- Legacy: Legacy completion POST /api/v1/tpo/recruiter-leads/follow-ups/{id}/done returns 204 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:127-132`)
- vNext now: vNext POST /api/placements/tpo/calendar/follow-ups/{id}/complete returns JSON (`src/app/api/placements/tpo/calendar/follow-ups/[followupId]/complete/route.ts:16-36`)
- Fix: Confirm no caller assumes empty body and preserve idempotency
