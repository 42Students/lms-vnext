# Work packet: edit src/components/tpo/tpo-team-forms.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-3/l11-u016-tpo-messages.md

## G2-19-031-138  [P1] GAP  facet F23  effort L
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:197-267` — Legacy shared multi-person topics/object threads.
- vNext now: `src/components/tpo/tpo-team-forms.tsx:76-92` — New private pair threads plus separate Everyone; shared object kind dropped.
- Fix: Implement object and multi-person topic thread support.

## G2-11-016-079  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:196-263`
- vNext now: `src/components/tpo/tpo-team-forms.tsx:76-99`
- Fix: Legacy shared drive/company/student Team Conversations create absent in vNext private member-to-member form; decide full contextual team roadmap.
