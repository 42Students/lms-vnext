# Work packet: edit src/modules/inbound-mail/admin-service.ts (part 2 of 2)

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l13-u024-superadmin-inbound-mail-controller.md

## G2-13-024-034  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:82-85 current principal handled_by captured
- vNext now: src/modules/inbound-mail/admin-service.ts:76-97 mutation checks request context SUPER_ADMIN and version but no handler actor storage
- Fix: Write actor user ID and status audit event for every triage action

## G2-13-024-035  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:43-54 POSTED is immutable from manual DONE category
- vNext now: src/modules/inbound-mail/admin-service.ts:86-97 uses NEW/TRIAGED/RESOLVED state alone
- Fix: Keep orthogonal POSTED outcome and disallow manual handling

## G2-13-024-041  [P1] GAP  facet F15  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicInboundEmailController.java:28-33 public signed worker receiver only accepts shared secret
- vNext now: src/modules/placements/recruiter-message-email-inbound-service.ts:1-55 alternate HMAC bridge; src/modules/inbound-mail/admin-service.ts:24-55 read-only inbox adapter
- Fix: Provide authenticated, deduplicated generic inbox ingest for all 42lms.com addresses, not recruiter replies alone

## G2-13-024-024  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:84-86 update missing id returns HTTP404
- vNext now: src/modules/inbound-mail/admin-service.ts:90-97 stale/missing treated identically STALE; src/app/api/admin/inbound-mail/status/route.ts:18-19 HTTP409
- Fix: Differentiate not-found from optimistic conflict without leaking unauthorized identifiers

## G2-13-024-026  [P2] MISSING  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:139-143 per-email error 'Couldn't load this email'
- vNext now: src/modules/inbound-mail/admin-service.ts:50-55 no individual fetch operation
- Fix: Add detail read error banner inside drawer while retaining metadata

## G2-13-024-027  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:80-87 responds JSON id and done boolean
- vNext now: src/modules/inbound-mail/admin-service.ts:90-97 responds id,status,version and UPDATED/STALE discriminator
- Fix: Translate success payload and show user feedback after Mark done/reopen
