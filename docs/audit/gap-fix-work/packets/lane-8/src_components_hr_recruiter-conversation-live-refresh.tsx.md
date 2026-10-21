# Work packet: edit src/components/hr/recruiter-conversation-live-refresh.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-messages.md

## G2-13-004-061  [P1] GAP  facet F19  effort M
- Legacy: Old polling hits lightweight version pulse every 4s only on changes reload (`docs/legacy-source/frontend/src/components/tpo/ui/useLivePulse.js:11-43`)
- vNext now: New polling calls full router.refresh every 4s when visible/idle (`src/components/hr/recruiter-conversation-live-refresh.tsx:8-23`)
- Fix: Use lightweight version endpoint before full RSC refresh to reduce DB/network and stale revalidation.

## G2-13-004-031  [P2] GAP  facet F08  effort M
- Legacy: Legacy stale refresh banner says This refresh failed. Showing the last successful inbox (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:167-170`)
- vNext now: New polling refresh has no explicit stale inbox banner; server content refreshes (`src/components/hr/recruiter-conversation-live-refresh.tsx:8-23`)
- Fix: Surface unobtrusive stale status on failing revalidation.
