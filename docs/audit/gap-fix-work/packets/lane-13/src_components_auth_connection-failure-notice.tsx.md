# Work packet: edit src/components/auth/connection-failure-notice.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-graceful-states.md

## G2-1-037-027  [P3] GAP  facet F08  effort S
- Legacy: legacy api/ApiMethod.js:185-199 timeout/network toast 5 sec
- vNext now: src/components/auth/connection-failure-notice.tsx:11-17 notice10 sec
- Fix: Align toast timing
