# Work packet: edit src/app/(authenticated)/tpo/team/page.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u016-tpo-messages.md, docs/audit/gap2/lane-3/tpo-team-thread-controller.md, docs/audit/gap2/lane-4/tpo-team-redirect.md

## G2-11-016-076  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:41-54`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:31-75`
- Fix: Legacy numeric facultyId/team thread IDs and typed entity context; vNext UUID team member threads with idempotency and restricted scope, crosswalk required.

## G2-3-022-048  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:65-74`, `147-157`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:154-209`
- Fix: Legacy about(kind,key) contextual conversations, search across team, mentions and global asks are not fully reproduced by standalone private pairs; prioritize context thread and rollup parity.

## G2-4-028-001  [P1] GAP  facet F01  effort S
- Legacy: /tpo/team is a redirect shim, never renders a Team workspace (`docs/legacy-source/frontend/src/pages/tpo/team.js:5-9`)
- vNext now: /tpo/team renders full Team page (`src/app/(authenticated)/tpo/team/page.tsx:31-35,79-86`)
- Fix: Restore owner-approved redirect to canonical destinations.

## G2-4-028-002  [P1] GAP  facet F01  effort S
- Legacy: Default and conversation tabs redirect to /tpo/messages?tab=team (`docs/legacy-source/frontend/src/pages/tpo/team.js:7-9`)
- vNext now: Default renders conversations in Team (`src/app/(authenticated)/tpo/team/page.tsx:44-50`)
- Fix: Redirect default to Messages Team.

## G2-4-028-003  [P1] GAP  facet F01  effort S
- Legacy: tab=people or members redirects to /tpo/settings?tab=team (`docs/legacy-source/frontend/src/pages/tpo/team.js:7-9`)
- vNext now: members aliases to people but remains in Team (`src/app/(authenticated)/tpo/team/page.tsx:44-50`)
- Fix: Redirect both aliases to Settings People.

## G2-4-028-004  [P1] GAP  facet F01  effort S
- Legacy: People route drops rest query, conversations preserve rest query (`docs/legacy-source/frontend/src/pages/tpo/team.js:8-9`)
- vNext now: Thread c/m handled before tab, other keys parsed strictly (`src/app/(authenticated)/tpo/team/page.tsx:36-49`)
- Fix: Preserve legacy query forwarding and precedence.

## G2-4-028-021  [P1] MISSING  facet F06  effort S
- Legacy: Remove flow checks ownership impact before submit (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:79-86`)
- vNext now: Handover disclosure but no member removal (`src/app/(authenticated)/tpo/team/page.tsx:140-148`)
- Fix: Restore impact gated removal and reassignment.

## G2-4-028-037  [P1] GAP  facet F12  effort S
- Legacy: People redirect drops c/m/extra params (`docs/legacy-source/frontend/src/pages/tpo/team.js:8`)
- vNext now: c/m redirect before people parsing (`src/app/(authenticated)/tpo/team/page.tsx:36-43`)
- Fix: Prioritize tab people redirect before c/m.

## G2-4-028-048  [P1] GAP  facet F18  effort S
- Legacy: Explicit owner copy Messages > Team and Settings > People (`docs/legacy-source/frontend/src/pages/tpo/team.js:5-9`)
- vNext now: Header Team with Conversations/People tabs (`src/app/(authenticated)/tpo/team/page.tsx:81-86`)
- Fix: Match owner navigation wording.

## G2-4-028-054  [P1] GAP  facet F20  effort S
- Legacy: c/m forwarded for conversations but dropped for members (`docs/legacy-source/frontend/src/pages/tpo/team.js:7-9`)
- vNext now: c/m handled even when members requested (`src/app/(authenticated)/tpo/team/page.tsx:36-43`)
- Fix: Match query precedence for membership destinations.

## G2-4-028-060  [P1] GAP  facet F23  effort S
- Legacy: Legacy URL aliases and rest params have precise contract (`docs/legacy-source/frontend/src/pages/tpo/team.js:7-9`)
- vNext now: Redirect aliases not implemented (`src/app/(authenticated)/tpo/team/page.tsx:36-50`)
- Fix: Add old-bookmark compatibility cases.

## G2-11-016-033  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:148-151`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:171-177`
- Fix: Legacy Couldn't load conversations Retry, keeps previously loaded rows; vNext Could not load conversations right now. Your search has been kept. with Retry link.

## G2-4-028-022  [P2] GAP  facet F07  effort S
- Legacy: Not-ready router shows skeleton without error (`docs/legacy-source/frontend/src/pages/tpo/team.js:14-19`)
- vNext now: Invalid tab parses to conversations (`src/app/(authenticated)/tpo/team/page.tsx:31-50`)
- Fix: Use canonical redirect while retaining known query params.

## G2-4-028-024  [P2] GAP  facet F07  effort S
- Legacy: People lookup failure does not hide Team chat (`docs/legacy-source/frontend/src/pages/tpo/messages.js:29-37`)
- vNext now: Team roster always fetched on conversation tab (`src/app/(authenticated)/tpo/team/page.tsx:51-78`)
- Fix: Make roster failure nonblocking for conversations.

## G2-4-028-025  [P3] GAP  facet F08  effort S
- Legacy: Successful redirect silently updates URL without toast (`docs/legacy-source/frontend/src/pages/tpo/team.js:14-18`)
- vNext now: Page renders locally without redirect (`src/app/(authenticated)/tpo/team/page.tsx:79-86`)
- Fix: Keep silent redirect and no success toast.
