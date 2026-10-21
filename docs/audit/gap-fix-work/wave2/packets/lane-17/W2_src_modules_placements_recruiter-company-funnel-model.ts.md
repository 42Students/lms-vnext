# Work packet (wave 2): edit src/modules/placements/recruiter-company-funnel-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-company.md

## G2-13-001-020  [P2] GAP  facet F04  effort S
- Legacy: Funnel percentages are nearest integer of first stage count (`docs/legacy-source/frontend/src/pages/recruiter/company.js:22-32`)
- vNext now: Bar percentage retains fractional value and label is percent of previous stage (`src/modules/placements/recruiter-company-funnel-model.ts:6-14`)
- Fix: Use Math.round(count/applied*100) for legacy of-all label and bar; keep prior-step insight separately if intentional.

## G2-13-001-072  [P2] GAP  facet F18  effort S
- Legacy: Legacy first funnel stage label `Applied`; assessment label `Test`; hired label `Placed` (`docs/legacy-source/frontend/src/pages/recruiter/company.js:17-18`)
- vNext now: New `Shared applicants`, `Assessment`, `Hired` (`src/modules/placements/recruiter-company-funnel-model.ts:4-5`)
- Fix: Copy exact stage label catalogue except deliberate privacy terminology changes.
