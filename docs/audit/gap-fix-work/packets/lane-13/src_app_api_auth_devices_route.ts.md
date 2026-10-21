# Work packet: edit src/app/api/auth/devices/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md

## G2-1-002-042  [P1] GAP  facet F10  effort M
- Legacy: `AuthController.java:1090-1116` user/admin revoke-sessions increments learner/faculty tokenVersion, including current session.
- vNext now: `src/modules/auth/session-service.ts:120-134` supports revokeAllSessionsForUser, but public device DELETE (`src/app/api/auth/devices/route.ts:35-47`) skips current.
- Fix: Expose true own-device all-session revocation where legacy client calls require it; confirm admin endpoints use revokeAllSessionsForUser.

## G2-1-002-045  [P1] GAP  facet F11  effort M
- Legacy: `AuthController.java:1099-1108` other-person revoke-all permits caller through `requireAccessLearner` or faculty-schedule access, broader than admin-only in some roles.
- vNext now: `src/app/api/auth/devices/route.ts:13-17,35-47` is strictly self only; `/api/auth/devices/[sessionId]` ownership checks.
- Fix: Inventory legacy staff revoke-all privilege and either restore authorized admin-only target action or explicitly restrict with approval.
