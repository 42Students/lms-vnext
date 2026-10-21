# Work packet: edit src/db/schema/tpo-crm.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md, docs/audit/gap2/lane-14/u022-tpo-recruiter-lead-controller.md, docs/audit/gap2/lane-19/tpo-email-campaign-service.md

## G2-10-026-068  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:108-110,127-129 — Recipient rows have SHA256 unsubscribe token hash, lead ID.
- vNext now: src/modules/messaging/tpo-campaign-unsubscribe-service.ts:30-55; src/db/schema/tpo-crm.ts:61-61 — Recipient UUID and lead unsubscribedAt, signed proof.
- Fix: Support legacy hash-token migration.

## G2-14-022-064  [P1] GAP  facet F22  effort L
- Legacy: Legacy recruiter_lead, activity, followup tables use integer/Long IDs and college scope `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:89-126` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:208-269`
- vNext now: New placement_tpo_leads/activities/followups UUID and composite college FKs `src/db/schema/tpo-crm.ts:27-174` `src/db/schema/tpo-crm.ts:184-220`
- Fix: Create complete legacy ID→UUID migration including crosslinks

## G2-19-010-067  [P1] GAP  facet F22  effort L
- Legacy: Legacy SQL tables `tpo_email_campaign` header with numeric ID, subject/body/sent_by, count counters `docs/legacy-source/backend/src/main/resources/db/migration/V214__engage_email_campaigns.sql:6-18`
- vNext now: vNext UUID campaigns with DRAFT/SENDING/SENT status and separate draft fields `src/db/schema/tpo-crm.ts:295-328` `src/db/schema/tpo-campaign-drafts.ts:17-50`
- Fix: Migrate header/sender/subject/body and counts into UUID campaign+draft with status.

## G2-19-010-068  [P1] GAP  facet F22  effort L
- Legacy: Legacy recipients rows have email, string status and SHA256 unsubscribe token hash `docs/legacy-source/backend/src/main/resources/db/migration/V214__engage_email_campaigns.sql:20-29`
- vNext now: vNext recipients use HMAC recipient_key, status enum, unsubscribedAt and no raw email `src/db/schema/tpo-crm.ts:333-385`
- Fix: Map legacy SHA token to new signed-token system; preserve old link validity via scoped migration where possible.
