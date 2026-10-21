# Work packet: NEW / MISSING items from docs/audit/gap2/lane-16/u015-job-eligibility.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u015-job-eligibility.md

## G2-16-015-004  [P1] GAP  facet F03  effort M
- Legacy: JobEligibility.java:18 branches field list.
- vNext now: validation.ts:557-572 program/cohort/section UUIDs, no branches list.
- Fix: Show department/branch multi-select and map normalized department scope; retain free-text CSE matching.

## G2-16-015-014  [P2] GAP  facet F07  effort M
- Legacy: JobEligibility.java:14-16 ignoreUnknown JSON fields for backward compatibility.
- vNext now: validation.ts:627-628 .strict() rejects unrecognized keys.
- Fix: Normalize legacy alias keys before strict validation, show field-specific migration error.
