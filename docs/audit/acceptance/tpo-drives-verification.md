# TPO Drives — verified gap closure evidence (chat-3)

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md`.
Source: `docs/audit/pages/tpo/drives.md`, Round R `drives-review.md`, and legacy-copy-B.
Tests are **written, not executed**: the orchestrator runs them after merging.

## Verified implementations (source inspected, test authored)

| ID | Status | Evidence (implementation; regression test with ID in name) |
| --- | --- | --- |
| TPO-drives-01 | DONE | `src/app/(authenticated)/tpo/placements/page.tsx` routes Drives to list; existing command center retained at `/tpo/placements/overview`; `tests/unit/tpo-drives-gap-closure.test.ts` — `TPO-drives-01 sidebar Drives resolves to real list, not operations dashboard` |
| TPO-drives-03 | NOT-A-GAP | Audit Round R corrected claim: `CANCELLED` appears in Closed view/count, requester `REJECTED` remains a distinct request state. `tpo-drive-lifecycle-list-model.ts`; `tests/unit/tpo-drives-gap-closure.test.ts` — `TPO-drives-03 is NOT-A-GAP: cancelled drives belong to Closed, distinct from rejected requests` |
| TPO-drives-09 | DONE | `src/modules/placements/tpo-drive-lifecycle-list-model.ts` status/request tone and labels; `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx` semantic StatusBadge for drives and requests; test `TPO-drives-09 legacy-friendly lifecycle statuses do not expose raw job enums`. No raw status shown in list. |
| TPO-drives-12 | DONE | Lifecycle More menu has Applicants / Rounds and schedule / Offers links in `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx`; `tests/unit/tpo-drives-gap-closure.test.ts` — `TPO-drives-12 row More menu links to applicants, rounds and offers` |
| TPO-drives-14 | DONE | Protected same-origin reminder route, `tpo-remind-not-applied-service.ts` performs audience exclusion, verified preview, database day-key dedupe, atomic audit and in-app notification writes; `tests/unit/tpo-drives-gap-closure.test.ts` — `TPO-drives-14 reminder flow requires preview token and explicit confirmation`. **Integration behavior remains unexecuted.** |
| TPO-drives-20 | DONE | `tpo-drive-lifecycle-list-service.ts` defaults to all college seasons and restricts selected season only on request; `tests/unit/tpo-drives-gap-closure.test.ts` — `TPO-drives-20 a missing season selector does not hide college history` |
| TPO-drives-21 | DONE | Drives list heading/subtitle match literal legacy wording in `lifecycle/page.tsx`, preserved overview route; `tests/unit/tpo-drives-gap-closure.test.ts` — `TPO-drives-21 heading and subtitle reproduce the legacy list copy` |
| TPO-drives-R06 | DONE | Lifecycle header and empty-state both provide Create drive links; `tests/unit/tpo-drives-gap-closure.test.ts` — `TPO-drives-R06 empty-state and header both link to Create drive` |

## Inspected and regression-covered, but not claimed closed

The following gaps each have their own named assertion in `tests/unit/tpo-drives-gap-closure.test.ts`. Their current source covers a meaningful part, but the legacy audit demands additional behavior beyond the test, so they remain open: `TPO-drives-05` (full stage detail), `-06` (registered/eligible breakdown), `-07` (complete pay categories), `-08` (recorded marker), `-09` (visual status colours and complete request tags), `-10` (all legacy filter facets), `-11` (request attention count), `-15` (bulk extend deadline), `-16` (list-level close consequence engine), `-17` (Excel), `-18` (column chooser/keyboard selection), `-19` (stale/partial data recovery), `-22` (all legacy form save states/semantics), `-23` (global company search), `-24` (full ambiguity modal), `-26` (clone past drive picker from Create), `-32` (repeatable packages/bonus), `-33` (category override reason), `-40` (live eligibility reach), `-R05` (full parity validation). Source tests do not substitute for browser or PostgreSQL acceptance.

**Round 3 ongoing:** `TPO-drives-42` now validates future deadline, pay/stipend and HTTPS employer URL before any employer/job writes (test TPO-drives-42); full publish action invariants remain open. `TPO-drives-43` now uses `apiFetch` to mask server/network errors, but atomic job+policy rollback and idempotent retry remain open (test TPO-drives-43).

**Remaining unaddressed Drives IDs:** `-04`, `-13`, `-25`, `-27`, `-28`, `-29`, `-30`, `-31`, `-34`, `-35`, `-36`, `-37`, `-38`, `-39`, `-41`, `-42`, `-43`, `-44`, `-45`, `-47`, `-48`, `-49`, `-50`, `-51`, `-52`, `-R03`, `-R04`. `TPO-drives-27` requires private bucket and scanner readiness for real file uploads; never invent signed URLs.

