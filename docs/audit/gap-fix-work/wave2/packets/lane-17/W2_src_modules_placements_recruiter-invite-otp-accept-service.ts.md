# Work packet (wave 2): edit src/modules/placements/recruiter-invite-otp-accept-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l13-u025-recruiter-pending-invite-controller.md

## G2-13-025-004  [P2] GAP  facet F02  effort M
- Legacy: Controller facade delegates all mutations to transactional inviteService `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:19-29`
- vNext now: Token/OTP flow mixes registration and grant creation `src/modules/placements/recruiter-invite-otp-accept-service.ts:28-46`
- Fix: Keep authenticated consent independent of one-time token acceptance.

## G2-13-025-020  [P2] GAP  facet F09  effort M
- Legacy: Concurrent accept/decline can change only pending status `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:303-331`
- vNext now: Token consume uses transaction and CAS on token `src/modules/placements/recruiter-invite-otp-accept-service.ts:108-127`
- Fix: Guard double submit and use conditional pending status UPDATE.
