# Work packet: edit src/db/schema/tpo-campaign-drafts.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tpo-email-campaign-service.md

## G2-19-010-067  [P1] GAP  facet F22  effort L
- Legacy: Legacy SQL tables `tpo_email_campaign` header with numeric ID, subject/body/sent_by, count counters `docs/legacy-source/backend/src/main/resources/db/migration/V214__engage_email_campaigns.sql:6-18`
- vNext now: vNext UUID campaigns with DRAFT/SENDING/SENT status and separate draft fields `src/db/schema/tpo-crm.ts:295-328` `src/db/schema/tpo-campaign-drafts.ts:17-50`
- Fix: Migrate header/sender/subject/body and counts into UUID campaign+draft with status.
