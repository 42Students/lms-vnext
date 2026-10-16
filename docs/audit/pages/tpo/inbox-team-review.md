# TPO / Inbox + Team + Announcements + Notifications: Round R review

Reviewed: 2026-10-16 by Round R reviewer (Sonnet 5.5). Round A file: `docs/audit/pages/tpo/inbox-team.md` (opened only after my own audit was written down). Judged against `origin/main` at `a2089e2af` (includes chat-2 and chat-7 work: recruiter-message TPO bell, public recruiter-joined bell).

Legacy sources (lms-dev-2026): `_hr-tpo-fe/src/{pages/tpo/{messages,team,announcements,notifications}.js, components/tpo/{MessagesPanel.js,TpoBellPanel.jsx,TpoTopBar.js,ui/useLivePulse.js,team/*,announcements/*}}`; backend `42LMS-BACKEND/lms/.../service/tpo/{TpoMessagesService,TpoTeamThreadService,TpoTeamPeopleService,TpoTeamService,PlacementAnnouncementService,TpoAuditService}.java`, `controller/tpo/{TpoHubController,TpoTeamThreadController,TpoAnnouncementController,TpoWorkspaceController}.java`, `security/TpoTeamAccessFilter.java`.

## 1. Summary

Round A gaps: 68. CONFIRMED 65, WRONG 0, SEVERITY-CHANGE 3 (03, 14, 60; 03 and 60 are also partly stale on current main). MISSED 7 (all S3/S4). Discrepancy rate = (7 + 0 + 3) / (68 + 7) = 10 / 75 = 13.3% (under the 15% re-audit threshold).

My independent audit reproduced almost every Round A row (messages: read/reply/compose/filters/live pulse/drafts/email relay; team: Everyone, object threads, topics, asks, decisions, edit/delete, search, filters, context, People workload, away, add/remove, assign; announcements: audiences, reach, undo, read tracking, remind, button, schedule, edit; notifications: bell drawer, feed, producers). Round A is accurate on vNext facts; where it is stale it is because chat-7 and chat-2 landed after it was written.

## 2. Round A gaps: verdicts

