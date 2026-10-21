# Work packet (wave 2): edit src/components/ui/error-state.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-graceful-states.md

## G2-1-037-017  [P2] GAP  facet F06  effort S
- Legacy: legacy utils/apiError.js:90-116 retryable only for appropriate errors
- vNext now: src/components/ui/error-state.tsx:3-9 accepts any action slot
- Fix: Enforce safe retry for idempotent reads
