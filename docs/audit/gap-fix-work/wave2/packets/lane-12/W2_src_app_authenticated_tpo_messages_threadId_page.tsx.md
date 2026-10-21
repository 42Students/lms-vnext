# Work packet (wave 2): edit src/app/(authenticated)/tpo/messages/[threadId]/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-3/l11-u016-tpo-messages.md

## G2-19-031-008  [P2] GAP  facet F02  effort L
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:350-389` — Right pane shows recruiter header, bubbles, send composer inline.
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:29-50` — New route replaces inline conversation pane with separate page.
- Fix: Build responsive inbox detail pane using the same route state.

## G2-19-031-014  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:408-418` — Message bubble attributes teammate name, EMAIL transport and Seen flag.
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:40-46` — Bubbles show generic You/Recruiter and Seen, but not teammate name/email marker.
- Fix: Expose senderName and via to detail renderer.

## G2-19-031-015  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:371-374` — Access ended banner gives settings/reactivation guidance.
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:29-50` — No equivalent banner next to new detail composer.
- Fix: Show grant ended warning and disable composer before submit.

## G2-19-031-096  [P2] GAP  facet F16  effort L
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:350-352` — Phone inbox uses All conversations back arrow and single pane.
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:29-50` — New thread route has Back to messages, not inline pane.
- Fix: One-pane phone state, responsive desktop master/detail.

## G2-11-016-019  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:404-417`
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:30-48`
- Fix: Legacy author identity You only for your own messages and colleague name for other TPO staff; vNext senderType TPO displays You for every staff sender.

## G2-11-016-023  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:128-134`
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:26-32`
- Fix: Legacy wide-screen >=992 auto-opens first unread thread or newest; vNext loads table until explicit row click.

## G2-11-016-044  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:404-417`
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:32-48`
- Fix: Legacy request event quote and recruiter email delivery metadata rendered inline; vNext detail only bubble/send/read and no request quote in shown projection.

## G2-11-016-050  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:128-134`
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:26-30`
- Fix: Legacy auto-opens first unread desktop and refreshes live; vNext explicit navigation to thread detail.

## G2-11-016-051  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:249-251`
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:49-50`
- Fix: Legacy accessEnded shows no-send warning; vNext reply component handles blocked permissions with different content.

## G2-11-016-053  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:371-403`
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:30-34`
- Fix: Legacy Choose a conversation or Start a conversation with New message empty right pane; vNext no right pane and empty thread No messages yet.

## G2-11-016-059  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:404-415`
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:40-49`
- Fix: Legacy rendered via EMAIL tag and read receipts, vNext only Seen; email-origin metadata not visible.

## G2-19-031-102  [P3] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:385-389` — Legacy role=log, aria-live=polite, aria-busy.
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:32-48` — New bubble list does not show explicit live log.
- Fix: Wrap messages in accessible log with busy flag.
