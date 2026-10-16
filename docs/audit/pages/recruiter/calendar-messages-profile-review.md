# Recruiter / calendar-messages-profile: Round R review

Reviewer: Claude Sonnet 5.5 (read-only, code only), 2026-10-16. Judged against current main (origin/main cf0116d1c plus the chat-7 and chat-2 merges 451dfe151 and 68e3036a4). Round A file: `docs/audit/pages/recruiter/calendar-messages-profile.md` (opened only after my own audit).

## 1. Summary

Round A gaps 48: CONFIRMED 43, WRONG 4 (01, 17, 19, 44), SEVERITY-CHANGE 1 (45), MISSED 4 (R01 to R04).
Discrepancy rate = (4 + 4 + 1) / (48 + 4) = 9 / 52 = 17.3%.

Two of the four WRONG rows (01 slots, 17 TPO bell) were true when Round A was written and were closed by chat-7 fixes (b9b3dbbe2, 6e0d32eac) that landed on main. Gap 08 is still open: the fix 47177b2d7 was undone by the merge 451dfe151 and a unit test now pins `/hr/messages` as the recruiter Messages href.

My independent method: read legacy `pages/recruiter/{calendar,messages,profile,company}.js`, `recruiter-invite/[token].js`, `RecruiterNotificationBell.jsx`, `RecruiterTopBar.jsx`, `useRecruiterCollege.js`, `NoCollegeSession.jsx` (all `_hr-tpo-fe` at lms-dev-2026) and backend `RecruiterSelfController`, `RecruiterCollegeController`, `RecruiterDriveController` (calendar, messages), `RecruiterTodayService.calendar`, `RecruiterNotificationService`, `TpoMessagesService`, `RecruiterMessageEmailService`, `RecruiterInviteService`, `RecruiterInviteCodeService`, `PublicRecruiterInviteController`; then vNext `hr/calendar`, `hr/conversations`, `hr/messages`, `hr/profile`, `components/hr/*`, `components/tpo/recruiter-invite-landing.tsx`, `components/placements/public-recruiter-join-form.tsx`, the calendar, conversation, notification and join services.

## 2. Round A gap verdicts

