# Work packet (wave 2): edit src/app/api/placements/recruiter/conversations/open/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-messages.md

## G2-13-004-038  [P2] GAP  facet F10  effort M
- Legacy: General thread is created automatically on sending if absent (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:207-211`)
- vNext now: New requires POST conversations/open, then navigates detail (`src/app/api/placements/recruiter/conversations/open/route.ts:10-23`)
- Fix: Allow compose+send without separate open step to match user flow.
