# Work packet (wave 2): edit src/components/tpo/tpo-recruiter-message-reply.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-19-031-038  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:444-455` — Recruiter composer max4000 and Send disabled empty/ended.
- vNext now: `src/components/tpo/tpo-recruiter-message-reply.tsx:79-97` — New max4000 and empty guard; ended access may only fail at API.
- Fix: Guard compose against inactive grant before send.

## G2-19-031-107  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:449-455` — Reply shortcut hint Ctrl/Cmd + Enter to send.
- vNext now: `src/components/tpo/tpo-recruiter-message-reply.tsx:79-92` — New Enter to send and Shift + Enter for a new line.
- Fix: Restore Ctrl/Cmd send shortcut/hint.
