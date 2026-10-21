# Work packet (wave 3): edit src/db/schema/identity-auth-attempts.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/learner-verification.md

## G2-20-018-012  [P1] MISSING  facet F06  effort L
- Legacy: Legacy pre-user learnerId=0 email or phone `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/VerificationServiceImpl.java:205-248`
- vNext now: New attempt userId FK NOT NULL `src/db/schema/identity-auth-attempts.ts:25-28`
- Fix: Implement separate secure onboarding challenge if legacy signup uses this

## G2-20-018-038  [P1] MISSING  facet F23  effort L
- Legacy: Legacy preuser and roll alternate flows `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/VerificationServiceImpl.java:171-264`
- vNext now: No roll number, user FK not null `src/db/schema/identity-auth-attempts.ts:25-43`
- Fix: Obtain owner approval for retirement or implement targeted parity
