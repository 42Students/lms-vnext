# TPO / Companies: Round R review
Reviewed: 2026-10-16 by Claude Sonnet 5.5 (Round R, code only, independent re-audit before opening the Round A file). Judged against `origin/main` at d1925cce3, which includes chat-2 commit 4ac4048ce "TPO-companies-01 wire one-time company join links".

## 1. Summary
Round A gaps: 30. CONFIRMED 27, WRONG 2 (01, 30), SEVERITY-CHANGE 1 (02). MISSED 5 (TPO-companies-R01 to R05). Discrepancy rate = (5 + 2 + 1) / (30 + 5) = 8/35 = 22.9%.
Round A is accurate and thorough; its main staleness is that chat-2 closed the core of gap 01 after it was written.

Independent method: read legacy `pages/tpo/companies.js`, `recruiterActivity.js`, `recruiterLeadStages.js`, `CompanyLinkCard.jsx`, `TeamConversation.jsx`, the Engage Companies tab in `pages/tpo/recruiters/index.js` (_hr-tpo-fe) and backend `TpoCompanyController`, `CompanyJoinService`, `TpoRecruiterLeadsHubService` (`companies()`, `companyDetail()`, `setCommunication()`) at lms-dev-2026; read vNext `tpo/companies/**`, `tpo-company-memory-workspace.tsx`, `tpo-public-join-link-card.tsx`, `tpo-public-join-link-service.ts`, lifecycle editor, trust toggle, create form, Engage workspace and the join schema.

## 2. Round A gap verdicts
| Round A gap ID | Verdict | Note |
|---|---|---|
| TPO-companies-01 | WRONG (closed on main) | Commit 4ac4048ce added `TpoPublicJoinLinkCard` on `/tpo/companies/[companyId]` (`page.tsx:101`) and `POST /api/placements/tpo/public-join-links` (same-origin, `placements.manage`, transactional create/replace, hash only, activity event `PLACEMENTS_PUBLIC_RECRUITER_LINK_CHANGED`, DOMAIN_REQUIRED enforced). One-time URL, Copy, replace confirm and "Made {date}" exist. Residuals (counters, copy, name-page absence) are now TPO-companies-R01, R02, R04 |
| TPO-companies-02 | SEVERITY-CHANGE S2 to S1 | Still no way to add a domain to an existing company (only the optional primary domain at create, `tpo-company-create-form.tsx:107`). Now that the link card exists and is disabled without a domain (`tpo-public-join-link-card.tsx:94`, service `DOMAIN_REQUIRED`), every relationship created without a domain, or from a lead or drive, can never get a link. The Round A note "precondition absent" is now wrong (it is enforced). vNext also holds one `primaryDomain`, legacy a list |
| TPO-companies-03 | CONFIRMED | A third location exists: `/tpo/settings/trusted` `tpo-trust-toggle.tsx` uses `window.prompt` for the reason (8-500 chars) then `window.confirm`; none of the legacy toasts or helper text |
| TPO-companies-04 | CONFIRMED (effect UNCONFIRMED) | `isTrusted` consumers on main are directory, lifecycle, summary and display files; no drive request or publish service reads it. Create-form copy even says trust does not change direct login permissions. The working tree has an uncommitted `recruiter-drive-request-model.ts`; re-check once it lands |
| TPO-companies-05 | CONFIRMED | `tpo-team-conversation-service.ts` has no company kind |
| TPO-companies-06 | CONFIRMED | `tpo-company-memory-service.ts:257,338` hard-code null |
| TPO-companies-07 | CONFIRMED | `hiredPerYear: []`, and the workspace declares the type but renders no per-year card |
| TPO-companies-08 | CONFIRMED | |
| TPO-companies-09 | CONFIRMED | |
| TPO-companies-10 | CONFIRMED | `tpo/placements` has only `jobs`, `new`, `lifecycle`, `recorded-outside`, `schedule-conflicts`; workspace links `/tpo/placements/{id}` (:249) |
| TPO-companies-11 | CONFIRMED | The canonical page has no Documents section at all (company share routes exist under `api/placements/tpo/jobs/[jobId]/company-shares`) |
| TPO-companies-12 | CONFIRMED | |
| TPO-companies-13 | CONFIRMED | `tpo/placements/new/page.tsx` takes no searchParams; legacy `DriveFormPage.js:196` prefilled `companyName` from `?company=` |
| TPO-companies-14 | CONFIRMED | |
| TPO-companies-15 | CONFIRMED | |
| TPO-companies-16 | CONFIRMED | |
| TPO-companies-17 | CONFIRMED | |
| TPO-companies-18 | CONFIRMED | |
| TPO-companies-19 | CONFIRMED | Branch order verified at `recruiter-leads-workspace.tsx:366-370` |
| TPO-companies-20 | CONFIRMED | |
| TPO-companies-21 | CONFIRMED | |
| TPO-companies-22 | CONFIRMED | |
| TPO-companies-23 | CONFIRMED | |
| TPO-companies-24 | CONFIRMED | No `companies` rule in `legacy-sidebar-active-model.ts` |
| TPO-companies-25 | CONFIRMED (live check pending) | |
| TPO-companies-26 | CONFIRMED | Join-link replace also uses `window.confirm` (`tpo-public-join-link-card.tsx:23`) |
| TPO-companies-27 | CONFIRMED | |
| TPO-companies-28 | CONFIRMED | |
| TPO-companies-29 | CONFIRMED | |
| TPO-companies-30 | WRONG (deep link works) | `tpo/recruiters/page.tsx:31-32` passes `initialAdd` and `initialCompany`; `recruiter-leads-workspace.tsx:106,109,482` opens the Add form with the company prefilled (commit 7ccc8b04b). Still missing is the in-table `Add a contact` button, already in TPO-companies-17 |

