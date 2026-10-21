# Work packet: edit src/components/tracker/tracker-telegram-manual-panel.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u005-tracker-logs.md

## G2-16-005-033  [P2] GAP  facet F08  effort S
- Legacy: `logs.js:499-515`: test-alert toasts distinguish not configured, delivered, rejected, 403 and generic.
- vNext now: `tracker-telegram-manual-panel.tsx:30-43,81-90`: one result message/notice and confirm dialog, no distinctions in UI.
- Fix: Display exact configured/delivered/rejected messages and access errors after send.
