# Work packet: edit src/modules/placements/recruiter-today-week-events-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-home.md

## G2-13-002-018  [P1] GAP  facet F04  effort M
- Legacy: Folds round+matching slot on job/day/title and counts slots (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:20-33`)
- vNext now: New lists individual SLOT and ROUND event items (`src/modules/placements/recruiter-today-week-events-model.ts:19-28`)
- Fix: Fold before sort/limit, avoid duplicate-looking weekly rows.
