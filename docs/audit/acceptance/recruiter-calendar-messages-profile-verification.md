# Recruiter calendar/messages/profile – chat-2 round 6

| Gap | Status | Evidence |
| --- | --- | --- |
| REC-calendar-messages-profile-28 | PARTIAL — OPEN | `src/app/(authenticated)/hr/profile/page.tsx` restores exact legacy Profile header, detail/college sections and explanatory strings, named test in `tests/unit/chat2-recruiter-profile-and-lead-parity.test.ts`; combined save and mobile edit still pending. |
| REC-calendar-messages-profile-42 | DONE (source, tests not run) | Existing invite declined state already has exact legacy confirmation copy; named test in `tests/unit/chat2-recruiter-profile-and-lead-parity.test.ts`. |
| REC-calendar-messages-profile-37 | NOT-A-GAP | Existing `/hr/company?tab=reports` deep-link redirects to scoped Reports, preserving collegeId and navigation, verified named test. |
| REC-calendar-messages-profile-47 | PARTIAL — OPEN | Retired `/recruiter` and `/recruiter/colleges` entrypoints now use explicit redirects to canonical Today (`/hr/home`) rather than rendering duplicated surfaces. Named unit tests in `tests/unit/chat2-recruiter-legacy-entrypoints.test.ts`. Global navigation aliases are shell-owned and still require chat-9. |

## Chat-14 reassignment — batch 1 (authored; tests not executed)

| Gap | Status | Evidence |
| --- | --- | --- |
| REC-calendar-messages-profile-12 | DONE | `src/components/hr/recruiter-conversation-reply-form.tsx` intercepts in-app leave with confirmation while retaining beforeunload; `tests/unit/recruiter-chat14-round1.test.ts` — ID-named test |
| REC-calendar-messages-profile-16 | PARTIAL — OPEN | `src/modules/placements/hr-conversation-send-feedback-model.ts` maps 403 to legacy access-ended; server read/disposition still needs consistent ended-access state; named test |
| REC-calendar-messages-profile-25 | DONE | `src/modules/placements/recruiter-profile-details-service.ts`, `src/app/api/placements/recruiter/profile/details/route.ts` + client details editor; optional normalized mobile, same-origin, optimistic CAS, named test |
| REC-calendar-messages-profile-27 | DONE | Same transaction and single Save changes with beforeunload/navigation confirmation and persistent error; named test |
| REC-calendar-messages-profile-28 | DONE | `src/app/(authenticated)/hr/profile/page.tsx` + details editor retain titles, work email and contact-only mobile explanatory copy; named test |
| REC-calendar-messages-profile-37 | NOT-A-GAP | Existing `?tab=reports` deep link redirects to scoped Reports and preserves college; named test |
| REC-calendar-messages-profile-42 | DONE | Existing invite declined/unsubscribed copy already exact; independently inspected `src/components/tpo/recruiter-invite-landing.tsx`; named test |
| REC-calendar-messages-profile-47 | DONE | Existing `/recruiter` and `/recruiter/colleges` redirects both land at canonical Today; named test |
| REC-calendar-messages-profile-R03 | DONE | `src/app/(authenticated)/hr/notifications/page.tsx` now links Messages, no contradictory unavailable sentence; named test |

## Chat-14 reassignment — batch 2 (tests authored, not run)

| Gap | Status | Evidence |
| --- | --- | --- |
| REC-calendar-messages-profile-23 | DONE | `src/components/hr/hr-recruiter-bell.tsx` opens notification bell and acknowledges only when all unread are on visible preview; `tests/unit/recruiter-chat14-round2.test.ts` GR ID test; no hidden-older unread silently cleared |

## Chat-14 reassignment — combined final evidence (tests not run)

