# Work packet (wave 3): edit src/modules/placements/learner-job-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md

## G2-18-023-028  [P0] MISSING  facet F11  effort L
- Legacy: Company preview refuses until applicant and shows only shared-column subset, excludes readiness/debarments/no-show by construction; LearnerEligibilityController.java:124-138
- vNext now: No equivalent preview, so no validated column allowlist yet; learner-job-service.ts:41-292
- Fix: Require existing application and server allowlist projection with deny-by-default private fields.

## G2-18-023-010  [P1] MISSING  facet F04  effort L
- Legacy: Company preview returns `preview` row and `columns=ALL_COLUMNS` identical to share link; LearnerEligibilityController.java:124-138
- vNext now: No matching company-preview read established in inspected vNext detail modules; learner-job-service.ts:41-292
- Fix: Add applicant self-preview from same company share projection with TPO column bands and redaction.

## G2-18-023-025  [P1] MISSING  facet F10  effort L
- Legacy: Company preview delegates TpoShareService.rowsFor(...ALL_COLUMNS...,learnerId); LearnerEligibilityController.java:131-138
- vNext now: No source-equivalent share projection reader located in mapped learner-job service; learner-job-service.ts:1-292
- Fix: Reuse exact recruiter-share projection, never fabricate preview from learner's full academic profile.
