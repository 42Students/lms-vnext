# Work packet (wave 2): edit src/components/auth/connection-failure-notice.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-graceful-states.md

## G2-1-037-018  [P2] GAP  facet F06  effort S
- Legacy: legacy api/ApiMethod.js:153-163 Retry keyboard action on network notice
- vNext now: src/components/auth/connection-failure-notice.tsx:32-35 dismiss but no Retry
- Fix: Offer accessible safe-read retry

## G2-1-037-031  [P2] GAP  facet F09  effort S
- Legacy: legacy api/ApiMethod.js:153-163 optional Retry control in notification
- vNext now: src/components/auth/connection-failure-notice.tsx:32-35 no Retry
- Fix: Provide safe retry without repeating mutations

## G2-1-037-010  [P3] GAP  facet F03  effort S
- Legacy: legacy api/ApiMethod.js:185-199 notifications duration 5 seconds
- vNext now: src/components/auth/connection-failure-notice.tsx:15-17 10 seconds
- Fix: Match durations and notice location
