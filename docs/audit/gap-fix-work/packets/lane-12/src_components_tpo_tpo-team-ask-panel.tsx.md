# Work packet: edit src/components/tpo/tpo-team-ask-panel.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-19-031-039  [P1] GAP  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamComposer.jsx:159-177` — Ask can target any team member and optional due, with away warning.
- vNext now: `src/components/tpo/tpo-team-ask-panel.tsx:61-110` — New Ask panel targets counterpart in private conversation.
- Fix: Allow eligible assignee selection beyond one private participant.
