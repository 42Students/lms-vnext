# Work packet: edit src/db/schema/placement-public-joins.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u022-tpo-public-link.md, docs/audit/gap2/lane-8/job-slug-generator.md, docs/audit/gap2/lane-8/public-college-join-controller.md

## G2-16-022-035  [P1] GAP  facet F22  effort M
- Legacy: CollegePublicLinkService.java:67-69 college_public_link hash,nonce,post_direct,counts.
- vNext now: placement-public-joins.ts:6-36 hash,scope,expiry,postWithoutApproval,counts, no nonce.
- Fix: Migrate settings and counters; decide token recovery.

## G2-8-010-023  [P1] GAP  facet F11  effort M
- Legacy: Legacy Job.jobSlug globally unique, organization/college stored on Job (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:127-135,220-236`)
- vNext now: New public join scoped by collegeId and optional companyId with unique hash (`src/db/schema/placement-public-joins.ts:6-35`)
- Fix: Use tenant-scoped external job resolution; enforce row-level authorization and company/job association separately

## G2-8-026-036  [P1] GAP  facet F10  effort M
- Legacy: Legacy public link postDirect flag may let public recruiter post without review (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:123-141).
- vNext now: New join audit metadata explicitly bypassesDriveReview:false even if link schema has postWithoutApproval flag (src/modules/placements/public-join/join-service.ts:189-202; src/db/schema/placement-public-joins.ts:19-23).
- Fix: Determine whether post-direct toggle is intentionally retired; ensure published posting review policy matches.
