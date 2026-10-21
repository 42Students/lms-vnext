# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/learner-verification.md

4 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/learner-verification.md

## G2-20-018-001  [P2] GAP  facet F01  effort S
- Legacy: Learner verification entity backs phone/alternate OTP login [L:9-35,S:35-47]
- vNext now: New identity_auth_attempts backs /api/auth/login/start and verify [N:22-52,A:19-32]
- Fix: Map old account OTP entry points to scoped new attempt ID

## G2-20-018-006  [P2] GAP  facet F03  effort S
- Legacy: Legacy blockedTillTs varchar string `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerVerification.java:23-24`
- vNext now: New rate limitation by contact and IP + 429 [B:153-191,A:65-77]
- Fix: Show exact retry window and disable resend during cooldown

## G2-20-018-011  [P2] GAP  facet F05  effort S
- Legacy: Legacy resend cap stored 3, incorrectAttempts starts1 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/VerificationServiceImpl.java:39-45`
- vNext now: New resendAttempts0, verificationAttempts0, email max5 [N:44-45,A:40-42]
- Fix: Align attempt displays and resend defaults with actual vNext policy

## G2-20-018-019  [P2] GAP  facet F10  effort S
- Legacy: Legacy save creates row with plaintext OTP `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/VerificationServiceImpl.java:35-47`
- vNext now: New createAttempt persists MAC and expiry then sends SMS/email [B:153-215,A:338-373]
- Fix: Ensure send-failure compensation and no reusable old OTP
