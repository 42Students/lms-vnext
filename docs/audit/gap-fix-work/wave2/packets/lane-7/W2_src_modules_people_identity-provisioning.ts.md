# Work packet (wave 2): edit src/modules/people/identity-provisioning.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/user.md, docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-1-021-020  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/UserDto.java:12-23: userName/password required @NotBlank <=255; email optional @Email <=255; phone <=20; name/businessTitle <=255.
- vNext now: src/modules/people/identity-provisioning-repository.ts:25-119: normalized contact/UID collision; src/modules/people/identity-provisioning.ts:42-67 delegates input validation, no password.
- Fix: Write field-by-field form parity or approved retirement for username/password; don't silently relax email/phone validations.

## G2-18-031-061  [P2] GAP  facet F15  effort S
- Legacy: Legacy create toast promises phone OTP login; Students.js:509;Faculty.js:408
- vNext now: vNext identity provision does not send an invite/email at onboard; person-onboard-dialog.tsx:106-113;identity-provisioning.ts:36-64
- Fix: Distinguish 'can sign in' from 'sent notification'; update copy only if login provisioning succeeds
