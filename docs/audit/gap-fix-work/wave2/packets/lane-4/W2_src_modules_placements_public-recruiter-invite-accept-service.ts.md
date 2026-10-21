# Work packet (wave 2): edit src/modules/placements/public-recruiter-invite-accept-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/public-recruiter-invite-controller.md, docs/audit/gap2/lane-9/l13-u025-recruiter-pending-invite-controller.md

## G2-3-026-015  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:283-287`
- vNext now: `src/modules/placements/public-recruiter-invite-accept-service.ts:148-149`
- Fix: Legacy JOINED payload contains status,collegeName,signInEmail (and sign-in hint); vNext returns accepted,outcome,signInEmail and reads preview college name for success.

## G2-3-026-059  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:239-240`
- vNext now: `src/modules/placements/public-recruiter-invite-accept-service.ts:121-145`
- Fix: Legacy RECRUITER_INVITE_PENDING TPO bell on pending existing account is absent because vNext skips pending workflow.

## G2-3-026-075  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:270-280`
- vNext now: `src/modules/placements/public-recruiter-invite-accept-service.ts:121-149`
- Fix: Legacy TpoMailService welcome delivery + optional DriveReviewInviteService link are not in vNext transaction; document integrations and post-commit retry semantics.

## G2-13-025-008  [P2] GAP  facet F04  effort S
- Legacy: POST accept returns {ok:true} `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:25-26`
- vNext now: Token accept returns accepted/outcome/signInEmail `src/modules/placements/public-recruiter-invite-accept-service.ts:146-150`
- Fix: Implement stable pending accept response and client refresh.
