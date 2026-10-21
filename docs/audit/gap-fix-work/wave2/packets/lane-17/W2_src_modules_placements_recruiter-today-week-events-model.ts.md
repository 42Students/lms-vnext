# Work packet (wave 2): edit src/modules/placements/recruiter-today-week-events-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-home.md

## G2-13-002-023  [P2] GAP  facet F05  effort S
- Legacy: This week folds then displays first 8 chronological items (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:20-33`)
- vNext now: New displays first 8 events without folding (`src/modules/placements/recruiter-today-week-events-model.ts:19-28`)
- Fix: Apply fold before eight-item cap.

## G2-13-002-069  [P2] GAP  facet F19  effort S
- Legacy: Old week fetch returns events and fold then eight displayed (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:20-33`)
- vNext now: New max 8 without folding (`src/modules/placements/recruiter-today-week-events-model.ts:19-28`)
- Fix: Fold before cap.

## G2-13-002-071  [P2] GAP  facet F20  effort M
- Legacy: Old slot grouping uses job/date/normalized title (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:20-33`)
- vNext now: New displays distinct slot items (`src/modules/placements/recruiter-today-week-events-model.ts:19-28`)
- Fix: Prevent duplicate events after multi-slot fetch.
