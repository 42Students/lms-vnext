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

| REC-calendar-messages-profile-25 | DONE (source; unrun) | Single profile form edits optional validated phone via dedicated `placement_recruiter_public_contacts`, blank clears it, login `users.phone_e164` untouched; scoped atomic PATCH; named test `tests/unit/chat2-recruiter-profile-combined.test.ts`. |
| REC-calendar-messages-profile-27 | PARTIAL — OPEN | Single Save changes, dirty badge, beforeunload and conflict-retained fields; in-app route transition guard still pending. Named test same file. |
| REC-calendar-messages-profile-28 | DONE (source; unrun) | Exact legacy section titles, account explanations, one combined editor for first/last/designation/mobile, same named test. |

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
