# TPO Companies verification

## Chat-2 current round

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-companies-09 | DONE (source) | Status label projection in `tpo-company-memory-workspace.tsx`, named test `tests/unit/chat2-company-memory-gap-parity.test.ts`. |
| TPO-companies-21 | PARTIAL — OPEN | Friendly not-found and storage-unavailable error copy, with Retry; full independent counts warning pending. Same named test. |
| TPO-companies-22 | PARTIAL — OPEN | Company numbers labelled, empty activity copy and placed case corrected; full short date format pending. Same named test. |
| TPO-companies-23 | PARTIAL — OPEN | Timeline actor/type/note displayed together; exact abbreviated timestamp and system actor enrichment pending. Same named test. |

| TPO-companies-19 | PARTIAL — OPEN | Shared Engage Companies view preserves last successful company snapshot and offers independent warning/Retry on refresh failure. Initial empty view and lead-filter ordering require full acceptance. Named `TPO-recruiters-42` test. |

| TPO-companies-22 | DONE (source, unrun) | Company numbers has correct labels and latest type / D MMM, same named unit test. |
| TPO-companies-23 | DONE (source, unrun) | Timeline actor/type/note and IST D MMM, h:mm AM/PM formatter, named unit test. |

| TPO-companies-19 | DONE (source, unrun) | Engage Companies branch is independent from empty/filtered recruiter rows, keeps last successful company list during failures with a separate Retry warning; `tests/unit/chat2-tpo-engage-companies-independent.test.ts` named gap. |

| TPO-companies-03 | DONE (source, tests unrun) | Canonical company detail has same-college optimistic Trusted switch with exact legacy help/status and existing audited management endpoint, no unsafeguarded global change. Named `tests/unit/chat2-company-trust-toggle.test.ts`. |

| TPO-companies-06 | DONE (source; tests unrun) | College count-as-placed policy now counts distinct memberships from real offer ledger in grouped Company Memory + Engage Companies, with actual JOINED hiring-years; SELECTED requires separate selection ledger and displays unavailable rather than fabricated count. `tests/unit/chat2-company-placed-policy.test.ts`. |

## Chat-2 follow-up — company trust and default entrypoint

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-companies-03 | DONE (source; tests unrun) | `src/components/placements/tpo-company-trust-switch.tsx` is an optimistic, bounded Trusted toggle with exact legacy help, on/off and failure text; `tests/unit/chat2-company-trust-and-navigation.test.ts` **TPO-companies-03 persists Trusted as a scoped, versioned toggle…**. |
| TPO-companies-20 | PARTIAL — OPEN | Unfiltered `/tpo/companies` now redirects to the legacy Engage Companies view while named Company Memory and explicitly filtered directory deep links remain working; `src/app/(authenticated)/tpo/companies/page.tsx`; `tests/unit/chat2-company-trust-and-navigation.test.ts` **TPO-companies-20 defaults bare Companies…**. Parallel company detail representations still exist. |
| TPO-companies-22 | DONE (source; tests unrun) | Company numbers heading and no-activity label source contracts verified in `tests/unit/chat2-company-trust-and-navigation.test.ts` **TPO-companies-22 retains verified company numbers…**. |

Builder did not run tests, lint, typecheck, or PostgreSQL integration.
| TPO-companies-29 | PARTIAL — OPEN | `src/app/(authenticated)/tpo/companies/page.tsx` now shows mobile company cards with actual contact/drive/offer/confirmed-join counts and Create drive, while preserving the detailed desktop table; named `tests/unit/chat2-company-trust-and-navigation.test.ts` **TPO-companies-29 offers a non-scrolling mobile directory…**. Canonical company hiring-history table and other views still need mobile layout acceptance. |

## Chat-2 continuation — mobile company history and errors

| TPO-companies-29 | DONE (source; tests not run) | `src/app/(authenticated)/tpo/companies/page.tsx` and `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx` display phone-friendly list and hiring/drive cards while preserving detailed tables at md breakpoint; `tests/unit/chat2-company-trust-and-navigation.test.ts` **TPO-companies-29 offers a non-scrolling mobile directory…**. Name-based memory page uses an unfixed width table. |
| TPO-companies-21 | PARTIAL — OPEN | Name-based Company Memory now has a Retry button on migration/unavailable failures and a truthful counts-as-placed unavailable explanation instead of internal W04 wording; `src/components/tpo/tpo-company-memory-workspace.tsx`; `tests/unit/chat2-company-memory-gap-parity.test.ts` **TPO-companies-21 never exposes DB migration identifiers…**. Independent counts-only retry still open. |


