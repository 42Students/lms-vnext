# TPO inbox, Team, announcements and bell — builder chat-2 verification

**Protocol:** `docs/orchestrator/briefs/gap-closure-lane.md`. Tests are authored but **not run** by chat-2. Independent execution and migration registration are the orchestrator's responsibility. A DONE below means source implementation plus a named acceptance test exists on this branch; not runtime-certified.

| ID | Status | Evidence (implementation; test file and test name) |
| --- | --- | --- |
| TPO-inbox-team-15 | DONE | Permanent Everyone channel `src/app/(authenticated)/tpo/team/everyone/page.tsx`, `src/modules/placements/tpo-team-everyone-service.ts`, `src/db/schema/tpo-internal.ts`, `docs/proposed-migrations/tpo-inbox-team-everyone.sql`; `tests/unit/tpo-team-everyone-model.test.ts` **TPO-inbox-team-15 exposes Everyone…**, **TPO-inbox-team-15 notifies…**; `tests/integration/db09-tpo-team-everyone.test.ts` **TPO-inbox-team-15 keeps Everyone accessible after mute…**. Integration requires the orchestrator to register migration and set `TPO_TEAM_EVERYONE_SCHEMA_READY=1`. |
| TPO-inbox-team-04 | DONE | `src/app/api/placements/tpo/messages/threads/[threadId]/read/route.ts` and `src/components/tpo/tpo-recruiter-message-reply.tsx` explicit read POST and Seen; `tests/unit/tpo-inbox-team-recruiter-inbox-closure.test.ts` **TPO-inbox-team-04 opens as a read acknowledgement…**. |
| TPO-inbox-team-05 | DONE | `src/modules/placements/tpo-messages-model.ts` and `src/app/(authenticated)/tpo/messages/page.tsx` Reply/Unread segment, company/body preview, search; `tests/unit/tpo-inbox-team-recruiter-inbox-closure.test.ts` **TPO-inbox-team-05 filters recruiter last-response…**. |
| TPO-inbox-team-06 | DONE | `src/modules/placements/tpo-inbox-date-model.ts` and `src/app/(authenticated)/tpo/messages/page.tsx` company, preview, waiting, access end, relative IST; `tests/unit/tpo-inbox-team-recruiter-inbox-closure.test.ts` **TPO-inbox-team-06 preserves company…**. |
| TPO-inbox-team-19 | DONE | `src/modules/placements/tpo-team-internal-read-service.ts` scoped topic/message search and excerpts; `src/components/tpo/tpo-team-search.tsx` 200ms debounce and slash shortcut; `src/app/(authenticated)/tpo/team/page.tsx` URL query; `tests/unit/tpo-team-search-verification.test.ts` **TPO-inbox-team-19 searches only the caller's authorized Team threads…** and **TPO-inbox-team-19 keeps search in the URL…**. Database acceptance remains with orchestrator. |
| TPO-inbox-team-08 | BLOCKED | Email relay needs verified provider credentials and inbound reply webhook; `docs/orchestrator/queues/gap-closure-chat-2.md` blocker. No production access or emails attempted. |
| TPO-inbox-team-10 | DONE | `src/app/(authenticated)/tpo/messages/page.tsx` exact legacy subtitle and no internal migration jargon; `tests/unit/tpo-inbox-team-copy.test.ts` **TPO-inbox-team-10 uses the exact legacy Messages subtitle…**. |

| TPO-inbox-team-09 | DONE | Messages 4-second + focus refresh; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-09**. |
| TPO-inbox-team-11 | DONE | no notification-as-message fallback; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-11**. |
| TPO-inbox-team-13 | DONE | mobile recruiter cards and back control; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-13**. |
| TPO-inbox-team-14 | DONE | canonical notifications redirect; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-14**. |
| TPO-inbox-team-27 | DONE | Team 30-second + focus refresh; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-27**. |
| TPO-inbox-team-39 | DONE | safe inline Team create and reply errors; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-39**. |
| TPO-inbox-team-40 | DONE | exact Team subtitle; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-40**. |
| TPO-inbox-team-56 | DONE | exact announcement tabs/subtitles; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-56**. |
| TPO-inbox-team-58 | DONE | 200/8000 create and edit limits; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-58**. |
| TPO-inbox-team-65 | DONE | exact Notifications subtitle; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-65**. |
| TPO-inbox-team-66 | DONE | mark-all no-confirm with zero guard; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-66**. |
| TPO-inbox-team-R01 | DONE | scoped recruiter message TPO bell notification; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-R01**. |
| TPO-inbox-team-R03 | DONE | legacy announcement tab aliases; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-R03**. |

| TPO-inbox-team-41 | DONE | Last 500 messages, default scroll to newest or deep-linked message `src/modules/placements/tpo-team-conversation-service.ts`, `src/components/tpo/tpo-team-message-scroll.tsx`; `tests/unit/tpo-inbox-team-round2.test.ts` **TPO-inbox-team-41 loads the latest five hundred messages…**. |
| TPO-inbox-team-55 | DONE | `src/modules/announcements/tpo-notice-form-error-model.ts`, create/edit routes and UI exact HTTPS error, required title/message, IST schedule minima; `tests/unit/tpo-inbox-team-round2.test.ts` **TPO-inbox-team-55 returns a user-facing error…**. |
| TPO-inbox-team-R05 | DONE | `src/db/schema/tpo-internal.ts`, `src/modules/placements/tpo-team-internal-read-service.ts`, `src/modules/placements/tpo-team-internal-ack-service.ts`; proposed SQL `docs/proposed-migrations/tpo-inbox-team-read-receipts.sql`; `tests/unit/tpo-inbox-team-round2.test.ts` **TPO-inbox-team-R05 separates Team read positions…** and `tests/integration/db09-tpo-team-read-receipts.test.ts` **TPO-inbox-team-R05 separates unread message positions…**. PG test requires schema registration and `TPO_TEAM_READ_RECEIPTS_SCHEMA_READY=1`. |

Source-level follow-up still required for `TPO-inbox-team-30/48/49/50/51/52/53/64`: named tests capture implemented pieces, but full legacy acceptance has not yet been demonstrated. These remain queued.

| TPO-inbox-team-R07 | DONE | Loaded log semantics, native link keyboard navigation, All conversations back label and Team slash hint; `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx`, `src/app/(authenticated)/tpo/team/[threadId]/page.tsx`, `src/components/tpo/tpo-team-search.tsx`; `tests/unit/tpo-inbox-team-round2.test.ts` **TPO-inbox-team-R07 gives native keyboard links…**. |

Other queued gaps remain outstanding until individually inspected and recorded.
