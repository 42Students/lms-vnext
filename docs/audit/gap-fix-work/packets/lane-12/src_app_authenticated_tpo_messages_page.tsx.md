# Work packet: edit src/app/(authenticated)/tpo/messages/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u016-tpo-messages.md, docs/audit/gap2/lane-4/tpo-team-redirect.md, docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-11-016-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:19-23`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:56-72`
- Fix: Legacy /tpo/messages?tab=team shows Team within Messages; vNext /tpo/messages recruiter only, team moved to /tpo/team. Preserve deep-link redirects and tab semantics.

## G2-11-016-077  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:39-45`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:161-175`
- Fix: Legacy Messages tab strip Recruiters/Team no longer exists in same route; implement or alias without duplicating messages.

## G2-4-028-007  [P1] MISSING  facet F02  effort S
- Legacy: Canonical Messages contains Recruiters and Team tablist (`docs/legacy-source/frontend/src/pages/tpo/messages.js:40-68`)
- vNext now: Recruiter Messages page lacks Team tablist (`src/app/(authenticated)/tpo/messages/page.tsx:56-80,121-140`)
- Fix: Add team tab and component to Messages.

## G2-4-028-010  [P1] MISSING  facet F03  effort S
- Legacy: Recruiters and Team tab buttons with aria-selected (`docs/legacy-source/frontend/src/pages/tpo/messages.js:40-45`)
- vNext now: Message filters only and no Team tab (`src/app/(authenticated)/tpo/messages/page.tsx:56-80`)
- Fix: Restore both visible Messages tabs.

## G2-4-028-018  [P1] GAP  facet F05  effort S
- Legacy: Messages Team selected by tab query (`docs/legacy-source/frontend/src/pages/tpo/messages.js:39-44`)
- vNext now: Status/date/search parser only (`src/app/(authenticated)/tpo/messages/page.tsx:73-80,121-129`)
- Fix: Add Team-specific filter model in Messages.

## G2-4-028-031  [P1] MISSING  facet F10  effort S
- Legacy: Team conversations use getTeamPeople and TeamConversations (`docs/legacy-source/frontend/src/pages/tpo/messages.js:29-37,50-57`)
- vNext now: Only getTpoMessagesInbox recruiter conversations (`src/app/(authenticated)/tpo/messages/page.tsx:105-140`)
- Fix: Integrate internal threads into Messages Team tab.

## G2-19-031-050  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:294-301` — Stale inbox refresh banner This refresh failed. with Retry.
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:131-140` — New unavailable state is full-panel; no retained-success rows.
- Fix: Preserve stale list and closable refresh error.

## G2-11-016-031  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:293-305`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:131-137`
- Fix: Legacy error Could not load conversations, Retry and list skeleton, vNext full-page Recruiter conversations temporarily unavailable with notifications alternative.

## G2-11-016-036  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:46-48`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:203-212`
- Fix: Legacy explains drive Discussion tab relation in subtitle, vNext simplified instructions and new metric summary.
