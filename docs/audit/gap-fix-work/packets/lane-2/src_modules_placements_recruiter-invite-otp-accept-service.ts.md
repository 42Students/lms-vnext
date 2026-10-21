# Work packet: edit src/modules/placements/recruiter-invite-otp-accept-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l13-u025-recruiter-pending-invite-controller.md

## G2-13-025-013  [P1] GAP  facet F06  effort M
- Legacy: Authenticated accept requires collegeId only, no body/code `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:20-26`
- vNext now: Public OTP accept requires token/code plus authenticated email `src/modules/placements/recruiter-invite-otp-accept-service.ts:28-53`
- Fix: Use consent-only authenticated endpoint; no second email OTP.

## G2-13-025-015  [P2] GAP  facet F07  effort S
- Legacy: Missing pending grant throws Not found `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:303-305,324-326`
- vNext now: Public token acceptance rejects stale token by generic invalid `src/modules/placements/recruiter-invite-otp-accept-service.ts:108-127`
- Fix: Preserve non-enumerating not-found for any stale/foreign college.
