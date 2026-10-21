# Work packet: edit src/app/api/placements/tpo/messages/threads/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l19-u022-tpo-hub-controller.md

## G2-19-022-076  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:325-329 POST send recruiter message
- vNext now: src/app/api/placements/tpo/messages/threads/route.ts:9-23 opens thread only
- Fix: Separate open thread from actual send body/notification persistence
