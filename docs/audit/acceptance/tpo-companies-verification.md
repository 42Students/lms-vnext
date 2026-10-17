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

## [chat-5] Owner-delegated UNCONFIRMED decisions (2026-10-17)

| ID | Result | Decision and evidence |
|---|---|---|
| TPO-companies-04 | NOT-A-GAP | Decision: Trusted company is a directory confidence indicator only; keep independent TPO approval for a new drive request. Auto-publishing a trusted company's new request risks learner harm. Test: `tests/unit/chat5-delegated-policy-decisions.test.ts` — named test `TPO-companies-04` (source/policy regression; executable CI pending). |
| TPO-companies-25 | DONE | Decision: Remove obsolete DB09_TPO_API_READY gates after migrations were registered; real readiness, persisted scope and normal error responses own failures. GET list/detail and same-origin people POST are no longer dependent on an env flag. Test: `tests/unit/chat5-delegated-policy-decisions.test.ts` — named test `TPO-companies-25` (source/policy regression; executable CI pending). |
| TPO-companies-R03 | OPEN | Decision: Allow College Admin company operations under placements.manage with persisted active actor checks, not only an explicit TPO role; directory/detail/lifecycle/link scopes updated, remaining company mutation endpoints require audit. Test: `tests/unit/chat5-unconfirmed-permission-decisions.test.ts` — named test `TPO-companies-R03` (source/policy regression; executable CI pending). |
