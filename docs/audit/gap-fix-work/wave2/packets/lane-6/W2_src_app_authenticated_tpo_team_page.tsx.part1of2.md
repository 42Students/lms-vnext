# Work packet (wave 2): edit src/app/(authenticated)/tpo/team/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-2/l19-u022-tpo-hub-controller.md, docs/audit/gap2/lane-3/l11-u016-tpo-messages.md, docs/audit/gap2/lane-3/tpo-team-thread-controller.md, docs/audit/gap2/lane-4/tpo-team-redirect.md

## G2-19-031-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:47-61` — Team supports c, about, m, ask, tab and filter deep-link parameters.
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:37-50` — New handles c/m redirect and members tab alias, but no about/ask resolution.
- Fix: Preserve legacy object/ask deep link targets.

## G2-19-031-009  [P2] GAP  facet F02  effort L
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:130-181` — Team three-pane list, conversation and contextual details.
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:155-203` — Current list links to separate private pages, without persistent details pane.
- Fix: Restore desktop three-pane hierarchy.

## G2-19-031-030  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:86-109` — Team message search min2 chars, 250ms debounce, up to 50 hits.
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:72-78` — New query search is server page based, not live text match snippets.
- Fix: Implement text search with debounced request/snippet.

## G2-19-031-097  [P2] GAP  facet F16  effort L
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:176-181` — Team desktop three pane, phone one pane with back.
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:155-203` — New separate list/thread pages at all widths.
- Fix: Recreate responsive three-column and mobile navigator.

## G2-19-022-068  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:273-278 GET /my-access
- vNext now: src/app/(authenticated)/tpo/team/page.tsx:31-55
- Fix: Provide effective current team role to all controls

## G2-19-022-080  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:361-365 GET team list with access
- vNext now: src/app/(authenticated)/tpo/team/page.tsx:31-60
- Fix: Include myRole/accounts/me with directory

## G2-19-022-101  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:273-278 /my-access role from team
- vNext now: src/app/(authenticated)/tpo/team/page.tsx:34-55 membership gate and explicit TPO/TPO_ADMIN/COLLEGE_ADMIN roles
- Fix: Align team role authority with exact old TPO admin actions; avoid broad userType-only exposure

## G2-11-016-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:39-45`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:79-87`
- Fix: Legacy Recruiters/Team two tabs under Messages; vNext Team page tabs Conversations/People while Messages lacks Team tab.

## G2-11-016-005  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:50-59`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:79-87`
- Fix: Legacy team tab uses TeamConversations left/middle/right pane; vNext /tpo/team shows conversation list and opens detail route.

## G2-11-016-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:129-190`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:154-207`
- Fix: Legacy three-pane team conversation app with left list, center conversation, optional right context; vNext vertical list plus dedicated thread page.

## G2-11-016-009  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:52-58`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:79-87`
- Fix: Legacy team tab has no surrounding PageShell wrapper, vNext section wraps inside standard app canvas. Match borders/padding.

## G2-11-016-011  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:46-47`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:81-82`
- Fix: Exact team subtitle includes placement team's own conversations: who does what and what you decided; vNext Team shortens this.

## G2-11-016-014  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:129-150`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:154-166`
- Fix: Legacy team search Search (press /) with icon and plus action, filter chips Following/All/Me/Asks/Decisions/Drives/Companies/Students/Topics; vNext fewer filtered chips.

## G2-11-016-015  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:176-190`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:178-206`
- Fix: Legacy opens selected team conversation in central pane and toggles detail context; vNext opens /tpo/team/{uuid} route.

## G2-11-016-018  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:19-25`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:188-190`
- Fix: Legacy relative times Today h:mm A / Yesterday / day-of-week / D MMM; vNext team absolute en-IN date/time with IST.

## G2-11-016-021  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:28-36`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:158-165`
- Fix: Legacy team filters Following default, Me/Asks/Decisions and topic kind; vNext following default and limited ALL/FOLLOWING/UNREAD/TOPICS/DECISIONS/ASKS/@Me.

## G2-11-016-022  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:99-110`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:154-163`
- Fix: Legacy server text search triggered after >=2 chars, full conversation messages included; vNext page query q max120 and SQL service projection, verify message body search.

## G2-11-016-024  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:111-117`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:154-181`
- Fix: Legacy auto-opens followed unread or Everyone on wide screens; vNext lists Everyone as link, no auto open.

## G2-11-016-025  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:39-39`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:31-50`
- Fix: Legacy tab query `team/recruiters` on /tpo/messages with shallow replace; vNext separate route and query conversations/people.

## G2-11-016-039  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:41-45`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:83-87`
- Fix: Legacy single role=tablist Messages with two tabs; vNext Team tabs separate Conversations and People, no Recruiters tab.

## G2-11-016-054  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:148-151`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:175-192`
- Fix: Legacy loading six-row skeleton and filter-specific empties; vNext list EmtpyState and migration NOT_REGISTERED warning.

## G2-11-016-061  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:41-45`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:154-207`
- Fix: Legacy team mobile one pane at a time, desktop three; vNext always list page and independent detail; compare responsive transitions.

## G2-11-016-064  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:85-96`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:155-156`
- Fix: Legacy keyboard / focuses search when not typing; vNext TeamSearch may not implement slash focus; verify.

## G2-11-016-069  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:69-73`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:73-78`
- Fix: Legacy loads all followed team threads then local filters, vNext queries paged membership threads; sorting and total counts differ.

## G2-3-022-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:29-36`, `59-80`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:31-86`, `src/app/api/placements/tpo/team/threads/route.ts:9-23`
- Fix: Legacy /api/v1/tpo/team/threads list/search/about/open/start has 1:1 and contextual topic semantics; vNext `/tpo/team` and POST `/api/placements/tpo/team/threads` mostly private pair conversations. Map all routes to explicit new equivalents.

## G2-3-022-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:159-172`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:87-153`
- Fix: Legacy People read, away update and assign unowned work are same controller; vNext team page uses separate away/ownership services. Ensure all navigation/actions remain discoverable.

## G2-3-022-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:45-90`, `docs/legacy-source/frontend/src/components/tpo/team/TeamConversation.jsx:125-154`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:154-209`, `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:57-78`
- Fix: Legacy Team Conversations embeds selected conversation beside list and context/details; vNext redirects into standalone thread page. Align dual-pane/back links and page width.

## G2-3-022-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:123-178`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:87-153`
- Fix: Legacy People cards include workload numbers, Add a team member and removal impact; vNext shows team roles/workload and unowned assignment but roster management differs. Compare card hierarchy.

## G2-3-022-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:19-44`, `45-90`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:154-209`
- Fix: Legacy filters include following/unread/topics/decisions/asks/@me with counts across loaded threads, vNext follows same names but counts of current 100-item page only. Make count scope explicit/complete.

## G2-3-022-009  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:59-69`
- vNext now: `src/modules/placements/tpo-team-internal-read-service.ts:13-98`, `src/app/(authenticated)/tpo/team/page.tsx:72-79`
- Fix: Legacy threads/search and unread are individual endpoints with real counts, vNext filters paged list and shell counters via separate read. Preserve independently correct unread badge.

