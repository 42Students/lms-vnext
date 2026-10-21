# Work packet: edit src/modules/people/identity-provisioning-repository.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/user.md

## G2-1-021-023  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:140-160: exact duplicates errors 'Username already exists...', 'Email already exists...', 'Phone number already exists...'.
- vNext now: src/modules/people/identity-provisioning-repository.ts:82-113: generic IDENTITY_COLLISION error for UID/phone/email conflicts.
- Fix: Render field-specific safe collision copy rather than single generic error if registration requires it.

## G2-1-021-026  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:487-488: POST registration returns 200 wrapped Response OK with user entity, no toast.
- vNext now: src/modules/people/identity-provisioning-repository.ts:16-23: returns provision summary with existed/platformStatus.
- Fix: Align post-registration confirmation/redirect while excluding credentials.
