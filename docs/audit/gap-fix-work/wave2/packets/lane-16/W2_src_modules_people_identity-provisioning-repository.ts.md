# Work packet (wave 2): edit src/modules/people/identity-provisioning-repository.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/user.md

## G2-1-021-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:58-60,484-495: POST /api/v1/users/register (also /users/register) creates legacy User.
- vNext now: src/modules/people/identity-provisioning-repository.ts:16-57: canonical identity provision via repository, not direct username/password User entity.
- Fix: Document registration endpoint migration and whether any legacy public client still submits UserDto.

## G2-1-021-020  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/UserDto.java:12-23: userName/password required @NotBlank <=255; email optional @Email <=255; phone <=20; name/businessTitle <=255.
- vNext now: src/modules/people/identity-provisioning-repository.ts:25-119: normalized contact/UID collision; src/modules/people/identity-provisioning.ts:42-67 delegates input validation, no password.
- Fix: Write field-by-field form parity or approved retirement for username/password; don't silently relax email/phone validations.

## G2-1-021-043  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:143,151,159: exact duplicate username/email/phone strings.
- vNext now: src/modules/people/identity-provisioning-repository.ts:93-113: IDENTITY_COLLISION generic internal error.
- Fix: Write specific UI mapping with safe nonenumerating copy.
