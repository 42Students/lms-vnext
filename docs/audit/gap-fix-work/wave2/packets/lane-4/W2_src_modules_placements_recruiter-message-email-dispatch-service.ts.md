# Work packet (wave 2): edit src/modules/placements/recruiter-message-email-dispatch-service.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-scheduled-jobs.md, docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-20/recruiter-message-email-service.md

## G2-17-010-018  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:68-70 — Digest lease 4 min (period 5 min).
- vNext now: src/modules/placements/recruiter-message-email-dispatch-service.ts:68-75 — Per-thread row lock, but global job lease not evident.
- Fix: Avoid overlapping digest batches with global lease or equivalent reservation.

## G2-18-010-041  [P2] GAP  facet F11  effort M
- Legacy: Legacy null collegeId sends recruiter mail with generic reply mailbox (`TpoMailService.java:87-89,118-121`).
- vNext now: New digest requires valid replyToken+domain and live college context (`recruiter-message-email-provider.ts:21-31`; `recruiter-message-email-dispatch-service.ts:45-65`).
- Fix: Decide fallback for college-null system invitations; do not silently drop legitimate mail.

## G2-20-010-011  [P2] MISSING  facet F04  effort S
- Legacy: Exact 1 new message versus N new messages based on total unread count `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:95-110`
- vNext now: Only top 3 messages loaded and sent, no full unread count `src/modules/placements/recruiter-message-email-dispatch-service.ts:101-108`
- Fix: Count all newly unread messages; preserve singular/plural text

## G2-20-010-014  [P2] GAP  facet F05  effort S
- Legacy: Candidate selection capped 200 per run `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:62-75`
- vNext now: Candidate selection capped 100 per run, sorted oldest first `src/modules/placements/recruiter-message-email-dispatch-service.ts:45-65`
- Fix: Size worker batch and cadence for queue/backlog SLA

## G2-20-010-018  [P2] GAP  facet F06  effort S
- Legacy: Default reply routing tag r; dev rdev can be configured `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:50-58`
- vNext now: Domain/secret controlled reply addresses; no separate localpart dev tag `src/modules/placements/recruiter-message-email-dispatch-service.ts:26-35`
- Fix: Configure explicit non-production inbound domain or mailbox separation

## G2-20-010-026  [P2] GAP  facet F10  effort L
- Legacy: Legacy updates recruiter_emailed_at with six-hour conditional SQL before provider sends `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:100-104`
- vNext now: New holds row lock across external provider call, then writes lastSentAt `src/modules/placements/recruiter-message-email-dispatch-service.ts:68-75,115-126`
- Fix: Test after-send-before-commit crash, implement idempotent outbox if necessary

## G2-20-010-030  [P2] GAP  facet F11  effort M
- Legacy: Legacy checks grant ACTIVE and valid_until null OR future `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:69-75`
- vNext now: New requires verified DRIVES capability with valid_until >now (NULL rejected) `src/modules/placements/recruiter-message-email-dispatch-service.ts:52-61`
- Fix: Decide perpetual grant parity; preserve stricter authorization by design

## G2-20-010-045  [P2] GAP  facet F18  effort S
- Legacy: Blank first name falls back to 'there' in cleanMerge `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:192-200`
- vNext now: recipientName=email rather than blank fallback `src/modules/placements/recruiter-message-email-dispatch-service.ts:115-119`
- Fix: Use recruiter first name or 'there' fallback

## G2-20-010-046  [P2] GAP  facet F19  effort S
- Legacy: Unreads queried in full to get total, final three shown `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:95-113`
- vNext now: Only last 3 queried, no total unread count `src/modules/placements/recruiter-message-email-dispatch-service.ts:101-108`
- Fix: Add count in same scoped transaction

## G2-20-010-048  [P2] GAP  facet F20  effort L
- Legacy: Legacy conditional slot claim prevents concurrent digest sends `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:100-104`
- vNext now: New transaction row-level lock includes provider call `src/modules/placements/recruiter-message-email-dispatch-service.ts:68-75,115-128`
- Fix: Test retry and transaction rollback; consider idempotent outbox instead of remote call inside transaction

## G2-20-010-031  [P3] GAP  facet F11  effort S
- Legacy: Legacy recruiter not deleted and non-empty email `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:63-75`
- vNext now: New active user/profile/company; only email is NOT NULL, blank may remain `src/modules/placements/recruiter-message-email-dispatch-service.ts:50-63`
- Fix: Filter whitespace email in due query
