# Work packet (wave 2): edit src/lib/api-fetch.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-graceful-states.md

## G2-1-037-012  [P2] GAP  facet F04  effort S
- Legacy: legacy utils/apiError.js:90-116 includes retryable boolean
- vNext now: src/lib/api-fetch.ts:13-24 status/code without retryable
- Fix: Expose retryable to page actions

## G2-1-037-044  [P2] GAP  facet F13  effort S
- Legacy: legacy api/ApiMethod.js:95-97 cancel silent
- vNext now: src/lib/api-fetch.ts:100-103 returns timeout-ish cancellation
- Fix: Suppress abort notice

## G2-1-037-061  [P2] GAP  facet F20  effort S
- Legacy: legacy api/ApiMethod.js:95-97 cancel is caller transition
- vNext now: src/lib/api-fetch.ts:100-103 converts to status499 with timeout message
- Fix: Differentiate canceled vs timeout
