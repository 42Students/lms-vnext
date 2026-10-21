# Work packet (wave 2): edit src/modules/placements/tpo-home-legacy-rows.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l11-u014-tpo-home.md

## G2-11-014-019  [P2] GAP  facet F04  effort M
- Legacy: Legacy Team row asks/mentions/unread and overdue prioritization, href /tpo/messages?tab=team&filter=me (homeRows.js:109-124).
- vNext now: vNext asks/unread, teamMentions always null, no overdue count and links /tpo/team?filter=me (tpo/home/page.tsx:113-116,140-142; tpo-home-legacy-rows.ts:66-71).
- Fix: Restore mention and overdue display or document dedicated Team route functional change.

## G2-11-014-049  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact date/hello/needLine structure and text grammar from dj/homeRows (home.js:63-68; homeRows.js:126-137).
- vNext now: vNext same greeting words/format but needLine counts rows and moved after metrics (tpo/home/page.tsx:175-199; tpo-home-legacy-rows.ts:19-25).
- Fix: Restore needLine formula and adjacency, exact punctuation.

## G2-11-014-055  [P2] GAP  facet F20  effort M
- Legacy: Legacy `nextUp` priority returns top needsYou; needLine count max cards/attention (homeRows.js:29-54,126-137).
- vNext now: vNext urgency built from operations and tasks, needLine count solely attention rows (tpo-home-next-up.ts:23-46; tpo-home-legacy-rows.ts:19-25).
- Fix: Keep priority and grammar consistent when multiple tasks map to one row.
