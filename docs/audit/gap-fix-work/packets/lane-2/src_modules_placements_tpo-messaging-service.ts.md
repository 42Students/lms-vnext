# Work packet: edit src/modules/placements/tpo-messaging-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/l19-u022-tpo-hub-controller.md

## G2-19-022-019  [P2] GAP  facet F07  effort S
- Legacy: Messages reject blank and >4000 characters with `Write a message first` / `Keep a message under 4000 characters` (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:187-188).
- vNext now: `src/modules/placements/tpo-messaging-service.ts:36-40` validates trimmed 1..4000.
- Fix: Check server/client exact wording and whitespace-only handling; translate Zod min/max errors to legacy strings.