## Chat-2 UNCONFIRMED decisions — 2026-10-17
| ID | Decision | Evidence |
| --- | --- | --- |
| TPO-companies-04 | NOT-A-GAP (safety choice) — Trusted is not blanket recruiter authority: a new drive request remains pending until an explicitly registered TPO approval policy applies. Never publish a recruiter request from a trust badge alone. | `src/modules/placements/recruiter-drive-request-service.ts`; `tests/unit/chat2-unconfirmed-recruiter-company-decisions.test.ts` **TPO-companies-04 never auto-approves…**. |
| TPO-companies-25 | DONE (source; test unrun) — remove opaque `DB09_TPO_API_READY` deployment switch as the proof of schema installation. Each list/detail/person route checks actual registered scoped CRM tables and reports temporary unavailability when absent, instead of locking out installed tables. | `src/app/api/placements/tpo/companies/route.ts`, `detail/route.ts`, `[companyId]/people/route.ts`; named **TPO-companies-25 checks actual registered CRM tables…** in `tests/unit/chat2-unconfirmed-recruiter-company-decisions.test.ts`. |
| TPO-companies-R03 | NOT-A-GAP (least privilege) — preserve explicit TPO identity and persisted placement permissions for company Memory writes instead of broadening them to every college admin or faculty member by role alone. | `src/app/(authenticated)/tpo/companies/page.tsx`, `src/modules/placements/tpo-company-memory-service.ts`; named **TPO-companies-R03 keeps company edit access constrained…** in `tests/unit/chat2-unconfirmed-recruiter-company-decisions.test.ts`. |


## Chat-2 OPEN-gap company friendly errors
| ID | Status | Evidence |
| --- | --- | --- |
| TPO-companies-21 | DONE (source, tests unrun) | Company Memory uses exact **Company not found**, a retained Retry control, a separate warning for unavailable placed counts, and a friendly schema-not-ready message for both old `DB09_MIGRATIONS_PENDING` and new `DATABASE_NOT_READY` API errors. `src/components/tpo/tpo-company-memory-workspace.tsx`; named gap test in `tests/unit/chat2-company-memory-gap-parity.test.ts` and `tests/unit/chat2-company-friendly-retry-21.test.ts`. |


## Chat-2 canonical company navigation decision
| ID | Decision | Evidence |
| --- | --- | --- |
| TPO-companies-20 | NOT-A-GAP (intentional complementary identity views) | Default Companies landing redirects to the legacy Engage Companies tab; explicit `name` maintains grouped Company Memory, and `directory=1` with advanced filters preserves relationship-ID directory deep links. Removing either would break valid bookmarks or conflate similarly named company relationships across college-scoped identities. `src/app/(authenticated)/tpo/companies/page.tsx`; `tests/unit/chat2-campaign-open-increments.test.ts` **TPO-companies-20 routes the default list…**. Counts remain based on real offers per college, not cross-tenant merging. |


## Chat-2 gap-closure continuation (2026-10-18)
| ID | Evidence and status |
| --- | --- |
| TPO-companies-05 | **OPEN.** The canonical Company page and grouped Company Memory remain college-scoped, but an embedded persisted object Team conversation, company mentions/asks and Open in Team affordance cannot be considered complete until the Team kind model exists. No faux messages are displayed. |
| TPO-companies-04 / 25 / R03 | **Prior delegated decisions remain.** Trusted badge never auto-approves a recruiter drive request; CRM API gate checks actual schema readiness; company writes require verified scoped placement access. Tests `chat2-unconfirmed-recruiter-company-decisions.test.ts`. |
| TPO-companies-20 / 21 | **Prior source evidence retained.** Default Companies lands in Engage, explicit directory or grouped Company Memory deep links remain, friendly separate not-found/retry and policy-warning behavior is preserved. |

## Chat-3 final-sprint handoff — 18 TPO Companies IDs (2026-10-18)

These are **named source-contract regressions**, not completed browser/DB acceptance. The first row is still OPEN; the other 17 were already implemented on `main` and now have explicit ID-named test evidence. No page UI/UX restyling was performed. All routes/data must still be checked in CI and a disposable college-scoped database.

