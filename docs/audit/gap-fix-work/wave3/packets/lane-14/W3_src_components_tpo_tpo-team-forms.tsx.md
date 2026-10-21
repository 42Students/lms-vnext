# Work packet (wave 3): edit src/components/tpo/tpo-team-forms.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-19-031-056  [P1] MISSING  facet F09  effort L
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:197-267` — New Team conversation dialog supports drives/companies/students/topics and multiple people.
- vNext now: `src/components/tpo/tpo-team-forms.tsx:76-92` — New private create form accepts one recipient and topic.
- Fix: Implement multi-member and object thread creation dialog.
