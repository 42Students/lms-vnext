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