| Round A gap ID | Verdict | Note |
| --- | --- | --- |
| TPO-inbox-team-01 | CONFIRMED | `messages/page.tsx` selects no bodies; `openTpoMessageThread`/`sendThreadMessage`/`listThreadMessages` in `tpo-messaging-service.ts` have no TPO route or page (callers are only HR inbox services). S1 stands. |
| TPO-inbox-team-02 | CONFIRMED | Same: no API route under `api/placements/tpo/messages` except `notifications/read`. |
| TPO-inbox-team-03 | SEVERITY-CHANGE | S1 to S2, and the first half is now WRONG on current main: `recruiter-message-tpo-notification-service.ts` (called from `tpo-messaging-service.ts:552,591,764`) writes one in-app bell per active TPO user (not the sender), title "New message from a recruiter". Still missing: Messages counter on the top bar (`tpo/layout.tsx` plain "Messages" link), the "A recruiter replied by email" variant, the 120-char body preview, and a link to the conversation (see TPO-inbox-team-R01). |
| TPO-inbox-team-04 | CONFIRMED | Legacy `TpoMessagesService.messages()` runs `UPDATE tpo_message SET read_at = NOW()` on open (a GET that writes; vNext needs an explicit POST per AGENTS rule). |
| TPO-inbox-team-05 | CONFIRMED | |
| TPO-inbox-team-06 | CONFIRMED | |
| TPO-inbox-team-07 | CONFIRMED | |
| TPO-inbox-team-08 | CONFIRMED | Add detail for the builder: `RecruiterMessageEmailService` constants WAIT 15 min unread, QUIET 2 min, LATEST 45 min, GAP 6 h, SHOWN 3 messages. |
| TPO-inbox-team-09 | CONFIRMED | |
| TPO-inbox-team-10 | CONFIRMED | |
| TPO-inbox-team-11 | CONFIRMED | |
| TPO-inbox-team-12 | CONFIRMED | |
| TPO-inbox-team-13 | CONFIRMED | |
| TPO-inbox-team-14 | SEVERITY-CHANGE | S4 to S3. `/tpo/messages/notifications` is now the `actionHref` of the new recruiter-message bell (`recruiterMessageTpoHref()`), so it is the landing page for the most important inbox event and shows only event-type labels. |
| TPO-inbox-team-15 | CONFIRMED | |
| TPO-inbox-team-16 | CONFIRMED | |
| TPO-inbox-team-17 | CONFIRMED | Topic max 160 in `team/page.tsx` form vs legacy 200 confirmed. |
| TPO-inbox-team-18 | CONFIRMED | `tpo-team-internal-read-service.ts` selects only id/topic/createdAt, `.limit(50)`. |
| TPO-inbox-team-19 | CONFIRMED | |
| TPO-inbox-team-20 | CONFIRMED | Related defect added as TPO-inbox-team-R05. |
| TPO-inbox-team-21 | CONFIRMED | |
| TPO-inbox-team-22 | CONFIRMED | |
| TPO-inbox-team-23 | CONFIRMED | |
| TPO-inbox-team-24 | CONFIRMED | |
| TPO-inbox-team-25 | CONFIRMED | `team/[threadId]/page.tsx` prints "You" or "Team member". |
| TPO-inbox-team-26 | CONFIRMED | |
| TPO-inbox-team-27 | CONFIRMED | |
| TPO-inbox-team-28 | CONFIRMED | Legacy `counts` returns `team` and `announcements` (TpoWorkspaceController `counts()`). |
| TPO-inbox-team-29 | CONFIRMED | |
| TPO-inbox-team-30 | CONFIRMED | |
| TPO-inbox-team-31 | CONFIRMED | |
| TPO-inbox-team-32 | CONFIRMED | |
| TPO-inbox-team-33 | CONFIRMED | |
| TPO-inbox-team-34 | CONFIRMED | |
| TPO-inbox-team-35 | CONFIRMED | Legacy directory `LIMIT 30` (`TpoTeamService.java:65`) and role must be TPO_ADMIN (`:72`) confirmed. |
| TPO-inbox-team-36 | CONFIRMED | Messages "You can't remove yourself. Ask another TPO admin." (`TpoTeamService.java:103`), "Choose someone from the placement team to take them over" (`:109`), "They still own recruiters or drives, or have open asks. Choose who takes them over." all confirmed. |
| TPO-inbox-team-37 | CONFIRMED | `TPO_TEAM_ROLE_LABELS` still has Faculty Coordinator / Student Coordinator. |
| TPO-inbox-team-38 | CONFIRMED | Generalised in TPO-inbox-team-R02. |
| TPO-inbox-team-39 | CONFIRMED | |
| TPO-inbox-team-40 | CONFIRMED | |
| TPO-inbox-team-41 | CONFIRMED | `PAGE_SIZE = 40` in `tpo-team-conversation-service.ts`. |
| TPO-inbox-team-42 | CONFIRMED | |
| TPO-inbox-team-43 | CONFIRMED | `createTpoNotice` hard-codes `receiverType:"COLLEGE"`. S1 stands: a placement notice goes to every college member, staff included. |
| TPO-inbox-team-44 | CONFIRMED | |
| TPO-inbox-team-45 | CONFIRMED | |
| TPO-inbox-team-46 | CONFIRMED | `createTpoNotice` inserts the announcement and one activity event only; no `inAppNotifications` insert. |
| TPO-inbox-team-47 | CONFIRMED | |
| TPO-inbox-team-48 | CONFIRMED | `tpo-placement-read-service.ts` filters `scheduledAt <= now` and `expiresAt > now` on non-deleted tabs. |
| TPO-inbox-team-49 | CONFIRMED | |
| TPO-inbox-team-50 | CONFIRMED | |
| TPO-inbox-team-51 | CONFIRMED | |
| TPO-inbox-team-52 | CONFIRMED | |
| TPO-inbox-team-53 | CONFIRMED | `canUndoTpoAnnouncementSend` is evaluated at render time. |
| TPO-inbox-team-54 | CONFIRMED | |
| TPO-inbox-team-55 | CONFIRMED | `api/placements/tpo/announcements/route.ts` returns `NextResponse.json({error:"INVALID_BODY"},{status:400})` to a plain form post. |
| TPO-inbox-team-56 | CONFIRMED | |
| TPO-inbox-team-57 | CONFIRMED | Legacy `update`/`delete` check college only (`PlacementAnnouncementService` requireOwn by college), no author check. |
| TPO-inbox-team-58 | CONFIRMED | Legacy 200/8000, vNext 255/10000. |
| TPO-inbox-team-59 | CONFIRMED | |
| TPO-inbox-team-60 | SEVERITY-CHANGE | S1 to S2 and partly stale. Reason for S2: legacy `TpoBellPanel` doc says the bell is "things that happened, for information; things to do live on Home under Needs you", so the actionable drive request / student request / escalation still reach Requests, Drives and Home. Stale evidence: TPO-addressed producers on current main are now Team thread events, recruiter message (chat-7), public recruiter joined (`public-join/join-service.ts:193`, chat-2), verification updates. About 22 of the ~25 legacy bell types are still absent. |
| TPO-inbox-team-61 | CONFIRMED | `tpo-bell-panel.tsx` shows `items.slice(0,10)`; "Open record" is a plain Link, no read call. |
| TPO-inbox-team-62 | CONFIRMED | |
| TPO-inbox-team-63 | CONFIRMED | |
| TPO-inbox-team-64 | CONFIRMED | |
| TPO-inbox-team-65 | CONFIRMED | |
| TPO-inbox-team-66 | CONFIRMED | |
| TPO-inbox-team-67 | CONFIRMED | Legacy `BELL_UNREAD_DAYS = 30` confirmed. |
| TPO-inbox-team-68 | CONFIRMED | |