| Gap | Status | Evidence |
| --- | --- | --- |
| REC-calendar-messages-profile-16 | OPEN | 403 reply copy now exactly explains ended access (`hr-conversation-send-feedback-model.ts`). Conversation detail still uses indistinguishable notFound, and full expired-grant recovery is unfinished; test `recruiter-chat14-round1`. |
| REC-calendar-messages-profile-23 | DONE | Bell opens and acknowledges only when all unread items are visible; `hr-recruiter-bell-service.ts` restricts the bulk write to the selected college and current recruiter. Tests `recruiter-chat14-round2` and `round3`. |
| REC-calendar-messages-profile-24 | OPEN | Shell-owned global recruiter topbar college branding/mobile footer. Handoff recorded in `docs/orchestrator/queues/graceful-needs-shell.md`; no prohibited chat-14 shell changes. |
| REC-calendar-messages-profile-25 | DONE | Existing current-main `recruiter-profile-details-service.ts` saves separate contact-only `placementRecruiterPublicContacts.phoneDigits`, never `users.phoneE164`; `recruiter-profile-details-editor.tsx` and named round1 test. Proposed contact storage migration belongs to original author. |
| REC-calendar-messages-profile-27 | DONE | Single name, designation and contact mobile Save changes, dirty submit, legacy profile saved text, now in-app confirmation and unload guard. `recruiter-profile-details-editor.tsx` round1 test. |
| REC-calendar-messages-profile-28 | DONE | Profile titles `Your details`, `College access`, `Account`, read-only Work email, Mobile help; main's contact-ready UI retained and named test. |
| REC-calendar-messages-profile-48 | DONE | No-college address guidance preserved at recruiter home and calendar; `recruiter-chat14-round3.test.ts`. |
| REC-calendar-messages-profile-R01 | BLOCKED | Real email provider acceptance, inbound provider reply-to routing, authenticated sender mapping, and idempotent unread reminder delivery unavailable; not safe to label read-state mail bridging DONE. |
| REC-calendar-messages-profile-R03 | DONE | Notifications page links to working `/hr/messages` and no longer contradicts conversation availability; round1 test. |

## Chat-14 reassignment closure audit (2026-10-17)

Source-verified against the audited legacy behavior on the branch. Tests named below were authored but **not executed** in the GitHub connector; orchestrator verification remains required. A private or foreign conversation ID continues to return 404 without revealing whether it exists.

| ID | Status | Evidence: implementation; named test |
| --- | --- | --- |
| REC-calendar-messages-profile-12 | DONE | `src/components/hr/recruiter-conversation-reply-form.tsx` — exact discard/keep dialog, beforeunload and guarded in-app navigation; `tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts` — `REC-calendar-messages-profile-12 confirms in-app draft navigation rather than discarding it silently`. |
| REC-calendar-messages-profile-16 | DONE | `src/app/(authenticated)/hr/conversations/page.tsx`, `[threadId]/page.tsx`, `src/modules/placements/hr-conversation-send-feedback-model.ts` — exact ended-access copy on grant and reply failures; foreign/private thread IDs remain indistinguishable 404; `tests/unit/recruiter-chat14-round1.test.ts` — `REC-calendar-messages-profile-16 surfaces the exact ended-access response to a failed recruiter reply`. |
| REC-calendar-messages-profile-23 | DONE | `src/components/hr/hr-recruiter-bell.tsx`, `src/modules/placements/hr-recruiter-bell-service.ts` — read-on-open only when all unread visible, per-college scoped; `tests/unit/recruiter-chat14-round2.test.ts` — `REC-calendar-messages-profile-23 avoids marking older unseen notifications as read`. |
| REC-calendar-messages-profile-24 | OPEN | Shell-owned college logo/name and mobile footer require chat-9; one-line Needs shell handoff in `docs/orchestrator/queues/gap-closure-chat-14.md`. |
| REC-calendar-messages-profile-25 | DONE | `src/components/hr/recruiter-profile-details-editor.tsx`, `src/modules/placements/recruiter-profile-details-service.ts` — optional mobile via dedicated contact (work email unchanged); `tests/unit/recruiter-chat14-round1.test.ts` — `REC-calendar-messages-profile-25 supports optional mobile contact without changing work-email login`. |
| REC-calendar-messages-profile-27 | DONE | `src/components/hr/recruiter-profile-details-editor.tsx` — single atomic save, optimistic conflict, dirty indicator, beforeunload, intercepted in-app navigation with exact discard; `tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts` — `REC-calendar-messages-profile-27 confirms dirty in-app profile navigation and guards save`. |
| REC-calendar-messages-profile-28 | DONE | `src/app/(authenticated)/hr/profile/page.tsx` — profile card titles/legacy help; `tests/unit/recruiter-chat14-round1.test.ts` — `REC-calendar-messages-profile-28 preserves recruiter profile card titles and legacy help`. |
| REC-calendar-messages-profile-37 | NOT-A-GAP | `src/app/(authenticated)/hr/company/page.tsx` retains authorized reports deep-link redirect and the replacement page; `tests/unit/recruiter-chat14-round1.test.ts` — `REC-calendar-messages-profile-37 preserves company reports deep links with authorized redirect`. |
| REC-calendar-messages-profile-42 | DONE | `src/components/tpo/recruiter-invite-landing.tsx` exact declined/unsubscribed legacy text; `tests/unit/recruiter-chat14-round1.test.ts` — `REC-calendar-messages-profile-42 shows the legacy decline and unsubscribe confirmation`. |
| REC-calendar-messages-profile-47 | DONE | `src/app/(authenticated)/recruiter/page.tsx` and `recruiter/colleges/page.tsx` both redirect to the canonical authorized Today URL; `tests/unit/recruiter-chat14-round1.test.ts` — `REC-calendar-messages-profile-47 redirects legacy recruiter and colleges entrypoints to Today`. |
| REC-calendar-messages-profile-48 | DONE | `src/app/(authenticated)/hr/calendar/page.tsx` no-college guidance; `tests/unit/recruiter-chat14-round3.test.ts` — `REC-calendar-messages-profile-48 keeps the original no-college recruiter address guidance`. |
| REC-calendar-messages-profile-R01 | OPEN | Unread placement-cell message email digests and inbound Reply-To conversation routing are not yet implemented; provider credentials and allowlist-only delivery must be respected. |
| REC-calendar-messages-profile-R03 | DONE | `src/app/(authenticated)/hr/notifications/page.tsx` no longer wrongly says conversations unavailable; `tests/unit/recruiter-chat14-round1.test.ts` — `REC-calendar-messages-profile-R03 links the notification footer to working recruiter conversations`. |


