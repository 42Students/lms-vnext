# Work packet (wave 2): edit src/modules/auth/session-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/user-controller.md, docs/audit/gap2/lane-1/user-session.md, docs/audit/gap2/lane-1/refresh-token-blocklist.md

## G2-1-008-049  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:359-385`: faculty sign-in increments tokenVersion, stores device session/JWT.
- vNext now: `src/app/api/auth/login/verify/route.ts:52-59`,`src/modules/auth/session-service.ts:40-62`: transactional challenge consume/session creation.
- Fix: Clarify existing-device revocation semantics and migration.

## G2-1-022-028  [P2] GAP  facet F10  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserSessionServiceImpl.java:93-117 admin revoke blocklists then deletes and logs actor.
- vNext now: src/modules/auth/session-service.ts:120-134 supports all-user revoke; targeted admin revoke not in this module.
- Fix: Expose scoped admin targeted-device revoke if old authorized use remains.

## G2-1-020-014  [P3] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RefreshTokenBlocklistRepository.java:29: findByUserIdAndUserType returns blocklisted entries without pagination.
- vNext now: src/modules/auth/session-service.ts:136-143: list only active sessions for one user, newest lastSeenAt first.
- Fix: If audit history UI needed, add permission-bound revocation event listing rather than expose digests.

## G2-1-020-015  [P3] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RefreshTokenBlocklistRepository.java:43: countByUserIdAndUserType reports number of blocked tokens.
- vNext now: src/modules/auth/session-service.ts:136-143: active sessions list; no blocked-token count API.
- Fix: Confirm operator need for historical revocation counters; avoid raw JTI display.

## G2-1-020-043  [P3] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RefreshTokenBlocklistRepository.java:24,29,43: point lookup, per-account list, count; token rows retained until cleanup.
- vNext now: src/modules/auth/session-service.ts:70-79: point lookup LIMIT1; 136-143: per-user active list without page cap.
- Fix: Add bounded session list pagination if accounts can accumulate many rows.

## G2-1-022-012  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/UserSession.java:42-43 lastUsedAt touched on rotation.
- vNext now: src/modules/auth/session-service.ts:88-96 lastSeenAt touched at most once per 60s.
- Fix: Label approximate last seen consistently.

## G2-1-022-015  [P3] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/UserSessionRepository.java:17 sorts per-role sessions by lastUsedAt descending unbounded.
- vNext now: src/modules/auth/session-service.ts:136-143 user-wide active sessions sorted lastSeenAt descending unbounded.
- Fix: Bound list and clarify different role grouping.

## G2-1-022-043  [P3] GAP  facet F19  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/UserSessionRepository.java:17 no page bound.
- vNext now: src/modules/auth/session-service.ts:136-143 no page bound.
- Fix: Add pagination and latest-first stable tie-break.
