# Work packet: edit src/db/schema/db01-auth-handoffs.staged.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-handoff-page.md, docs/audit/gap2/lane-1/auth-handoff-token.md

## G2-1-024-054  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:505-519: legacy auth_handoff_token raw refresh/access token material, single-use soft-deleted.
- vNext now: src/db/schema/db01-auth-handoffs.staged.ts:27-49: proposed identity_auth_handoffs with HMAC code and scope FKs STAGED ONLY; no active matching page API.
- Fix: Decide release of secure scoped handoff end to end, or accept no cross-host SSO and document re-login.

## G2-1-014-026  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:324-333`: generates raw token, stores access+refresh JWT and expiry at issue.
- vNext now: `src/db/schema/db01-auth-handoffs.staged.ts:5-9`: staged HMAC-only row, no production writer.
- Fix: If reinstated, issue one-time code with target/domain scope, no transferable JWT.

## G2-1-014-046  [P1] MISSING  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AuthHandoffTokenRepository.java:24-25`: conditional claimUnused flips used once; race loser 404.
- vNext now: `src/db/schema/db01-auth-handoffs.staged.ts:48-49`,`src/db/schema/db01-auth-handoffs.staged.ts:78-82`: staged timestamp but no active transaction.
- Fix: Require compare-and-swap consumedAt IS NULL and expiresAt>now in single DB operation.
