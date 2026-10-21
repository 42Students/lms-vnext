# Work packet (wave 2): edit src/components/tpo/tpo-company-team-conversation.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-companies.md

## G2-11-007-054  [P2] GAP  facet F09  effort L
- Legacy: Legacy TeamConversation embeds modals for Edit message, Mark ask done, Rename, Add people, leave/delete decisions. `docs/legacy-source/frontend/src/components/tpo/team/TeamConversation.jsx:198`
- vNext now: vNext TpoCompanyTeamConversation inline edits/options plus separate company Team route, not same modals. `src/components/tpo/tpo-company-team-conversation.tsx:136`
- Fix: Compare each Team dialog action and restore modal sizing, label, focus, message copy.
