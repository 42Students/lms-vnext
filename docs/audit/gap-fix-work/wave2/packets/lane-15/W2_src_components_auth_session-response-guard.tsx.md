# Work packet (wave 2): edit src/components/auth/session-response-guard.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-graceful-states.md

## G2-1-037-033  [P2] GAP  facet F10  effort S
- Legacy: legacy api/ApiMethod.js:125-169 report auth lost mid-action
- vNext now: src/components/auth/session-response-guard.tsx:31-36 redirect only
- Fix: Verify mid-action auth-loss reporting
