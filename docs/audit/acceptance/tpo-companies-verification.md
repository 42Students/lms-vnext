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