### Chat-14 UNCONFIRMED owner decision — 2026-10-18

| Gap ID | Decision | Evidence |
| --- | --- | --- |
| REC-calendar-messages-profile-46 | NOT-A-GAP for automatic pending-grant acceptance: existing recruiters use the expiring college/company join link and verified mailbox code, after which the existing active account is reused or the join returns ALREADY_JOINED. No silent grant at login, no acceptance of a revoked grant, and no unverified pending invitation in the recruiter Home. This is more secure and deterministic for multi-college grants than legacy implicit acceptance. | `src/modules/placements/public-join/join-service.ts`; `tests/unit/recruiter-chat14-unconfirmed-decisions.test.ts` test `REC-calendar-messages-profile-46 reuses verified existing-account join and never silently auto-accepts`. |

### REC-calendar-messages-profile-R01 bridge delivery (2026-10-18)

| Gap ID | Status | Evidence |
| --- | --- | --- |
| REC-calendar-messages-profile-R01 | BLOCKED — real provider credentials and database deployment | `src/modules/placements/recruiter-message-email-model.ts` and `tests/unit/recruiter-chat14-message-email-policy.test.ts`: 15-min initial wait, 2-min quiet, 45-min maximum wait, 6-hour cooldown, latest 3 excerpts, HMAC. `src/modules/placements/recruiter-message-email-dispatch-service.ts`: active same-company grant, verified DRIVES capability, unread TPO messages, persisted row lock and digest cooldown. `src/modules/placements/recruiter-message-email-inbound-service.ts`: signed-gateway payload, exact sender, unexpired opaque reply alias, idempotency, attribution EMAIL and TPO bell. `src/app/api/internal/placements/recruiter-message-reminders/route.ts` and `recruiter-message-inbound/route.ts` accept only origin-checked POST. `tests/unit/recruiter-chat14-message-email-bridge-contract.test.ts`. New schema is `src/db/schema/recruiter-message-email.ts`, SQL in `docs/proposed-migrations/recruiter-message-email-bridge.sql`. Delivery remains disabled until the orchestrator registers SQL, configures a dedicated ZeptoMail (not OTP) template, provider-verified inbound mail gateway, reply domain and HMAC/worker secrets. No proof of provider end-to-end acceptance is claimed. |

### REC-calendar-messages-profile-R01 delivery hardening — 2026-10-18

| Gap ID | Behavior chosen | Evidence |
| --- | --- | --- |
| REC-calendar-messages-profile-R01 | Each thread gets a stable opaque Reply-To token derived from a dedicated 32+ byte secret, so replying to earlier digest emails remains valid during rotation of messages. Reply ingestion strips quoted historical mail to avoid duplicating private placement conversation bodies; empty/oversized replies fail closed. | `recruiter-message-email-model.ts`: `recruiterReplyTokenForThread`, `extractRecruiterEmailReply`; dispatch and inbound services; `tests/unit/recruiter-chat14-message-email-policy.test.ts` named REC-calendar-messages-profile-R01. Required secret: `RECRUITER_MESSAGE_REPLY_TOKEN_SECRET`. |

### REC-calendar-messages-profile-24 data-only shell handoff — 2026-10-18

| Gap ID | Status | Evidence and exact integration request |
| --- | --- | --- |
| REC-calendar-messages-profile-24 | OPEN — chat-9 integration after UX-playbook approval | `src/modules/placements/recruiter-shell-navigation-model.ts` and `tests/unit/recruiter-chat14-shell-handoff.test.ts` define the exact legacy five mobile rows Today → `/hr/home`, Drives → `/hr/drives`, Calendar → `/hr/calendar`, Messages → `/hr/conversations`, Company → `/hr/company` with college-scoped links, nested active highlighting, and an explicit no-inferred-brand result when grants are ambiguous. Shell owner chat-9 must use only the selected authorized college's name and the separately authorized college logo, allow a college chooser for multiple active grants, preserve hamburger navigation, respect safe-area bottom inset, and use the audited UX playbook. No shared-shell or page visual code changed in chat-14. |