## 3. MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
| --- | --- | --- | --- | --- | --- |
| TPO-inbox-team-R01 | The new recruiter-message bell (chat-7) is a dead end and thinner than legacy: it links to `/tpo/messages/notifications` (a labels-only list that cannot show the message) instead of the conversation, body is the fixed text "A recruiter sent a message to the placement cell." (legacy: first 120 chars of the message, then "…"), and there is no "A recruiter replied by email" title variant. Messages overview also has no unread count in the top bar. | SIDE-EFFECT | S3 | `TpoMessagesService.java:213-214` (title variants, 120-char preview, link `/tpo/messages`); `TpoTopBar.js:102-103` | `recruiter-message-tpo-notification-model.ts` (`recruiterMessageTpoHref`), `recruiter-message-tpo-notification-service.ts:38-42` |
| TPO-inbox-team-R02 | "Placement team" is defined differently on every page, not only Team: legacy lets TPO, college admin, super admin and faculty added as TPO admin use Messages, Team, Announcements and the bell (`TpoTeamAccessFilter`), and bell items with no target go to all of them. vNext pages require the `TPO` membership role (`hasMembershipRole(context,"TPO")` then redirect `/dashboard`), and the recruiter-message and recruiter-joined bells go only to users holding role `TPO`. A college-admin or coordinator account therefore sees no Messages/Announcements/bell. | PERMISSION | S3 | `TpoTeamAccessFilter.java:44-60`; `TpoAuditService.java:94-100` (college-wide bell); `TpoTeamService.java:109` (admin = faculty_type 4/14) | `messages/page.tsx:59-64`, `announcements/page.tsx` (role check), `recruiter-message-tpo-notification-service.ts:27-35`, `public-join/join-service.ts:186-193` |
| TPO-inbox-team-R03 | Legacy URL state is rejected: `/tpo/announcements?tab=from42` (and `students`), which the legacy bell item, sidebar badge and Home links use, fails vNext's tab enum (`yours`/`from-42`/`deleted`) and renders "Invalid tab. Return to announcements". Any legacy-style deep link or the exact-wording tab names "To your students"/"From 42" cannot be reached by URL. | STATE | S3 | `announcements.js:264, 334` (`?tab=from42`); `PlacementAnnouncementService.java:386` (bell link `/tpo/announcements?tab=from42`) | `announcements/page.tsx:20-23`; `tpo-placement-read-model.ts:2` |
| TPO-inbox-team-R04 | Announcement lists are silently capped at 100 rows with no count, no paging and no "showing first 100" note; "Yours" also lists colleagues' notices (no actions) mixed with the author's own. | STATE | S4 | `AnnouncementList.jsx` (full list, per-cell filter); `PlacementAnnouncementService.forCollegeStudents` | `tpo-placement-read-service.ts:44` (`.limit(100)`) |
| TPO-inbox-team-R05 | Team unread is coupled to bell read state: a thread's "n unread" is the count of unread `inAppNotifications` whose `actionHref` is `/tpo/team/<id>`. Clicking "Mark all as read" in the bell or on /tpo/notifications silently clears every Team thread's unread count, and opening a thread never clears it (only the explicit "Mark this conversation's alerts as read" button). Legacy keeps separate per-thread read pointers that clear when the conversation is opened. | STATE | S3 | `TpoTeamThreadService` unread per followed thread (counts `team` in `TpoWorkspaceController.counts`); bell read-all touches only `tpo_bell_read` | `tpo-team-internal-read-service.ts:30-45`; `tpo-notifications-service.ts` `markAllOwnTpoNotificationsRead` |
| TPO-inbox-team-R06 | Notification recipients are fixed at event time. A TPO added later sees none of the earlier notifications, and a TPO removed/re-added loses history; legacy shares one college feed (plus per-person items) so a new teammate sees recent items (older than 30 days shown as read). | STATE | S4 | `TpoAuditService.java:114-136` (`bellFeed`, 30-day rule) | `recruiter-message-tpo-notification-service.ts:27-43` (per-member rows at insert time) |
| TPO-inbox-team-R07 | Accessibility and keyboard details to carry into the Messages build: thread rows are `role="button"` with Enter/Space activation and `aria-current`; message list is `role="log" aria-live="polite" aria-label="Conversation messages"` with `aria-busy`; the back control is labelled "All conversations"; composer has `aria-label="Message"`; Team search hint "Search  (press /)" and `aria-pressed` on filter chips. vNext table pages have none of these (and no `/` shortcut). | A11Y | S4 | `MessagesPanel.js:310-320, 387-390, 352`; `TeamConversations.jsx:91-109, 133` | `messages/page.tsx` (table), `team/[threadId]/page.tsx` (`aria-label="Private team messages"` only) |

