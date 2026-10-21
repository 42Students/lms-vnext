# Work packet (wave 2): edit src/components/auth/device-list.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md

## G2-1-002-009  [P2] GAP  facet F03  effort M
- Legacy: `AuthController.java:1090-1116` server reports `All sessions revoked` on revoke-all (including current).
- vNext now: `src/components/auth/device-list.tsx:102-135` labels control `Sign out everywhere else`, retaining current; `/api/auth/devices` DELETE action.
- Fix: Keep distinct actions for all sessions versus all *other* sessions; label correctly and implement true revoke-all with re-auth if needed.

## G2-1-002-010  [P2] GAP  facet F03  effort S
- Legacy: `AuthController.java:1139-1151` per-device revocation exposes success `Session revoked`.
- vNext now: `src/components/auth/device-list.tsx:80-99` row action `Sign out` and toast `Device signed out`, current row has badge `This device`.
- Fix: Use legacy copy where parity requested or record intentional clearer new wording; check current-device revoke affordance.

## G2-1-002-020  [P2] GAP  facet F05  effort S
- Legacy: `AuthController.java:1139-1151` DELETE any of caller's own sessions including active current session.
- vNext now: `src/components/auth/device-list.tsx:80-99` deliberately hides Sign out action for `device.current`; current logout is elsewhere (`src/app/api/auth/session/route.ts:18-70`).
- Fix: Keep current-session signout accessible via account menu and document difference, avoid a dead-end for users.

## G2-1-002-062  [P2] GAP  facet F17  effort S
- Legacy: `AuthController.java:1121-1158` sessions API exposes no accessible names for devices itself.
- vNext now: `src/components/auth/device-list.tsx:68-96` renders device label and 'Sign out'; each repeated button lacks person/session-specific aria-label.
- Fix: Add distinct device label in accessible action name for screen readers and ensure confirmation identifies selected device.

## G2-1-002-064  [P2] GAP  facet F18  effort S
- Legacy: `AuthController.java:1024-1084` exactly `{message:'Logged out'}`; `:1090-1116` `{message:'All sessions revoked'}`; `:1139-1151` `{message:'Session revoked'}`.
- vNext now: `src/app/api/auth/session/route.ts:41-44`, `auth/devices/route.ts:47`, `auth/devices/[sessionId]/route.ts:31` return ok/code; `device-list.tsx:87-95,113-120` uses different text.
- Fix: Keep legacy user-facing wording in shell where requested and record intentional semantics (`everywhere else`).