| Round A gap ID | Verdict | Note |
| --- | --- | --- |
| REC-calendar-messages-profile-01 | WRONG (closed on main) | `recruiter-calendar-service.ts` now selects `hrInterviewSlots` (PROPOSED, OFFERED, BOOKED) and `hr/calendar/page.tsx` shows "Interview slot" and "Waiting for the cell" for PROPOSED. Commits b9b3dbbe2, c567c11bf. |
| -02 | CONFIRMED | vNext needs round status SCHEDULED or COMPLETED and includes CLOSED drives (recruiter-calendar-service.ts:154-160,190-193); legacy SQL has no round status filter and PUBLISHED only. |
| -03 | CONFIRMED | Start time only in vNext cards; legacy shows "h:mm A to h:mm A" (calendar.js:109). |
| -04 | CONFIRMED | vNext deadline title "Application deadline: {drive}" (recruiter-calendar-model.ts:85); legacy "Applications close". |
| -05 | CONFIRMED | Copy differs; eyebrow, IST sentence. |
| -06 | CONFIRMED | Multi-college merge without college label. |
| -07 | CONFIRMED | S4, UNCONFIRMED part stays (see section 5). |
| -08 | CONFIRMED | Still open on main. Sidebar Messages is `/hr/messages` (shell-model.ts:210), the notification inbox. The fix 47177b2d7 was reverted in the merge; tests/unit/recruiter-message-navigation.test.ts now asserts `/hr/messages`. Decision needed from the owner; legacy Messages is the conversations inbox. |
| -09 | CONFIRMED | |
| -10 | CONFIRMED | |
| -11 | CONFIRMED | |
| -12 | CONFIRMED | |
| -13 | CONFIRMED | No pulse and no polling in any hr conversation component. |
| -14 | CONFIRMED | `readRecruiterThreadMessages` never writes (tpo-messaging-service.ts:600-640). |
| -15 | CONFIRMED | |
| -16 | CONFIRMED | |
| -17 | WRONG (closed on main) | `sendRecruiterThreadMessage` and `sendThreadMessage` now call `notifyTpoOfRecruiterMessage` (tpo-messaging-service.ts:545-548,578-581; recruiter-message-tpo-notification-service.ts). Commit 6e0d32eac. The delayed unread email to the other party is a separate item, see R01 (it is the recruiter-side email that is missing). |
| -18 | CONFIRMED | |
| -19 | WRONG | `hr/messages/error.tsx`, `hr/messages/loading.tsx`, `hr/profile/error.tsx`, `hr/profile/loading.tsx` all exist. The residual difference is wording only (global in-page copy "Could not load your messages" / "We couldn't load your profile"), which is S4 COPY at most. |
| -20 | CONFIRMED | |
| -21 | CONFIRMED | `AccountActions` is a plain "Notifications" link to `/notifications` (account-actions.tsx:40-45); no bell, badge or drawer for recruiters. |
| -22 | CONFIRMED | `HR_NOTIFICATION_EVENTS` has only `placements.job.published` and `placements.job.closed` (hr-notifications-model.ts:7). |
| -23 | CONFIRMED | |
| -24 | CONFIRMED | |
| -25 | CONFIRMED | Mobile is read-only "Mobile" (hr/profile/page.tsx:34-37). The public join form does collect a phone (public-recruiter-join-form.tsx:110) but with no validation, see R04. |
| -26 | CONFIRMED | |
| -27 | CONFIRMED | |
| -28 | CONFIRMED | |
| -29 | CONFIRMED | No valid-until in the grants overview; the expiry policy exists (`recruiter-grant-expiry-policy`), so the data is available to show. |
| -30 | CONFIRMED | Owner decision item. |
| -31 | CONFIRMED | No stage funnel in the reports route. |
| -32 | CONFIRMED | |
| -33 | CONFIRMED | |
| -34 | CONFIRMED | |
| -35 | CONFIRMED | |
| -36 | CONFIRMED | |
| -37 | CONFIRMED | |
| -38 | CONFIRMED | Landing component unchanged since cf3e30911: Join permanently disabled, no send-code route under `app/api/public/recruiter-invite/[token]/` (only accept, not-hiring, opened, unsubscribe and the preview). Note: chat-2 added join forms for `/college-join` and `/company-join` (the public network links), not for the per-lead `/recruiter-invite/[token]`; the invite page still cannot onboard. |
| -39 | CONFIRMED | |
| -40 | CONFIRMED | |
| -41 | CONFIRMED | |
| -42 | CONFIRMED | |
| -43 | CONFIRMED | |
| -44 | WRONG (closed on main, residual in 45 and R04) | `/company-join/[token]` now renders `PublicRecruiterJoinForm` with send-code and join (app/company-join/[token]/page.tsx; routes `app/api/public/company-join/{send-code,join}`; commits 5b47d651a, 0999c1f65, b789b1861). The heading, "Send me a code", "Join {college} placements", "Send a new code" strings match legacy. Whether it works on dev depends on env gates, see section 5. |
| -45 | SEVERITY-CHANGE S2 to S3 | Preview, invalid-link copy ("This link is no longer valid" / "Ask the placement cell for a new one."), and the success title "You now have access to {college}" exist now. What remains is error mapping (see R04) and the distinct "You already have access" text (join-service returns ALREADY_JOINED but the form ignores it). A form-level copy and mapping gap, not a blocked workflow. |
| -46 | CONFIRMED | No `PENDING_HR` or pending-invite handling anywhere in `src`. |
| -47 | CONFIRMED | |
| -48 | CONFIRMED | |

