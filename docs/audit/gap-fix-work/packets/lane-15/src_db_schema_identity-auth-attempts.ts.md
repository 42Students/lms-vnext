# Work packet: edit src/db/schema/identity-auth-attempts.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/learner-verification.md

## G2-20-018-023  [P1] GAP  facet F11  effort L
- Legacy: Legacy preuser learnerId0 bypasses real account FK `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/VerificationServiceImpl.java:205-248`
- vNext now: New requires existing user FK `src/db/schema/identity-auth-attempts.ts:25-28`
- Fix: Design safe pre-registration identity before challenge creation

## G2-20-018-036  [P1] GAP  facet F22  effort M
- Legacy: Legacy MySQL learner_acct_verification id int, plaintext otp, roll and flags `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerVerification.java:9-35`
- vNext now: New Postgres identity_auth_attempts typed UUID, hashes, strict checks and indexes `src/db/schema/identity-auth-attempts.ts:22-137`
- Fix: Record deliberate replacement and old-data retirement, no plaintext migration
