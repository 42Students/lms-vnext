# Work packet (wave 3): edit src/app/api/placements/jobs/[jobId]/share-preview/export/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l18-u023-learner-eligibility-controller.md

## G2-18-023-071  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerEligibilityController.java:135-137 explicit company preview excludes readiness/debarment/no-show data via ALL_COLUMNS
- vNext now: src/app/api/placements/jobs/[jobId]/share-preview/export/route.ts:11-26 staff shareable shortlist export not a learner self preview
- Fix: Implement preview projection using exact permitted column bands and retention policy.
