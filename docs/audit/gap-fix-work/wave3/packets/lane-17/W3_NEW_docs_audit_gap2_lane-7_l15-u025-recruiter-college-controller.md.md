# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-7/l15-u025-recruiter-college-controller.md

5 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l15-u025-recruiter-college-controller.md

## G2-15-025-005  [P1] MISSING  facet F02  effort L
- Legacy: LBE/service/tpo/RecruiterCollegeOverviewService.java:22-31,106-115 overview aggregate cards: rounded totals, branch and CGPA bands.
- vNext now: V/modules/placements/recruiter-company-overview-model.ts:8-26 active/closed/total own company jobs, recent list only.
- Fix: Implement privacy-safe college total/by-branch/CGPA band cards.

## G2-15-025-031  [P1] MISSING  facet F12  effort L
- Legacy: LBE/service/tpo/RecruiterCollegeOverviewService.java:37-50 MIN_GROUP10 and rounded to nearest5.
- vNext now: V/modules/placements/recruiter-company-overview-model.ts:8-26 no learner count/rounding.
- Fix: Apply suppression and round-to-five before returning recruiter aggregation.

## G2-15-025-032  [P1] MISSING  facet F12  effort L
- Legacy: LBE/service/tpo/RecruiterCollegeOverviewService.java:84-103 CGPA only VERIFIED academic, display band if cohort >=10 and per band >=10.
- vNext now: V/modules/placements/recruiter-company-overview-model.ts:21-26 no verified CGPA aggregation.
- Fix: Use verified-only academic evidence with threshold before rendering bands.

## G2-15-025-047  [P1] MISSING  facet F19  effort L
- Legacy: LBE/service/tpo/RecruiterCollegeOverviewService.java:65-103 requires reading student totals per department and verified academic bands.
- vNext now: V/modules/placements/recruiter-company-overview-model.ts:8-26 pure array filtering published/closed own jobs.
- Fix: Add grouped aggregate SQL with suppression at DB boundary and indexed academic evidence query.

## G2-15-025-056  [P1] MISSING  facet F23  effort L
- Legacy: LBE/service/tpo/RecruiterCollegeOverviewService.java:22-31 privacy rounded college demographic metrics.
- vNext now: V/modules/placements/recruiter-company-overview-model.ts:21-26 only company drive metrics, demographics dropped.
- Fix: Restore privacy-safe overview or cite explicit owner decision removing it.