### REC-calendar-messages-profile-R01 — chat-14 delivery hardening handoff (2026-10-18)

| Gap ID | Verification status | Evidence |
| --- | --- | --- |
| REC-calendar-messages-profile-R01 | BLOCKED (provider integration, numbered migration) | `recruiter-message-email-dispatch-service.ts` now rejects unread job threads not owned by the same authorized employer relationship; scopes TPO/recruiter college and verified grant; requires an inbound HMAC secret, Reply-To token secret, non-OTP template and ZeptoMail bearer config **before** dispatch. `recruiter-message-email-inbound-service.ts` serializes on an authorized thread token row, computes provider replay hashes per thread, rechecks recruiter/college/job authorization, and strips quoted history. `recruiter-message-email-provider.ts` validates exact reply domain and HTTPS ZeptoMail URL before transmitting bearer credentials and escapes merged college/company/name/excerpts. `src/db/schema/recruiter-message-email.ts` mirrors the proposal's partial unique reply-token index. `tests/unit/recruiter-chat14-reminder-boundaries.test.ts` covers 20 deterministic timing cases and negative timestamps; additional R01 tests in `recruiter-chat14-message-email-policy.test.ts` and `recruiter-chat14-message-email-bridge-contract.test.ts`. Tests authored but not run in a repository checkout; live provider acceptance and migration deployment remain unverified. |

**Deployment requirements:** register `docs/proposed-migrations/recruiter-message-email-bridge.sql` through the orchestrator (do not copy directly into numbered migrations here); configure `RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED=true`, `RECRUITER_MESSAGE_REPLY_DOMAIN`, `RECRUITER_MESSAGE_REPLY_TOKEN_SECRET` (32+ bytes), `RECRUITER_MESSAGE_INBOUND_HMAC_SECRET` (32+ bytes), `RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY` (different from the OTP key), `ZEPTOMAIL_TOKEN`, verified sender/domain and an authenticated worker scheduler. The inbound-mail gateway **must verify provider authenticity** before forwarding the HMAC-signed request. Use a dedicated Reply-To mailbox; rotate the stable reply-token secret only with a planned alias grace period. Outside production, allowlist restrictions continue to apply. Provider acceptance does not itself guarantee end-recipient delivery; no exactly-once guarantee is claimed.


## Final-sprint chat-2 independent verification (2026-10-18; tests not executed)

These 22 IDs were explicitly assigned to chat-2 in `docs/orchestrator/queues/final-sprint.md`. The tests verify the *current* scoped implementation; PARTIAL rows do not claim parity that does not exist.

| ID | Verdict | Named regression test / factual evidence |
| --- | --- | --- |
| REC-calendar-messages-profile-03 | DONE — source | `chat2-final-sprint-recruiter-calendar.test.ts` — ID-named end-time and actual `durationMinutes` reader, IST card |
| REC-calendar-messages-profile-05 | DONE — source | Same file — original subtitle, Previous/Next week labels and newly restored exact empty-state copy |
| REC-calendar-messages-profile-06 | DONE — source | Same file — `collegeName` on each authorized college event |
| REC-calendar-messages-profile-07 | DONE — source | Same file — rounds/interviews to Rounds and deadline to Overview of the authorized recruiter drive |
| REC-calendar-messages-profile-09 | DONE — source | `chat2-final-sprint-recruiter-messages.test.ts` — unread/conversation toolbar and authorized message-body search |
| REC-calendar-messages-profile-10 | DONE — source | Same file — company + job subject, General label, n new and relative activity |
| REC-calendar-messages-profile-11 | DONE — source | Same file — inline General history, reply, guarded General creation |
| REC-calendar-messages-profile-13 | DONE — source | Same file — focused/visible 4-second refresh with no GET side effects |
| REC-calendar-messages-profile-14 | DONE — source | Same file — explicit client POST read acknowledgment on opening a thread |
| REC-calendar-messages-profile-15 | DONE — source | Same file — safe 400/403 feedback, send success versus refresh failure, Ctrl/Cmd+Enter |
| REC-calendar-messages-profile-18 | PARTIAL — OPEN | Same file — scoped request cards, sender attribution, proposal marker and request link; full legacy event-line types not all rendered |
| REC-calendar-messages-profile-20 | NOT-A-GAP | Same file — accessible Older/Newer + oldest/newest navigation intentionally retains bounded, chronological pages rather than loading unbounded history |
| REC-calendar-messages-profile-R02 | DONE — source | Same file — current authorized drive or General conversation subject and real drive link |
| REC-calendar-messages-profile-26 | DONE — source | `chat2-final-sprint-recruiter-profile-company.test.ts` — bounded separate First name / Last name |
| REC-calendar-messages-profile-29 | DONE — source | Same file — actual college access expiry and no-end-date fallback |
| REC-calendar-messages-profile-30 | NOT-A-GAP | Same file — deliberate self-service Leave Access (owner OD-20) with explicit confirmation and no automatic regrant |
| REC-calendar-messages-profile-32 | PARTIAL — OPEN | Same file — company initial, safe clickable site, primary domain, industry fallback, privacy note; full verified-by-42 evidence and multi-domain list not present, no invented verification |
| REC-calendar-messages-profile-33 | NOT-A-GAP | Same file — TPO's private Trusted relationship bit is not exposed; safe `Linked by the placement cell` fact only |
| REC-calendar-messages-profile-34 | DONE — source | Same file — authorized current-college own-company team and actual attributed drive counts |
| REC-calendar-messages-profile-35 | DONE — source | Same file — corrected `Offered` now sums pending+accepted+declined; other accepted/declined/joined/withdrawn totals remain separate, no fake counts |
| REC-calendar-messages-profile-36 | DONE — source | Same file — exact Recruiter, Your profile and Your work with college header, without page restyling |
| REC-calendar-messages-profile-41 | PARTIAL — OPEN | Same file — work email is readonly and student contact-sharing boundary is explicit; reviewer-drive invite paragraph needs real linked drive data and cannot be invented |

