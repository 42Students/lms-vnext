# Work packet: edit src/modules/placements/college-placement-student-lookup-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u002-student-placement-lookup.md

## G2-15-002-021  [P1] GAP  facet F05  effort L
- Legacy: Search is autocomplete offering up to ten learners, user selects exactly one (`StudentPlacementLookup.js:45-60,88-95,128-144`).
- vNext now: Search returns up to 15 expanded learners, all with application tables and no selection dropdown (`college-placement-student-lookup-model.ts:1-10`; `admin/placements/student-lookup/page.tsx:53-75`).
- Fix: Implement 10-result autocomplete and explicit one-student selection, defer detail queries until selection.
