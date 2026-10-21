# Work packet: edit src/lib/friendly-error.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-graceful-states.md

## G2-1-037-021  [P3] GAP  facet F07  effort S
- Legacy: legacy utils/apiError.js:96 timeout sentence The LMS took too long
- vNext now: src/lib/friendly-error.ts:27 This is taking longer than expected
- Fix: Match timeout wording

## G2-1-037-023  [P3] GAP  facet F07  effort S
- Legacy: legacy utils/apiError.js:102 Session expired / Please sign in again
- vNext now: src/lib/friendly-error.ts:16 Your session has ended
- Fix: Match expiry copy

## G2-1-037-024  [P3] GAP  facet F07  effort S
- Legacy: legacy utils/apiError.js:108 conflict This changed elsewhere
- vNext now: src/lib/friendly-error.ts:19 This changed while you were working
- Fix: Match conflict copy and keep draft
