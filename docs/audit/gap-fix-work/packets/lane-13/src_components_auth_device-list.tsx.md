# Work packet: edit src/components/auth/device-list.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md

## G2-1-002-033  [P2] GAP  facet F08  effort S
- Legacy: `AuthController.java:1090-1116` revoke-all `{message:'All sessions revoked'}`.
- vNext now: `src/components/auth/device-list.tsx:102-135` success toast `Signed out everywhere else`; current retained.
- Fix: Avoid promising all devices for action excluding current; offer explicit sign-out-all path if needed.

## G2-1-002-034  [P2] GAP  facet F08  effort S
- Legacy: `AuthController.java:1139-1151` revoke-one `{message:'Session revoked'}`.
- vNext now: `src/components/auth/device-list.tsx:87-95` toast `Device signed out`, and `:125-136` confirmation 'Sign out this device. You can sign in again later.'
- Fix: Follow legacy literal copy if clone copy demanded; otherwise record approved new copy.
