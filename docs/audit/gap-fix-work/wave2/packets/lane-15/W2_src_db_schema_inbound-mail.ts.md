# Work packet (wave 2): edit src/db/schema/inbound-mail.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md, docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md, docs/audit/gap2/lane-8/l13-u024-superadmin-inbound-mail-controller.md

## G2-10-009-116  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V224__inbound_email_from_cloudflare.sql:3-8` external_id Message-ID varchar100 unique renamed from Gmail
- vNext now: `src/db/schema/inbound-mail.ts:20` source_message_id varchar255 unique
- Fix: Map Message-ID limit/uniqueness and duplicate semantics during migration

## G2-10-009-118  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V225__inbound_mail_inbox.sql:6` body_text MEDIUMTEXT stores 200000 char received email
- vNext now: `src/db/schema/inbound-mail.ts:25` plain text no max declared, `src/components/admin/inbound-mail-list.tsx:86` clips render to15000
- Fix: Expose full body detail and cap transport consistently

## G2-5-026-024  [P2] GAP  facet F10  effort M
- Legacy: Legacy matches recruiter/learner sender and college for inbound mail attribution. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:126-145`
- vNext now: vNext inbox schema can associate collegeId but no recruiterId/learnerId. `src/db/schema/inbound-mail.ts:19-28`, `src/modules/inbound-mail/admin-service.ts:50-55`
- Fix: Persist resolved actor relationship for operator filtering.

## G2-13-024-014  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:28 id numeric from MySQL inbound_email
- vNext now: src/db/schema/inbound-mail.ts:19 UUID id, sourceMessageId unique varchar255
- Fix: Document numerical legacy id to UUID/sourceMessageId mapping for imports/inbound dedupe

## G2-13-024-053  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V225__inbound_mail_inbox.sql:4-12 indexes kind,handledAt,createdAt
- vNext now: src/db/schema/inbound-mail.ts:30-36 indexes source key,receivedAt,collegeId+status
- Fix: Add indexes for OPEN/REPLIES/DONE lists and search; benchmark sort+count

## G2-13-024-046  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:92-95 fallback '(no subject)' lowercase
- vNext now: src/db/schema/inbound-mail.ts:24 subject nonnullable and UI renders '(No subject)' per existing inbound-mail-list
- Fix: Use exact lowercase fallback in subject table/drawer
