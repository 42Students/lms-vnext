# Work packet: edit src/modules/inbound-mail/message-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md, docs/audit/gap2/lane-8/l13-u024-superadmin-inbound-mail-controller.md

## G2-10-009-023  [P1] MISSING  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:19-28` status details distinguish POSTED/STORED/NO_THREAD/WRONG_SENDER/NOT_VERIFIED/EMPTY/ACCESS_ENDED/FAILED
- vNext now: `src/modules/inbound-mail/message-model.ts:8-12` and `src/modules/inbound-mail/triage-transition-model.ts:1-18` support only NEW/TRIAGED/RESOLVED
- Fix: Store delivery/routing outcome orthogonally to staff triage status

## G2-13-024-007  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:19-28 eight specific reply-routing badge words
- vNext now: src/modules/inbound-mail/message-model.ts:8-12, src/db/schema/inbound-mail.ts:26-35 only NEW/TRIAGED/RESOLVED
- Fix: Persist kind and routing status separately and display exact legacy badges

## G2-10-009-042  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:45-53` unknown show defaults to OPEN; page negative clamped0
- vNext now: `src/modules/inbound-mail/message-model.ts:2-7` strict status enum and page1..10000; `src/app/(authenticated)/admin/inbound-mail/page.tsx:25-27` invalid warning
- Fix: Translate legacy show aliases and clamp/validate with appropriate error copy
