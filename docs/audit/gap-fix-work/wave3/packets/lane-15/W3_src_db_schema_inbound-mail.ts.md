# Work packet (wave 3): edit src/db/schema/inbound-mail.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md, docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md

## G2-10-009-064  [P0] MISSING  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:74-124` inbound receive routes replies to conversations and keeps failed replies for triage
- vNext now: `src/db/schema/inbound-mail.ts:15` explicitly says no ingestion enabled; no message import from bridge `src/modules/placements/recruiter-message-email-inbound-service.ts:21-105` into inbox table
- Fix: Wire authenticated inbound ingestion into inbox with durable receipt, routing outcome and manual review states

## G2-10-009-112  [P0] MISSING  facet F21  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:23-32` Cloudflare Email Routing/D1 worker signs HTTP with INBOUND_EMAIL_SECRET
- vNext now: `src/db/schema/inbound-mail.ts:15` no webhook ingest enabled, `src/modules/placements/recruiter-message-email-inbound-service.ts:27-30` separate feature-flagged recruiter bridge
- Fix: Implement inbound worker endpoint + secure routing and DB row ingestion for every accepted mail

## G2-5-026-002  [P0] MISSING  facet F01  effort L
- Legacy: Legacy inbound routes both recruiter replies and all other mail to Super Admin Inbound mail. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:22-33`
- vNext now: vNext mapped bridge handles recruiter replies only; inbox schema comment explicitly says no ingestion by table alone. `src/modules/placements/recruiter-message-email-inbound-service.ts:21-39`, `src/db/schema/inbound-mail.ts:15-17`
- Fix: Implement verified general-mail ingestion into inbound_mail_messages, with provider proof and failure classifications.
