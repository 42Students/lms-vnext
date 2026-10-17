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

## Round 4 — additional open-gap evidence (not closure; tests written, not run)

| Gap | Status | Evidence and next action |
| --- | --- | --- |
| TPO-drives-27 | BLOCKED | Private JD file bucket, scanner and owner storage protocol must be wired before upload. No fake file input or public URL added. Test TPO-drives-27 in `tests/unit/tpo-drives-chat-3-open-verification.test.ts`. |
| TPO-drives-28 | OPEN | Employment type remains the fixed enum. UI now explains custom job types and placed-counting rules are separate; full configured type and placement accounting integration requires schema/UI work. Test TPO-drives-28. |
| TPO-drives-29 | OPEN | On-site/hybrid/remote no longer imply pool logistics; work-mode helper clarifies travel and scheduling, but host/reporting/travel data not persisted. Test TPO-drives-29. |
| TPO-drives-30 | OPEN | External portal URL is labelled accurately. Portal name is not stored, and UI explicitly says so; schema/API needed. Test TPO-drives-30. |
| TPO-drives-31 | OPEN | Historical outside-platform record remains separate from published opportunities, still cannot attach participants or offers. Source and test TPO-drives-31 confirm no invented job. |
| TPO-drives-32 | OPEN | Fixed, variable and stipend values are persisted on create. Repeatable packages, bonuses, stipend duration and per-role details still require workspace changes. Test TPO-drives-32. |
| TPO-drives-34 | OPEN | Program/cohort targeting exists with tenant-scoped choices, but placement-batch counts/defaults and finished-batch semantics require further work. Test TPO-drives-34. |
| TPO-drives-39 | OPEN | Create explicitly directs round templates and recruiter invites to after-save workspace; legacy preset chooser still missing. Test TPO-drives-39. |
| TPO-drives-40 | OPEN | Setup review exists; a truthful "Who this reaches" panel now explains that reach can only be verified after save. Live eligibility preview on the form remains unavailable. Test TPO-drives-40. |
| TPO-drives-42 | OPEN | Create-side publish preflight and server lifecycle deadline/pay blockers verified; direct publish and TPO lifecycle still have different mandatory round/policy rules. Test TPO-drives-42. |
| TPO-drives-48 | OPEN | Persisted edit state explicitly refuses LIVE edits. No pretend notification choices; live-edit domain contract and audit side effects remain. Test TPO-drives-48. |
| TPO-drives-52 | OPEN | Quick draft and full create routes remain separate. Test TPO-drives-52 locks their current exposure until workflows can be safely consolidated. |

| TPO-drives-26 | DONE (safe create-picker action) | Clone action now uses guarded `apiFetch` and keyboard-accessible `ConfirmDialog` instead of browser confirmation/raw response errors. Named tests TPO-drives-26 and GR-35; server remains responsible for ownership, source copying and auditing. |

| TPO-drives-01 | DONE | Verified sidebar route `/tpo/placements` redirects to actual lifecycle list. Test TPO-drives-01; sidebar component remains owned by chat-9. |
| TPO-drives-09 | DONE (available statuses) | Lifecycle list uses labelled and color-toned status badges for jobs and recruiter requests, including Cancelled / Declined; test TPO-drives-09. Persisted CANCELLED-vs-CLOSED distinction remains TPO-drives-R04. |
| TPO-drives-38 | OPEN | UI explicitly states employer skill requirements cannot be configured here. No persisted skill tags or applicant match setup; needs server/domain support, no fake UI. Test TPO-drives-38. |
| TPO-drives-47 | OPEN | UI directs lead invitations to Engage instead of claiming this form emails recruiters; drive-specific invitation, public review link, email/clipboard UX remain. Test TPO-drives-47. |
| TPO-drives-50 | OPEN | Edit checks TPO actor and college scope, but recruiter-originated approved drive fields are not yet protected by a company-owned-field policy and last-saved attribution. Test TPO-drives-50. |

| TPO-drives-22 | DONE (visible wording) | Create and Edit use `Create drive`, `Create draft`, `Publish`, `Save changes`, `Back to drives` and `Open drive page`. Edit now uses accessible confirmation and guarded friendly API. Named test TPO-drives-22. Full legacy wizard semantics still tracked in other IDs. |

## Round 5 — 2026-10-17, current authoritative dispositions

All tests below were authored but **not executed**. The prior "Remaining unaddressed" snapshot above is historical and should not be used as the current disposition for these IDs.

