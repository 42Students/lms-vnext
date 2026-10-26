# TPO prototype 01 — Companies → Today: source and acceptance record

**Reference:** original user-supplied `42LMS pages prototype-png-tpo(1).zip` → `Companies › Today.png`, 2880 × 1912 px, depicted 22 October 2026. This is a **static design reference**, not representative live data.

**Current route:** `/tpo/companies/today` (focus by default).
**Old LMS logic consulted:** `42Students/lms2-fe`, branch `lms-dev-2026`, `src/components/tpo/today/TodayQueue.jsx` and `src/pages/tpo/companies.js`.
**New platform implementation:** `src/app/(authenticated)/tpo/companies/today/page.tsx`, `src/components/tpo/tpo-companies-today.tsx`, CSS module, company-attention and follow-up services.
**Evidence:** `tests/unit/tpo-today-prototype-views.test.ts`, `.github/workflows/tpo-prototype-source-acceptance.yml`. This is source/unit evidence only: do not mark screenshot or live-provider acceptance without new artifacts.

## Prototype walkthrough → implementation

| Requirement | Source-level status | Caveat / acceptance |
| --- | --- | --- |
| Shared left navigation / Companies tabs / authenticated topbar | Existing shell and TPO section tabs retained | Screenshot at original viewport and page-auth verification still required |
| Today focus list includes company identity and recruiter actions, not only CRM follow-ups | Implemented: typed, selectable company, reply and follow-up items in a single queue | This is a **bounded** composite preview; no invented invitation/expiry task facts |
| Company verification action opens selected identity facts | Implemented: selected-company pane, verified vs college-trusted facts, recruiter/company links | TPO cannot impersonate platform verification; company decision happens on authorized detail route |
| Waiting recruiter reply opens its own context in the right pane | Implemented: selected-reply pane, receipt timestamp, preview, real Messages deep-link | An inbox reply is not a bulk email campaign receipt; page selection never sends |
| Due and upcoming follow-ups, days late and seven IST dates | Implemented using persisted CRM followups and IST day model | Next steps without a persisted follow-up are not fabricated |
| Follow-up Done / Tomorrow / planned next follow-up | Existing guarded, version-aware and confirmed mutation endpoints preserved | Authenticated browser and failure-path acceptance still needed |
| J/K movement and 'Later & next' across all loaded work types | Implemented; leaves persisted data unchanged until confirmed action | Real keyboard and focus testing pending |
| My work vs everyone's with unassigned and college boundary | Existing college-scoped server reads and scope validation retained | UI cannot select another college |
| Summary counts, not-contacted, undated and later followups | Real source counts; the shown source/total discrepancy and outage are labeled | Company preview is at most 15; replies are at most three in focus |
| Trust/verification safety | Company detail link points to existing college trust controls; misleading trust-implies-direct-publish copy corrected | Actual direct publication requires verified company, current grant and college policy |
| Responsive / same-viewport visual parity | **OPEN** | Needs actual vNext browser screenshot compared to original image; nothing is marked pixel-matched |

## Important safety and truthfulness

- The prototype shows example people such as Ravi Kumar and Openjoin Co. **Do not seed, invent, or hard-code these names into runtime UI.**
- A recruiting lead's association with a company is not independent company verification.
- A college can choose a company-trust relationship; that is **not** platform verification.
- Selecting a message, clicking 'Later & next', or opening a company record **does not** send an email, mark a reply handled, or persist a company-trust change.
- Failed optional reads must report incompleteness rather than showing a complete zero count; the independent follow-up queue remains useful.
- Do not enable client-side direct-publish merely because company trust is true; server policy remains the source of truth.
- A successful source test is not proof of a browser-visible render, persisted mutation, real provider receipt, or pixel match.

## Required acceptance before declaring this page fully closed

1. Dedicated TPO source CI **on the relevant final head SHA** passes both strict application typecheck and the focused unit set; record run URL and commit.
2. Authenticated TPO browser walkthrough with at least one unverified linked company, one waiting recruiter conversation and one due follow-up: selected detail, J/K, day switch, empty/partial/outage, business permissions, same-college scope and stale deep link.
3. Persisted end-to-end mutation test for follow-up Done, Tomorrow, idempotency/stale conflict and safe failure; verify no sends/trust changes occur from navigation alone.
4. Exact 1440 × 956 viewport runtime screenshot against the 2880 × 1912 prototype at 2x scaling, plus responsive checks; document remaining intentional changes due to live-data truthfulness.

**Current closure status:** focused source/typecheck **PASS** on commit `5f5167db9c69265fab5f21b6b13c44ab5bfa6c32`, [TPO run 40398586308](https://github.com/42Students/lms-vnext/actions/runs/40398586308): **21/21 test files and 129/129 tests passed**. Page 01 is code-implemented with a passing dedicated acceptance gate; authenticated browser flows, exact-viewport visual acceptance and global CI remain open. A subsequent trust-helper copy correction does not independently certify a new runtime pass.
