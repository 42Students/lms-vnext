# Work packet (wave 2): edit src/modules/admin-ui/super-admin-placement-student-search-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u002-student-placement-lookup.md

## G2-15-002-028  [P2] GAP  facet F06  effort S
- Legacy: Search threshold at least 2 trimmed characters, shorter clears options without error (`StudentPlacementLookup.js:70-82`).
- vNext now: Requires 3..150 characters in HTML and Zod query parser (`admin/placements/student-lookup/page.tsx:33-38`; `super-admin-placement-student-search-model.ts:5-15`).
- Fix: Accept >=2 characters, preserve backend upper bound and helpful client guidance.

## G2-15-002-054  [P2] GAP  facet F12  effort M
- Legacy: Candidate trigger min2 chars, 300ms debounce, max10 results; selection numeric learnerId (`StudentPlacementLookup.js:45-60,70-92`).
- vNext now: Trigger min3 max150, GET submit, 15 matches; IDs are UUID membership (`super-admin-placement-student-search-model.ts:5-15`; `college-placement-student-lookup-model.ts:1-10`; `college-placement-student-lookup-service.ts:14-25`).
- Fix: Match threshold/timing/count; translate identity mapping explicitly.
