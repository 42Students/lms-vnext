# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-16/u015-job-eligibility.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u015-job-eligibility.md

## G2-16-015-005  [P1] MISSING  facet F03  effort L
- Legacy: JobEligibility.java:42 gender field diversity-only.
- vNext now: validation.ts:557-627 no gender in policy.
- Fix: Implement controlled diversity-only gender criterion with privacy review; never export to employers.
