# Work packet (wave 2): edit src/components/admin/inbound-mail-list.tsx

28 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md

## G2-10-009-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:84-104` Ant Table four columns Received, From, Email, Status
- vNext now: `src/components/admin/inbound-mail-list.tsx:43-67` article/card rows display subject, from/to, preview, date, explicit Read button
- Fix: Use four-column desktop table and mobile equivalent preserving density

## G2-10-009-007  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:128-146` Drawer from right width640 with extra action above content
- vNext now: `src/components/admin/inbound-mail-list.tsx:68-89` shared Drawer footer actions after content, no explicit width640
- Fix: Match 640px right drawer and header action position

## G2-10-009-012  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:84-86` Received column shows compact date
- vNext now: `src/components/admin/inbound-mail-list.tsx:60` time appears at article bottom with IST suffix
- Fix: Move received date to first table column and format D MMM, h:mm A

## G2-10-009-014  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:92-95` subject bold or (no subject) plus one-line preview max520 ellipsis
- vNext now: `src/components/admin/inbound-mail-list.tsx:55-59` (No subject), 2-line safe plain-body preview
- Fix: Use lowercase (no subject), one-line preview, 520px clipping

## G2-10-009-017  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:125` row click opens drawer anywhere on row
- vNext now: `src/components/admin/inbound-mail-list.tsx:62` Read message button required
- Fix: Restore row click and keyboard-accessible row trigger

## G2-10-009-020  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:140-143` Drawer displays Loading... or full body/preview with prewrap
- vNext now: `src/components/admin/inbound-mail-list.tsx:84-88` shows preloaded body truncated at 15000
- Fix: Fetch full message on open and show loading/failure state

## G2-10-009-022  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:30` date formatted D MMM, h:mm A using dj helper
- vNext now: `src/components/admin/inbound-mail-list.tsx:60` uses toLocaleString en-IN Asia/Kolkata with explicit IST
- Fix: Format dates exactly D MMM, h:mm A; keep timezone consistent

## G2-10-009-024  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:74-76` full body_text returned on GET one
- vNext now: `src/modules/inbound-mail/admin-service.ts:50-54` list loads entire bodyPlain and `src/components/admin/inbound-mail-list.tsx:86` clips it at 15000
- Fix: Implement detail-only body fetch to avoid huge list payload and preserve full text

## G2-10-009-035  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:120-127` search-empty shows Nothing waiting to be read (OPEN) or No emails (others)
- vNext now: `src/components/admin/inbound-mail-list.tsx:44-47` generic No inbound messages match these filters
- Fix: Use segmented-view-specific empty captions

## G2-10-009-040  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:128-146` Drawer state open object created with loading true then fetched
- vNext now: `src/components/admin/inbound-mail-list.tsx:68-89` selected row only, no detail fetch
- Fix: Add on-open detail fetch and prevent stale-drawer overwrite

## G2-10-009-054  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:128-146` width640 Drawer includes subject, Sender, To/received and body preview
- vNext now: `src/components/admin/inbound-mail-list.tsx:68-89` Drawer with separate From/To/Received, 15000-char cap
- Fix: Match 640px drawer size and complete content order

## G2-10-009-056  [P2] MISSING  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:139-143` Drawer distinguishes warning Could not load this email from body rendering
- vNext now: `src/components/admin/inbound-mail-list.tsx:84-89` no detail fetch/error branch
- Fix: Render retryable body-load warning inside Drawer

## G2-10-009-058  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:138-140` status tag shown only when status != STORED
- vNext now: `src/components/admin/inbound-mail-list.tsx:56` triage status shown always, no routing tag
- Fix: Restore routing status chip condition in Drawer

## G2-10-009-068  [P2] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:128-146` drawer shows full body to Super Admin only
- vNext now: `src/components/admin/inbound-mail-list.tsx:86` clips body to 15000, `src/modules/inbound-mail/admin-service.ts:60-64` gates global Super Admin
- Fix: Keep full-body authorization while avoiding eager exposure in list

