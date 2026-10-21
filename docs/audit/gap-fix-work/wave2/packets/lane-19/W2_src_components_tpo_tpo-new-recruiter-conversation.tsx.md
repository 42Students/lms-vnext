# Work packet (wave 2): edit src/components/tpo/tpo-new-recruiter-conversation.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-3/l11-u016-tpo-messages.md

## G2-19-031-037  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:462-481` — New recruiter modal offers searchable active picker plus General thread helper.
- vNext now: `src/components/tpo/tpo-new-recruiter-conversation.tsx:78-120` — Dialog exists, active recruiter list and quick replies; helper/action sequence differs.
- Fix: Restore helper text and active select semantics.

## G2-11-016-029  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:196-202`
- vNext now: `src/components/tpo/tpo-new-recruiter-conversation.tsx:32-47`
- Fix: Legacy explicit Discard this message draft? Modal with Keep writing; vNext has Discard draft button + on-unload guard, confirm exact click copy.

## G2-11-016-037  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:196-202`
- vNext now: `src/components/tpo/tpo-new-recruiter-conversation.tsx:78-89`
- Fix: Legacy new message composer in right-side panel/modal with confirmation on discard; vNext Dialog New message to recruiter and quick replies Disclosure.

## G2-11-016-040  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:208-241`
- vNext now: `src/components/tpo/tpo-new-recruiter-conversation.tsx:50-76`
- Fix: Legacy sendMessage directly with recruiterId/jobId, newMessage, optional quoted changeRequestId; vNext first POST thread then POST message, no inline quote in create.
