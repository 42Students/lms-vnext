# Work packet (wave 2): edit src/app/api/placements/tpo/calendar/follow-ups/[followupId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-057  [P2] GAP  facet F10  effort M
- Legacy: Legacy move PUT /api/v1/tpo/recruiter-leads/follow-ups/{id}/move (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:134-139`)
- vNext now: vNext PATCH /api/placements/tpo/calendar/follow-ups/{id} (`src/app/api/placements/tpo/calendar/follow-ups/[followupId]/route.ts:16-40`)
- Fix: Verify atomic move and tenant scoped selector under changed HTTP verb