## G2-10-009-078  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:123-124` Empty state Nothing waiting to be read for OPEN, No emails otherwise
- vNext now: `src/components/admin/inbound-mail-list.tsx:44-47` generic No inbound messages match these filters
- Fix: Preserve exact view-specific empty states

## G2-10-009-079  [P2] MISSING  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:69-71` drawer open.loading then fallback warning
- vNext now: `src/components/admin/inbound-mail-list.tsx:68-89` body populated from list, no loading state
- Fix: Show detail spinner, empty/failure/body fallback

## G2-10-009-089  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:123-126` Ant Table middle density; no explicit mobile transforms in file
- vNext now: `src/components/admin/inbound-mail-list.tsx:50-64` responsive stacked articles at <=767
- Fix: Preserve four columns on desktop and readable stacked mobile parity

## G2-10-009-094  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:43-46` sender name/tag content as visual emphasis
- vNext now: `src/components/admin/inbound-mail-list.tsx:58-60` plain text From/To, no semantic sender role
- Fix: Add semantic recruiter/student badges and college suffix

## G2-10-009-100  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:124` Nothing waiting to be read, No emails
- vNext now: `src/components/admin/inbound-mail-list.tsx:46` No inbound messages match these filters
- Fix: Use status-aware empty copy

## G2-10-009-101  [P2] MISSING  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:139` Couldn't load this email
- vNext now: `src/components/admin/inbound-mail-list.tsx:68-89` no detail error
- Fix: Add exact detail warning

## G2-10-009-104  [P2] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:86-88`,91 cuts inbound full text at 200000, reply body at4000, preview1000
- vNext now: `src/components/admin/inbound-mail-list.tsx:59` safeInboundPreview 180 and `src/components/admin/inbound-mail-list.tsx:86` clips body to 15000
- Fix: Document intentional preview/body caps; preserve full detail

## G2-10-009-118  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V225__inbound_mail_inbox.sql:6` body_text MEDIUMTEXT stores 200000 char received email
- vNext now: `src/db/schema/inbound-mail.ts:25` plain text no max declared, `src/components/admin/inbound-mail-list.tsx:86` clips render to15000
- Fix: Expose full body detail and cap transport consistently

## G2-10-009-018  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:128-138` Drawer title subject and To addr · received date
- vNext now: `src/components/admin/inbound-mail-list.tsx:68-85` titled subject and structured From/To/Received descriptors
- Fix: Match original Drawer heading/metadata inline presentation

## G2-10-009-026  [P3] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:38-45` sender fallback Unknown sender when fromAddress missing
- vNext now: `src/components/admin/inbound-mail-list.tsx:58` From {row.fromAddress} without fallback
- Fix: Render Unknown sender for missing/malformed sender identity

## G2-10-009-027  [P3] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:92-95` empty subject fallback (no subject) lowercase
- vNext now: `src/components/admin/inbound-mail-list.tsx:55`,68 uses (No subject) capital N
- Fix: Use exact legacy fallback case

## G2-10-009-037  [P3] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:51-57` defaults OPEN, q empty, page0, drawer closed, busy false
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:25` default NEW, q empty, page1; `src/components/admin/inbound-mail-list.tsx:17-21` drawer closed
- Fix: Map state defaults faithfully despite 0/1-based internal page difference

## G2-10-009-084  [P3] GAP  facet F14  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:140-143` full body is plain text and not downloadable
- vNext now: `src/components/admin/inbound-mail-list.tsx:84-88` displays plain text capped at 15000; no download
- Fix: Preserve full readable body without inventing attachment handling

## G2-10-009-098  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:92` subject fallback (no subject)
- vNext now: `src/components/admin/inbound-mail-list.tsx:55` (No subject)
- Fix: Use lowercase fallback
