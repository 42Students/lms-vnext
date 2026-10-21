# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-16/u015-job-eligibility.md

7 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u015-job-eligibility.md

## G2-16-015-003  [P2] GAP  facet F02  effort M
- Legacy: JobEligibility.java:17-43 fields grouped by identity, academics, verification, gender.
- vNext now: validation.ts:557-627 schema groups IDs, academics, gap/backlogs/evidence.
- Fix: Place form groups in same sequence including separate diversity-driving field if approved.

## G2-16-015-006  [P2] GAP  facet F03  effort S
- Legacy: JobEligibility.java:39 verifiedMarksOnly Boolean.
- vNext now: validation.ts:622-626 requireVerifiedEvidence and missingEvidencePolicy.
- Fix: Use legacy label for verified-only toggle and explain stricter policy interaction.

## G2-16-015-013  [P2] GAP  facet F06  effort M
- Legacy: JobEligibility.java:42 gender free-form String; no enum/range.
- vNext now: validation.ts:557-628 strict object rejects gender.
- Fix: If gender policy retained, use vetted enum and explicit validation; don't silently ignore imported value.

## G2-16-015-025  [P2] GAP  facet F12  effort M
- Legacy: JobEligibility.java:26-34 nullable percentages allow unknown marks with verified-only policy conditional.
- vNext now: validation.ts:623-626 missingEvidencePolicy=ALLOW_WITH_FLAG, REQUIRE_COMPLETE extra.
- Fix: Map missing marks across toggles; distinguish NOT_PROVIDED vs FAIL and verified absence.

## G2-16-015-027  [P2] GAP  facet F13  effort M
- Legacy: JobEligibility.java:14-16 unknown historical keys ignored.
- vNext now: validation.ts:627-628 strict rejection causes error on old payload.
- Fix: Offer legacy-input adapter or explicit recoverable parse warning.

## G2-16-015-035  [P2] GAP  facet F20  effort S
- Legacy: JobEligibility.java:14-16 unknown legacy keys ignored.
- vNext now: validation.ts:627-628 strict rejects, unlike old.
- Fix: Handle extra historical keys before applying strict typed shape.

## G2-16-015-010  [P3] GAP  facet F05  effort S
- Legacy: JobEligibility.java:18-25 lists represent set membership, no sort/page.
- vNext now: validation.ts:559-572,616-621 arrays deduplicated, capped100/30.
- Fix: Retain legacy selection values but document new caps; no tabular pagination in DTO.
