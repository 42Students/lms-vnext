# Work packet: edit src/components/auth/session-response-guard.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-graceful-states.md

## G2-1-037-028  [P2] GAP  facet F08  effort S
- Legacy: legacy layouts/layout.js:143-149 session warning before redirect
- vNext now: src/components/auth/session-response-guard.tsx:31-36 redirect without toast
- Fix: Show expiry explanation after re-login redirect
