# Work packet: edit src/modules/auth/login-repository.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/recruiter.md

## G2-15-016-017  [P1] GAP  facet F05  effort M
- Legacy: Separate active lookups by phone/email/id ignoring deleted rows. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RecruiterRepository.java:21-33`)
- vNext now: New shared users lookup phoneE164/email, recruiterGrant activation separate. (`src/modules/auth/login-repository.ts:35-49`)
- Fix: Enforce active recruiter+valid grant for role-specific login, not merely active user.

## G2-15-016-032  [P1] GAP  facet F10  effort M
- Legacy: Lookups contactMail/mobile/id and active filters. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RecruiterRepository.java:19-33`)
- vNext now: New phone/email unified users, then profile/grant checks. (`src/modules/auth/login-repository.ts:35-50`)
- Fix: Trace exact login via recruiter role and compare invalid/archived account errors.

## G2-15-016-042  [P1] GAP  facet F12  effort M
- Legacy: Suspended recruiter denied globally. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:86-89`)
- vNext now: Login grant checks active profile and grant scope. (`src/modules/auth/login-repository.ts:93-151`)
- Fix: Verify suspended platform user cannot enter learner/other roles or old recruiter privileges.

## G2-15-016-025  [P2] GAP  facet F07  effort M
- Legacy: Soft-deleted phone lookup distinct from active. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RecruiterRepository.java:18-22`)
- vNext now: New user phone lookup ignores recruiter profile archive until later. (`src/modules/auth/login-repository.ts:35-40`)
- Fix: Return clean suspended/retired-account reason, avoid identity enumeration.
