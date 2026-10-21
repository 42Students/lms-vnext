# Work packet (wave 3): edit src/modules/placements/college-stage-action-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-application-status-validator.md

## G2-13-010-007  [P1] MISSING  facet F03  effort L
- Legacy: HIRED is resumable to OFFERED for erroneous hiring reversal (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:52-57`)
- vNext now: New stage map HIRED:[] terminal; no return to OFFERED (`src/modules/placements/college-stage-action-model.ts:24-32`)
- Fix: Provide explicit audited reversal path with offer/joined outcome reversal, not freeform move.

## G2-13-010-019  [P1] MISSING  facet F05  effort L
- Legacy: Old HIRED next OFFERED for audited correction (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:52-57`)
- vNext now: New HIRED terminal (`src/modules/placements/college-stage-action-model.ts:31-31`)
- Fix: Implement explicit reversal service with joining-outcome corrections.

## G2-13-010-062  [P1] MISSING  facet F23  effort L
- Legacy: Old API user/admin can move back to APPLIED, to ASSESSMENT after INTERVIEW (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:21-32`)
- vNext now: New stage service removes these corrections, with separate REINSTATE only (`src/modules/placements/college-stage-action-model.ts:24-32`)
- Fix: Expose explicitly audited correction transitions for exceptional regressions.
