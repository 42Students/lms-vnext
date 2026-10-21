# Work packet (wave 2): edit src/modules/placements/tpo-messages-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u016-tpo-messages.md

## G2-11-016-058  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:158-160`
- vNext now: `src/modules/placements/tpo-messages-service.ts:204-287`
- Fix: Legacy live pulse updates unread/chat delivery independent of page navigation; vNext inbox uses DB persisted counts and notification fallback, no faux communication inferred.

## G2-11-016-068  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:158-160`
- vNext now: `src/modules/placements/tpo-messages-service.ts:204-287`
- Fix: Legacy live pulse/whole thread refresh and client filter, vNext paged SQL snapshots 25/50/100; benchmark unread responsiveness.

## G2-11-016-070  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:136-160`
- vNext now: `src/modules/placements/tpo-messages-service.ts:204-287`
- Fix: Legacy refresh thread while open preserves last success on failure; vNext route independent SSR may not preserve draft/thread in component state.

## G2-11-016-073  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:158-160`
- vNext now: `src/modules/placements/tpo-messages-service.ts:204-287`
- Fix: Legacy getMessagesPulse and TpoHubService, vNext Postgres message table readiness, SQL page and in-app notification fallback, different availability signals.
