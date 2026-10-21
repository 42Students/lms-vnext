# Work packet (wave 2): edit src/db/schema/placement-public-enquiries.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-4-026-086  [P2] GAP  facet F22  effort M
- Legacy: Legacy recruiter_invite_code stores hashed token/email/code, usedAt, wrong tries (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteCodeService.java:72-84,100-113`)
- vNext now: Enquiry challenge UUID, college ID, codeHash, attempts, verifiedAt/expiry indexes (`src/db/schema/placement-public-enquiries.ts:17-38`)
- Fix: Plan token-scoped old rows to college-scoped new challenges; preserve replay guarantees.
