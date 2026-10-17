# Recruiter calendar/messages/profile – chat-2 round 6

| Gap | Status | Evidence |
| --- | --- | --- |
| REC-calendar-messages-profile-28 | PARTIAL — OPEN | `src/app/(authenticated)/hr/profile/page.tsx` restores exact legacy Profile header, detail/college sections and explanatory strings, named test in `tests/unit/chat2-recruiter-profile-and-lead-parity.test.ts`; combined save and mobile edit still pending. |
| REC-calendar-messages-profile-42 | DONE (source, tests not run) | Existing invite declined state already has exact legacy confirmation copy; named test in `tests/unit/chat2-recruiter-profile-and-lead-parity.test.ts`. |
| REC-calendar-messages-profile-37 | NOT-A-GAP | Existing `/hr/company?tab=reports` deep-link redirects to scoped Reports, preserving collegeId and navigation, verified named test. |
| REC-calendar-messages-profile-47 | PARTIAL — OPEN | Retired `/recruiter` and `/recruiter/colleges` entrypoints now use explicit redirects to canonical Today (`/hr/home`) rather than rendering duplicated surfaces. Named unit tests in `tests/unit/chat2-recruiter-legacy-entrypoints.test.ts`. Global navigation aliases are shell-owned and still require chat-9. |

| REC-calendar-messages-profile-12 | DONE (source, not run) | `src/components/hr/recruiter-conversation-reply-form.tsx` now offers Close, confirming nonempty draft with exact Discard / Keep writing dialog; beforeunload remains guarded. `tests/unit/chat2-recruiter-draft-discard.test.ts` named tests. |

| REC-calendar-messages-profile-R03 | DONE (source, unrun) | Notification footer no longer claims conversations unavailable, while `/hr/messages` resolves to the real conversation inbox. Named `tests/unit/chat2-recruiter-access-copy.test.ts`. |
| REC-calendar-messages-profile-16 | PARTIAL — OPEN | Exact ended-access copy in college conversation selection, while detail still hides unauthorized IDs as 404. Named test. |
| REC-calendar-messages-profile-48 | DONE (source, unrun) | No-college calendar page explicitly mentions the college placements address and retains Return to Today. Named test. |
