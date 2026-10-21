# Work packet: edit src/app/api/auth/devices/[sessionId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md

## G2-1-002-031  [P2] GAP  facet F07  effort S
- Legacy: `AuthController.java:1149-1157` per-session revoke 404 `Session not found`, 403 `Cannot revoke another user's session`, 500 `Internal error`.
- vNext now: `src/app/api/auth/devices/[sessionId]/route.ts:23-34` returns 404 `{error:'SESSION_NOT_FOUND'}` and 403 for invalid origin; ownership enforced by UPDATE WHERE user_id.
- Fix: Use safe generic 404 for missing/not-owned, but show correct device-revocation copy in UI.