## 3. MISSED gaps
| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| TPO-companies-R01 | Company link card shows no opened/joined counters; instead it prints internal jargon "Opened and joined counts are pending database registration." to a TPO. The real table has no `opens_count`/`joins_count` (only the staged schema declares them) and the public preview/join path never increments anything, so the TPO cannot tell whether a link is used | MISSING-FIELD | S2 | CLC:338-342 ("Made {date}. Opened n time(s), n joined."); CJS:104-115 (opens, joins), 126-135 (preview increments opens), 188-189 (join increments joins) | `tpo-public-join-link-card.tsx:98-102`; `db/schema/placement-public-joins.ts:7-28` (no counters); `public-join/staged-schema.ts:21-22` (staged only) |
| TPO-companies-R02 | Link card wording and behaviour differ: (a) text says "Anyone at {domain}" not "Anyone at {company name}" and prints the domain twice ("Email domains: x", no `@`); (b) no inline domain input or `Add domain`; (c) failure shows generic "Couldn't make the link" and never the reason (legacy surfaces "Add the company's email domain first, so only its people can join"); the API returns DOMAIN_REQUIRED / ALREADY_EXISTS / STALE / NOT_FOUND but the card ignores them; (d) load failure has no Retry; (e) replace uses `window.confirm` not a Popconfirm with a `Make a new link` button; (f) date uses `toLocaleDateString("en-IN")` (dd/mm/yyyy) not `D MMM YYYY` | COPY | S3 | CLC:263-355 (esp. 316-331, 343-348); CJS:81 | `tpo-public-join-link-card.tsx:23-47,63-77,92-97`; `api/placements/tpo/public-join-links/route.ts:30-38` |
| TPO-companies-R03 | Role scope narrower: legacy `/api/v1/tpo/**` (company detail, engagement, join-link, trusted, communication) accepts the TPO admin or the college admin (placement-cell guests ADMIN and FACULTY via PORTAL_GUESTS); every vNext company page and service requires the TPO membership role and redirects others to `/dashboard`. A college admin who used the company page in legacy has only read-only `/college/companies` | PERMISSION | S3 | legacy-inventory-B.md line 5 (role legend); `TpoCompanyController` scopes by `p().getCollegeId()` only | `tpo/companies/page.tsx:59-66`; `[companyId]/page.tsx:38-45`; `tpo-public-join-link-service.ts:30-40`. UNCONFIRMED whether the product wants college admin here |
| TPO-companies-R04 | Join link, domain and trust controls exist only on the UUID page. Companies that appear only as a CRM name or by drives (legacy `companyDetail` resolves a `companyId` from `job.company_id` or the college list and shows the card whenever it resolves) land on the `?name=` page with no link card, no trust state and no pointer to the canonical page; the dominant legacy entry (Engage Companies tab, linking to `?name=`) never reaches the link card | MISSING-ACTION | S2 | PG:151 (`data.companyId && <CompanyLinkCard>`); HUB:388-395 (companyId resolved by name) | `tpo-company-memory-workspace.tsx:151-255` (no card); `recruiter-leads-workspace.tsx:415-420` (links to `?name=`); `companies/page.tsx:50-54` |
| TPO-companies-R05 | Canonical page lists drives oldest first (`asc(placementJobs.createdAt)` in `tpo-companies-view-service.ts`, no re-sort); legacy and the vNext name page list newest first. UNCONFIRMED until checked on seeded data | STATE | S3 | HUB:~392 (`ORDER BY j.id DESC`) | `tpo-companies-view-service.ts` drive query (asc createdAt); `[companyId]/page.tsx:306` renders in service order; name page `tpo-company-memory-service.ts:137` is desc |

