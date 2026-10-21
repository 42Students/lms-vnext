# Work packet: edit src/components/admin/admin-revoke-sessions.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/super-admin-user-admin-controller.md

## G2-1-007-028  [P2] GAP  facet F08  effort M
- Legacy: `AdminUsers.js:273-300` force logout confirmation 'Ends every active session ... use Suspend instead'.
- vNext now: `admin-revoke-sessions.tsx:44-49` description 'including other colleges ... revoked immediately'.
- Fix: Include reversible sign-in reassurance and comparison to Suspend in dialog description.
