# Work packet: edit src/modules/messaging/receipt-history-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/sms-delivery-log.md

## G2-4-016-028  [P2] GAP  facet F07  effort S
- Legacy: Legacy search has no explicit validation error copy; suffix sanitized silently. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:61-72`)
- vNext now: New Zod rejects invalid page and purpose length. (`src/modules/messaging/receipt-history-model.ts:3-6`)
- Fix: Return clear client error on malformed suffix while preserving friendly input.

## G2-4-016-031  [P2] GAP  facet F08  effort S
- Legacy: Legacy status note exact SENT means operator accepted, handset delivery is not reported. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:80-83`)
- vNext now: New batch projection labels acceptedByProvider but no exact same support note. (`src/modules/messaging/receipt-history-model.ts:20-34`)
- Fix: Show explicit caution above results and in API.