## G2-3-022-010  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:147-157`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:154-209`, `src/modules/placements/tpo-team-asks-service.ts:22-58`
- Fix: Legacy `/asks/mine`, `/mentions`, `/summary`, `/lookup` return cross-thread results; vNext team page filters local thread page, asks list by specific thread. Add global scoped endpoints.

## G2-3-022-013  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:44-44`, `169-172`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:87-153`
- Fix: Legacy assign unowned accepts arrays of drive IDs/company names and one target faculty ID; vNext separate workflow takes membership UUIDs. Map empty selections, college scoping, and multi-company assignment.

## G2-3-022-020  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:79-88`, `180-202`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:89-152`
- Fix: Legacy team-member removal presents ownership impact and reassign modal; vNext People shows ownership/away and handover components but confirm mechanics differ. Check parity on modal details.

## G2-3-022-030  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversation.jsx:122-124`
- vNext now: `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:40-44`, `src/app/(authenticated)/tpo/team/page.tsx:74-78`
- Fix: Legacy failed read displays Ant Alert with Retry and skeleton, vNext team list catches failure and thread page says tables not registered; provide retry CTA distinct from empty conversations.

## G2-3-022-035  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:123-177`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:105-153`
- Fix: Legacy People workload cards grid vs vNext min768 two-column list with border-bottom. Match avatar, badges, count layout and mobile collapse after screenshots.

## G2-3-022-037  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:29-44`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:154-209`
- Fix: Legacy filter chips select view on team conversation list, vNext uses URL links and aria-current=page. Preserve keyboard selected state/announcements and focus on filter updates.

## G2-3-022-040  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:59-66`
- vNext now: `src/modules/placements/tpo-team-internal-read-service.ts:13-98`, `src/app/(authenticated)/tpo/team/page.tsx:74-79`
- Fix: Legacy full thread list and separate search result, vNext `listMyTpoInternalThreads` pages100 and applies filters to fetched page; global filter counts/mentions may be incomplete. Move filters into SQL before pagination.

## G2-3-022-044  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:62-63`, `153-157`
- vNext now: `src/modules/placements/tpo-team-internal-read-service.ts:13-98`, `src/app/(authenticated)/tpo/team/page.tsx:154-209`
- Fix: Legacy unread/summary/lookup endpoints feed shell indicators and cross-workspace navigation; vNext list/shell counters and team page derived separately. Confirm source wiring and correctness after writes.

## G2-4-028-005  [P2] GAP  facet F01  effort S
- Legacy: router.replace avoids history stack entry (`docs/legacy-source/frontend/src/pages/tpo/team.js:14-18`)
- vNext now: Team tabs navigate via links (`src/app/(authenticated)/tpo/team/page.tsx:79-86`)
- Fix: Use server replace-equivalent history semantics.

## G2-4-028-014  [P2] GAP  facet F04  effort S
- Legacy: Card fields name/kind/away/drives live and review/companies (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:143-160`)
- vNext now: Role labels and different workload breakdown (`src/app/(authenticated)/tpo/team/page.tsx:105-139`)
- Fix: Restore kind and live-review counts on canonical People.
