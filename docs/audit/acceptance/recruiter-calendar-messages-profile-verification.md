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
