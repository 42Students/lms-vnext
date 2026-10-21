# Work packet: edit src/modules/placements/recruiter-company-funnel-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-company.md

## G2-13-001-051  [P1] GAP  facet F12  effort S
- Legacy: Funnel labels Applied, Shortlisted, Test, Interview, Offered, Placed (`docs/legacy-source/frontend/src/pages/recruiter/company.js:17-32`)
- vNext now: New labels Shared applicants, Shortlisted, Assessment, Interview, Offered, Hired (`src/modules/placements/recruiter-company-funnel-model.ts:4-5`)
- Fix: Restore exact legacy labels where metrics are semantically equal; mark semantic change explicitly.

## G2-13-001-076  [P1] GAP  facet F20  effort S
- Legacy: Legacy `funnelSteps` treats invalid/missing counts as zero and protects 0 denominator (`docs/legacy-source/frontend/src/pages/recruiter/company.js:22-32`)
- vNext now: New model clamps negative/fractional percent to 0..100 (`src/modules/placements/recruiter-company-funnel-model.ts:6-14`)
- Fix: Test negative/backward funnel stage values; do not silently saturate if legacy diagnostic count matters.
