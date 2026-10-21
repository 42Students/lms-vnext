# Work packet (wave 2): edit src/app/(authenticated)/tpo/messages/page.tsx

31 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-2/l19-u022-tpo-hub-controller.md, docs/audit/gap2/lane-3/l11-u016-tpo-messages.md, docs/audit/gap2/lane-4/tpo-team-redirect.md

## G2-19-031-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:270-291` — Inbox left pane contains New message, All/Reply/Unread and search.
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:218-272` — Stats summary and Communication filters precede tabular threads.
- Fix: Use legacy inbox-first pane hierarchy; collapse extra metrics.

## G2-19-031-081  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:294-304` — Inbox initial skeleton, retry, stale-data retention.
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:82-103` — New filter error; no stale success-cache on fetch failure.
- Fix: Skeleton/stale-with-retry states.

## G2-19-031-115  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:59-65` — Recruiter 4sec pulse reload only if version changes.
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:179-179` — TpoLiveRefresh interval4000 rerenders; DB version gate unclear.
- Fix: Use lightweight version pulse and visibility guard.

## G2-19-022-073  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:312-315 GET /messages/pulse version
- vNext now: src/app/(authenticated)/tpo/messages/page.tsx:9-30 TpoLiveRefresh hook
- Fix: Verify version/poll equality and stale-thread recovery

## G2-11-016-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:27-27`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:161-171`
- Fix: Legacy active sidebar item messages for both tabs; vNext separate Messages and Team navigation, clone sidebar highlight.

## G2-11-016-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:61-69`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:161-181`
- Fix: Legacy recruiter inbox embedded in PageShell Card and MessagePanel; vNext shows page header, metric/filter sections and DataTable.

## G2-11-016-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:40-45`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:163-175`
- Fix: Legacy tab strip directly below subtitle inside Card header; vNext New message + More TPO tools actions above metrics and status.

## G2-11-016-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:266-269`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:356-424`
- Fix: Legacy two-pane inbox aside and conversation panel on same page; vNext dense DataTable of threads and separate detail page.

## G2-11-016-010  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:46-48`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:163-167`
- Fix: Exact legacy recruiter subtitle one for each drive and a general one differs from vNext Keep recruiter conversations tied to the right drive...

## G2-11-016-012  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:270-290`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:249-319`
- Fix: Legacy New message primary, All/Reply/Unread segmented chips and Search recruiter or drive; vNext status chips plus collapsible Communication filters.

## G2-11-016-013  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:321-339`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:395-423`
- Fix: Legacy thread list shows avatar/name/company, subject preview, relative time and unread Badge; vNext table fields Participant/Subject/Status/Message records/Last activity/Context.

## G2-11-016-016  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:251-262`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:218-247`
- Fix: Legacy inbox counts unreadThreads and waitingCount from loaded threads; vNext summary counts persisted full-scope conversation records/messages.

## G2-11-016-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:321-339`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:395-424`
- Fix: Legacy each row unread badge and `Waiting for you`, `Access ended`; vNext shows Badge and status per thread with different grouping.

## G2-11-016-020  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:255-263`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:249-294`
- Fix: Legacy client local thread filters ALL/WAITING/UNREAD and live search recruiter/subject/lastBody; vNext query/server ALL/READ/UNREAD/EMPTY + date/status/search.

## G2-11-016-041  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:158-160`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:105-126`
- Fix: Legacy useLivePulse keeps open thread refreshed within seconds; vNext server RSC inbox refreshed on navigation/reload, no same streaming/focus refresh proof.

## G2-11-016-047  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:22-35`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:61-70`
- Fix: Legacy TPO session uses loginUser and facultyId mapping; vNext must have active TPO collegeMembership role, narrower user identity.

## G2-11-016-048  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:23-24`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:71-84`
- Fix: Legacy default recruiters tab and team-only when tab=team; vNext messages list always recruiter and team separate route.

## G2-11-016-052  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:293-305`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:375-385`
- Fix: Legacy No conversations yet/No conversations match search in left panel, vNext No matching communication records / No recruiter threads match these filters.

## G2-11-016-055  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:300-301`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:131-137`
- Fix: Legacy refresh failure retains stale threads with This refresh failed. Retry; vNext server page error may replace list with ErrorState.

## G2-11-016-060  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:266-269`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:385-424`
- Fix: Legacy tablet/desktop split inbox vs thread; vNext mobile card-converted DataTable and separate full-page thread. Compare 375/768/992.

## G2-11-016-063  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:41-44`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:249-260`
- Fix: Legacy tab roles/aria-selected keyboard semantics; vNext status filter links and no Recruiters/Team tab role.

## G2-11-016-078  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:266-349`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:375-424`
- Fix: Legacy two-pane recruiter conversation workspace replaced by table; old shell/menu/canvas matching requires side-by-side panel.

## G2-4-028-045  [P2] GAP  facet F16  effort S
- Legacy: Messages shared card/tab structure (`docs/legacy-source/frontend/src/pages/tpo/messages.js:50-68`)
- vNext now: Dedicated recruiter inbox layout (`src/app/(authenticated)/tpo/messages/page.tsx:121-140`)
- Fix: Mirror mobile tab strip and Messages card.

## G2-4-028-047  [P2] MISSING  facet F17  effort S
- Legacy: role=tablist and aria-selected provided (`docs/legacy-source/frontend/src/pages/tpo/messages.js:40-45`)
- vNext now: No Messages Team tablist (`src/app/(authenticated)/tpo/messages/page.tsx:56-80`)
- Fix: Implement accessible tabs keyboard/focus.

## G2-19-031-082  [P3] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:304-304` — Empty inbox No conversations yet; search No conversations match this search.
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:381-392` — New text No recruiter threads match these filters.
- Fix: Split no threads vs no search hits, exact copy.

## G2-19-031-100  [P3] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:309-320` — Full recruiter row keyboard accessible with 44px hit zone.
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:405-408` — New link on subject only, smaller row hit zone.
- Fix: Full row clickable/keyboard activate.

## G2-19-031-101  [P3] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:309-320` — Conversation accessible name includes recruiter and subject.
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:405-408` — New subject link name lacks recruiter context.
- Fix: aria-label recruiter/subject and aria-current.

## G2-19-031-106  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:287-290` — Search placeholder Search recruiter or drive.
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:315-320` — New placeholder Recruiter, subject or message.
- Fix: Use exact legacy placeholder.

## G2-19-031-108  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:304-304` — Empty copy No conversations yet.
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:381-392` — New No recruiter threads match these filters.
- Fix: Use legacy empty and search-empty strings.

## G2-11-016-065  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:46-48`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:164-167`
- Fix: Legacy recruiter and team subtitles exact copy differs, restore original for page clone.

## G2-11-016-066  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:278-290`
- vNext now: `src/app/(authenticated)/tpo/messages/page.tsx:249-319`
- Fix: All/Reply/Unread filter names now All/Unread etc plus date status; Reply-needed needs direct affordance.
