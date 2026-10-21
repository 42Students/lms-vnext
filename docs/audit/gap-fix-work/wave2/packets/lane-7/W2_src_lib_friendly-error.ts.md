# Work packet (wave 2): edit src/lib/friendly-error.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-graceful-states.md

## G2-1-037-009  [P2] GAP  facet F03  effort S
- Legacy: legacy utils/apiError.js:90-116 per-kind title/message
- vNext now: src/lib/friendly-error.ts:14-29 shared sentence catalog
- Fix: Map exact error headings by kind

## G2-1-037-057  [P3] GAP  facet F18  effort S
- Legacy: legacy utils/apiError.js:90-116 exact per-code strings
- vNext now: src/lib/friendly-error.ts:14-29 alternate catalog
- Fix: Diff every string against copy catalog
