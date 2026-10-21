# Work packet: edit src/db/schema/inbound-mail.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md, docs/audit/gap2/lane-10/superadmin-inbound-mail.md, docs/audit/gap2/lane-8/l13-u024-superadmin-inbound-mail-controller.md

## G2-5-026-052  [P0] MISSING  facet F23  effort M
- Legacy: Legacy stores non-conversation and invalid replies for Super Admin. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:84-88,95-123`
- vNext now: vNext handles only accepted recruiter replies; table is not a writer. `src/modules/placements/recruiter-message-email-inbound-service.ts:27-51`, `src/db/schema/inbound-mail.ts:15-17`
- Fix: Build all-mail intake and failed-message recovery before declaring feature parity.

## G2-10-009-073  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:79-81` INSERT IGNORE by external Message-ID prevents duplicate inbound emails
- vNext now: `src/db/schema/inbound-mail.ts:30-35` unique sourceMessageId indexed, but no inbox ingest worker
- Fix: Use sourceMessageId idempotency at actual inbound ingest boundary

## G2-10-009-087  [P1] MISSING  facet F15  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:109-122` postEmailReply triggers message handling, non-posted retained for manual triage
- vNext now: `src/db/schema/inbound-mail.ts:15` and `src/modules/inbound-mail/admin-service.ts:50-54` lack routing outcome and ingestion
- Fix: Persist non-posted reply as staff actionable item with reason/status tag

## G2-10-009-106  [P1] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:78-81` duplicate Message-ID dedupe insert ignore
- vNext now: `src/db/schema/inbound-mail.ts:31` sourceMessageId UNIQUE but ingest path absent
- Fix: Enforce durable idempotent ingestion transaction after HMAC/worker validation

## G2-10-009-108  [P1] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:189-206` strips quoted text; stores whole failed reply and processed body separately
- vNext now: `src/modules/placements/recruiter-message-email-inbound-service.ts:36-37` extracts recruiter reply before acceptance; `src/db/schema/inbound-mail.ts:25` one bodyPlain only
- Fix: Persist original body separately from stripped text and routing outcome

## G2-10-009-115  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V225__inbound_mail_inbox.sql:4-12` inbound_email has kind, body_text, recruiter_id, learner_id, college_id, handled_at/by plus idx kind/handled
- vNext now: `src/db/schema/inbound-mail.ts:19-35` inbound_mail_messages has collegeId/from/to/subject/bodyPlain/status/version only
- Fix: Extend schema with routing status, kind, sender identity joins and handledAt/by and indexes

## G2-10-009-117  [P1] MISSING  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:29-35` preview, threadId, recruited/student names derived via joins
- vNext now: `src/db/schema/inbound-mail.ts:17-29` lacks preview/thread ids and recruiter/student references
- Fix: Add dedicated foreign keys or indexed reference fields plus safe joined projection

## G2-10-009-119  [P1] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V225__inbound_mail_inbox.sql:10-11` handledAt/by audit dates + actor
- vNext now: `src/db/schema/inbound-mail.ts:26-29` stores status/version but no auditor/time
- Fix: Add handler and timestamp for staff triage; log transitions

## G2-5-026-007  [P1] GAP  facet F04  effort M
- Legacy: Legacy distinguishes REPLY to conversation vs OTHER inbox mail, stores both. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:22-33,69-88`
- vNext now: vNext schema status NEW/TRIAGED/RESOLVED, separate recruiter message event table; no reply kind on inbox row. `src/db/schema/inbound-mail.ts:15-35`, `src/modules/placements/recruiter-message-email-inbound-service.ts:38-40`
- Fix: Map REPLY/OTHER and delivery outcome to durable result attributes.

## G2-5-026-008  [P1] GAP  facet F04  effort M
- Legacy: Legacy records from/to,subject,threadId,messageId,recruiterId,learnerId,collegeId,bodyPreview,bodyText. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:147-154`
- vNext now: vNext inbox has from,to,subject,bodyPlain,collegeId but no thread/message/recruiter/learner or preview columns. `src/db/schema/inbound-mail.ts:19-28`
- Fix: Add linkage metadata or related-event join for triage and diagnostics.

## G2-5-026-030  [P1] GAP  facet F12  effort M
- Legacy: Legacy records receive UTC date and max length fields even on failure. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:147-154`
- vNext now: vNext inbox receipt requires receivedAt with timezone, but no new webhook writer populates timestamp. `src/db/schema/inbound-mail.ts:20-28`
- Fix: Write UTC receive timestamps and bounded headers in new ingester.

## G2-5-026-034  [P1] GAP  facet F14  effort M
- Legacy: Legacy inbound mail records entire body up to MEDIUMTEXT, supports triage and attribution. `docs/legacy-source/backend/src/main/resources/db/migration/V225__inbound_mail_inbox.sql:1-13`
- vNext now: vNext bodyPlain text exists but writer absent; attachments and raw MIME not saved. `src/db/schema/inbound-mail.ts:20-28`
- Fix: Implement safe body persistence with size/retention controls.

## G2-5-026-049  [P1] GAP  facet F22  effort M
- Legacy: Legacy inbound_email keyed external_id (<=100), kind REPLY/OTHER, body_text, associations and handledAt. `docs/legacy-source/backend/src/main/resources/db/migration/V224__inbound_email_from_cloudflare.sql:1-9`, `docs/legacy-source/backend/src/main/resources/db/migration/V225__inbound_mail_inbox.sql:1-13`
- vNext now: vNext inbound_mail_messages keyed uuid+sourceMessageId 255, NEW/TRIAGED/RESOLVED; no legacy delivery outcome or actor columns. `src/db/schema/inbound-mail.ts:15-35`
- Fix: Define migration/backfill for status, kind, attribution and handling metadata.

## G2-13-024-007  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:19-28 eight specific reply-routing badge words
- vNext now: src/modules/inbound-mail/message-model.ts:8-12, src/db/schema/inbound-mail.ts:26-35 only NEW/TRIAGED/RESOLVED
- Fix: Persist kind and routing status separately and display exact legacy badges

## G2-13-024-031  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:80-87 done=true sets handled_at NOW and handled_by current principal; false nulls both
- vNext now: src/db/schema/inbound-mail.ts:19-29 only status and version, no handled_at/by
- Fix: Persist handledAt/handledBy and reverse transition audit to preserve who handled it

## G2-13-024-052  [P1] MISSING  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V225__inbound_mail_inbox.sql:4-12 adds kind,body_text,recruiter/learner/college,handled_at,handled_by to inbound_email
- vNext now: src/db/schema/inbound-mail.ts:19-29 only sourceMessageId,collegeId,from,to,subject,bodyPlain,status,receivedAt,version
- Fix: Reconcile schema columns for routing, identity, handled actor/time, thread, preview

## G2-13-024-054  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:28-35 lists MySQL inbound_email from workflow
- vNext now: src/db/schema/inbound-mail.ts:15-37 new PostgreSQL inbound_mail_messages independent of recruiter reply bridge
- Fix: Define retention/source-of-truth mapping, ingestion migration and distinct routing/triage states
