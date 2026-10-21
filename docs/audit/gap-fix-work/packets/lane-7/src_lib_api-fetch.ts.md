# Work packet: edit src/lib/api-fetch.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-graceful-states.md

## G2-1-037-020  [P2] GAP  facet F07  effort S
- Legacy: legacy utils/apiError.js:93-95 canceled requests silent and not retryable
- vNext now: src/lib/api-fetch.ts:100-103 abort status499 with timeout message
- Fix: Give canceled its own silent outcome
