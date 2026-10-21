# Work packet: edit src/app/(authenticated)/tpo/messages/[threadId]/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-3/l11-u016-tpo-messages.md

## G2-19-031-003  [P1] GAP  facet F01  effort L
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:18-20` — Recruiter message panel appears on inbox and embedded on drive Discussion.
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:13-30` — Dedicated /tpo/messages/[threadId] page is present; drive embedding not provided here.
- Fix: Embed scoped conversation component in drive Discussion with quotes.

## G2-11-016-032  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:369-369`
- vNext now: `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:18-26`
- Fix: Legacy conversation failed to load inline retry keeping last successful thread; vNext unavailable tables ErrorState or server exception.
