# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-16/u031-placements-end-to-end.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u031-placements-end-to-end.md

## G2-16-031-077  [P2] GAP  facet F17  effort M
- Legacy: rounds/[roundId]/results/page.tsx:75-92 uses section per learner and editable details expansion.
- vNext now: tpo/drives/[jobId].js:462-463 RoundsTab has onShowRound route to Applicants tab.
- Fix: Keep keyboard-operable jump from round result to exact applicant list selection, with focus target.