## 3. MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
| --- | --- | --- | --- | --- | --- |
| REC-calendar-messages-profile-R01 | The recruiter is never emailed about placement-cell messages that wait unread, and a reply by email does not come back into the conversation. Legacy: a scheduler emails the recruiter when the cell's messages stay unread (15 min wait, 2 min quiet, 45 min cap, 6 h between emails), the email quotes the latest 3 messages and its Reply-To is a per-thread address that posts the reply into the thread (`via` EMAIL). Without this a recruiter who is not on the site never learns the cell wrote | SIDE-EFFECT | S2 | RecruiterMessageEmailService.java:21-38,61-116; TpoMessagesService.java:164-170 (`postEmailReply`), 176-183 (reply token); PublicInboundEmailController | No recruiter-bound message email and no inbound reply path: `sendThreadMessage` only notifies on RECRUITER actor (tpo-messaging-service.ts:545-548); no `recruiter-message` mail template or job under `src`; only `modules/inbound-mail/message-model.ts` exists. Round A 17 covered only the recruiter-to-TPO direction |
| REC-calendar-messages-profile-R02 | The conversation detail page does not say which drive (or "General") the thread is about, and gives no link to that drive. Header is always "Placement cell discussion". The list shows the drive title, but after opening it a recruiter with several drive threads cannot tell them apart. Legacy opens a drive thread inside that drive's Messages tab (drive context visible) and titles the General drawer "Placement cell · General" | MISSING-FIELD | S3 | messages.js:136 (`openThread` to `/recruiter/drives/{jobId}?tab=messages`), 225 (drawer title); TpoMessagesService.java:222 (subject "Company · Job title") | hr/conversations/[threadId]/page.tsx:39-41 (generic PageHeader; `result.thread.jobId` is available but never shown) |
| REC-calendar-messages-profile-R03 | Stale and self-contradicting copy on the notification inbox: the footer says "Conversation threads and replies remain unavailable. Read acknowledgement applies only to your own employer-scoped notification." while threads and replies are live one click away, and the page also tells the user the inbox is unrelated to conversations. Because the sidebar Messages row lands here (gap 08), a recruiter is told on their main Messages page that replies do not exist | COPY | S3 | n/a (legacy has no such text; messages.js:152-157) | hr/messages/page.tsx:102-103 (last paragraph), 40-41 |
| REC-calendar-messages-profile-R04 | The recruiter join form (`/college-join` and `/company-join`, now the main onboarding path) collapses every server answer into two strings ("We couldn't send the code. Please try again." and "Something went wrong. Please try again.") and reads only `response.ok`. The API returns ACCESS_REMOVED (400), RATE_LIMITED (429) and SERVICE_NOT_READY (503), and the service returns ALREADY_JOINED, but none reach the person: no "Too many codes. Try again in an hour.", no wrong or expired code message (legacy WRONG_CODE, CODE_EXPIRED, CODE_LOCKED), no "That access was removed", no "You already have access to {college}", no mobile validation (legacy INVALID_MOBILE "Enter a valid 10-digit mobile number, or leave it blank", max 14), no "Use your {company} email" for the company link, and errors are never shown under the field. The page also asks for the code before the wrong-code error can be told apart from a network failure | VALIDATION | S2 | recruiter-invite/[token].js:8-18,95-104; RecruiterInviteCodeService.java:60-68,101-111; RecruiterInviteService.java:177-188 | components/placements/public-recruiter-join-form.tsx:35-45,66-82,110-117 (generic catch, `phone` only `max(20)`); app/api/public/company-join/join/route.ts:19-27 (maps to ACCESS_REMOVED, COULD_NOT_JOIN, SERVICE_NOT_READY); public-join/join-service.ts:36,158-161 |

## 4. WRONG and SEVERITY-CHANGE details

- 01: vNext now has SLOT events. Verified in `recruiter-calendar-service.ts` (slots query with statuses PROPOSED, OFFERED, BOOKED within the window, authorized job ids only), and `hr/calendar/page.tsx` badge text "Waiting for the cell" for PROPOSED slots and "Interview slot" kind label. Slot click target is the interview-slots page.
- 17: vNext now writes the TPO bell on recruiter messages through `notifyTpoOfRecruiterMessage` (called inside the send transaction). Still unknown: the later unread email to the TPO (legacy RecruiterMessageEmailService is recruiter-bound, so there is no TPO email in legacy either; this part of Round A's wording was a misreading).
- 19: error and loading boundaries exist for `/hr/messages` and `/hr/profile`.
- 44: company-join page is a working form (behind env gates). Residual issues are in 45 and R04.
- 45 S2 to S3: the workflow is no longer blocked; remaining items are message mapping and the ALREADY_JOINED text.

## 5. UNCONFIRMED items and how to confirm (live check on the deployed dev site)

1. Public join env gates: `/company-join/{token}` and `/college-join/{token}` return 503 SERVICE_NOT_READY when `PUBLIC_JOIN_TRUSTED_PROXY_READY`, OTP and delivery gates are not set. Open a real link on dev, send a code, watch whether an email arrives and whether the form fails with the generic text (R04).
2. After a successful join, can the new recruiter actually sign in on the college address and see `/hr/home`? (Recruiter grant created by `acceptPublicRecruiterJoin`; verify the account, grant row and expiry date.)
3. Gap 07: whether `/hr/placements/jobs/{id}` has a Rounds tab or anchor for round clicks.
4. Gap 22 side: whether the generic `/notifications` page shows any recruiter events (placements.job.* only expected).
5. Nav destination (gap 08): confirm on dev which page the sidebar Messages row opens for a recruiter-only account, and decide with the owner whether to restore 47177b2d7 and update the pinned test.
6. Calendar scope (gap 02): create a draft or PENDING round with a date on a published drive and see whether it appears in legacy and in vNext.
7. R01: send a placement-cell message to a test recruiter and wait 20 minutes on dev; check for an email and that replying by email posts into the thread.
8. Time zone: legacy shows times in the viewer's local zone (moment local), vNext always IST; confirm the owner accepts IST-only (all Indian colleges, so likely an intentional difference).


## REC-calendar-messages-profile-R02 source checkpoint — 2026-10-17

Recruiter conversation detail now presents the authorized drive title or **General**, and drive threads link back to `/recruiter/drives/{jobId}?tab=messages`. The title is selected inside the existing recruiter-college company grant-scoped read. Focused unit tests were authored; live PostgreSQL, typecheck and browser verification remain open.
