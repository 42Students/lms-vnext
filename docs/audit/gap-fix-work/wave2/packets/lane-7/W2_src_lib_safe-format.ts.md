# Work packet (wave 2): edit src/lib/safe-format.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md

## G2-2-037-012  [P2] GAP  facet F04  effort M
- Legacy: src/lib/format-date.ts:9-19 en-IN Asia/Kolkata medium date time
- vNext now: src/lib/safe-format.ts:12-18 en-IN DD Mon YYYY (IST) explicit suffix
- Fix: Choose one date-format contract per column and use same fallback/IST display.

## G2-2-037-053  [P2] GAP  facet F20  effort M
- Legacy: src/lib/format-date.ts:1-7 explicit IST en-IN to avoid hydration mismatch
- vNext now: src/lib/safe-format.ts:12-18 outputs (IST), unlike medium locale date formatter
- Fix: Standardize date parse and timezone suffix across SSR/client and export.
