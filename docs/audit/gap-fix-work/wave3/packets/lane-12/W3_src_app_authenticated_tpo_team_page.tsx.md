# Work packet (wave 3): edit src/app/(authenticated)/tpo/team/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-19-031-029  [P2] MISSING  facet F05  effort L
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:10-13` — Team filters include Drives, Companies, Students, Topics, @ Me and Asks.
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:159-164` — New filters cover Topics, @ Me and Asks, not object categories.
- Fix: Add object thread types and three missing filters.
