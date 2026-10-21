# Work packet (wave 2): edit src/components/tracker/tracker-telegram-manual-panel.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u005-tracker-logs.md

## G2-16-005-040  [P2] GAP  facet F09  effort M
- Legacy: `logs.js:763-764`: ClaudeReportModal + LogDigestDrawer invoked on separate actions.
- vNext now: `tracker-live-logs-explorer.tsx:238-248`; `tracker-telegram-manual-panel.tsx:65-89`: compact report Dialog and Telegram digest Dialog.
- Fix: Match modal title, payload preview and digest drawer interactions.

## G2-16-005-061  [P3] GAP  facet F15  effort S
- Legacy: `logs.js:499-516`: send-test-alert details delivery outcomes.
- vNext now: `tracker-telegram-manual-panel.tsx:33-43`: displays API message and success/failure but loses legacy four branches.
- Fix: Preserve delivery-specific toast/disabled state.
