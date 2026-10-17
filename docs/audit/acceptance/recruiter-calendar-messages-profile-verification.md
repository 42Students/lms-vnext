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
