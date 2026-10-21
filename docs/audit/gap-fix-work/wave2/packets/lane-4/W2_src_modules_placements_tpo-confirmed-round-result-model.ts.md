# Work packet (wave 2): edit src/modules/placements/tpo-confirmed-round-result-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md

## G2-12-022-050  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/ResultsEntryModal.jsx:11-16 — outcome labels Pass, Not cleared, Waitlist, Absent
- vNext now: src/modules/placements/tpo-confirmed-round-result-model.ts:11-16 — Shortlisted for next round, Not selected in this round, On hold / waitlisted, Absent from round
- Fix: Align vocabulary in result editor and outcome chips