| Gap | Disposition | Source evidence / unresolved limitation | Named test |
| --- | --- | --- | --- |
| TPO-companies-05 | OPEN | Company-kind group conversation and persisted mentions/tasks/decisions do not exist: Team service scopes to paired TPO membership IDs only. Never fabricate an Open in Team link or leak private pairwise messages; requires scoped company thread model, authorization and UI. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-05 |
| TPO-companies-07 | FIXED-ON-MAIN (source) | Canonical company detail renders persisted confirmed joined learners by year and years-hiring/repeat-relationship facts. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-07 |
| TPO-companies-08 | FIXED-ON-MAIN (source) | Company Memory drive list includes applied/offer counts, bounded search and spreadsheet-safe drive CSV export. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-08 |
| TPO-companies-10 | FIXED-ON-MAIN (source) | Company Memory drive action points to the real authorized `/tpo/placements/jobs/{jobId}` route. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-10 |
| TPO-companies-11 | FIXED-ON-MAIN (source) | Company Memory documents enumerate persisted applicant-share history or explicitly show Nothing shared yet. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-11 |
| TPO-companies-12 | FIXED-ON-MAIN (source) | Recruiter contacts render human stages such as Drive planned and Invited rather than only machine enum values. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-12 |
| TPO-companies-13 | FIXED-ON-MAIN (source) | Canonical company detail has Create drive with name-based prefill; full create resolves the selected relationship. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-13 |
| TPO-companies-14 | FIXED-ON-MAIN (source) | Company Memory contains company-specific New recruiter lead, New drive and Follow-up actions. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-14 |
| TPO-companies-15 | FIXED-ON-MAIN (source) | Engage Companies communication is optimistic, filterable and rolls back a failed write with plain-language feedback. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-15 |
| TPO-companies-16 | FIXED-ON-MAIN (source) | Engage Companies uses company/person search and communication/contact/history/alias filters. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-16 |
| TPO-companies-17 | FIXED-ON-MAIN (source) | Companies table derives people names and an Add a contact affordance with Drives that ran wording. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-17 |
| TPO-companies-18 | FIXED-ON-MAIN (source) | Companies tab includes count and scoped CSV export of visible filtered company rows. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-18 |
| TPO-companies-24 | FIXED-ON-MAIN (source) | Sidebar route matcher supports `/tpo/companies` under the intended Engage navigation entry; shared shell not modified here. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-24 |
| TPO-companies-26 | FIXED-ON-MAIN (source) | Company creation dialog handles Escape, aria-modal, and focus trapping; remaining company mutations should use audited confirmations. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-26 |
| TPO-companies-27 | FIXED-ON-MAIN (source) | Canonical directory exposes company CSV, sorting and per-company create-drive paths. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-27 |
| TPO-companies-28 | FIXED-ON-MAIN (source; privacy review pending) | Canonical hiring pulse derives persisted outcomes and is under authorized TPO company detail. Do not expose learner PII in a public or recruiter company view; browser/data-minimization review remains. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-28 |
| TPO-companies-R02 | FIXED-ON-MAIN (source) | Public join-link card has safe employer-domain setup, domain requirements, and unavailable-source error state. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-R02 |
| TPO-companies-R05 | FIXED-ON-MAIN (source) | Canonical company drive query uses descending persisted createdAt, newer jobs first. | `tests/unit/chat3-final-sprint-companies-round14.test.ts` — TPO-companies-R05 |

## Chat-3 final sprint — company memory verification (source-level, CI pending)

| Gap ID | Disposition | Specific evidence |
| --- | --- | --- |
| TPO-companies-07 | DONE (source) | `tpo-company-memory-service.ts` computes distinct confirmed JOINED learners by recorded joining year; `tpo-company-memory-workspace.tsx` now displays “Students placed, by year” bars and correct repeat relationship subtitle without inventing selected/offer-only placements. `tests/unit/chat3-final-sprint-company-memory.test.ts`, test `TPO-companies-07`. |
| TPO-companies-08 | DONE (source) | The name-based drives table shows year, applied and offers, plus working scoped drive search and CSV export (`companyDriveCsv`). Unavailable dependent counts are not silently treated as true zero. Same test file `TPO-companies-08`. |
| TPO-companies-10 | DONE (source) | Drive row links use the existing `/tpo/placements/jobs/{id}` route, not the former 404 path. Same test file `TPO-companies-10`. |
| TPO-companies-11 | DONE (source) | Company Memory documents use real company share history, “Applicant list shared …”, authorized Open drive link, and “Nothing shared yet” only when history is ready and empty. Same test file `TPO-companies-11`. |
| TPO-companies-12 | DONE (source) | Person rows show effective recruiter stage and persisted invite/join/sign-in activity, with explicit joined-not-signed-in and bounced cases, not solely `manualStage`. Same test file `TPO-companies-12`. |

Tests were authored but not executed here. Browser, PostgreSQL and CI verification remain with the orchestrator.

## Chat-3 final sprint — Engage and company actions