## 4. WRONG and SEVERITY-CHANGE details
- 01 (WRONG): verified in current code. Files: `src/components/tpo/tpo-public-join-link-card.tsx`, `src/modules/placements/tpo-public-join-link-service.ts`, `src/app/api/placements/tpo/public-join-links/route.ts`, `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx:62,101`. Verified by reading: create vs replace actions, 409 on ALREADY_EXISTS/STALE, 422 DOMAIN_REQUIRED, token stored hashed, URL returned once, expiry set to 9999-12-31 as a stand-in for legacy "never expires". Public-side tests exist (`TPO-campaigns-public-19/20`); a card-level browser check is still pending. Replacement gaps: R01, R02, R04.
- 02 (S2 to S1): see table. Fix hint: add `POST /api/placements/tpo/companies/[companyId]/domains` (validate with `placementCompanyDomainSchema`, audit event, reject a domain owned by another company) plus the inline input on the card; ideally several domains.
- 30 (WRONG): deep-link prefill closed by 7ccc8b04b; keep only the missing button (17).

## 5. Checked, no gap
- Intentional vNext improvements confirmed: archive/restore with reason and audit, contact log, internal feedback, paged directory with search, optimistic concurrency (`expectedUpdatedAt`), same-origin checks, activity event on link changes. Archived relationships are excluded from detail (`listPlacementCompanies` is ACTIVE-only), so the detail page 404s for them; reach them via `/archived` then `/manage`.
- Legacy `GET /companies/detail` returns "Not found" when a company has neither contact nor drive; vNext `notFound()` is equivalent.
- Legacy "no name redirects to Engage Companies" is a deliberate change (Round A 20).

## 6. UNCONFIRMED (batch for the live check on the deployed dev site)
1. TPO-companies-04: create a recruiter drive request for a trusted vs an untrusted company on dev and observe whether it goes live without TPO review (once the working-tree `recruiter-drive-request-*` work is on main).
2. TPO-companies-25: as TPO, `GET /api/placements/tpo/companies?collegeId=...` and open `/tpo/companies?name=<existing>`; a 503 `DB09_MIGRATIONS_PENDING` means the env gate is off.
3. TPO-companies-R05: open `/tpo/companies/<id>` for a company with 2 or more drives and compare ordering with `/tpo/companies?name=<same>`.
4. TPO-companies-R01/R02: make a link for a company with a domain, open `/company-join/<token>` in a private window, reload the card: confirm counters stay absent and the "pending database registration" text shows; call the API for a domain-less company and note what the card shows.
5. TPO-companies-R03: sign in as a college admin on dev and open `/tpo/companies`; expect redirect to `/dashboard`.
6. Mobile (375 px): `[companyId]` and directory tables scroll horizontally (Round A 29); check the link card Copy row wraps.