Source checks and pure-model tests were written, not run. No recruiter company trust secrets, foreign-college threads or invented offer counts are exposed.

### Final sprint chat-2 — calendar and inbox (IDs 03/05/06/07/09)
| Gap ID | Verdict | Source, gap-ID test and behavior |
| --- | --- | --- |
| REC-calendar-messages-profile-03 | DONE — source verified; CI pending | `src/modules/placements/recruiter-calendar-service.ts` reads persisted round duration; `src/app/(authenticated)/hr/calendar/page.tsx` renders start/end in IST, without inventing missing end. Test `tests/unit/chat2-final-sprint-calendar-inbox-a.test.ts` — `REC-calendar-messages-profile-03 shows scheduled start and end in IST when available`. |
| REC-calendar-messages-profile-05 | DONE — source verified; CI pending | Calendar retains legacy subtitle, accessible Previous/Next week and empty-week wording; source `hr/calendar/page.tsx`; named `REC-calendar-messages-profile-05` test in `chat2-final-sprint-recruiter-calendar.test.ts`. |
| REC-calendar-messages-profile-06 | DONE — source verified; CI pending | Calendar events include the exact employer-college identity, not merged anonymous cards; `recruiter-calendar-service.ts` and calendar event card; `REC-calendar-messages-profile-06` test in `chat2-final-sprint-calendar-inbox-a.test.ts`. |
| REC-calendar-messages-profile-07 | DONE — source verified; CI pending | Drive Overview for deadlines; scoped drive Rounds tab for rounds and slots. `hr/calendar/page.tsx`; named `REC-calendar-messages-profile-07` test in `chat2-final-sprint-calendar-inbox-a.test.ts`. |
| REC-calendar-messages-profile-09 | DONE — source verified; CI pending | Scoped conversations show unread summary, toolbar counts, general conversation description and body-matching search; `hr/conversations/page.tsx`, `hr-conversation-inbox-service.ts`; named `REC-calendar-messages-profile-09` test in `chat2-final-sprint-recruiter-messages.test.ts`. |

### Final sprint chat-2 — general conversations (IDs 10/11/13/14/15)
| Gap ID | Verdict | Source, gap-ID test and behavior |
| --- | --- | --- |
| REC-calendar-messages-profile-10 | DONE — source verified; CI pending | `hr/conversations/page.tsx`: Company · Job, General, new badge and relative activity; named `REC-calendar-messages-profile-10` test `tests/unit/chat2-final-sprint-conversations-b.test.ts`. |
| REC-calendar-messages-profile-11 | DONE — source verified; CI pending | General thread expands in same inbox, with history, Ctrl/Cmd+Enter, first-open action and reply feedback. `hr/conversations/page.tsx`, `recruiter-conversation-reply-form.tsx`; named `REC-calendar-messages-profile-11` test `chat2-final-sprint-conversations-b.test.ts`. |
| REC-calendar-messages-profile-13 | DONE — source verified; CI pending | Four-second visible-only refresh for inbox and open thread, read-only GET. `recruiter-conversation-live-refresh.tsx`; named `REC-calendar-messages-profile-13` test `chat2-final-sprint-recruiter-messages.test.ts`. |
| REC-calendar-messages-profile-14 | DONE — source verified; CI pending | Client POST on opening an unread authorized thread acknowledges incoming messages, GET remains read-only. `recruiter-conversation-read-control.tsx`; named `REC-calendar-messages-profile-14` test `chat2-final-sprint-conversations-b.test.ts`. |
| REC-calendar-messages-profile-15 | DONE — source verified; CI pending | Exact empty/4000-char/send/refreshed-but-unavailable feedback, with saved draft before confirmed send. `recruiter-conversation-reply-form.tsx`; named `REC-calendar-messages-profile-15` test `chat2-final-sprint-conversations-b.test.ts`. |