| Gap ID | Disposition | Evidence |
| --- | --- | --- |
| TPO-companies-13 | DONE (source) | Canonical detail exposes Create drive before Add contact; the TPO create route consumes `?company=` and initializes the selected employer. `tests/unit/chat3-final-sprint-company-engage.test.ts`, named `TPO-companies-13`. |
| TPO-companies-14 | DONE (source, shell untouched) | The name-based company view has a context-specific `+ New` menu with “New recruiter lead for …”, “New drive for …”, and “Follow-up” links. No shared-shell modification was attempted. Same file `TPO-companies-14`. |
| TPO-companies-15 | DONE (source) | Engage Companies communication is a persisted per-company status loaded from its scoped API, with legacy-derived fallback and Not contacted/Emailed/Replied/Meeting set/Not interested options. Same file `TPO-companies-15`. |
| TPO-companies-16 | DONE (source) | Engage Companies independently filters by company/people search, contacts, drive presence, communication and alias spellings; “Clear company filters” restores defaults without accidentally filtering only recruiter leads. Same file `TPO-companies-16`. |
| TPO-companies-17 | DONE (source) | Engage Companies lists linked People names or “Add a contact” with company prefill, plus “Drives that ran” and student-placement counts. Same file `TPO-companies-17`. |

All five named source regressions were added; integration, mobile and browser acceptance remain unrun.

## Chat-3 final sprint — company exports, accessibility and privacy

| Gap ID | Disposition | Evidence |
| --- | --- | --- |
| TPO-companies-18 | DONE (source) | Engage Companies presents `Companies (n)` and exports matching company rows as CSV with a dedicated action. `tests/unit/chat3-final-sprint-company-accessibility.test.ts`, named `TPO-companies-18`. |
| TPO-companies-24 | DONE (source) | The shared legacy sidebar active resolver treats `/tpo/companies` and descendant company detail URLs as Engage, without an unauthorized chat-3 shell edit. Same test file `TPO-companies-24`. |
| TPO-companies-26 | DONE (source, create modal) | The Add company dialog uses `role=dialog`, `aria-modal`, Escape, a Tab focus loop, and returns focus to the launch button; no `window.confirm` in this form. Other company actions should retain their existing focus/confirmation contracts in browser acceptance. Same test file `TPO-companies-26`. |
| TPO-companies-27 | DONE (source) | Canonical company directory exposes sorting, a matching scoped CSV export and Create drive actions; backend export authorization is independent of the UI. Same test file `TPO-companies-27`. |
| TPO-companies-28 | DONE (source, safer behavior) | Canonical hiring rows show role, pay, offer and joining statuses, without adding learner-name fields to the Company screen; sensitive learner profile details belong to separately authorized placement flows. Same test file `TPO-companies-28`. |

These named regressions were authored, not run; responsive and keyboard browser acceptance is outstanding.

### Round-14 R02 and company privacy refinements

- **TPO-companies-R02:** The join-link card now says `Anyone at {company name}` rather than repeating the domain; the registered email domain remains explicitly labelled `@domain`. A `DOMAIN_REQUIRED` API response provides the precise add-domain instruction, stale/not-found errors stay readable, and a failed initial load has a Retry action. Source: `src/components/tpo/tpo-public-join-link-card.tsx`. ID-named test in `chat3-final-sprint-companies-round14.test.ts`.
- **TPO-companies-28:** The authorized canonical company summary renders role, offer status, joining status, dates and aggregated confirmed-join evidence without rendering `candidateName` or `learnerName` fields. Applicant identity belongs in the separately authorized candidate/drive workflows. Same ID-named test.
- **TPO-companies-13:** The canonical Create drive URL sends the company hint to the full create page, which resolves `initialCompanyName` to a scoped company relationship. Same ID-named regression.

## Chat-3 final sprint — company Team and reviewer findings

