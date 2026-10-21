# Work packet (wave 2): edit src/modules/placements/tpo-drive-form-error-copy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u015-job-eligibility.md

## G2-16-015-032  [P3] GAP  facet F18  effort S
- Legacy: JobEligibility.java:36-39 `verifiedMarksOnly` explicitly described as verified college marks.
- vNext now: tpo-drive-form-error-copy.ts:41-43 labels minCgpa/percentage/passing years; missing verifiedMarksOnly label.
- Fix: Use `Verified marks only` and missing/unverified helper copy.
