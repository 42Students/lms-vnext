# Work packet (wave 2): edit src/app/api/placements/tpo/calendar/follow-ups/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-056  [P2] GAP  facet F10  effort M
- Legacy: Legacy create POST /api/v1/tpo/recruiter-leads/{leadId}/follow-ups (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:115-125`)
- vNext now: vNext POST /api/placements/tpo/calendar/follow-ups with leadId in body (`src/app/api/placements/tpo/calendar/follow-ups/route.ts:14-38`)
- Fix: Maintain compatible mapping, response, status and missing-lead error
