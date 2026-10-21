# Work packet (wave 2): edit src/app/(authenticated)/tpo/team/[threadId]/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-19-031-024  [P2] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoTeamThreadService.java:226-264` — Team open returns messages, participants, open asks and decision history.
- vNext now: `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:63-85` — New private thread has decisions/tools, not arbitrary member roster/context facts.
- Fix: Add participant list and object facts once multi-member threads ship.

## G2-3-022-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:45-90`, `docs/legacy-source/frontend/src/components/tpo/team/TeamConversation.jsx:125-154`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:154-209`, `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:57-78`
- Fix: Legacy Team Conversations embeds selected conversation beside list and context/details; vNext redirects into standalone thread page. Align dual-pane/back links and page width.

## G2-3-022-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversation.jsx:140-160`
- vNext now: `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:58-85`
- Fix: Legacy title row shows private/topic type chips and participant names; vNext PageHeader states `Private placement-team conversation` and puts Decisions in aside. Match header badges and counts.

## G2-3-022-012  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:41-44`, `109-112`
- vNext now: `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:63-72`
- Fix: Legacy topic update supports title and isPrivate boolean; vNext rename changes topic but no equivalent privacy toggle evidenced. Add permissioned topic privacy control and confirmation.

## G2-3-022-019  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversation.jsx:105-120`, `180-185`
- vNext now: `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:63-78`
- Fix: Legacy topic privacy/public conversion and Leave ask for confirmation; vNext Conversation tools disclosure exposes rename/follow/mute but lacks group privacy/leave prompts. Restore only where group model exists.

## G2-3-022-030  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversation.jsx:122-124`
- vNext now: `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:40-44`, `src/app/(authenticated)/tpo/team/page.tsx:74-78`
- Fix: Legacy failed read displays Ant Alert with Retry and skeleton, vNext team list catches failure and thread page says tables not registered; provide retry CTA distinct from empty conversations.

## G2-3-022-038  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:85-112`
- vNext now: `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:58-78`
- Fix: Legacy statuses ADDED/OK/LEFT, topic `Private topic`, and follow/mute prompts differ from VNext `Private placement-team conversation`, `Conversation tools` and pair labels. Restore literal old user-facing copy where mapped.

## G2-3-022-039  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversation.jsx:105-120`, `180-185`
- vNext now: `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:79-108`
- Fix: Legacy `Open to the whole team`, `Make private`, `Leave this conversation?`, `Delete this message?` warnings are not all represented in new pair-only UI; capture exact modal strings.
