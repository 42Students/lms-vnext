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
