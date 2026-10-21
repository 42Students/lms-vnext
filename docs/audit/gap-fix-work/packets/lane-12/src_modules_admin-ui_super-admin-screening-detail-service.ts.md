# Work packet: edit src/modules/admin-ui/super-admin-screening-detail-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u021-application-screening-entity.md

## G2-13-021-005  [P1] GAP  facet F03  effort M
- Legacy: Legacy badges PENDING/COMPLETED/FAILED, overall score 0..1. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:31-46`
- vNext now: vNext pending/hold/rejected/shortlisted, no score. `src/modules/admin-ui/super-admin-screening-detail-service.ts:13-34`
- Fix: Distinguish automated screening status from manual decision.

## G2-13-021-006  [P1] GAP  facet F03  effort M
- Legacy: Legacy matchedSkills,missingSkills JSON for visual match details. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:61-72`
- vNext now: vNext detail only application/eligibility/screening decision, no skill chips. `src/modules/admin-ui/super-admin-screening-detail-service.ts:13-34`
- Fix: Show matched and missing skills without ranking protected traits.

## G2-13-021-007  [P1] GAP  facet F03  effort M
- Legacy: Legacy human explanation, partial score, excluded attribute reasons. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:75-102`
- vNext now: vNext omits confidence and exclusion explanations. `src/modules/admin-ui/super-admin-screening-detail-service.ts:27-35`
- Fix: Preserve score provenance/partial warning UI.
