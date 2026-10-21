# Work packet: edit src/lib/outbound.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/zeptomail-service.md, docs/audit/gap2/lane-14/u012-zeptomail-service.md

## G2-13-011-021  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:127-149` retries failed event mails up to 3 times with 500ms × attempt delay
- vNext now: `src/modules/messaging/providers.ts:56-58` and `src/lib/outbound.ts:37-39` single non-idempotent POST attempt
- Fix: Document intentional at-most-once semantics; implement provider idempotency/reconciliation before promising legacy retry guarantees

## G2-14-012-050  [P1] GAP  facet F19  effort M
- Legacy: Legacy synchronous RestTemplate POST, dispatcher may retry 3 times `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:147-157` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:127-149`
- vNext now: New outboundFetch 10s timeout and max one attempt `src/modules/notifications/zeptomail-email.ts:108-109` `src/lib/outbound.ts:32-50`
- Fix: Set bounded timeout and outbox retry visibility; no blind duplicate sends
