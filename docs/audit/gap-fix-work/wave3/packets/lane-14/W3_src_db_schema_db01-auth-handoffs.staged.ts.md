# Work packet (wave 3): edit src/db/schema/db01-auth-handoffs.staged.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-handoff-token.md

## G2-1-014-016  [P1] MISSING  facet F05  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AuthHandoffTokenRepository.java:24-25`: claimUnused conditional update guards two racing consumers.
- vNext now: `src/db/schema/db01-auth-handoffs.staged.ts:48-49`,`src/db/schema/db01-auth-handoffs.staged.ts:78-82`: timestamp model but no active consume implementation.
- Fix: Add one-statement atomic consume with expiry, target host and active membership recheck.
