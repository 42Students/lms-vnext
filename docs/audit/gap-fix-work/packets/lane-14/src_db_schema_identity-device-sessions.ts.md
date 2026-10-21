# Work packet: edit src/db/schema/identity-device-sessions.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-18-031-077  [P1] GAP  facet F21  effort M
- Legacy: Legacy signup/login uses SmsService/test OTP and session token version; LearnerController.java:338-391,674-800;FacultyController.java:421-480;AdminUserLifecycleController.java:178-198
- vNext now: vNext first-party identity provider with per-device session DB and OTP flow; identity-provisioning.ts:36-64;identity-device-sessions.ts:20-68
- Fix: Verify provider SMS delivery, identity collision, session revocation timing and no wrong-college session leak

## G2-18-031-082  [P1] GAP  facet F22  effort M
- Legacy: Legacy learner/faculty suspendedAt/reason and tokenVersion separate from person type; Learner.java:21-73;Faculty.java:25-64
- vNext now: vNext collegeMemberships suspendedAt/reason, platformStatus, identity_device_sessions with revokedAt; memberships.ts:17-50;users.ts:20-24;identity-device-sessions.ts:20-68
- Fix: Document scope of suspension/OTP invalidation and single account with multiple college memberships
