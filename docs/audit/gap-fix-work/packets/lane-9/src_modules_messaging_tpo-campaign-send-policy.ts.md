# Work packet: edit src/modules/messaging/tpo-campaign-send-policy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u014-email-suppression-repository.md

## G2-18-014-021  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:13 — ‘Stop all emails’ global by normalized address.
- vNext now: src/modules/messaging/tpo-campaign-send-policy.ts:11-17 — campaign send policy checks lead-local unsubscribedAt only.
- Fix: Add active global-HMAC suppression gate to campaign dispatch pre-send.
