# Work packet: edit src/modules/people/identity-provisioning.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-18-031-077  [P1] GAP  facet F21  effort M
- Legacy: Legacy signup/login uses SmsService/test OTP and session token version; LearnerController.java:338-391,674-800;FacultyController.java:421-480;AdminUserLifecycleController.java:178-198
- vNext now: vNext first-party identity provider with per-device session DB and OTP flow; identity-provisioning.ts:36-64;identity-device-sessions.ts:20-68
- Fix: Verify provider SMS delivery, identity collision, session revocation timing and no wrong-college session leak