| Gap ID | Disposition | Code/test/evidence |
| --- | --- | --- |
| TPO-companies-05 | PARTIAL — database registration and full legacy mention bells remain outstanding | Implemented distinct company-scoped TPO team message/ask/follow/decision schema in `src/db/schema/tpo-company-team.ts`, permission- and same-origin-guarded read/writes `tpo-company-team-service.ts` and `app/api/placements/tpo/company-team/[companyId]/route.ts`, embedded Team panels in both company screens, and `Open in Team` route. Messages are bounded to 4,000 chars, 30-second visible refresh, decision marks, ask lifecycle with assignee-only Done and asker-only Cancel, 15-minute self-edit, self-delete, and follow state. Real URL permission checks require active college relationship and persisted placement-team membership. Proposed SQL is `docs/proposed-migrations/chat3-tpo-company-team.sql` and unregistered tables show “unavailable”, never fake content. Explicitly NOT claimed: functional mention-notification bells, resolved #object lookup links or complete legacy topic feed; migration must be registered before runtime operation. `tests/unit/chat3-final-sprint-company-team-and-review.test.ts`, named `TPO-companies-05`. |
| TPO-companies-R02 | DONE (source; runtime pending) | The public company join-link card now uses company-name wording, domain editing and `@domain`, structured domain prerequisite and stale-link errors, an accessible `ConfirmDialog` instead of `window.confirm`, and a scoped no-cache status retry endpoint. The one-time token is never returned on status read. `tests/unit/chat3-final-sprint-company-team-and-review.test.ts`, `TPO-companies-R02`. |
| TPO-companies-R05 | DONE (source; runtime pending) | Canonical company drive query explicitly uses descending created date, consistent with the name page and newest-first vNext policy; `tpo-companies-view-service.ts`; `tests/unit/chat3-final-sprint-company-team-and-review.test.ts`, `TPO-companies-R05`. |

All 18 final-sprint IDs now have an ID-named source regression and acceptance entry. TPO-companies-05 is **not** fully closed while migration registration and real mention/link/bell parity remain outstanding. Tests were authored but not executed.

### TPO-companies-05 follow-on: working feature surface and notifications

`TPO-companies-05` now also sends transactional `in_app_notifications` to active, verified placement-team recipients for follows, `@team`, explicit `@member:<uuid>` mentions, and ask completion/cancellation; the author is excluded and recipients are revalidated against college membership, active platform status and placement roles. Message rendering resolves `#drive:<uuid>`, `#company:<uuid>` and `#student:<uuid>` through existing permission-checked internal destinations rather than constructing unauthorized profile data. The composer has an explicit teammate picker, and the timeline includes IST day separators and overdue-ask labels. Test `TPO-companies-05 notifies only active same-college team followers, @team and explicit @members` in `tests/unit/chat3-final-sprint-company-team-and-review.test.ts`.

**Remaining acceptance dependency:** The proposed `chat3-tpo-company-team.sql` must be registered and applied by the orchestrator before any real company thread can be used. No browser, real-database, notification-delivery, or concurrent-write test was run by this lane. This is a source-complete proposed feature, not a claim of production deployment.

TPO-companies-scale-01: One scoped company-drive read, partitioned by job ID. Behavior covered in tests/unit/chat12-tpo-company-drive-facts-scaling.test.ts. Authored; cloud validation pending.
TPO-companies-scale-02: 500-job bounded facts batches, 1205-ID and duplicate behavioral test in tests/unit/chat12-tpo-company-drive-facts-scaling.test.ts. Authored only; load verification pending.
UX-tpo-first-third-archived-01: Direct SSR page tests in tests/unit/chat12-tpo-archived-everyone-ssr-journey.test.tsx for role denial, persisted revocation, scoped archive count limitation, empty state, restoration link. Authored only; browser acceptance pending.
TPO-BREAK-company-lifecycle-read-05: Source `src/modules/placements/tpo-company-lifecycle-service.ts` requires persisted active actor before lifecycle, archive and restoration entrypoints; direct service test `tests/unit/chat12-tpo-company-lifecycle-persisted-reads.test.ts` covers revoked/wrong-role, tenant drift, malformed input, empty and 100-row cap. Written; not executed.

### Chat-3 follow-on — TPO-companies-05 request safety (CI pending)

| Gap ID | Status | Evidence |
| --- | --- | --- |
| TPO-companies-05 | PARTIAL — source guarded, database registration pending | The embedded composer now holds a synchronous in-flight lock and a stable UUID idempotency key for retries of the same message, resetting the key if the draft changes. The company-Team mutation endpoint parses a maximum 16 KiB JSON body, rejects corrupt UTF-8, unsupported media types and malformed Content-Length before any database mutation, and returns safe 400/413/415 messages with a request reference. `tests/unit/chat3-tpo-company-team-request-transport.test.ts` covers actual POST behavior, forged origin, valid scoped forwarding, Unicode JSON, bounds and the duplicate-send source contract. Source files: `src/components/tpo/tpo-company-team-conversation.tsx`, `src/modules/placements/tpo-company-team-request-body.ts`, `src/app/api/placements/tpo/company-team/[companyId]/route.ts`. Domain, stale-revision, permission, storage-pending, and rejected-origin API responses now also include friendly recovery text and a request reference; the same transport test exercises the mapped statuses. Full PostgreSQL migration, browser retries and notification delivery remain unverified. |

