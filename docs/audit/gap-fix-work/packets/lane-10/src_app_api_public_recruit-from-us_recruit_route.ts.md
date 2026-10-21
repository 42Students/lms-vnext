# Work packet: edit src/app/api/public/recruit-from-us/recruit/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-4-026-031  [P2] GAP  facet F07  effort S
- Legacy: Missing body returns BODY_REQUIRED/`Details are required` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:69-76`)
- vNext now: Malformed body returns COULD_NOT_SEND_ENQUIRY (`src/app/api/public/recruit-from-us/recruit/route.ts:15-17`)
- Fix: Map required-body problem to exact legacy field/page alert.

## G2-4-026-034  [P2] GAP  facet F07  effort S
- Legacy: Code-specific CODE_REQUIRED/EXPIRED/LOCKED/WRONG_CODE with exact messages (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteCodeService.java:100-113`)
- vNext now: Mapped to COULD_NOT_SEND_ENQUIRY (`src/app/api/public/recruit-from-us/recruit/route.ts:23-27`)
- Fix: Preserve specific OTP errors without leaking sensitive details.
