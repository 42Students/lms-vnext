# TPO inbox, Team, announcements and bell — builder chat-2 verification

**Protocol:** `docs/orchestrator/briefs/gap-closure-lane.md`. Tests are authored but **not run** by chat-2. Independent execution and migration registration are the orchestrator's responsibility. A DONE below means source implementation plus a named acceptance test exists on this branch; not runtime-certified.

| ID | Status | Evidence (implementation; test file and test name) |
| --- | --- | --- |
| TPO-inbox-team-15 | DONE | Permanent Everyone channel `src/app/(authenticated)/tpo/team/everyone/page.tsx`, `src/modules/placements/tpo-team-everyone-service.ts`, `src/db/schema/tpo-internal.ts`, `docs/proposed-migrations/tpo-inbox-team-everyone.sql`; `tests/unit/tpo-team-everyone-model.test.ts` **TPO-inbox-team-15 exposes Everyone…**, **TPO-inbox-team-15 notifies…**; `tests/integration/db09-tpo-team-everyone.test.ts` **TPO-inbox-team-15 keeps Everyone accessible after mute…**. Integration requires the orchestrator to register migration and set `TPO_TEAM_EVERYONE_SCHEMA_READY=1`. |
| TPO-inbox-team-04 | DONE | `src/app/api/placements/tpo/messages/threads/[threadId]/read/route.ts` and `src/components/tpo/tpo-recruiter-message-reply.tsx` explicit read POST and Seen; `tests/unit/tpo-inbox-team-recruiter-inbox-closure.test.ts` **TPO-inbox-team-04 opens as a read acknowledgement…**. |
| TPO-inbox-team-05 | DONE | `src/modules/placements/tpo-messages-model.ts` and `src/app/(authenticated)/tpo/messages/page.tsx` Reply/Unread segment, company/body preview, search; `tests/unit/tpo-inbox-team-recruiter-inbox-closure.test.ts` **TPO-inbox-team-05 filters recruiter last-response…**. |
| TPO-inbox-team-06 | DONE | `src/modules/placements/tpo-inbox-date-model.ts` and `src/app/(authenticated)/tpo/messages/page.tsx` company, preview, waiting, access end, relative IST; `tests/unit/tpo-inbox-team-recruiter-inbox-closure.test.ts` **TPO-inbox-team-06 preserves company…**. |
| TPO-inbox-team-19 | DONE | `src/modules/placements/tpo-team-internal-read-service.ts` scoped topic/message search and excerpts; `src/components/tpo/tpo-team-search.tsx` 200ms debounce and slash shortcut; `src/app/(authenticated)/tpo/team/page.tsx` URL query; `tests/unit/tpo-team-search-verification.test.ts` **TPO-inbox-team-19 searches only the caller's authorized Team threads…** and **TPO-inbox-team-19 keeps search in the URL…**. Database acceptance remains with orchestrator. |
| TPO-inbox-team-10 | DONE | `src/app/(authenticated)/tpo/messages/page.tsx` exact legacy subtitle and no internal migration jargon; `tests/unit/tpo-inbox-team-copy.test.ts` **TPO-inbox-team-10 uses the exact legacy Messages subtitle…**. |

Other queued gaps remain outstanding until individually inspected and recorded.