### Final sprint chat-2 — thread and grants (IDs 18/20/26/29/30)
| Gap ID | Verdict | Source, gap-ID test and behavior |
| --- | --- | --- |
| REC-calendar-messages-profile-18 | DONE — source verified; CI pending | Authorized drive thread includes change-request decision and discussion history, with recruiter "You" and TPO sender identity. `hr/conversations/[threadId]/page.tsx`; named `REC-calendar-messages-profile-18` test `tests/unit/chat2-final-sprint-threads-profile-c.test.ts`. |
| REC-calendar-messages-profile-20 | DONE — source verified; CI pending | Chronological messages per page plus explicit Older/Newer and oldest/newest navigation; `hr/conversations/[threadId]/page.tsx`; named `REC-calendar-messages-profile-20` test `chat2-final-sprint-threads-profile-c.test.ts`. Pagination is retained intentionally instead of an unbounded query. |
| REC-calendar-messages-profile-26 | DONE — source verified; CI pending | Separate required First name/optional Last name, 100-char boundaries, one safe Save. `recruiter-profile-details-editor.tsx`; named `REC-calendar-messages-profile-26` test `chat2-final-sprint-recruiter-profile-company.test.ts`. |
| REC-calendar-messages-profile-29 | DONE — source verified; CI pending | Per-college grant valid-until disclosure; no-expiry grants say "Access has no end date". `hr/profile/page.tsx`, `recruiter-self-grants-service.ts`; named `REC-calendar-messages-profile-29` test `chat2-final-sprint-threads-profile-c.test.ts`. |
| REC-calendar-messages-profile-30 | DONE — deliberate improvement; CI pending | Retain explicit confirm-before-DELETE to immediately leave one college's grant; does not affect other colleges and does not imply revocation until server success. `recruiter-profile-access.tsx`; named `REC-calendar-messages-profile-30` test `chat2-final-sprint-threads-profile-c.test.ts`. |

### Final sprint chat-2 — company, reports and subject (IDs 32/33/34/35/36/41/R02)
| Gap ID | Verdict | Source, gap-ID test and behavior |
| --- | --- | --- |
| REC-calendar-messages-profile-32 | DONE — source verified; CI pending | Company initial avatar, safe clickable website, domain, accurate missing industry disclosure and college-company explanation. `hr/company/page.tsx`; named `REC-calendar-messages-profile-32` test `tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts`. Unverified "Verified by 42" badges are intentionally not invented. |
| REC-calendar-messages-profile-33 | DONE — privacy improvement; CI pending | Internal TPO trust flag is not shown to recruiter as permission/endorsement; `hr/company/page.tsx`; named `REC-calendar-messages-profile-33` test `chat2-final-sprint-recruiter-profile-company.test.ts`. |
| REC-calendar-messages-profile-34 | DONE — source verified; CI pending | Employer-college active teammate list, name initial, factual attributed drive count and accurate invitation instructions; `hr/company/page.tsx`; named `REC-calendar-messages-profile-34` test `chat2-final-sprint-recruiter-profile-company.test.ts`. |
| REC-calendar-messages-profile-35 | DONE IN BRANCH — CI pending | `hr/company/reports/page.tsx`: legacy Applied and Offered labels; **Offered = ISSUED + ACCEPTED + DECLINED** from mutually exclusive offer states, not the incomplete issued-only number. Accepted/Declined/Joined remain distinct; legacy empty guidance restored without visual redesign. Named `REC-calendar-messages-profile-35` test `chat2-final-sprint-recruiter-profile-company.test.ts`. |
| REC-calendar-messages-profile-36 | DONE IN BRANCH — CI pending | `hr/company/page.tsx`: exact Recruiter eyebrow, "Your profile" action and "Your work with {college}" summary; changed copy, not layout. Named `REC-calendar-messages-profile-36` test `chat2-final-sprint-recruiter-profile-company.test.ts`. |
| REC-calendar-messages-profile-41 | DONE — source verified; CI pending | Locked invited work email and permission-scoped student contact explanation; no promise of inaccessible applicant data. `recruiter-invite-landing.tsx`; named `REC-calendar-messages-profile-41` test `chat2-final-sprint-recruiter-profile-company.test.ts`. |
| REC-calendar-messages-profile-R02 | DONE — source verified; CI pending | Authorized conversation subject explicitly shows drive title or General and links to authorized drive and college inbox; `hr/conversations/[threadId]/page.tsx`; named `REC-calendar-messages-profile-R02` test `chat2-final-sprint-recruiter-messages.test.ts`. |

