# Work packet (wave 2): edit src/modules/auth/runtime.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/learner-verification.md

## G2-20-018-028  [P2] GAP  facet F15  effort S
- Legacy: Legacy OTP persisted, delivery delegated to SMS service `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/VerificationServiceImpl.java:35-47`
- vNext now: New SMS Exotel and email ZeptoMail runtime providers `src/modules/auth/runtime.ts:3-26`
- Fix: Compare actual DLT/Zepto template, recipient and timing

## G2-20-018-035  [P2] GAP  facet F21  effort S
- Legacy: Legacy optional TestOtpService and SMS gateway `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/VerificationServiceImpl.java:65-80`
- vNext now: New Exotel/ZeptoMail, dev-only test code `src/modules/auth/runtime.ts:3-26`
- Fix: Audit provider webhook, delivery and dev/prod env segregation
