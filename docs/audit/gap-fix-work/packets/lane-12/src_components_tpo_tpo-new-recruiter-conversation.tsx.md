# Work packet: edit src/components/tpo/tpo-new-recruiter-conversation.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u016-tpo-messages.md

## G2-11-016-034  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:213-218`
- vNext now: `src/components/tpo/tpo-new-recruiter-conversation.tsx:50-75`
- Fix: Legacy Failed to send keeps compose content, vNext thread-create partial success warns Conversation opened, but the message was not sent.

## G2-11-016-035  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:213-239`
- vNext now: `src/components/tpo/tpo-new-recruiter-conversation.tsx:67-76`
- Fix: Legacy toast Message sent, vNext navigates conversation without matching success toast on create.
