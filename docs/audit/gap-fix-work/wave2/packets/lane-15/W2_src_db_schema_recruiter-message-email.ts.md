# Work packet (wave 2): edit src/db/schema/recruiter-message-email.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/recruiter-message-email-service.md

## G2-20-010-054  [P2] GAP  facet F22  effort S
- Legacy: Legacy inbound log includes status/sender/recipient/preview `docs/legacy-source/backend/src/main/resources/db/migration/V223__recruiter_message_email_and_replies.sql:13-28`
- vNext now: New inbound event stores only hashed provider ID/thread/message and timestamp `src/db/schema/recruiter-message-email.ts:23-33`
- Fix: Preserve privacy-safe audit for rejected inbound and shared mailbox operations
