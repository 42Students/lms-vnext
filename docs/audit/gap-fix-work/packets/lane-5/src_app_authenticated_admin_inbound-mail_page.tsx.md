# Work packet: edit src/app/(authenticated)/admin/inbound-mail/page.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md, docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md, docs/audit/gap2/lane-8/l13-u024-superadmin-inbound-mail-controller.md

## G2-10-009-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:9-11`,108-114 /superadmin/inbound-mail is global, no selected college
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:16-19` /admin/inbound-mail page title Inbound mail; `src/modules/inbound-mail/admin-service.ts:60-64` denies narrowed org/college scope
- Fix: Make inbox accessible to all authorized Super Admin scope modes or document and migrate deliberate global-only access

## G2-10-009-004  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:12-17` views To read / Posted to conversations / Done / All
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:45-55` substitutes To read / Being handled / Done / All
- Fix: Restore Posted to conversations view backed by original routing outcomes; keep TRIAGED as extra if desired

## G2-10-009-011  [P1] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:12-17` REPLIES Posted to conversations and DONE/ALL segments
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:46-47` status tabs TRIAGED Being handled, RESOLVED Done, ALL
- Fix: Reinstate REPLIES based on mail-routing status, not only triage status

## G2-10-009-059  [P1] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/api/Services/SuperAdminInboundMailService.js:7` GET /api/v1/superadmin/inbound-mail with show,q,page
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:25-28` server listInboundMailForAdmin with status,q,recipient,page
- Fix: Map OPEN/REPLIES/DONE/ALL compound legacy filters to new query contract

## G2-10-009-066  [P1] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:9-11` no college selection; all 42lms.com messages visible
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:18` requires admin-scope.select, `src/modules/inbound-mail/admin-service.ts:62-63` scoped admins denied
- Fix: Make scope behavior explicit in UI, do not show generic access failure

## G2-10-009-071  [P1] MISSING  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:51` REPLIES = status POSTED even if manually marked
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:46` no POSTED view, only TRIAGED
- Fix: Restore posted conversation replies view

## G2-10-009-121  [P1] MISSING  facet F23  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:12-17` REPLIES tab and routing reason chips
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:45-47` TRIAGED tab instead; status reason absent
- Fix: Keep both routing outcome and optional staff triage view

## G2-5-026-004  [P1] GAP  facet F02  effort M
- Legacy: Legacy non-conversation emails appear on Super Admin Inbound mail. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:25-32`
- vNext now: vNext inbox page exists, but inbound bridge does not populate it. `src/app/(authenticated)/admin/inbound-mail/page.tsx:16-19,45-76`
- Fix: Wire same validated source to inbox list before presenting it as live.

## G2-5-026-021  [P1] GAP  facet F09  effort M
- Legacy: Legacy Super Admin handles OTHER and failures in separate inbound mail interface. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:23-32`
- vNext now: vNext has separate triage page, but no generalized receiver operation. `src/app/(authenticated)/admin/inbound-mail/page.tsx:45-76`, `src/modules/inbound-mail/admin-service.ts:57-69`
- Fix: Link persisted inbound events to triage without exposing private messages.

## G2-13-024-006  [P1] MISSING  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:12-17 modes To read, Posted to conversations, Done, All
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:46-47 To read, Being handled, Done, All
- Fix: Replace Being handled tab with Posted to conversations, optionally preserve triage as extra

## G2-13-024-029  [P1] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:128-146 slide-out drawer; POSTED read-only actions
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:73-76 rendered client list/drawer; src/modules/inbound-mail/admin-service.ts:86-97 permits transitions without routing context
- Fix: Enforce read-only for posted messages server-side as well as action visibility

## G2-10-009-042  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:45-53` unknown show defaults to OPEN; page negative clamped0
- vNext now: `src/modules/inbound-mail/message-model.ts:2-7` strict status enum and page1..10000; `src/app/(authenticated)/admin/inbound-mail/page.tsx:25-27` invalid warning
- Fix: Translate legacy show aliases and clamp/validate with appropriate error copy

## G2-13-024-025  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:120-126 fetch failure warning 'Couldn't load inbound mail' and Retry
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:29-33 storage unavailable alert and Retry but general fetch error not equivalent
- Fix: Add recoverable loading/query failure warning separate from missing table