## 4. WRONG / SEVERITY-CHANGE details

- TPO-inbox-team-03 (S1 to S2, partly WRONG). Round A section 1A says a recruiter's message never alerts the TPO and section 2D says no producer exists for recruiter messages. On current main `sendRecruiterThreadMessage` calls `notifyTpoOfRecruiterMessage` inside the same transaction (`tpo-messaging-service.ts:552, 591, 764`), creating an `activityEvents` row (`placements.recruiter.message.received`) and one `inAppNotifications` row per active TPO user. What remains broken is the counter, the link target and the body (TPO-inbox-team-R01). The gap still matters but no longer "blocks" discovery, so S2.
- TPO-inbox-team-60 (S1 to S2, partly stale). See table above. Round A's claim "TPO inserts only in tpo-team-internal-*" is stale: add `recruiter-message-tpo-notification-service.ts` and `public-join/join-service.ts:193`. Remaining producers to build (legacy types): RECRUITER_JOINED (invite accepted paths), RECRUITER_INVITE_PENDING, RECRUITER_NOT_HIRING, RECRUITER_UNSUBSCRIBED, RECRUITER_REVIEWING, RECRUITER_ROUND_ADDED, RECRUITER_RESULTS, RECRUITER_SLOTS, RECRUITER_SELECTIONS, COMPANY_REQUEST, DRIVE_CHANGES_MADE, DRIVE_REQUEST (two titles), STUDENTS_ADDED, STUDENT_REQUEST, REQUEST_ESCALATED, OFFER_ACCEPTED/DECLINED, SHARE_OPENED, SHARE_LOCKED, INELIGIBLE_FLAGGED, RECRUIT_FROM_US, ANNOUNCEMENT_FROM_42, plus the per-person TEAM_* types (TEAM_ADDED, TEAM_MENTION, TEAM_ASK, TEAM_ASK_DONE, TEAM_ASSIGNED).
- TPO-inbox-team-14 (S4 to S3). See table above.

## 5. Extra findings that are not gaps

- Audit events (resolves a Round A UNCONFIRMED): legacy writes NO `tpo_audit_log` row for sending messages, Team thread actions, or announcements. The only Team audit rows are `TEAM_MEMBER_SET` and `TEAM_MEMBER_REMOVED` (`TpoTeamService.java:78, 128`). vNext's audit events for announcements and team threads are therefore an improvement, not a parity item. When gaps 35/36 are built the two legacy actions must still be audited.
- Round A false-gap check: notification date groups (Today, Yesterday, This week, Earlier) in `notification-groups.ts` already match legacy; no gap needed. Unread filter label "Unread (n)" matches.
- Legacy dev-only status (Team, Announcements) is correct per inventory B; reaching them is gated by `filterNavByFeatureFlags` which neither audit traced (UNCONFIRMED below).

## 6. UNCONFIRMED items and how to confirm (batch for the live dev check)

1. Which Messages source is live on dev (conversation tables vs notification fallback): open `/tpo/messages` and read the "Current source" banner. Decides how much of gaps 01/02/05/06 is visible.
2. Bell after a recruiter message: send one from the recruiter account on dev, check the TPO bell title/body/link and that the link opens `/tpo/messages/notifications` (R01).
3. Team unread coupling (R05): create a Team thread as TPO A, log in as TPO B, note the unread count, click Mark all as read in the bell, reload `/tpo/team`; unread should drop to 0 without opening the thread.
4. College-admin and TPO-admin access (R02): log in as a college-admin-only account on dev and open `/tpo/messages`, `/tpo/announcements`; legacy lets them in.
5. Announcement deep links (R03): load `/tpo/announcements?tab=from42` on dev; expect "Invalid tab".
6. Legacy feature flag gating of Team/Announcements (`filterNavByFeatureFlags`, SB:323-330): check on the legacy dev stack with a college that has placements disabled.
7. Whether a scheduled notice (future `scheduledAt`) becomes visible to students at the right time and whether the author can still find it (gap 48): create one for +2 min on dev, watch Yours and the student notice inbox.
8. Email relay timing (gap 08): requires legacy stack; send a TPO message, wait 15 minutes unread, confirm one email with up to 3 messages and Reply-To address, and that a second within 6 hours is not sent.