### Chat-2 final sprint: commit-by-commit test and acceptance trace (22/22; 2026-10-18)

All 22 cases were checked against current branch source before insertion. Every commit below contains a separately named test that cites the matching gap's acceptance entry in this file. `FIXED-ON-MAIN` means the implementation predated this sprint; `IN-BRANCH` means the recruiter reports/header fixes remain in the lane branch. This is **source/test authorship evidence, not a claim of executed CI or passed database integration**.

| Gap ID | Final sprint starting status | Gap-tagged test commit | Test source | Acceptance scope |
| --- | --- | --- | --- | --- |
| REC-calendar-messages-profile-03 | FIXED-ON-MAIN | [`1555a9dbc`](https://github.com/42Students/lms-vnext/commit/1555a9dbca0501610eb320563fc830fb0be4d644) | `tests/unit/chat2-final-sprint-recruiter-calendar.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-05 | FIXED-ON-MAIN | [`a76f94cef`](https://github.com/42Students/lms-vnext/commit/a76f94cef291771e437c309694513488c42120d1) | `tests/unit/chat2-final-sprint-recruiter-calendar.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-06 | FIXED-ON-MAIN | [`05b0bef2c`](https://github.com/42Students/lms-vnext/commit/05b0bef2c2450b9bb40dee2fdb2a2aca75c60ee9) | `tests/unit/chat2-final-sprint-recruiter-calendar.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-07 | FIXED-ON-MAIN | [`0f8ad2c76`](https://github.com/42Students/lms-vnext/commit/0f8ad2c763f1c4ae9ea4760201fc3ffca88c7586) | `tests/unit/chat2-final-sprint-recruiter-calendar.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-09 | FIXED-ON-MAIN | [`48412c947`](https://github.com/42Students/lms-vnext/commit/48412c947e37a5d81b236009df8a05d81a25773d) | `tests/unit/chat2-final-sprint-recruiter-messages.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-10 | FIXED-ON-MAIN | [`b503336b4`](https://github.com/42Students/lms-vnext/commit/b503336b49c8d1d239340a2faa2d9ec4345c4290) | `tests/unit/chat2-final-sprint-recruiter-messages.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-11 | FIXED-ON-MAIN | [`1f4580ab3`](https://github.com/42Students/lms-vnext/commit/1f4580ab3148eec74618f72d8eeddb71c3f4172c) | `tests/unit/chat2-final-sprint-recruiter-messages.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-13 | FIXED-ON-MAIN | [`3493a398a`](https://github.com/42Students/lms-vnext/commit/3493a398a7861158ec7dc6886dc731194d8564a7) | `tests/unit/chat2-final-sprint-recruiter-messages.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-14 | FIXED-ON-MAIN | [`dbe69262b`](https://github.com/42Students/lms-vnext/commit/dbe69262b251b736ecd5d13615a4983ce588075e) | `tests/unit/chat2-final-sprint-recruiter-messages.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-15 | FIXED-ON-MAIN | [`1b9ae1a9c`](https://github.com/42Students/lms-vnext/commit/1b9ae1a9cba248b520718e23d2cb43f8dcd67bf1) | `tests/unit/chat2-final-sprint-recruiter-messages.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-18 | FIXED-ON-MAIN | [`ffcbf7a8e`](https://github.com/42Students/lms-vnext/commit/ffcbf7a8ed59cc6d53f98032032f5b5e1679a853) | `tests/unit/chat2-final-sprint-recruiter-messages.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-20 | FIXED-ON-MAIN | [`56ca1c037`](https://github.com/42Students/lms-vnext/commit/56ca1c03747b4fb9fd3a0679b54c67209712f96e) | `tests/unit/chat2-final-sprint-recruiter-messages.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-26 | FIXED-ON-MAIN | [`36bae5721`](https://github.com/42Students/lms-vnext/commit/36bae572154161f843c7076b377b83198f03a1d4) | `tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-29 | FIXED-ON-MAIN | [`048ee9b30`](https://github.com/42Students/lms-vnext/commit/048ee9b30e6333d744377e538305acef95fc79fc) | `tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-30 | FIXED-ON-MAIN | [`2ddbf6fe9`](https://github.com/42Students/lms-vnext/commit/2ddbf6fe9bf46547b05c010d0eb4560ae28a5dd8) | `tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-32 | FIXED-ON-MAIN | [`34f854b79`](https://github.com/42Students/lms-vnext/commit/34f854b795cfd787d1b1deed647119f6c862f454) | `tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-33 | FIXED-ON-MAIN | [`c6e619289`](https://github.com/42Students/lms-vnext/commit/c6e619289628cbdc7a9be8778830e6ee1366d948) | `tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-34 | FIXED-ON-MAIN | [`cbc20e9c3`](https://github.com/42Students/lms-vnext/commit/cbc20e9c3b65cb28dd17fb0e1171f19bed600d9e) | `tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-35 | IN-BRANCH | [`34d1d1d45`](https://github.com/42Students/lms-vnext/commit/34d1d1d459f1a95e55bad666b7edcad7de9de3c3) | `tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-36 | IN-BRANCH | [`b0f9dcc74`](https://github.com/42Students/lms-vnext/commit/b0f9dcc743ac5b678293466ee35642882ab993d2) | `tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-41 | FIXED-ON-MAIN | [`882f3609f`](https://github.com/42Students/lms-vnext/commit/882f3609f9df17701ff400ec41ea0f8a62d20b94) | `tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts` | Individual source-contract regression; existing gap acceptance details above |
| REC-calendar-messages-profile-R02 | FIXED-ON-MAIN | [`f7aa98d8a`](https://github.com/42Students/lms-vnext/commit/f7aa98d8a4fae8dddfcde8189e7f879d7f5b7dad) | `tests/unit/chat2-final-sprint-recruiter-messages.test.ts` | Individual source-contract regression; existing gap acceptance details above |

**Release gate:** Run Vitest and `tsc --noEmit` on the final merged commit; confirm recruiter-college authorization and real offer counts against PostgreSQL fixtures. This GitHub-connector-only lane did not run the suites. Legacy copy variations are recorded above with explicit least-privilege behavior choices rather than inferred verification, badges, grants or read-state changes.


## chat-15 recruiter conversation and notifications identity boundary — 2026-10-18

| ID | Status | Acceptance evidence and outstanding verification |
|---|---|---|
| HR-ACCOUNT-OWNER-17 | SOURCE FIX, CI PENDING | `hr-conversation-inbox-service.ts`, `hr-notifications-service.ts`; `tests/unit/HR-BREAK-chat15-conversations-10.test.ts` and `HR-BREAK-chat15-notifications-09.test.ts`. Private recruiter message and notification reads require the embedded recruiter user ID to match the authenticated session user, before accessing any college data. Multi-college users must choose scope. Verify revoked account and stale session against real DB. |
| HR-TENANT-ID-16 | SOURCE FIX, CI PENDING | `recruiter-job-visibility-model.ts`, `tests/unit/HR-BREAK-chat15-tenant-identity-04.test.ts`. A borrowed relationship grant cannot make an unrelated session user an authorized job viewer. |


## chat-15 recruiter account revocation and activity (2026-10-18, CI pending)

| ID | Source | Acceptance evidence |
|---|---|---|
| HR-ACTIVITY-OWNER-28 | `hr-job-activity-service.ts` | Before college-choice disclosure or activity reads, active recruiter identity must equal authenticated session user. `tests/unit/HR-BREAK-chat15-activity-owner-28.test.ts` includes stolen recruiter context, wrong college and private-event exclusion. |
| HR-TEAM-OWNER-30 | `recruiter-company-team-service.ts` | College grant chooser denies identity swaps before returning college names; `tests/unit/recruiter-company-team-scope.test.ts`. |
| HR-TEAM-REVOKE-32 | `recruiter-company-team-service.ts` | After choosing an employer-college relationship, source query rechecks acting user's ACTIVE recruiter profile, persisted grant and platform status before team contacts are loaded. `tests/unit/recruiter-company-team-scope.test.ts`; real revoked-session PostgreSQL test is outstanding. |

No runtime, database or responsive browser results were claimed; retain these as open acceptance gates.


## Chat-15 team directory revocation (2026-10-18)

**HR-TEAM-COLLEGE-33:** `getRecruiterCompanyTeam` now requires an ACTIVE college alongside ACTIVE relationship, company, acting recruiter profile, grant and platform user before exposing team contact emails. Evidence: `tests/unit/recruiter-company-team-scope.test.ts` (added college invariant). CI and real college deactivation acceptance remain outstanding.


## Chat-15 HR protected page and state checks

`UX-CHAT15-ROUTES-41` verifies 20 canonical HR page role gates, 13 recruiter alias routes, detail 404 and invalid-filter state text, and tracker role isolation. `HR-CHANGE-REQUESTS-PAGE-40` renders own-company, foreign-job denied, cross-party denied and storage-unavailable states. `HR-STATE-MACHINE-43` covers review-round, interview-slot and drive request transitions including stale versions, duplicate names and capacity. All are authored source/unit tests; user-browser acceptance and cloud execution are outstanding.
