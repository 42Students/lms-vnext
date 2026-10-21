# Work packet: edit src/db/schema/recruiter-message-email.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/recruiter-message-email-service.md

## G2-20-010-053  [P1] GAP  facet F22  effort M
- Legacy: Legacy MySQL adds thread recruiter_emailed_at/raw token, inbound_email audit/inbound state `docs/legacy-source/backend/src/main/resources/db/migration/V223__recruiter_message_email_and_replies.sql:5-35`
- vNext now: New proposed Postgres mail state with hash and reply expiry plus inbound hash idempotency `src/db/schema/recruiter-message-email.ts:6-34`
- Fix: Apply verified matching Drizzle/PostgreSQL migration and validate startup guard
