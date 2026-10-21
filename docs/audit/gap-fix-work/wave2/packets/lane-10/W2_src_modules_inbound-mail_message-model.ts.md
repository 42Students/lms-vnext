# Work packet (wave 2): edit src/modules/inbound-mail/message-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md, docs/audit/gap2/lane-8/l13-u024-superadmin-inbound-mail-controller.md

## G2-10-009-107  [P2] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:168-174` lowercases sender and parses header email
- vNext now: `src/modules/inbound-mail/message-model.ts:9-11` validates email shape; `src/modules/inbound-mail/admin-service.ts:50-54` stores existing values
- Fix: Normalize sender and address display on input; don't lose malformed-but-received mail

## G2-13-024-018  [P3] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:45-46 show any unknown value defaults OPEN; page negative clamps0
- vNext now: src/modules/inbound-mail/message-model.ts:2-7 strict status enum and page min1/max10000
- Fix: Map invalid legacy query values to OPEN/first page where UX parity intended

## G2-13-024-036  [P3] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:55-61 q blank means no search and page clamp
- vNext now: src/modules/inbound-mail/message-model.ts:2-7 max q length120, default empty and page1
- Fix: Match empty-query behavior and show field-specific max validation if 120 remains
