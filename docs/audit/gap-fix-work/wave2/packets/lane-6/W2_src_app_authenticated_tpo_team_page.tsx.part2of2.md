# Work packet (wave 2): edit src/app/(authenticated)/tpo/team/page.tsx (part 2 of 2)

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-team-redirect.md, docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-3/l11-u016-tpo-messages.md

## G2-4-028-017  [P2] GAP  facet F05  effort S
- Legacy: Sort labels Most work / Overdue first / Name (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:132-140`)
- vNext now: Most assigned duties / Overdue first / Name (`src/app/(authenticated)/tpo/team/page.tsx:95-104`)
- Fix: Match Most work label.

## G2-4-028-029  [P2] GAP  facet F09  effort S
- Legacy: Workload counts offer dated Ask popovers (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:99-115`)
- vNext now: Count links without individual item popover (`src/app/(authenticated)/tpo/team/page.tsx:122-139`)
- Fix: Restore detailed Ask popovers at canonical People.

## G2-4-028-033  [P2] GAP  facet F11  effort S
- Legacy: Shim contains no role gate (`docs/legacy-source/frontend/src/pages/tpo/team.js:12-19`)
- vNext now: Requires hasPlacementTeamMembership (`src/app/(authenticated)/tpo/team/page.tsx:34-35`)
- Fix: Retain secure access but route allowed users correctly.

## G2-4-028-036  [P2] GAP  facet F12  effort S
- Legacy: Only people/members trigger settings, other tabs conversation (`docs/legacy-source/frontend/src/pages/tpo/team.js:7-9`)
- vNext now: Invalid maps to conversations but no redirect (`src/app/(authenticated)/tpo/team/page.tsx:44-50`)
- Fix: Map all legacy tabs to correct canonical URL.

## G2-4-028-038  [P2] GAP  facet F12  effort S
- Legacy: Conversation redirect preserves all non-tab params (`docs/legacy-source/frontend/src/pages/tpo/team.js:9`)
- vNext now: Strict parser only supports selected props (`src/app/(authenticated)/tpo/team/page.tsx:31-49`)
- Fix: Retain query forwarding for old bookmarks.

## G2-4-028-039  [P2] GAP  facet F13  effort S
- Legacy: AntD Skeleton active while browser router initializes (`docs/legacy-source/frontend/src/pages/tpo/team.js:18`)
- vNext now: Server page replaces skeleton with page loading (`src/app/(authenticated)/tpo/team/page.tsx:79-86`)
- Fix: Keep loading skeleton for redirect transition.

## G2-4-028-049  [P2] GAP  facet F18  effort S
- Legacy: Full private team subtitle starts Your placement team's own conversations (`docs/legacy-source/frontend/src/pages/tpo/messages.js:46-48`)
- vNext now: Abbreviated Who does what... text (`src/app/(authenticated)/tpo/team/page.tsx:81-82`)
- Fix: Restore exact subtitle in Messages Team.

## G2-4-028-051  [P2] GAP  facet F19  effort S
- Legacy: Redirect has zero DB reads (`docs/legacy-source/frontend/src/pages/tpo/team.js:12-19`)
- vNext now: Multiple roster/threads/workload queries (`src/app/(authenticated)/tpo/team/page.tsx:51-78`)
- Fix: Make redirect O(1) and only load destination data.

## G2-4-028-052  [P2] GAP  facet F19  effort S
- Legacy: Fetch people only when Team tab selected (`docs/legacy-source/frontend/src/pages/tpo/messages.js:27-37`)
- vNext now: Always fetch team roster even on conversation tab (`src/app/(authenticated)/tpo/team/page.tsx:51-70`)
- Fix: Lazy-load people on destination only.

## G2-4-028-053  [P2] GAP  facet F20  effort S
- Legacy: Wait for router.isReady then replace (`docs/legacy-source/frontend/src/pages/tpo/team.js:14-17`)
- vNext now: Server query parse without old replace (`src/app/(authenticated)/tpo/team/page.tsx:32-50`)
- Fix: Test history, hydration and router query readiness.

## G2-4-028-056  [P2] GAP  facet F21  effort S
- Legacy: getTeamPeople service feeds Team composer (`docs/legacy-source/frontend/src/pages/tpo/messages.js:29-37`)
- vNext now: New internal TPO services feed Team page (`src/app/(authenticated)/tpo/team/page.tsx:23-29`)
- Fix: Wire equivalent service to canonical Messages.

## G2-19-031-010  [P3] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:111-117` — Wide-screen team auto-opens followed unread thread or Everyone.
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:166-184` — New list supplies links but no wide-screen auto-selection.
- Fix: Select unread/Everyone at >=992px, not on phone.

## G2-19-031-017  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:152-167` — Team thread row carries kind icon, private lock, @ mark and unread badge.
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:178-189` — Unread and ask counts exist, but kind and mention icons are absent.
- Fix: Render typed kind/mention indicators.

## G2-19-031-084  [P3] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:150-151` — Team filter-specific no-results and no-following copy.
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:191-193` — New generic no conversations matching filters.
- Fix: Use Following/All/Search distinct empty messages.

## G2-19-031-109  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:133-135` — Team search Search  (press /).
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:155-164` — New search has no / shortcut text.
- Fix: Implement / focus and placeholder.

## G2-11-016-067  [P3] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:151-151`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:192-192`
- Fix: Legacy You follow nothing else yet. All shows every conversation. vs vNext No conversations match these filters. Clear filters to see all.

## G2-4-028-015  [P3] GAP  facet F04  effort S
- Legacy: Away until shown as weekday and day/month (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:155-160`)
- vNext now: Full date and time IST (`src/app/(authenticated)/tpo/team/page.tsx:113-116`)
- Fix: Match exact dated format when cloning.