| ID | Status | Evidence (implementation and named regression) |
| --- | --- | --- |
| TPO-drives-39 | OPEN | Create now explicitly explains that round templates, recruiter invitations and rounds are configured in the saved workspace, never falsely creating rounds. `placement-job-create-form.tsx`; `tests/unit/tpo-drives-chat-3-open-verification.test.ts` TPO-drives-39. Creating/editing round preset rows on the form is still missing. |
| TPO-drives-42 | OPEN | Publish preflight now checks selected or named employer **before** creating employer/job, alongside future IST deadline, pay, role title and HTTPS link. `placement-job-create-form.tsx`; `tests/unit/tpo-drives-gap-closure.test.ts` TPO-drives-42. End-to-end server publication parity and field-level validation are not yet accepted. |
| TPO-drives-44 | OPEN | Dedicated `tpo-drive-form-error-copy.ts` maps known employer, stale, compensation and publish errors to sentences, used by Create and Edit instead of leaking codes. `tests/unit/tpo-drives-chat-3-round4.test.ts` TPO-drives-44. Exact copy for every server error still requires audit and browser testing. |
| TPO-drives-45 | OPEN | Strict IST wall-clock conversion works independently of browser zone; explicit 11:59 PM IST action validates the date and preserves draft autosave. `tpo-drive-deadline-ist.ts`, `placement-job-create-form.tsx`; named round4 TPO-drives-45 tests. A date-first picker that defaults to 23:59 automatically remains. |
| TPO-drives-49 | DONE (source verified; browser unrun) | Frozen Closed/Cancelled drive explains that it cannot be changed and links to Create drive/Clone; the edit route already had a non-destructive loading skeleton, and its error boundary now has exact safe failed-load wording, Retry and Back to drives. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/{page,error,loading}.tsx`; `tests/unit/tpo-drives-chat-3-round4.test.ts` — TPO-drives-49 closed drive has immutable explanation, clone path and retriable read boundary. |

No new schema or proposed migrations in this round. Shell was not edited. `TPO-drives-27` remains blocked by private storage and malware scanning; TPO-drives-47/-48/-50 retain their full server behavior backlog.


## Round 6 — TPO creation and source test reconciliation

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-drives-39 | OPEN (functional advance) | Real legacy Talk/Test/Interview, Test/Technical/HR, Test/GD/Interview presets in `tpo-drive-round-presets.ts`; Create persists actual pending rounds after the draft and eligibility policy through the scoped rounds API. On retry it reads back already-created round sequence before adding only absent rows, refusing changed sequences to prevent duplication. Modes and dates are intentionally scheduled later; custom per-row mode editor is still OPEN. Source test `tpo-drives-chat-3-open-verification.test.ts` now covers the real flow, not obsolete "not created" copy. |
| TPO-drives-37 | DONE | No retired Max active/past backlog or gap-year fields exist in Create; `tests/unit/tpo-drives-chat-3-round4.test.ts`, named TPO-drives-37 test. |
| TPO-drives-43 | OPEN | Partial job retry now also inspects round readback to avoid duplicate preset insertion, but persisted idempotency across lost job POST responses still needs server-side work. |
| TPO-drives-51 | NOT-A-GAP | Existing College Admin Create route has explicit role gate; named source regression now matches the current route formatting. |
| TPO-drives-42 | OPEN | Legacy future deadline/pay/HTTPS/company checks are performed before company creation; source regression assertions match current form, but full server publication parity remains. |

| TPO-drives-11 | DONE (source verified; tests not executed) | Five persisted Needs doing categories on lifecycle list with SQL-scoped counts (pending review Requests, no applicants, no deadline, due soon, overdue), URL-filtered category links and active state. `tpo-drive-lifecycle-list-service.ts`, `lifecycle/page.tsx`, `tests/unit/tpo-drives-gap-closure.test.ts` named TPO-drives-11. |

## Round 11 — complete employer-history duplicate warnings

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-drives-25 | DONE (source-level; tests not run) | `placement-job-create-workspace.tsx` aggregates **all** non-archived college-scoped prior drive titles/status/IDs for the selected employer, independently of three recent-role highlights; `placement-job-create-form.tsx` warns of an existing drive with its status and a direct drive link; ID-named `tests/unit/tpo-drives-chat-3-round4.test.ts` test `TPO-drives-25 Company Memory uses scoped historical drive facts`. |
