# Work packet (wave 2): edit src/modules/messaging/provider-acceptance-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-3-012-034  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:190-194`
- vNext now: `src/modules/messaging/provider-acceptance-model.ts:6-12`
- Fix: Legacy rejects failed* status, vNext rejects every status outside finite affirmative list. Verify against provider sandbox and retain fail-closed semantics.
