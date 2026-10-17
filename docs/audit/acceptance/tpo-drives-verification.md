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


## Round 4 — review-first Drives tabs

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-drives-04 | DONE | `src/modules/placements/tpo-drive-lifecycle-list-service.ts`: default Requests when pending reviews else Live, explicit All preserved; persistent college-scoped counts. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx`: clickable count badges and active view. Named test `TPO-drives-04 review-first default and persistent badge counts` in `tests/unit/tpo-drives-chat-3-round4.test.ts` (written, not run). |

| TPO-drives-45 | OPEN | `tpo-drive-deadline-ist.ts` parses valid IST wall time and rejects impossible days before the first creation write; Create form uses the converted ISO and explains IST. 11:59 PM prefill still outstanding. `tests/unit/tpo-drives-chat-3-round4.test.ts`, two TPO-drives-45 tests (not run). |

| TPO-drives-37 | OPEN | Legacy retired backlog/gap-year filters are now absent from Create and its submitted policy. Other policy APIs can still set them; `tests/unit/tpo-drives-chat-3-round4.test.ts` test TPO-drives-37. |
| TPO-drives-49 | OPEN | Non-editable edit page points operators to Clone a past drive; complete frozen detail/hydration behavior remains; test TPO-drives-49. |

| TPO-drives-35 | OPEN | Create now sends `minPctThroughout` and `requireVerifiedEvidence` and validates percentage bounds; PG/gender/branch parity remains. Test TPO-drives-35 in `tests/unit/tpo-drives-chat-3-round4.test.ts`. |
| TPO-drives-36 | OPEN | Five legacy eligibility presets populate actual policy values with a college conversion caution. Dynamic CGPA-to-percentage hint remains. Test TPO-drives-36. |

| TPO-drives-R02 | DONE | Publish action creates a reviewed draft and navigates to workspace `?publish=1`, never publishes directly from form; named TPO-drives-R02 test. Existing flow independently verified in source. |
| TPO-drives-R03 | DONE | Preflight now shows warning for absent rounds and warns when all targeting/evidence fields are empty, nonblocking; named TPO-drives-R03 test. |
| TPO-drives-R05 | OPEN | Create fields enforce annual CTC upper bounds and numeric/percentage caps; complete Zod field error mapping, description parity and role creation remain. Named TPO-drives-R05 test. |
| TPO-drives-44 | OPEN | Internal create response failures now tell the operator to inspect saved drafts/employers instead of echoing implementation detail; exact legacy copy per error remains unverified; named TPO-drives-44 test. |

| TPO-drives-25 | OPEN | `placement-job-create-workspace.tsx` now computes college-scoped company memory (past drives, joined hires, latest date, recent roles); create form shows recent-title duplicate warning; full employer-level duplicate detection beyond recent three titles remains. Test TPO-drives-25 in `tests/unit/tpo-drives-chat-3-round4.test.ts`. |
| TPO-drives-R03 | DONE | Revised warning suppresses false unrestricted-audience copy when an explicit eligibility preset is selected; second test TPO-drives-R03 in `tests/unit/tpo-drives-chat-3-round4.test.ts`. |

| TPO-drives-43 | OPEN | Client keeps server-returned draft ID and relationship in a ref; a failed eligibility write can retry without a second job/company create, and changing fields after partial save redirects to existing draft instead. Missing true atomic server transaction / idempotency key and persistence across browser restarts. Named test TPO-drives-43, `tests/unit/tpo-drives-chat-3-round4.test.ts`. |

| TPO-drives-15 | OPEN | First published-drive deadline already supported by DB service; now form validates strict IST date and uses accessible confirmation, guarded `apiFetch`, preserving draft on failure. Multi-drive deadline bulk action remains open. Tests TPO-drives-15 and TPO-drives-45 in round-4. |

| TPO-drives-46 | OPEN | Direct publish now creates eligible learner in-app notifications in the same transaction, after immutable publication event and before first-drive debarment advance, matching TPO lifecycle publish. Email provider is explicitly unavailable and still needs owner/provider integration. Test TPO-drives-46. |
| TPO-drives-R01 | OPEN | Independently inspected direct `publishPlacementJob`: server enforces future application deadline and a CTC/stipend presence. Still differs from TPO lifecycle round/policy blockers; test TPO-drives-R01 records partial server preflight. |
| TPO-drives-51 | NOT-A-GAP (role alternative) | College Admin has a permission-gated separate `/college/placements/new` with the same `PlacementJobCreateWorkspace`; TPO URL does not need to grant College Admin role. Test TPO-drives-51. Broader college-admin action feature parity not asserted. |

| TPO-drives-26 | DONE (create-picker route) | `placement-job-create-workspace.tsx` now offers a college-scoped last-20 closed/cancelled drive picker with `TpoDriveCloneAction`; existing API creates a fresh draft, drops dates/outcomes/offer history and stores `sourceJobId` audit. Full legacy clone UX still subject to browser acceptance; named test TPO-drives-26. |

| TPO-drives-41 | OPEN | Create form now stores a per-user/college browser draft, restores field/selection values and clears backup after success, with a discard option and existing unload/double-submit guard. Server-side autosave + last-saved-by/time and route-change interception remain incomplete. Named test TPO-drives-41. |

| GR-60 | PARTIAL (TPO Drive Create) | Form backup uses a scoped browser key with stable hooks and no lint suppressions; named GR-60 TPO-drives-41 test. Server saved-state parity still open. |
