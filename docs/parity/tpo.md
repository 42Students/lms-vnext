## Chat-2 Phase 2 + paused chat-5 takeover — 2026-10-16

**Branch:** `chatgpt/chat-2` only, latest `main` fast-forwarded before editing. Exactly ten commits individually pushed. **Authored integration/unit tests have NOT RUN**, so no binary tracker acceptance flags changed.

- **T-S2-04:** `16ea821` clears the recruiter invite token atomically with campaign recipient opt-out (DB09 lifecycle constraint) and adds a future-migration-gated PG test. `97574fa` limits **unique eligible** recipients to 500 rather than raw CRM rows, with unit and live-CRM PG tests. `b92dd10` adds proposed campaign/recipient-key uniqueness and an isolated PG duplicate-delivery witness. Production campaign tables, sender, EMAIL activity, company EMAILED status, global suppression and opt-out delivery acceptance remain unregistered/unverified.
- **P-S1-07:** `36b8dbf` skips locked offers in concurrent expiry sweeps and adds PG tests for an external row lock and one-winner expiry. 15-minute scheduler/notification acceptance remains open.
- **P-S2-06:** `6bbbaef` uses exact eligible milliseconds (not partial Sunday hours) for IST offer response deadlines, with unit and persisted-college-rules PG tests.
- **T-S2-08:** `a97da1a` redacts public median/highest salary until there are 5 **distinct learners** with known CTC, rather than five offers for one person; unit and PG tests added. Population provenance and independent k-anonymity certification remain open.
- **T-S2-07:** `fa872aa` introduces version-locked, author-only 30-second UNDO_SEND on registered DB10 notices with same-origin route, UI control, unit and PG tests. Ordinary removal/restore remain available. Targeted publication, read receipts, one-hour remind-unread, privacy, DB/browser acceptance still open.
- **P-S1-06:** `686bee8` exposes confirmation-required, TPO-scoped cascade compensation via a same-origin POST. Existing PG cascade test was extended for sibling offer/application restoration, repeat undo and invalid cascade rejection. Visible UI link and executed DB concurrency acceptance remain open.
- **T-S2-03:** `0c231a0` authors a real DB09 test for one-shot day-four reminder, original invitation expiration, token rotation and first-open suppression. Provider and scheduled worker still gated.
- **TPO wording:** this commit matches TPO Placement eligibility, Team, Students, Calendar and Settings page headings to their current sidebar labels and asserts them in a unit test. Corrected 2026-10-16: the sidebar and headings are `Engage`, `Drives` and `Audit log` (verified against legacy lists.js tpoNavigationMenu); the earlier "Recruiter Leads/Placement Operations/Audit Log" naming was an inverted brief and is superseded.
- **Section A remaining:** P-S2-08 SELECTED needs authoritative selection ledger, P-S2-09 HOLD promotion requires safe applied-result version/undo design, P-S2-13 season uniqueness needs owner disposition, P-S2-14 applicant/slot FK and clash support need registration; sweep scheduling and broad acceptance remain pending. Main's shared `loadPlacementHeldOfferFacts` remains authoritative (no shadow inline SQL).
- **Section E remaining:** T-S2-05 company-share code/disclosure scope choice, T-S2-06 group threads, T-S2-07 recipient targeting/read tracking/remind-unread, T-S2-04 provider activation, T-S2-08 privacy certification, T-S2-09/10 verification acceptance. Section D still contains only a discovery placeholder with no concrete assigned IDs.
- **Not run:** Vitest, TypeScript, ESLint, production build, disposable PostgreSQL DB08/DB09/DB10 migration replay/concurrency, any real campaign/OTP delivery, Playwright/mobile or independent privacy tests. Protected `src/db/schema`, `drizzle/`, `src/auth`, `src/security`, deployment/CI files, `main` and other lanes were untouched.

## Chat-2 Phase 2 — migration 0092/0093 integration round (2026-10-16)

**Source changes pushed; independent acceptance NOT RUN.** Fast-forwarded `main` at `36392aa5` before any edits. **Exactly 10 implementation/documentation commits pushed only to `chatgpt/chat-2`**, no `main` or cross-lane writes. These notes supersede older "proposed/unregistered" statements about grant validity and recruiter OTP: **0092 recruiter grant validity and 0093 recruiter_invite_code are REGISTERED**. Configured recruiter duration is read exclusively from 0075 `placement_tpo_college_settings.recruiter_access_months`; no second policy table or staged registration was created. The old `TPO_RECRUITER_GRANT_EXPIRY_READY` flag is obsolete and removed from context, grant-write, OTP service, acceptance endpoint/model and boundary test (`f64a024`); context still fails closed on inactive, expired, unverified or missing DRIVES grants.

- **T-S1-01, T-S1-03 — real migration wiring and authored integration tests:** `f64a024` removes obsolete expiry gate while retaining OTP provider-readiness checks; `b6edc14` adds disposable real-PostgreSQL 0092/0093 test covering six-digit issue, single-use acceptance, concurrent one-winner consumption, five wrong attempts, identity denial and expiry; `9072468` tests expiry/unverification/capability denial through actual resolved recruiter context; `2d0f42d` makes duplicate TPO grant reuse reject a persisted ACTIVE record without DRIVES, with another isolated DB test. **No OTP email/SMS provider was connected**, and the public endpoint still requires verified OTP delivery/readiness. Integration tests are authored but not executed.
- **T-S2-04 — still STAGED:** `0bfff95` adds a <=500 candidate, PII-free, deduplicated campaign preview planner that suppresses unsubscribed, bounced, missing-email and Not-now recipients. Campaign tables proposed in `docs/proposed-migrations/t-s2-04-tpo-campaigns.sql` remain unregistered; a production sender, full EMAIL activity, company EMAILED transition and recipient-specific unsubscribe end-to-end remain blocked on owner-approved migration and provider/privacy gates. No arbitrary runtime activation was done.
- **T-S2-07 — source partial:** `fe52815` wires ISO-safe IST Send at / Show until to the real DB10 `announcements.scheduled_at/expires_at` columns via same-origin endpoint and date validation; existing college-wide recipient scope is unchanged. **Still open:** target-specific publication and recipient writes (current user-facing audience selector is PREVIEW ONLY), read tracking, remind-unread with 1-hour gap, 30-second undo, bounded audience selectors rather than raw UUIDs, actual PG/browser acceptance. This commit tidies the pure IST date parser.
- **T-S1-02 / T-S2-01 wording:** `2169f69` aligned TPO headings with an inverted naming brief (superseded 2026-10-16: legacy labels are Engage, Drives, Audit log); `7cd639f` makes legacy Ctrl K a working shortcut with exact topbar wording, and `ae7d725` adds bound-limited tenant-scoped student, recruiter, company name search, instead of promising a search that only found batches/drives. Existing Recruiter sidebar, Today/Drives/Calendar/Messages/Company & Team and Recruiter Calendar / Messages & Notifications / Your Profile / Request a drive titles were already correct on main. The older static `docs/audit/wording-gap-report.md` contains historical mismatches; use current source, not outdated line numbers.
- **Other section E:** T-S1-04 official held-offer facts remain owned by main's shared `loadPlacementHeldOfferFacts` (no inline shadow query); T-S2-02 phone normalization and T-S2-03 first-open/reminder policy remain from main, with reminder provider/scheduled runner incomplete. T-S2-05 company-share code/privacy/disclosure disposition, T-S2-06 rich scoped team threads, T-S2-08 publisher live privacy certification, T-S2-09/10 verification acceptance remain open. **T-SEC-01** remains security-owner scope. Section D still contains a discovery placeholder, no actionable D backlog IDs.
- **Not executed:** Vitest/unit tests, TypeScript, lint, build, disposable Postgres migrations 0092/0093 test run, integration role/tenant/concurrency regression, real OTP delivery, Playwright/mobile, campaign delivery or privacy acceptance; no production DB operations. Existing binary tracker is unchanged. Do not mark these items DONE without independent passing evidence.

## Chat-2 Phase 2 section E follow-up — 2026-10-16 (SOURCE ONLY; NOT ACCEPTED)

Branch `chatgpt/chat-2` fast-forwarded current `main` first; previous branch round had already been merged by orchestrator. Exactly 10 feature/document commits were pushed in this round. No numbered migration, journal, `src/db/schema`, `src/auth`, `src/security`, `src/modules/storage`, global tracker or production database was modified; no inline held-offer query was reintroduced (the main-shared `loadPlacementHeldOfferFacts` remains authoritative).

- **T-S2-08 — partial, implementation extended:** pure privacy-aware opt-in decision (f5d4987), TPO-scoped opt-in/out writer with persisted permission recheck, row lock and audited transition (1ee32d7), same-origin POST and Settings navigation (2d2462a), and user-visible enable/disable control only when a stored cohort of at least five exists (82d9f9a). Public reader continues to derive last-12-month counts from the ledger and requires opt-in. No setting rows or population sizes are fabricated. Missing: verified population provenance, independently executed PostgreSQL role/tenant concurrency and k-anonymity tests, public browser and owner approval.
- **T-S2-07 — preview partial:** strict COLLEGE/PLACEMENTS/BATCHES/BRANCHES/DRIVE query parser and tests (1338160), and TPO Announcements now displays authorized audience-specific membership preview counts (fd6e68c). **It does not change notice recipients:** the existing composer still publishes college-wide. Outstanding: bounded UI pickers for batches/branches/drives instead of raw UUID, persisted targeted delivery, send-at/show-until, per-recipient read tracking, one-hour reminders and 30-second undo, PG/legacy/browser certification.
- **T-S2-04 — staged, not runtime-complete:** signed campaign+college+recipient-specific expiring opt-out token (2b52b59); tables `placement_tpo_email_campaigns` and `placement_tpo_email_campaign_recipients` (now real migration 0095), 500-recipient cap and persisted suppression policy (0e0c222); tenant/recipient-locked idempotent unsubscribe transaction staged behind `TPO_CAMPAIGNS_READY` (0119044). The existing global unsubscribe route is unmodified. No new public campaign route or sender is enabled; migration 0095 is registered; owner must still approve delivery/privacy, enforce provider and suppression rechecks, and execute PG tests.
- **T-S1-01 / T-S1-03 — still blocked:** orchestrator is registering recruiter-grant expiry and OTP challenge schemas. Existing staged models and fail-closed runtime guards retained as on main; no competing schema writer. Actual OTP provider and credential/login acceptance remain unverified.
- **T-S1-02 / T-S1-04 / T-S2-01 / T-S2-02 / T-S2-03 — prior source changes retained:** lead stages restricted to own drives, verified external held-offer facts now loaded by shared chat-5 service, persisted CRM chips and contact validation, invite first-open and one-shot reminder draft. External send remains gated; do not mark reminder delivery/scheduler or grant acceptance complete.
- **T-S2-05** code-protected applicant-share ZIP/phone/privacy/retention choices and **T-S2-06** rich group-thread behavior remain open pending scope/owner approval and wider schema/messaging support. **T-S2-09 / T-S2-10:** latest main already handles academic duplicate/blank rows, stale mark deletion, ID/receipt choice and key milestones; independent end-to-end certification still open. **T-SEC-01** belongs to security owner and was not changed.
- **Section D:** backlog is a placeholder awaiting discovery; no concrete D IDs were supplied. No D item can legitimately be marked finished.
- **Recruiter wording:** checked `docs/audit/wording-gap-report.md` against current main; sidebar `Drives`, `Messages`, role `Recruiter`, headings `Recruiter Calendar` / `Messages & Notifications` / `Your Profile`, and `Request a drive` are already implemented by the previously merged round. No duplicate UI changes were made in this round. The old report has historical gaps; unresolved exhaustive page/tab/modal copy audit remains open.
- **Not executed:** TypeScript / lint / Vitest / build, registered-journal replay, disposable PostgreSQL role/tenant/concurrency fixtures, Playwright or mobile browser checks, outbound delivery/OTP acceptance, privacy/k-anonymity publication tests, campaign unsubscribe end-to-end verification. Authored tests are not independent acceptance evidence. No binary task tracker flag changed.

**Chat-2 Phase 2 round (16 October 2026) — source-only, NOT acceptance-closed:** Latest main fast-forwarded before editing. Scope limited to `chatgpt/chat-2`; no registered Drizzle/schema/auth/storage or tracker writes. Sidebar copy (corrected 2026-10-16 to legacy: `Engage`, `Drives`, `Audit log`; `Recruiter` unchanged); retained all 15 TPO and five Recruiter rows, TPO Operate/Coordinate/Insights/Administration headers, and secondary Companies/More routes under Recruiter Leads/Settings navigation (commits `8ad177a`, `0e8072c`). Recruiter Calendar/Messages & Notifications/Your Profile headers retained, role eyebrow normalized, Request a drive topbar and page CTAs and Drives aliases corrected (`3d8a98e`, `70a6c84`). TPO topbar now uses the legacy find text, + New (Follow-up/Recruiter lead/Drive) and Messages link; bell empty and See all notifications copy corrected (`1abae56`, `70a6c84`). **T-S1-04 SOURCE PARTIAL:** verified external non-revoked offers now participate in held cap/uplift before self-apply and issuance, including unknown CTC fail-closed (`339b7fa`); real PG concurrency evidence pending. **T-S2-03 SOURCE PARTIAL:** 4-day one-shot reminder checks college/TPO scope, absent first-open, prior human contact and prior reminder; rotates digest and records timestamp without resetting `inviteSentAt` (`0b10a28` plus this commit); delivery adapter remains disabled/unconnected and transactional delivery outcome needs provider-level review. **T-S2-07 PREVIEW-ONLY:** strict targeting schema PLACEMENTS/BATCHES/BRANCHES/DRIVE with tenant-scoped active enrollment, consent or application counts (`41c0399`, `e6a16f8`); the existing COLLEGE notice composer is unchanged. Persisted targeted audience, scheduling, recipient read-tracking, reminders and undo are NOT implemented. **T-S1-01 / T-S1-03 PARTIAL from prior round:** grant expiry and OTP challenge migrations still proposed and not registered; no verified delivery or invited-only onboarding; acceptance not enabled. **T-S1-02 source wired:** legacy stage derivation uses own-drive facts; full browser/PG parity still pending. **T-S2-09/T-S2-10:** current main already has latest-endYear duplicate handling, blank-mark skipping, stale verified-mark deletion and Aadhaar-or-PAN plus three-core-milestone evidence policy, so not reimplemented in this lane. **Not run:** Vitest, tsc, lint, full build, disposable PostgreSQL and migration replay, browser/Playwright, OTP provider delivery, external-offer concurrency or end-to-end permission/tenant tests. No backlog item is marked DONE absent independent executed acceptance.

**Chat-2 Phase 2 next round (2026-10-16; SOURCE PARTIAL, NOT CLOSED):** merged main at `757addd`, preserving newer College Admin navigation and placement safeguards. **T-S1-01 PARTIAL:** expiry/capability/verification policy and staged migration `9cbd6ed`; recruiter context denies expired/unverified/missing-capability grants and fails closed before migration readiness `c9bba0a`; TPO grant writer requires configured expiry `9fb0c57`. **T-S1-02 SOURCE IMPLEMENTED, acceptance open:** Engage list and board use relationship-isolated canonical lead-stage derivation `d1649ff`; final commit adds exact legacy recruiter stage labels and title from `recruiterLeadStages.js`. **T-S1-03 PARTIAL:** staged challenge and SQL, HMAC 6-digit/10-minute/5 wrong tries/5 per link and 300 per college per hour `61ec0f4`; provider-injected delivery port `cf77efa`; authenticated email-matched atomic latest-challenge consumption/token CAS/company grant `de45029`; same-origin gated POST acceptance `dac4421`. **Remaining blockers:** both schema migrations unregistered, invitation OTP delivery provider unconnected, first-party invited-only login needs verification, schema/delivery readiness flags are disabled, no browser/security/DB acceptance evidence; no full end-to-end completion claim. Other legacy TPO/Recruiter page titles, tabs, buttons, fields, modals and messages still require exhaustive copy audit. Protected auth/schema/migration files and production unchanged. **NOT RUN:** Vitest, lint, TypeScript, build, PostgreSQL replay/tenant/concurrency checks, browser/Playwright, live OTP/email tests. Binary tracker unchanged.

**Chat-2 Phase 2 2026-10-16 — SOURCE PARTIAL, runtime acceptance not yet executed:** Rebased on main via merge 4ae6c6f. Implemented P-S1-02 active debarment guards in learner apply, TPO bulk Add-to-Drive and Drive Day PRESENT (309f576, 2f0e0e3); T-S2-03 invite first-open idempotent POST (0287ed0; reminder job still open); T-S2-01 legacy-label recruiter attention chips from persisted CRM facts (e290d74); P-S1-05 held-offer uplift checked before self-apply (52442f2; dream-drive exception remains blocked on registered field); P-S2-12 TPO cancellation withdraws issued offers atomically and issuance now checks published job (1ef431f; real CANCELLED state staged only); P-S2-07 precise expiry boundary with unregistered EXPIRED/CANCELLED proposal (310d375); T-S2-08 opt-in public 12-month offers/placed/employer aggregates and package figures (eee4206; writer/selected-stage/privacy/browser verification open). Exact legacy TPO and recruiter sidebar wording/order/groups and navigation tests delivered this round (final commit). No PostgreSQL, Vitest, lint, TypeScript, browser or full legacy screenshots executed through this GitHub-only connector; DO NOT treat these as CLOSED or tracker DONE. P-S1-01, P-S1-06 and P-S1-08 were already authored in previous round but full DB/integration correctness, undoability, and state semantics remain unverified. T-S2-07 audience-specific announcements/scheduling/reminders, T-S2-03 reminder rotation, P-S2-07 expiry persistence/sweep, P-S2-12 status migration, T-S2-08 public page writer remain pending.

**Chat-2 2026-10-15 / Additional TPO roster and persisted-denial hardening — PARTIAL:** Student roster clear/recovery links now clear ineffective journey/branch/search criteria while preserving the operator's page-size and bounded column layout. Global TPO requests now require fresh persisted ACTIVE TPO membership before querying learner requests; TPO calendar likewise checks the persisted active officer before event rendering, in addition to central college permission checks. Unit/source contract tests authored and pushed, not executed here. Continue to require actual integration/negative permission tests, browser/mobile and pinned-legacy comparisons before closing any row.

**Chat-2 2026-10-15 / TPO drive, roster, inbox, batches, reports and calendar parity (PARTIAL):** After merging current main and honoring Owner Decision 12 (no AI), implemented and individually pushed tested-source enhancements across: drive overview navigation (pipeline, candidate schedule, Drive Day); applicant-pipeline URL validation and scoped reset; round result student/role + stage filters with rejected invalid URLs; round Drive Day links to scoped results and schedule; participation-to-student-journey navigation; batch pagination clamping, distinct first-run/filtered empty states and filter reset; requests advanced-filter reset retaining decision status; report cards sorted consistently within category without changing reported metrics; TPO calendar strict date/view/company/event URL validation before data queries; empty unread inbox recovery; notices settings direct links to personal inbox and preferences. All existing canonical permission checks and data projections are retained, with no new tables, DDL, or AI implementation. Each behavior has a focused authored unit test, but no Vitest, lint, TS check, browser flow, exact legacy oracle diff or real database acceptance was independently executed in this GitHub-connector-only round. Thus these are implemented PARTIAL gaps, not verified CLOSED rows. Before closing these families: execute unit/integration/browser verification including tenant/role denies, large/filter-empty/stale datasets, mobile widths and exports, compare current legacy `prod-2026` at pinned FE/BE SHAs, and resolve wider TPO migration/privacy/outbound dependencies. No tracker DONE count change should be inferred from these commits.

**Chat-2 2026-10-15 / Registered 0077 company applicant sharing + TPO parity (PARTIAL; implementation, not certified):** Merged current `main` into `chatgpt/chat-2` with registered migrations 0077/0078/0079 and removed staged company-share table definitions/proposals. The company-share public read, TPO issue/list/revoke and access-history services now use `src/db/schema/placement-company-shares.ts` and real tables, with bounded current shortlist exposure (application ID, learner name, email only), live-token expiry/revocation checks, same-college ACTIVE membership and ACTIVE organization checks, transaction-locked audited public views/CSV, and shared persisted TPO authorization. Added transactionally committed PLACEMENTS activity events for share ISSUE and REVOKE, scoped to actor/college/job/share ID without tokens, hashes or learner PII. Invalid/off-range audit, public shortlist, internal shortlist and link pages are now handled safely; one-time token copy has a manual fallback; link controls report active/expired/revoked; newly created links remain capped at 25 visible rows. The internal share-preview is mobile-readable and retains independent link-history state during applicant searches. TPO company report now offers highest accepted full-time CTC ordering and scoped clear-filters states. Removed the TPO-specific `src/ai/tools/placements.ts` adapter, its registration and its AI-only integration test in accordance with Owner Decision 12; remaining global AI infrastructure belongs to the orchestrator/other area owners and is not reintroduced here. Authored unit and disposable PostgreSQL tests include same-college and cross-college FK integrity, hash uniqueness, expiry CHECK, VIEW/CSV audit events, and status/URL/mobility regression cases. **No unit tests, typecheck, build, independent disposable PostgreSQL journal replay or browser tests executed in this connector-only round, and these authored tests are not acceptance evidence.** Still PARTIAL: independent 0077 replay and concurrency/tenant/privacy negatives, actual issuer/revoker/view/browser smoke tests at exact SHA, legacy FE/BE diff, privacy approval for omitted ZIP/resume sharing, cross-role acceptance and full checks. No production/database credential operations; no direct `main` writes or edits to registered Drizzle migration and journal. Do not mark the company applicant-share matrix row DONE or whole TPO parity family CLOSED until all gates pass.

**Chat-2 2026-10-15 / 0077 registered schema integration — PARTIAL:** Public company-share and TPO management/audit services now import the registered 0077 Drizzle tables instead of removed staged schema; proposed migration is superseded by registered 0077. Runtime PostgreSQL verification and browser/security acceptance remain open, including durable cross-tenant view/audit and expiry/revocation concurrency. Owner decision 12 removes all AI and Vertex capabilities. 

**Chat-2 2026-10-15 / Follow-up company-share and TPO parity — PARTIAL (source pushed, acceptance pending):** On `chatgpt/chat-2`, merged latest `main` and reconciled the one overlapping Students page to preserve its cohort drill-down filters plus the merged TPO bulk-actions panel. Company applicant share now clamps public shortlisted-results pagination after a changing shortlist, exposes stricter CSV no-store/referrer/noindex headers, and explicitly rejects invalid scoped audit-history URL filters. Extended the disposable-PG capability test to assert tenant-coupled share-view/actor FKs and allowed audit-event kinds as well as share expiry/revocation. Added the unique (id,college_id) supporting index for college_memberships in the proposed SQL because a referenced composite FK requires its own unique target key; orchestrator must include this in registration. The company-share HTML, capped CSV, issue/list/revoke service and audit stay guarded by BOTH database tables in `companyShareTablesReady`; the orchestrator owns registration of `docs/proposed-migrations/20261015_company_applicant_shares.sql`. No registered migration/journal/schema-barrel modification is made here. Public ZIP/resume export remains an unapproved privacy deviation. TPO improvements: recruiter grants Next retains name/company search; reports gallery has URL-scoped category, true visible count and search; by-company outcomes can be filtered to actual placed/not placed and exported with identical filters, and can sort by submitted applications or actual drives; global requests adds older-than-24-hours and older-than-30-days filters based on persisted request timestamps, keeping original seven-day option. Each UI/model change has authored unit coverage, but **none of this round's tests or real PostgreSQL replay/browser flows were executed by this connector-only session** (no check runs reported for last branch SHA at inspection). Do not count any of these page families as fully CLOSED: require new tables registered and independently replayed, positive/negative tenant+role+concurrency tests, full test/typecheck/build, real browser desktop/mobile states, and exact legacy FE/BE oracle comparison. This is additional PARTIAL evidence, not master-matrix DONE, privacy sign-off or task closure.

**Chat-2 2026-10-15 / TPO cross-surface usability parity — PARTIAL, executable acceptance pending:** Ten distinct service/model + page + unit-test improvements pushed on chatgpt/chat-2 after merging fresh main. Global /tpo/requests now rejects malformed enum/pagination filters into a non-leaking clear-filters recovery (before the DB read); requests beyond valid pages offer first-page recovery preserving kind, status, age, sort and search. /tpo/students/requests summary statuses preserve the current student search and page size, and the same pending-decision control/context is accessible in a mobile card layout as well as the table. /tpo/students intelligence journey and branch drill-downs now preserve independent branch/search/page-size and column chooser state while resetting page. The authorized /tpo/placements/jobs/[jobId] workspace now exposes responsive navigation to actual overview/applicants/rounds/offers/joining/share-preview pages without inventing tabs or data. TPO reports gallery supports bounded title/description/category search while preserving season/drive scope. The /tpo/reports/by-company page adds an explicit authenticated filtered-**current-page** company CSV (formula-safe, 25 max), preserving q/sort/page/season/drive, while the existing overall-scope CSV remains separate and accurately labeled. TPO Settings custom job-type editor now supports current/historical active/inactive and name filters with corresponding empty states; blocked dates support date-only month and reason search in a responsive controls layout without changing persistence. Each change includes a focused Vitest test. No new tables/migrations; no journal/barrel/production changes. Unit tests, TypeScript/lint, browser (mobile 390px and desktop), disposable-PostgreSQL tenant/permission verification and exact frozen-legacy side-by-side flows remain **unexecuted/unaccepted** in this chat. The source-only additions do not close any sole-tracker task or certify the TPO account; privacy, keyboard/screen-reader, out-of-range/search export, and existing migration/legacy-delta gaps remain subject to independent acceptance.\n\n**Chat-2 2026-10-15 / Company applicant shares hardening and TPO grant security — PARTIAL, acceptance still open:** Continued from the existing token-scoped /company-share/[token] implementation on latest main and made twelve separately pushed code/test fixes on chatgpt/chat-2. Anonymous reads now validate share expiry against PostgreSQL clock_timestamp() under the locked share row (not an application clock sampled before a lock wait), require ACTIVE college AND organization, retain live SUBMITTED/SHORTLISTED/ACTIVE current membership projection with ONLY application ID, learner name and email, and present a non-disclosing error/retry state plus responsive mobile cards. TPO revocation is explicitly confirmed and filtered-client state reconciles on success. TPO issuance is serialized under placement-job FOR UPDATE and restricts each drive to ten live bearer links to mitigate uncontrolled external access; the limit is an explicit security-tightening parity exception pending owner review. Old revocable links are now accessible through independent 25-row TPO link pagination; invalid link status/page URL states recover visibly. TPO event history now pages 25 audited VIEW/CSV events at a time and exports up to 500 matching events with truncation disclosure. A central persisted ACTIVE same-college TPO membership + role + ACTIVE platform-user recheck is shared between share management and recruiter-grant reads. Unit/source contract tests and guarded, transactional disposable-PostgreSQL tenant FK, expiry, revocation and audit acceptance fixtures are authored, NOT executed or green-certified. The share tables remain staged in src/modules/placements/company-share/staged-schema.ts with owner-only proposed migration docs/proposed-migrations/20261015_company_applicant_shares.sql; DO NOT mark company-share, DB12, TPO or full clone parity DONE before registered journal/snapshot replay, source and permission/type/lint tests, actual 390px + desktop browser, token/referrer/privacy, role/tenant/authorization and concurrent revoke/issue execution, full legacy FE/BE diff and owner approval. Legacy resume ZIP/download is still withheld because it exceeds the preapproved three-field TPO share-preview projection. No migrations, tracker statuses, main commits, secrets or production databases modified by this lane.\n\n**Chat-2 2026-10-15 / TPO company-share and recruiter-access parity deepening — PARTIAL, not independently accepted:** On chatgpt/chat-2 (twelve separately pushed feature commits), TPO share-preview now shows per-link VIEW/CSV counts from the staged audit table, link status filters evaluated in SQL (ACTIVE/EXPIRED/REVOKED), accurate filter-specific empty states, and an authorized recent-100 company-share audit workspace with event-kind filter and formula-safe filtered CSV (no tokens, visitor IP, contacts, or learner records). The public /company-share/[token] now has a strictly bounded literal learner-name search applied to persisted same-college submitted/shortlisted applicant rows BEFORE count/pagination, with URL-persistent navigation and identically filtered existing 500-row CSV export. The authenticated TPO preview uses that same bounded name search and matched capped CSV; the three-field share projection is unchanged. TPO recruiter access now has college-scoped recruiter/company literal search, 25/page state persistence and an authorized capped 500-row filtered grant-history CSV excluding internal grant IDs and all contacts. All writes remain same-origin; the grant/audit reads call existing persisted-TPO scoped services. Server code and focused unit tests were authored; no typecheck, Vitest, PostgreSQL, browser/mobile, production or staging execution is claimed. Company sharing is STILL gated on owner registration of proposed company-share tables and transactional audit storage. Exact legacy FE/BE frozen SHA comparison, exhaustive TPO modal parity, public token threat-model review, real DB tests of view/revocation race, full history pagination, unauthenticated abuse control, precise CSV acceptance, 390px/desktop browser verification and privacy/owner approval remain open. Neither master matrix nor docs/tracker.json is marked complete by this source-only batch.\n\n**Chat-2 2026-10-15 / Company applicant share public token — PARTIAL, migration and acceptance pending:** Added the previously MISSING /company-share/[token] page and capped CSV endpoint as a 256-bit unguessable, SHA-256-digest-only capability with 1–7 day expiry, revocation and TPO-side creation/list/revoke controls integrated into the existing /tpo/placements/jobs/[jobId]/share-preview. Share content is live, token-scoped, same-college, SUBMITTED + SHORTLISTED with ACTIVE membership/user, and projects through the existing TPO share-preview model ONLY application ID, learner display name and email; no phone, resume, scores, screening notes, internal comments or broader profile. Every successful public page view and CSV extraction inserts a durable audit event in the same locking transaction; failures fail closed. Authenticated share issuance/revocation requires same-origin POST and independent persisted ACTIVE TPO/user/college verification. Proposed tables and tenant-coupled SQL exist ONLY under src/db/schema/placement-company-shares.ts, registered as migration 0077. Without both registered tables the public route is unavailable and TPO creation is disabled. Security/privacy exceptions: legacy ZIP/resume download NOT implemented because it would exceed the currently accepted TPO share-preview field set, pending explicit privacy approval. Authenticated TPO audit history is not yet exposed; public page referrer hardening, HTTP/browser regression, executed Vitest, disposable PG migration replay, cross-tenant and concurrency tests, security approval and precise legacy feature diff still required. Unit tests were authored, NOT executed in this chat. Keep master company applicant share row MISSING/PARTIAL, NOT DONE until owner registration and independent acceptance. No main or registered migration changes in this lane.\n\n**Chat-10 2026-10-15 / Team private conversations, notifications, acknowledgement — PARTIAL:** Registered migration 0070 private Team threads now have authorized bounded 40-message chronological pages with older/newer links (newest page first). New-thread invitations and successful replies issue recipient-only in-app notifications inside the corresponding audited transaction; notification titles and bodies contain no private conversation text. /tpo/team shows signed-in user, same-college unread alert counts per thread, and a separate same-origin thread acknowledgement POST marks only that user's matching event notifications read. Nothing is marked read on page GET. Still missing real PostgreSQL negative/positive denial tests, long-history and alert delivery browser verification, thread search, richer staff UX and multi-person/private group workflows. Do not mark DONE.

> **Chat-9 spreadsheet follow-up (2026-10-15) — PARTIAL.** TPO Students and drive-applications tables retain both URL-backed filters and column chooser. Changing visible columns now preserves the current page; filter changes reset paging, stale unsupported facets do not inflate the filter count, missing data renders explicitly without discarding numeric zero, forged/export-only selections do not inflate visible-column status, and desktop/mobile records gain accessible labels. Unit coverage is authored; independent runtime, database, responsive browser and full CI verification remain open. Bulk actions from chat-11 remain in both pages following the lane merge.


**Chat-10 2026-10-15 / College-wide TPO announcement visibility preview — PARTIAL:** Added a persisted-permission-checked count of ACTIVE college memberships with ACTIVE platform users to the TPO college-wide compose form. The preview never selects contact details or sends external/in-app messages. It is a potential visibility count only, not consent, delivery, reminder, unopened/unread, or individualized audience targeting. Exact legacy audience picker, edit+remind scheduling, recipient acknowledgment, real browser/PG verification and external messaging rules remain open. Do not mark DONE.

**Chat-10 2026-10-15 / Registered private Team conversations — PARTIAL:** After merging main migration 0070, `/tpo/team` gained server-form thread creation with a strictly validated same-college ACTIVE TPO colleague, a participant-only detail route, private 200-message history, and same-origin reply POST. Both creator and recipient are rechecked from persisted ACTIVE membership, TPO role and ACTIVE user before writing; thread/message writes produce one PLACEMENTS activity event without raw message content. The existing SQL author-participant trigger and composite college foreign keys remain intact. Missing: unread/read receipts, multi-member threads, paginated message history, in-app notifications, real-PG negative/positive tests and browser/mobile acceptance. Recruiters cannot use these routes. No external email/SMS sends occur.

**Chat-10 2026-10-15 / Author-only announcement edits — PARTIAL:** College-wide TPO notices now support inline title/body/pin edits with same-origin versioned POST, persisted active TPO authorization, author-and-college-constrained row lock/CAS, 409 on stale state, and an immutable metadata-only audit. Existing compose/remove/undo remain author-only. New controls require the existing announcements table at runtime. Missing: receiver-target audience picker/preview, reminders and outbound notification dispatch, member-level unread markers, detailed version history, isolated PostgreSQL cases, accessibility/browser certification. The legacy-delta TPO Announcements row must remain PARTIAL until these are addressed.

**Chat-10 2026-10-15 / Messaging receipt drill-down and CSV — PARTIAL:** New college-scope TPO batch details aggregate provider-accepted, queued, failed, and suppressed receipts from registered messaging migration 0062 without exposing per-recipient HMACs or contact PII. Engage history links to a detail route and a formula-neutralized, page-bounded, aggregate CSV. Services recheck persisted active membership under transaction. CSV is one page only, and SENT means provider acceptance, not mailbox delivery. True worker processing, durable rate caps, unsubscribe/suppression rechecks at dispatch, retries, and live PG/browser proof remain open.

**Chat-10 2026-10-15 / TPO college-wide announcement authoring — PARTIAL:** Added a TPO-only college-wide compose form with strict title/body/checkbox schema, same-origin POST, recorded author, and transactional audit, only when the staged announcements table is registered. Author-only deleted notice history and version-CAS Remove/Undo have persisted membership checks, 409 on stale version, and one activity event per successful mutation. From 42 notices remain read-only. Still missing specific-audience preview/segmentation, announcement edit, external reminders, per-recipient unread/read acknowledgements, learner delivery, 375px browser and PG acceptance. No claim of production sending or full parity.
**Chat-2 TPO backlog round after registered DB08 migration 0071 — PARTIAL / awaiting quality gates (2026-10-15):** Synced newest main into chatgpt/chat-2 before lane work, preserving latest registered DB08 registration/debarment schema and other lanes. Implemented five-choice registration summary over **active, same-college learners in the requested academic cohort**, separating PLACEMENTS consent records from invitation and effective eligibility. A missing registration table displays unavailable, not zero. Batch detail shows a registration KPI strip plus read-only registration-window status (not configured, invitation marked, open, deadline passed, finished); a stored invitedAt is **not evidence that an outbound message was sent**. Batch Students displays each active learner's recorded DB08 choice/source without assigning a choice to nonrespondents. Added a TPO-only Registrations workspace tab with name/member-reference and choice filters **before** 25-row pagination over at most 500 active learners; caps and incomplete totals are explicit. A same-origin-authenticated, college-scoped GET CSV exports **only the filtered current page**, safely neutralizing formulas and including the membership reference as export-only data, without private consent details. Unit tests authored for choice coverage, missing data, filters, paginated results, formula escaping and exclusive deadline semantics; test execution and real DB08 0071 PostgreSQL/browser acceptance are **not** claimed. **Still PARTIAL**: batch invitation/reminder execution and shared messaging receipts, learner's own consent/choice workflow through HTTP, full unbounded roster pagination, historical transfers, batch eligibility and complete journey bars on directory cards, stage-driven reminder audience, scoped TPO recordedOutside drives, other multi-module bulk/grid parity, and exact section 8 UI parity. No registered migrations, security/auth/infrastructure files, or central account-surface-parity planning matrix were modified.\n\n**Chat-2 2026-10-15 TPO backlog round — PARTIAL / gate pending:** Synced current main into `chatgpt/chat-2` before implementation. Added a reusable pure model for cohort eligibility inheritance (learner > one class > cohort, ambiguous multiple classes as Needs review), a TPO-permission/college-scoped read capped at 500 active learners, a batch detail eligibility KPI/bar with an explicit partial-data warning and contextual Next step. Added a formula-neutralized CSV with eligibility/source/review and membership reference export-only data and a same-college TPO-only 25-record current-page GET export linked from Students. In History, only the latest unreversed cohort-level action offers exact Undo (the server remains authoritative); timeline now includes events for current active classes and members, with scope-type and college checks and explicit limits of 500 subjects / 100 recent events, excluding historical transfers. Repaired the batch learner drill-in to the existing participation route. Improved reusable spreadsheet grid with working desktop/mobile header filters, export-only fields excluded from filtering, and an editable zero-result state. Added new pure unit tests and extended existing isolated DB08 PG tests for inherited decisions, learner overrides, foreign-college and wrong-role denial, plus fixture cleanup. **Still PARTIAL:** complete multi-batch/card-level inherited eligibility and journey counts; batch invite/remind messages, deadlines and delivery receipts; full history across historical transfers; all-TPO grid mounting, URL-persisted header filters, inline cell edits and bulk-action engine; Excel export, full-roster CSV, saved views, outside-platform recorded drives, other legacy section 8 rows. Tested source not executed in this chat: TypeScript, ESLint, Vitest, isolated PG, 375px browser and privacy gates remain orchestrator responsibilities. Neither `docs/planning/account-surface-parity.md` nor registered migrations were edited.\n\n**Chat-2 follow-on after migration 0064 (2026-10-15) — PARTIAL, awaiting orchestrator gates:** Synced latest main into `chatgpt/chat-2` preserving its registered TPO configuration schema and earlier fixes. Canonical `src/db/schema/tpo-configuration.ts` now powers Job types, Blocked dates and Prep readiness readers instead of duplicate staged definitions. Added Job types creation/activation/deactivation with same-origin routes, college-scoped persisted TPO permission checks, versioned updates and activity events; mobile editor. Blocked dates are date-only with add/remove endpoints, matching college scope, version checks, duplicate rejection and audit; mobile editor. Prep readiness can persist college-owned active course IDs and minimum-completion thresholds with course ownership verification and a versioned editor, **but the Students readiness metric is not yet recomputed from completions**. After-college outcomes now have a persisted, version-checked and audited per-learner update API, five fixed legacy choices, Students URL filter/column/editor and matching CSV data, with full-college filtering before pagination. Canonical learner profile `socialProfiles.githubUrl` now yields HTTPS-host-validated GitHub links with Students filter and CSV; LeetCode, CodeChef, Codeforces, HackerRank do **not** have canonical persisted fields and remain MISSING. No new tables were introduced in this round. Author-created pure unit tests are **not executed**. Outstanding: full Job types counts-as-placed semantics; scheduling conflict warnings from Blocked dates; actual learner readiness evaluation from prep courses; student-reported outcomes permissions; other coding platforms; bulk-actions integration, Batches eligibility/journey bars and invitation/reminder send paths, recorded-outside drives, TPO announcements/team legacy gaps, comprehensive PG integration/browser acceptance. Remain **PARTIAL** until validation and parity acceptance.\n\n**Chat-2 2026-10-15 follow-on (17 feature commits) — PARTIAL / NOT GATE-CERTIFIED:** Rebased via a non-force merge of main into chatgpt/chat-2. Corrected five fixed After-college destinations to Higher studies / Entrepreneurship / Competitive exams / Looking for a job / Not decided, matching the legacy delta. TPO Batches now has URL-validated name+state filters and a truthful persisted lifecycle KPI strip (not fake eligibility or journey counts); gracefully disables state filtering when the lifecycle table is absent. Batch Students now reads direct decision/version snapshots and mounts the existing persisted-membership, per-learner versioned participation editor; ambiguous class enrollment remains blocked. CSV import accepts exact membership UUIDs (not unverified names/rolls), validates 200-row maximum and reasons, server-previews active in-batch membership with skip reasons, commits matched decisions under the DB08 college lock with expected version plus active cohort recheck, and presents immediate exact undo restricted to active learners of the same batch. Added Mark finished / Reopen controls with same-origin API, persisted TPO role recheck under lock, versioned transitions, invitation prerequisite, and atomic activity event. Added pure-model tests for taxonomy, directory filtering, lifecycle KPIs, CSV parse, and lifecycle plan. **Not DONE:** TPO Batches eligibility/ineligibility/undecided counts with inherited scope and journey counts, contextual Next step, all matching legacy import identifiers and robust RFC CSV, split class workflows, bulk preview/undo across all TPO tables, one aggregate activity line per bulk decision, batch invitation/reminder delivery and deadlines, richer history across membership/class scopes, TPO settings persisted editors, Students after-college & coding-profile integration, recorded-outside drives, and broader legacy section 8 surfaces. PG integration, typecheck, lint, 375px browser and delivery validation have not run here. New configuration tables remain staged, not migrated. Do not mark any rows DONE based on this round.\n\n**Chat-2 2026-10-15 batch/workspace round — PARTIAL, not accepted parity:** Synced latest main into chatgpt/chat-2; added persisted TPO-actor checked /tpo/batches list, /tpo/batches/[batchId] overview, Students (25/page inherited learner/class/cohort participation), Rules with cohort decision and transaction-checked expectedVersion, cohort History (100 most recent) and guarded exact-action undo limited to that cohort. Added DB08 isolated PostgreSQL test for success, wrong role, foreign college and stale version (authored, NOT run). Bulk preview/grid foundations, URL filters and mobile card grid remain unmounted in domain operations. Batch list explicitly omits unverified eligibility bars/journey totals; Students bulk/import commit, precise per-learner history, deadline invite/remind dispatch, Mark finished/Reopen and action audit summaries remain missing.

**Chat-10 2026-10-15 / Engage campaign history and audience preview — PARTIAL:** Migration 0062 messaging receipts now power a PII-free, paginated college-scoped history at `/tpo/recruiters/campaigns`, linked from Engage. The new `/tpo/recruiters/campaigns/preview` counts contactable leads with explicit no-email, unsubscribed, bounced, not-now, and out-of-segment exclusions, with persisted TPO membership rechecked before reads. Neither screen sends messages; global opt-out/allowlist, quota, and provider state still require atomic verification at dispatch. Counts cannot be treated as actual deliveries. React mobile/browser and PostgreSQL privilege tests remain unexecuted.

**Chat-10 2026-10-15 / Internal Team conversations — PARTIAL:** Defined isolated thread/message schema only under `src/modules/placements/tpo-team-staged-schema.ts` and `docs/proposed-migrations/tpo-team-internal-conversations.sql` (NOT registered). `/tpo/team` now reads only threads where the active persisted TPO membership is a named participant, behind a table-exists guard, or reports migration unavailable without misrepresenting recruiter conversations as internal messages. Missing registered scoped foreign keys/DB enforcement, compose/send/read receipts, PG negative tests and mobile/browser verification.

**Chat-10 2026-10-15 / TPO announcements — PARTIAL:** Added `/tpo/announcements` with separate Yours/From 42 tabs, college-targeted current-notice read service, persisted permission checks, table-exists guard and mobile loading/error/empty states. The draft `announcements` table remains unregistered where unavailable; compose, audience preview, edit/delete/undo, remind/unread list, learner delivery, and audited external sending remain missing. Neither the master parity matrix nor unrelated role parity files were changed.

**Chat-2 2026-10-15 batch/workspace round — PARTIAL, not accepted parity:** Synced latest main into chatgpt/chat-2; added persisted TPO-actor checked /tpo/batches list, /tpo/batches/[batchId] overview, Students (25/page inherited learner/class/cohort participation), Rules with cohort decision and transaction-checked expectedVersion, cohort History (100 most recent) and guarded exact-action undo limited to that cohort. Added DB08 isolated PostgreSQL test for success, wrong role, foreign college and stale version (authored, NOT run). Bulk preview/grid foundations, URL filters and mobile card grid remain unmounted in domain operations. Batch list explicitly omits unverified eligibility bars/journey totals; Students bulk/import commit, precise per-learner history, deadline invite/remind dispatch, Mark finished/Reopen and action audit summaries remain missing.
**Chat-2 2026-10-15 follow-on (17 feature commits) — PARTIAL / NOT GATE-CERTIFIED:** Rebased via a non-force merge of main into chatgpt/chat-2. Corrected five fixed After-college destinations to Higher studies / Entrepreneurship / Competitive exams / Looking for a job / Not decided, matching the legacy delta. TPO Batches now has URL-validated name+state filters and a truthful persisted lifecycle KPI strip (not fake eligibility or journey counts); gracefully disables state filtering when the lifecycle table is absent. Batch Students now reads direct decision/version snapshots and mounts the existing persisted-membership, per-learner versioned participation editor; ambiguous class enrollment remains blocked. CSV import accepts exact membership UUIDs (not unverified names/rolls), validates 200-row maximum and reasons, server-previews active in-batch membership with skip reasons, commits matched decisions under the DB08 college lock with expected version plus active cohort recheck, and presents immediate exact undo restricted to active learners of the same batch. Added Mark finished / Reopen controls with same-origin API, persisted TPO role recheck under lock, versioned transitions, invitation prerequisite, and atomic activity event. Added pure-model tests for taxonomy, directory filtering, lifecycle KPIs, CSV parse, and lifecycle plan. **Not DONE:** TPO Batches eligibility/ineligibility/undecided counts with inherited scope and journey counts, contextual Next step, all matching legacy import identifiers and robust RFC CSV, split class workflows, bulk preview/undo across all TPO tables, one aggregate activity line per bulk decision, batch invitation/reminder delivery and deadlines, richer history across membership/class scopes, TPO settings persisted editors, Students after-college & coding-profile integration, recorded-outside drives, and broader legacy section 8 surfaces. PG integration, typecheck, lint, 375px browser and delivery validation have not run here. New configuration tables remain staged, not migrated. Do not mark any rows DONE based on this round.\n\n**Chat-2 2026-10-15 batch/workspace round — PARTIAL, not accepted parity:** Synced latest main into chatgpt/chat-2; added persisted TPO-actor checked /tpo/batches list, /tpo/batches/[batchId] overview, Students (25/page inherited learner/class/cohort participation), Rules with cohort decision and transaction-checked expectedVersion, cohort History (100 most recent) and guarded exact-action undo limited to that cohort. Added DB08 isolated PostgreSQL test for success, wrong role, foreign college and stale version (authored, NOT run). Bulk preview/grid foundations, URL filters and mobile card grid remain unmounted in domain operations. Batch list explicitly omits unverified eligibility bars/journey totals; Students bulk/import commit, precise per-learner history, deadline invite/remind dispatch, Mark finished/Reopen and action audit summaries remain missing.

**Chat-2 2026-10-15 settings, home, notification and verification — PARTIAL:** Regrouped TPO settings navigation. Added Job types, After college (five fixed codes), Prep readiness and Blocked dates pages. New persistence is staged only in src/modules/placements/staged-schema.ts and docs/proposed-migrations/20261015_tpo_configuration.sql; owner has NOT registered migrations; reads check table existence and editing is withheld. /tpo/home and TPO root now show one Next up with six real operational signal rows, but legacy acceptance and all attention variants remain. Mounted TPO bell drawer with own-inbox mark-all and /tpo/find scoped search for batch/drive records. Mounted shared /tpo/verification queue with persisted TPO role, explicit college enablement and individual verifier grant plus central profile-verification.review permission; private evidence checks, signed documents, review actions and full filters remain unavailable. Students After-college and coding links, recorded-outside drive flag, export-only grid columns on real TPO tables, settings writes, complete notification drawer semantics, and all remaining PARTIAL matrix gaps still open. No package/auth/drizzle/deployment edits; runtime typecheck, unit/PG suites and 375px browser certification are NOT run.

**Chat-2 R4 / Applicant submitted window — PARTIAL (2026-10-15):** Drive-applicant list and filtered CSV now support ALL, last seven rolling days and last 30 rolling days, using persisted submitted_at UTC instants and SQL before aggregate/page/export limit. URL preserves age filter alongside stage/channel/eligibility/search/sort. Pure rolling-date boundary and isolated PG positive/tenant tests authored, not executed; browser/download/legacy acceptance remain outstanding.

**Chat-2 R4 / Applicant stable ordering — PARTIAL (2026-10-15):** Per-drive applicant list and its formula-safe CSV now share NEWEST, OLDEST and LEARNER_NAME ordering in scoped SQL, with application-ID tie-breakers so multi-page exports and views use consistent order. No screening status or employer selection is inferred. Pure Zod and isolated PG tests authored; actual browser/download verification pending.

**Chat-2 R4 / Applicant eligibility evidence filter — PARTIAL (2026-10-15):** TPO applicant stage rows, counts, pagination and applicant CSV now support persisted ELIGIBLE versus ELIGIBLE_WITH_MISSING_EVIDENCE state filters, without re-evaluating eligibility or changing application decisions. Tenant-scoped SQL, strict filters, unit and isolated PG scope assertions authored, not executed. Exact legacy review drawer and browser acceptance remain open.

**Chat-2 R4 / Applicant channel filter — PARTIAL (2026-10-15):** Per-drive applicant stage workspace and preview/download CSV now share validated INTERNAL/EXTERNAL channel filtering, combined in tenant-scoped SQL before counts/pages/export cap; pagination retains filter. This does not infer how external applications progress or share screening notes. Unit/parser and gated PG scoped read checks authored; execution/browser and legacy parity remain open.

**Chat-2 R4 / Drives deadline order — PARTIAL (2026-10-15):** Drive lifecycle now supports stable company, earliest-deadline and latest-deadline ordering in SQL with `NULLS LAST`, deterministic tie-breakers and URL-preserved sort across pages. Missing deadlines remain explicitly unknown, not interpreted as expired. Pure input and isolated PostgreSQL ordering tests authored; PG/browser acceptance outstanding.

**Chat-2 R4 / Drives employment-type filter — PARTIAL (2026-10-15):** Lifecycle list now filters registered FULL_TIME/INTERNSHIP/CONTRACT employment types in tenant-scoped SQL, combines with deadline/mode/season/search, and preserves the filter through pagination and counts. Strict Zod and isolated PG checks authored; browser/PG execution and legacy parity still outstanding.

**Chat-2 R4 / Drives work-mode filter — PARTIAL (2026-10-15):** TPO lifecycle supports server-enforced ON-SITE/REMOTE/HYBRID or ALL mode, combined with selected season/deadline/lifecycle/search in SQL before paginated rows and metric counts. The filter persists in page navigation; strict Zod and isolated PG role/tenant tests authored, not executed. Legacy view parity/browser sign-off outstanding.

**Chat-2 R4 / Drives deadline states — PARTIAL (2026-10-15):** Season-scoped drive lifecycle now filters published deadlines within seven precise days, published deadlines already passed, and jobs without recorded deadlines, using tenant-scoped SQL *before* status counts/pagination. URL/query and empty states reflect selected filter; unpublished jobs never labeled overdue. Unit query and gated PostgreSQL own/foreign/wrong-role assertions authored, unexecuted. Precise legacy columns and browser acceptance remain open.

**Chat-2 R3 / service membership hardening — PARTIAL (2026-10-15):** TPO follow-up read, export and confirmed write service now independently requires persisted ACTIVE same-user/same-college membership, persisted TPO role and ACTIVE user before accepting request-context permissions. Forged learner-membership ID, foreign college and wrong role are denied before row reads/writes. Isolated PG fixture explicitly grants and cleans test TPO role. Auth and 375px browser certification remain open.

**Chat-2 R3 / Joining next-seven-day outlook — PARTIAL (2026-10-15):** TPO joining follow-ups now offer a future calendar window using India-local date-only arithmetic (tomorrow through today+7, inclusive) for accepted pending/deferred offers. Due-now, missing-date and explicitly JOINED outcomes are excluded. Filter carries through the existing capped CSV route; unit temporal boundary and isolated PG scoped read fixtures authored, not executed. Actual communication scheduling and browser parity remain open.

**Chat-2 R3 / L? Joining missing-date follow-up — PARTIAL (2026-10-15):** Season-scoped, college-TPO joining follow-ups now expose a dedicated Missing joining date filter for accepted pending/unrecorded outcomes. The filter reuses the persisted-date unknown semantics and applies identically to authorized capped CSV; missing is never classified as overdue or joined. Pure and isolated PG mutation/read/foreign/wrong-role checks authored, not executed; browser/legacy acceptance and historical data completeness outstanding.

**Chat-2 R3 / L39 Follow-up CSV — PARTIAL (2026-10-15):** College-scoped TPO due/upcoming queue now downloads up to 500 matching tasks with exact My/Team/search/window filters, stable due ordering, CSV formula neutralization and an explicit cap warning. Contact phone/email deliberately excluded and no outbound dispatch is asserted. Pure CSV safety and gated PG wrong-role/foreign tests authored, not executed; browser/download/snapshot acceptance outstanding.

**Chat-2 R3 / L40 Safe Call and WhatsApp preparation — PARTIAL (2026-10-15):** Due queue conditionally exposes explicit user-initiated telephone and WhatsApp links from persisted normalized recruiter phone, withholds actions for unsubscribed or linked recruiters and rejects malformed schemes. No message or call is auto-sent/logged; users must record the audited outcome separately. Pure preflight tests authored, not executed. Provider/browser and legacy message templates remain open.

**Chat-2 R3 / L39 Follow-up queue pagination — PARTIAL (2026-10-15):** My/Team and due/upcoming recruiter queue now pages persisted college-scoped tasks 25 at a time with real filtered SQL total, stable due/id order and clamped page links preserving q/window/scope. A separate 200-record lead-selection cap remains disclosed. Pure parser/pagination and isolated PostgreSQL multi-page fixture authored, not executed; snapshot consistency under concurrent writes/browser review remain open.

**Chat-2 R3 / L39 Literal recruiter follow-up search — PARTIAL (2026-10-15):** Due/upcoming My/Team queue now uses a strict bounded literal recruiter/company name filter in tenant-scoped SQL before row limiting, preserving search in view URLs. SQL parameter explicitly cast to text; `%` and `_` are not wildcards. Unit URL/parser and gated PostgreSQL literal tests authored, not executed. Browser acceptance outstanding.

**Chat-2 R3 / L39 Scheduled future follow-ups — PARTIAL (2026-10-15):** TPO due queue now offers mutually exclusive Due now and Next 7 days windows, enforced in college-scoped DB query before the 200-row cap and retaining My/Team ownership scope. Empty states, explicit window semantics and future scheduled tasks use real DB09 due timestamps. Unit query and gated PostgreSQL boundary fixtures authored, not executed; longer horizon/calendar/browser parity remains open.

**Chat-2 R3 / L34 My Work vs Placement Team — PARTIAL (2026-10-15):** Due follow-ups have server-enforced owner membership filtering, via a strict TEAM/MINE query and URL tabs. Both views remain within the authenticated college; the My Work view never relies on client-only filtering of the capped list. Unit validation and isolated PG owner/role/foreign tests authored, not executed. Full Home queue semantics, browser and pagination remain open.

**Chat-2 Round 2 / Per-drive offers CSV — PARTIAL (2026-10-15):** Authenticated TPO offer register now downloads a strict status/search/joining-filtered CSV from registered, college-scoped offer facts, capped at 500 rows with explicit truncation warning and safe spreadsheet-formula neutralization. No learner email/phone, fabricated selected status, sending or letter-receipt claim. Pure-model and isolated PostgreSQL tenant/wrong-role export assertions authored, not executed. Browser download verification remains open.

**Chat-2 Round 2 / By Company report ranking — PARTIAL (2026-10-15):** TPO company report adds bounded user-selected sort (alphabetical, placed learners, accepted offers, or average accepted full-time CTC). Missing compensation values sort last, ties deterministic, and order persists across paginated URL filters. Report source, totals and scope unchanged. Unit regressions authored; independent PG/browser proof and exact legacy sort parity outstanding.

**Chat-2 Round 2 / By Company search and pagination — PARTIAL (2026-10-15):** Season/drive-scoped TPO company report now adds literal bounded company-name search with 25-row pagination, clamped page requests and preserved scoped report filters; chart totals and full-scope CSV are deliberately unchanged. Company record links match the visible slice. Unit filtering/query tests authored, browser/PG and large-cohort efficiency review outstanding.

**Chat-2 Round 2 / By Company drill-down — PARTIAL (2026-10-15):** The company performance report now exposes canonical company-ID links (first 100, with truncation disclosure) to the independently college-scoped relationship/history page. Free-text names are never treated as identity; the reporting scope stays read-only and season/drive filters continue to apply to figures. Pure dedupe/link tests authored; browser/PG acceptance remains open.

**Chat-2 Round 2 / Offer expiry evidence — PARTIAL (2026-10-15):** Offer register now displays persisted expiry and issued/responded timestamps formatted for IST, with a pure 7-day issued-offer expiry classifier (expired, due soon, open, unknown). Accepted/declined/withdrawn offers are never mislabeled expired; no email or acceptance changes occur. Unit boundary tests authored; PG/browser and exact legacy terminology remain open.

**Chat-2 Round 2 / Offer register joining filter — PARTIAL (2026-10-15):** Per-drive offers now filter by explicit accepted-offer joining evidence (pending/unrecorded, joined, deferred and did-not-join), with Zod-validated selector and preserved search/status/page links. Issued offers never masquerade as pending joins. Unit contract tests authored; runtime PG/browser and exact legacy filter parity remain open.

**Chat-2 Round 2 / Offer register search — PARTIAL (2026-10-15):** Authorized TPO offer register now supports validated 100-character literal case-insensitive learner/role search; it filters before pagination and keeps status/search across tabs and page links. All-status offer counts remain scoped to underlying registered records; no SQL wildcard interpretation or new contact disclosure. Unit regressions authored; browser/PG runtime proof and SQL-side search optimization remain open.

**Chat-2 Round 2 / Offers register pagination — PARTIAL (2026-10-15):** Per-drive TPO offer register now navigates every persisted offer version with 25-row pages, complete status counts, issue-time ordering, validated page query, status-preserving Previous/Next and stale-page clamping rather than hiding records after 200. Existing tenant read fence retained. Unit and gated PG assertions authored; runtime/browser proof and large-volume SQL pagination remain open.

**Chat-2 / Recruiter Companies → Create Draft Drive — PARTIAL (2026-10-15):** The recruiter CRM Companies table now has a draft-drive action for bounded non-empty company names. These CRM group names are expressly unverified hints: the destination preselects only a unique, exact, active company relationship in the same TPO college, and otherwise requests a manual choice with a warning. Model tests authored; full legacy board behavior and runtime PG/mobile/browser acceptance remain open.

**Chat-2 / TPO More → My Notifications — PARTIAL (2026-10-15):** More navigation now directly exposes the existing own-recipient, college-and-placement-scoped in-app notification inbox with its read action. This avoids dead /tpo/notifications navigation and reuses the registered DB-backed read-and-audit writer; nav destination tests updated. Exact legacy notification-tab and browser acceptance remain open.

**Chat-2 / Company contact-people drill-in — PARTIAL (2026-10-15):** The company People page links each persisted linked recruiter lead to its canonical TPO recruiter-detail workspace. The destination's existing college-scoped lead loader remains responsible for authorization; no unlinked contact identities or private applicant lists are exposed. Model test authored; desktop/mobile and PG acceptance remain open.

**Chat-2 / Company offer/joining timeline links — PARTIAL (2026-10-15):** Offer-issued, response and recorded-joining events now deep-link to their exact persisted TPO offer record instead of the drive only. The destination retains college/role checks. Unit regression added; legacy parity and PG/mobile/browser proof remain open.

**Chat-2 / Company hiring-history offer drill-in — PARTIAL (2026-10-15):** Each persisted company offer version can now open the canonical TPO offer detail page, preserving the exact job ID and offer ID instead of linking only to the parent drive. The destination independently authorizes its TPO college scope; no learner contact is exported. Pure-model regression authored; PG/browser acceptance remains open.

**Chat-2 / Company directory → Create Drive — PARTIAL (2026-10-15):** Every canonical, college-linked employer in the Companies directory now has a direct Create Draft Drive action; recruiter-only free-text company groups do not receive the action, because they are not proof of a canonical employer identity. The destination revalidates the active scoped relationship. Model tests authored; mobile and PG acceptance still open.

**Chat-2 / Recruiter Lead → Create Draft Drive — PARTIAL (2026-10-15):** A lead with a recorded company name now offers a draft-drive link. The target page resolves a case-insensitive exact name ONLY against active company relationships returned for this TPO's college; missing or ambiguous names produce a visible warning instead of fabricating a company link. New model tests cover unmatched/ambiguous names. Full legacy lead workflow and PG/mobile/browser acceptance remain open.

**Chat-2 / Company → Create Draft Drive — PARTIAL (2026-10-15):** Active company detail links to the quick draft creator with a canonical company ID. The creator resolves that ID only within its signed-in TPO college's active company relationships, preselecting its verified relationship ID and displaying a non-leaking warning for invalid/foreign/archived IDs; the existing same-origin, Zod-validated, audited draft writer remains authoritative. Pure-model regressions authored; end-to-end legacy wizard and runtime mobile/browser acceptance remain open.

**chat-8 L552/L556 Offers and Joining reports drill-down — PARTIAL (2026-10-14):** Persisted season/drive-filtered TPO reports now link scoped drive offer registers, joining workspaces, and company histories. UUID-gated bounded 100-link mobile-friendly lists, empty/cap disclosures, pure unit and isolated PG report success/foreign/wrong-role tests authored, not executed. Existing neutralized capped CSV unchanged. Remaining: exact legacy report columns/filter persistence, historical company season drill filters, >100 navigation pagination, PG/browser/privacy approval.\n\n**chat-8 L195 Company KPI/hiring pulse — PARTIAL (2026-10-14):** Canonical same-college company detail now shows currently published drives, distinct seasons with recorded drives, distinct accepted-offer learners, distinct explicitly joined learners and latest persisted event, with honest null recency. Pure-model and scoped isolated PG tests authored, not executed. Remaining: exact legacy KPI formula/season history, CRM recency and owner activity, browser/PG acceptance, large-company performance, frozen-oracle parity.\n\n**chat-8 L326 Offer evidence drill-in — PARTIAL (2026-10-14):** Authorized TPO-only offer detail reads registered status and joining transition histories and internal reasons in college scope. Pure model and isolated PG success/foreign/wrong-role/unmatched tests authored, not executed. Remaining: exact legacy release/selection UX, historical offer versions, missing evidence reconciliation, scale, browser/PG/privacy acceptance.\n\n**chat-8 L323 Offer register — PARTIAL (2026-10-14):** TPO-only per-drive persisted offer versions, status filters/counts and mobile rows, response date, explicit joining and learner links. Pure unit and isolated PG success/foreign/wrong-role tests authored, not executed. Remaining: exact legacy selection verification, full offer lifecycle/history, >200 pagination, browser/PG execution and privacy review.\n\n# TPO — Detailed Page Parity Spec

**W65 D / Joining Status follow-up drill-in — PARTIAL:** College-TPO-scoped season report shows ACCEPTED-offer pending/unrecorded, DEFERRED and explicit JOINED/DID_NOT_JOIN evidence, with date-only IST due semantics (missing date is unknown). Mobile follow-up rows deep-link to the existing drive joining record; strict filter and formula-neutralized capped CSV. This is read-only, no artificial learner communication/decision. 500-offer source cap and CSV truncation are disclosed; full scale pagination, employer confirmation, historical branch/season attribution, exact legacy filters, executed PG/browser and privacy review remain open.

**W65 C / Rounds and interview scheduling — PARTIAL:** Added college-TPO-scoped interview readiness view over persisted PENDING/SCHEDULED INTERVIEW rounds with bounded 1–90-day outlook, separate upcoming/live/start-passed/missing-duration/unscheduled counts and deep link to existing candidate readiness. The upstream round selector caps at 200 and its limitation is displayed. No interviewer IDs, per-candidate time slots, invitation delivery or external calendar data are fabricated. Legacy panel/slot assignment requires migrated storage; exact conflict integration, historical completed rounds, executed PG/browser tests and full calendar parity remain open.

**W65 B / Drive Applicants stage table — PARTIAL:** College-TPO-scoped per-drive application stage view now reads registered application+screening state, separates WITHDRAWN from SUBMITTED, and offers validated stage/search filtering, counts, applicant-role context and mobile rows. It excludes private screening comments and does not fabricate SELECTED. The 500-row limit is disclosed. Legacy candidate drawer, bulk mutations, external channel details, full filter/export parity, executed PG/browser acceptance and large-list pagination remain open.

**W65 A / Drives List lifecycle tabs/counts — PARTIAL:** A TPO-only mobile drive lifecycle list now filters persisted non-archived draft/published/closed jobs by college and season with deadline-within-seven-days counts and links to the canonical drive workspace. The legacy Requests tab is not fabricated from job status; source request-state reconciliation, 500-row pagination, search/export, exact legacy columns, stale-success caching, browser acceptance and executed PG tests remain outstanding.

**W64 D PARTIAL:** New TPO-only offers-expiry watchlist uses migrated ISSUED offers with non-null expiry, strict 1–90 day selector and lexically compared IST YYYY-MM-DD boundaries. Capped to 200 with honest truncation and formula-neutralized CSV. Pure-model/isolated PG success, tenant/role and status-exclusion tests authored, not executed. Browser and runtime acceptance remain open.

**W64 C PARTIAL:** Existing canonical TPO company detail already has linked contacts, drive history and offer/join timeline. It now shows college relationship trust/status/updatedAt from persisted scoped lifecycle read; a pure model and gated PostgreSQL success/foreign/wrong-role tests are authored. Historical CRM parity, executed PG/browser verification and full detail performance review remain open.
**W64 B PARTIAL:** /tpo/reports/placed-branch derives season/drive-scoped unique accepted-offer learners and explicitly confirmed JOINED learners from persisted offers/outcomes; uses current active academic enrollment for branch and exposes unmatched students as Unassigned. CSV is formula-neutralized, capped to 200 branch rows with total+notice. Unit and isolated PostgreSQL tests authored; runtime PG/browser acceptance and historically accurate branch snapshots remain open.


Legacy sidebar: Home, Placement eligibility, Engage, Drives, Team, Students, Requests, Verification, Calendar, Announcements, Reports, Messages, Settings, Audit log, Notifications. Secondary/mobile `More` also links Profile and the secondary tools.

TPO parity is a product-critical gate. A TPO page is not complete unless its operational actions, confirmations, failure states and role/tenant fences are complete.

# Home

**W62 D / L45 PARTIAL:** Season-pipeline report and neutralized, capped CSV from migrated offers/applications/joins; selected has no independent persisted final-selection source. Runtime/browser evidence outstanding.

**W63 A / optimistic token precision audit — PARTIAL:** Audited 54 `src/modules/placements/{tpo-,company-}*service.ts` files for direct `eq(table.updatedAt, date)` guards: none remain. `tpo-company-lifecycle-service.ts` on merged main already uses `date_trunc('milliseconds', column) = ISO::timestamptz`. Added isolated PostgreSQL regression fixture with SQL-default `now()` plus 123 microseconds, successful first edit, stale old-token denial and a following archive. Tests authored, not executed; never mark DONE until PG verification.

**W62 C PARTIAL:** TPO Drive Day now shows scheduled PUBLISHED rounds actually inside their persisted duration window; checked-in, explicit ABSENT no-shows, WAITING and unknown derive from the existing college-scoped roster and attendance. Unknown duration never implies live status. Browser/PG execution, refresh cadence and exact legacy hero remain open.

## Page: TPO Home / Command Center
**Legacy:** `/tpo/home`

Audited legacy areas:
- season selector/current vs past season;
- read-only warning for past season;
- setup checklist with collapse/expand and deep links;
- My Work / Placement Team toggle;
- live Drive Day hero when a round is active;
- Needs You queue, grouped repeated task types, first 8 + Show all;
- urgency types including Deadline Today, Applicants to Share, HR Messages, Drive Requests, HR Access, Requests, Slots to Confirm, Results Ready, Selections to Verify, Follow-ups;
- Follow-ups Due with Call, WhatsApp, outcome logging, Done;
- This Week agenda;
- Season headline numbers;
- Branch performance;
- Season pipeline;
- Company funnel;
- Compensation intelligence;
- stale-data alert distinct from hard failure.

Closure checklist:
- [ ] Season selection and past-season read-only state match.
- [ ] Setup checklist item set/completion/deep links match.
- [ ] Setup checklist collapse/expand behavior matches.
- [ ] My Work / Placement Team toggle changes the queue correctly.
- [ ] Drive Day hero appears only from real live operational state.
- [ ] Needs You event taxonomy matches all legacy task types.
- [ ] Grouping repeated task types and group expand/collapse matches.
- [ ] Urgency labels/tones are semantically equivalent.
- [ ] Show all/fewer behavior matches.
- [ ] Follow-ups Due list matches.
- [ ] Call and WhatsApp actions work safely.
- [ ] Follow-up outcome logging and Done action match.

**W49 PARTIAL:** A TPO-only /tpo/follow-ups queue now presents the earliest 200 college-scoped open due tasks joined to registered DB09 recruiter leads, explicitly signals truncation, and links to each contact. Confirmed Create and Record Outcome + Done actions use strict Zod and same-origin routes, college-scoped row locking, stale due-date rejection, one immutable actor-attributed recruiter activity audit per successful write, and full transactional rollback on audit denial. Missing/foreign records do not become successful completion. The due queue is reachable from the recruiter leads header; dashboard card placement, mobile legacy ordering, per-owner My Work/Team segregation, future-task visibility, exact legacy outcome taxonomy, browser and separately executed PG acceptance remain open. Existing lead-detail follow-up API behavior is preserved pending migration to audited actions.
- [ ] This Week agenda matches.
- [ ] Placement rate/registered/offers/live/ready-unplaced/employer-conversation metrics match.
- [ ] Branch performance matches.
- [ ] Season pipeline matches.
- [ ] Company funnel matches.

**W54 PARTIAL (L46/L47):** A new TPO report and formula-neutralized CSV project company applications and accepted offers with an explicit accepted-learner / distinct SUBMITTED-applicant denominator (null if absent). Separate CTC measures distinguish accepted full-time offer versions from per-learner best packages, preserving missing values as null. Historical cohort conversion, unavailable external offers, executed tests and exact legacy/browser parity remain open.
- [ ] Compensation intelligence matches.
- [ ] Every KPI/queue CTA lands on the intended filtered destination.
- [ ] Initial loading, hard error and stale-last-success states are distinct.
- [ ] Past-season mutations are blocked server-side, not only visually.
- [ ] Mobile order prioritizes Needs You as legacy does.

# Leads / CRM

## Page: Leads
**Legacy:** `/tpo/leads`

**W62 B PARTIAL:** The existing recruiter leads report now shows college-scoped actionable stage counts and contact-health: 14-day recent/quiet/no-contact, pending/due next steps and owner assignment from registered DB09 facts. Rates and latest contact are null without evidence. Pure-model and PG checks authored, not executed; legacy drill-ins and browser sign-off remain open.

### Header / health summaries
- Add Lead;
- Import;
- outreach-health strip: follow-ups due, no next step, gone quiet, unassigned;
- relationship-stage strip;
- stale-load and Companies-load error handling.

- [ ] Add Lead action is present.

**W45 PARTIAL:** The existing Add Lead modal now requires an explicit creation confirmation. Its same-origin POST uses strict nested Zod input and the migrated DB09 lead/immutable activity tables. The service commits lead and staff-attributed NOTE audit in one transaction, so audit failure rolls back creation; tenant management scope and database contact unique indexes still enforce denial/duplicates. Full legacy duplicate-confirm/open flow, import preview, browser acceptance and executed PostgreSQL tests remain open.
- [ ] Import action is present.

**W46 PARTIAL:** Recruiter Leads now exposes an import CSV dialog with a downloadable six-column template, strict quote-aware parsing and server-side Zod validation, 200-row/160,000-character caps, per-row preview, user confirmation and created/duplicate/invalid report. The authorized same-origin API derives college from the active TPO membership, then inserts accepted lead rows and each immutable actor-attributed NOTE in one database transaction; registered unique indexes reject existing contacts. Invalid/duplicate rows are skipped without overwriting contacts. Exact legacy New/Already/To-fix preview grouping, mapping of alternative source spreadsheets, browser acceptance and executed isolated PostgreSQL evidence are still outstanding. This work does not complete parity.
- [ ] Outreach-health metrics and drill-in filters match.
- [ ] Relationship-stage metrics and drill-ins match.
- [ ] stale-data vs hard-error handling matches.

### View: Table
Legacy table columns include Contact, Stage, Flags, Owner, Last activity, Next follow-up, Invite, Source, Drives, Students hired and action.

Filters/actions:
- Stage;
- Owner;
- Source;
- Follow-up due;
- Quiet;
- No next step;
- Unassigned;
- saved table search/export/filter infrastructure;
- bulk Assign Owner;
- bulk Mark Contacted;
- bulk Not Now;
- bulk Prepare WhatsApp Invites;
- bulk Invite by Email;
- row Invite/Resend;
- row Create Drive;
- row Mark Contacted;
- row Not Now.

- [ ] All columns/derived values match.
- [ ] Search/filter/export behavior matches.
- [ ] All seven filter controls/toggles match.
- [ ] Bulk Assign Owner uses review/confirmation.

**W50 PARTIAL:** DB09-backed TPO Bulk Assign Owner now offers active same-college placement staff (TPO/Faculty/College Admin) as target owners and lets operators confirm up to 100 filtered, non-joined, non-unsubscribed leads. Same-origin strict POST, TPO+college permissions, sorted row locks and an expected-current-owner check prevent stale reassignment. Every changed row and its actor-attributed immutable NOTE audit commit together; unchanged/foreign/stale/protected rows return honest per-lead outcomes. The registered DB09 principal guard validates the target under SHARE locks. Legacy owner filters, unassign semantics, large-staff pagination, exact selection/modal UX, browser verification and executed isolated PostgreSQL tests remain open.

- [ ] Bulk Mark Contacted uses review/confirmation.
- [ ] Bulk Not Now opens reason/revisit flow.

**W48 PARTIAL:** Bulk Mark Contacted and bulk Not Now are wired in the recruiter Leads table/board workspace for at most 100 filtered active, non-joined, non-unsubscribed lead IDs. Explicit confirmation and mandatory Not Now reason, optional revisit ISO date, strict discriminated Zod validation, central TPO/college-scope checks, same-origin POST, ordered row locking, expected-stage stale-state checks, and an immutable actor-attributed NOTE for every changed lead are implemented against registered DB09 tables. Results distinguish updated/unchanged/ineligible, with no false claim of manual recruiter conversion. The legacy bulk modal/board row-actions/selection ergonomics, delivery UI and full browser acceptance are still unverified. Unit and isolated PostgreSQL success/denial/rollback tests are authored but not yet executed at this SHA.
- [ ] Bulk WhatsApp invite preparation matches.
- [ ] Bulk email invite preflight/count/confirmation matches.
- [ ] Joined/unsubscribed leads are correctly skipped/disabled.
- [ ] Row Invite/Resend matches.
- [ ] Row Create Drive pre-fills company.
- [ ] Row Mark Contacted matches.
- [ ] Row Not Now matches.

**W45 PARTIAL:** Lead-detail Not Now confirmation now posts strict Zod input to the same-origin endpoint; the college-scoped writer locks the lead and atomically updates the manual stage/revisit decision and appends an immutable user NOTE audit. Identical repeats are idempotent; changed reasons/dates are audited. Row-action placement in the table, full legacy modal semantics, browser acceptance and positive/negative disposable PostgreSQL execution remain open.

### View: Board
- columns by CRM stage;
- cards;
- drag/drop or Move To stage;
- recruited terminal handling;
- overflow/collapsed indicator to Table.

- [ ] Stage columns/order match.
- [ ] Move/drag semantics match.
- [ ] Terminal/recruited restrictions match.
- [ ] Empty columns/collapsed-overflow behavior match.

### View: Companies
- Company;
- People;
- Drives;
- Students hired;
- company detail deep link.

- [ ] Company aggregate values match.
- [ ] Company search/export match.
- [ ] Detail deep link works.

**W54 PARTIAL — TPO Lead details:** Existing single-create and editable lead forms remain canonical; the edit dialog now requires explicit confirmation, and the shared strict Zod email field trims/lowercases before validation for both create and edit. The migrated DB09 create/edit writers retain duplicate contact checks and an immutable CRM activity audit. Exact legacy duplicate-open overlay, executed browser validation and owner sign-off remain open.

### Overlays
- Add Lead modal: Email/Phone, Name, Company;
- duplicate-lead confirmation with Open action;
- Not Now modal: reason + revisit date;
- Invite modal;
- Import Preview modal groups New / Already leads / To fix;
- Prepared Messages modal for WhatsApp.

- [ ] Add Lead modal fields/validation match.
- [ ] duplicate detection/open-existing behavior matches.
- [ ] Not Now modal fields/validation match.
- [ ] Invite modal workflow matches.
- [ ] Import preview/validation/commit matches. (W46 PARTIAL: preview + confirm + transaction + row report added; exact legacy group/reconciliation UX remains.)
- [ ] Prepared WhatsApp Messages workflow matches.

## Page: Lead Detail
**Legacy:** `/tpo/leads/[leadId]`

Legacy areas/actions:
- header: Invite/Resend, Create Drive, More;
- More: Not Now, Add Follow-up;
- Not Now alert;
- unsubscribed/not-hiring alert;
- Contact card + click-to-call + WhatsApp;
- Company card + company deep link + drive list;
- interaction log: note/call/email/meeting style event types + outcomes;
- Follow-ups list + Add + Done;
- Timeline;
- Invite modal;
- Add Follow-up modal;
- Not Now modal.

- [ ] Header identity/stage/company context matches.
- [ ] Invite/Resend disabled correctly for joined/unsubscribed.
- [ ] Create Drive prefill works.
- [ ] Not Now alert/state matches.
- [ ] Unsubscribed/not-hiring state prevents inappropriate outreach.
- [ ] Contact phone/email/designation fields match.
- [ ] Call/WhatsApp actions match.
- [ ] Company card and drive history match.
- [ ] Interaction-log event types/outcomes match.
- [ ] Note validation matches.
- [ ] Follow-up list matches.
- [ ] Add Follow-up modal date/note behavior matches.
- [ ] Mark Follow-up Done matches.
- [ ] Timeline event coverage/order matches.
- [ ] Not Now modal reason/revisit behavior matches.
- [ ] Loading/not-found/error states match.

## Page: Company Detail
**Legacy:** `/tpo/companies?name=...`

Legacy contract:
- Create Drive;
- Add Contact;
- company metrics: contacts/active, drives, hires, seasons hiring, latest activity;
- People;
- Hiring History;
- Documents/shared applicant lists;
- Drives;
- Timeline.

**W54 PARTIAL — Company directory create:** The Companies directory now links a confirmed Add company modal to a TPO-scoped same-origin POST. The existing canonical employer identity/college relationship transaction enforces case-insensitive name/domain reuse and conflicting-identity denial; each successful college link writes an actor activity event in the same transaction. Imported contacts, legacy Create Drive prefill, exact duplicate review, executed PG/browser verification remain open.

- [ ] Company lookup is tenant-safe and case/identity stable.
- [ ] Create Drive prefill matches.
- [ ] Add Contact opens Leads add flow with company prefill.
**W61 B PARTIAL:** Canonical Company detail links to /tpo/companies/[companyId]/manage. TPOs can edit only their own college's trusted relationship flag, archive it when no DRAFT/PUBLISHED drives remain, and restore it through the archived-company directory. All writes require a reason, confirmation, scoped principal and row-locked expected timestamp, with transaction-coupled immutable activity. The global company identity stays shared and is not editable here. Legacy global rename/domain UX, owner assignment, archived-filter scale/pagination, disposable PostgreSQL and browser proof remain open.

- [ ] Company KPI strip matches.
- [ ] People list/stage/activity/deep links match.

**W59 PARTIAL — Company contact people:** A linked recruiter-contact people page now uses the registered DB09 `placement_tpo_leads` relationship column for confirmed create/edit of a name, unique normalized college email, and designation. The signed-in TPO college owns every write; the service locks the active company relationship and existing lead, checks its optimistic timestamp, and appends an actor-attributed immutable NOTE activity within each changed transaction. Phone-only edits, full contact reconciliation, duplicate-open UX, browser and isolated PostgreSQL verification remain open. This is not an independent migrated contact directory.

**W45 PARTIAL:** A separate /tpo/companies/[companyId]/feedback page now shows internal NOTE-type CRM activity for only recruiter leads explicitly linked to the college-company relationship, with a confirmed append-only note form. The POST endpoint requires same-origin, central TPO placements.manage permission, college scope, strict Zod input and an existing scoped lead, and reuses the migrated DB09 activity writer with a relationship check under the lead row lock. A new note on a NEW lead also moves that lead to CONTACTED as the existing writer requires. Contactless/DB09-unavailable/empty-history states are explicit. This is not externally submitted company feedback, rating, sent communications, or a replacement for the legacy interaction log; positive database, private-note disclosure, browser and UX parity checks remain open.

**W41 PARTIAL:** Company detail now links to a paginated contact activity log backed by registered DB09 lead activities. College-company relationship ownership, central placements permission, event type filtering, recorded outcome and timestamp are enforced; unavailable activity storage is labeled rather than counted as zero. Raw private notes and contact addresses are not projected. Legacy document-sharing, exact history semantics, browser and positive DB verification remain open.

**W51 PARTIAL:** The company contact-log page now records confirmed internal CALL, EMAIL, WHATSAPP, MEETING or NOTE activities against explicitly linked, non-unsubscribed DB09 recruiter leads. Strict Zod prohibits SYSTEM/delivery impersonation, requires a note and an expected lead timestamp; same-origin POST and central can()/scope gate use the signed-in TPO college. Within one transaction the active company relationship is scoped and read-locked, the selected lead is row-locked and stale-checked, its updatedAt is advanced to reject duplicate replays, and exactly one immutable actor-attributed DB09 activity is inserted. This form deliberately does NOT change the lead's manual stage, send messages or certify actual calls. Authored model and gated disposable-PostgreSQL tests cover success, immutable audit, wrong role, foreign college and stale inputs. Executed tests, legacy lead-detail timeline/interaction consistency, browser acceptance and interaction-outcome taxonomy still require certification.
- [ ] Hiring History metrics/table match.
- [ ] Shared Documents history matches.
- [ ] Open Drive from document/history works.
- [ ] Drives table matches.
- [ ] Timeline matches.
- [ ] Loading/not-found/error/empty states match.

# Drives

## Page: Drives List

**Work Mode drive-list scale follow-up — PARTIAL:** Lifecycle listing now searches persisted company/drive names literally, pages 25 drives at a time, and derives complete scoped season/search counts in a repeatable-read transaction instead of truncating the first 500. Previous/Next retain season, lifecycle and search; stale page requests clamp to the last page. Pure pagination tests cover records beyond 500; isolated PG fixtures exercise two-page completeness, correct counts, literal wildcard search and role/foreign-season denials. PG runtime and desktop/mobile browser acceptance remain open, as do persisted Requests workflow and exact legacy columns/export parity.
**Legacy:** `/tpo/drives`

Legacy lifecycle tabs:
- Requests;
- Drafts;
- Live;
- Closed.

Legacy summary:
- live now;
- waiting for review;
- deadlines in next 7 days;
- companies this season.

Legacy table:
- company/role;
- mode;
- CTC;
- type;
- deadline;
- lifecycle status;
- Open;
- row More: Applicants, Rounds and schedule, Offers;
- Create Drive disabled for past season;
- stale-data alert.

- [ ] Lifecycle tabs/counts match.
- [ ] Summary metrics/drill-ins match.
- [ ] Table columns/status labels match.
- [ ] search/filter/export infrastructure matches.
- [ ] row Open matches.
- [ ] row Applicants/Rounds/Offers deep links match.
- [ ] Create Drive matches and is blocked for past season.
- [ ] empty state changes correctly by lifecycle tab.
- [ ] stale-data/hard-error/loading states match.

## Page: New Drive
**Legacy:** `/tpo/drives/new`

**W54 PARTIAL — Step 1 quick draft:** The TPO new-drive page links to /tpo/placements/new/draft, a lightweight create-draft first step using an active season, existing college company relationship, role title and description, employment/work mode, and optional explicit-IST deadline. Strict Zod, confirmation and signed-in TPO college scope guard an origin-checked POST. The existing job transaction creates one primary role and now records an immutable actor activity event; no publication occurs. Legacy multi-step wizard parity, schedule constraints, retries, runtime PG/browser acceptance and additional role/eligibility configuration are still open.

- [ ] Company/recruiter source context matches.
- [ ] Role/title/description/location/mode/category fields match.
- [ ] compensation/CTC fields match.
- [ ] application window/deadline fields match.
- [ ] eligibility rule fields match.
- [ ] role options if present match.
- [ ] rounds/template fields present in legacy match.
- [ ] preview/review before create matches.
- [ ] validation/duplicate/conflict states match.
- [ ] successful create navigates to intended workspace.
- [ ] past-season/permission restrictions are enforced.

## Page: Edit Drive

**Work Mode follow-up — PARTIAL:** Edit Drive now canonicalizes offset ISO optimistic tokens before its locked millisecond CAS, so the same version expressed in IST is accepted. Unit regression executed; integration regression authored against the existing in-test drive fixture. Typecheck, changed-file ESLint and complete unit suite are required before this push. PostgreSQL execution is blocked by sandbox account creation/user switching (apt and embedded-postgres attempted). Full legacy fields, dirty navigation, desktop/mobile browser acceptance and independently executed PG evidence remain open.

**W66-1 PARTIAL — Edit Drive:** New `/tpo/placements/jobs/[jobId]/edit` edits title, description, locations, openings and INR CTC on active-season DRAFT jobs only. TPO college-actor scope, confirmed PATCH, row lock, millisecond-safe timestamp CAS, synchronized active primary role and immutable activity audit. Unit and disposable PG tests authored, unrun. Remaining: full legacy fields, navigation dirty-state checks, browser validation and independent PG certification.

**Legacy:** `/tpo/drives/[jobId]/edit`

- [ ] Editable fields match lifecycle restrictions.
- [ ] fields locked after publish match.
- [ ] validation and unsaved-change behavior match.
- [ ] Save result refreshes drive workspace safely.
- [ ] permission/past-season/read-only behavior match.

## Page: Drive Detail
**Legacy:** `/tpo/drives/[jobId]`

### Header / mission control

**Work Mode lifecycle follow-up — PARTIAL:** Deadline extension and consequence-preview closure canonicalize equivalent offset ISO tokens before timestamp checks; closure consequence rows are defined outside JSX. Existing preview keeps applications, rounds and offers intact and rejects changed counts. Unit offset regressions executed before push; corresponding PostgreSQL success/stale/foreign/wrong-role fixtures updated, runtime blocked by sandbox non-root account setup. Exact cancellation semantics, full legacy fields and desktop/mobile browser parity remain open.
Legacy:
- job title/company/status;
- needs-attention cards;
- KPIs reachable/applied/rounds/offers;
- lifecycle stepper Request→Published→Applications→Rounds→Offers→Closed;
- partial section-load warning;
- overflow actions Edit, Export Applicants, Share with Company, Cancel where allowed.

- [ ] Header/status/lifecycle context matches.
- [ ] Needs-attention taxonomy matches.
- [ ] KPI calculations and click-through filters match.
- [ ] Lifecycle stepper matches.
- [ ] independent section failures do not zero healthy sections.
- [ ] Edit action rules match.
- [ ] Export Applicants matches.
- [ ] Share with Company flow matches.
- [ ] Cancel availability rules match.

### Tab: Overview
- [ ] overview sections/summary match.
- [ ] request state and recruiter request details match.
- [ ] publish readiness/preflight signals match.
- [ ] not-applied/reachability/attention sections match.
- [ ] activity/history matches.
- [ ] navigation into filtered Applicants/other tabs matches.

### Tab: Applicants

**Work Mode applicant scale follow-up — PARTIAL:** Pipeline search/stage filters now execute in scoped SQL with complete stage counts and 25-row pagination under one repeatable-read snapshot. Every matching application can be reached beyond the old 500-row cutoff; Previous/Next preserve filters and stale page requests clamp safely. Each page retains the review drawer and its persisted screening token. Pure pagination tests and independent read-only learner PG fixtures cover two-page completeness, withdrawal/PENDING separation, literal wildcard search, foreign college and wrong role. PG runtime, browser/navigation acceptance and full legacy candidate/history/bulk parity remain open.

**Work Mode filtered CSV — PARTIAL:** Export preview/download preserve pipeline stage and literal student/role search. Filters execute in scoped SQL before the 501-record truncation probe; newest matching rows export first, capped at 500 with a truncation row. CSV submitted dates display IST and every cell still uses canonical formula neutralization. Unit tests and PG fixtures cover wildcard escaping, null screening/PENDING, WITHDRAWN separation, filters and tenant/role denials. PostgreSQL runtime and browser download verification remain open, along with exact legacy columns and pagination beyond the cap.

**Work Mode review drawer — PARTIAL:** Pipeline rows now open a native modal drawer with persisted role, application, screening, eligibility, channel and IST submitted time. Pending/held submitted applications in published drives expose the existing confirmed shortlist/reject writer with required note and timestamp token. Escape/Close restores native dialog focus; mobile scroll is bounded. Successful saves disable repeat submission; version tokens accept equivalent ISO offsets. Pure availability and offset tests plus PG pipeline/read/write/foreign/wrong-role/stale fixtures authored; PG runtime blocked by sandbox account setup. Full candidate profile/history, exact legacy visual layout and browser acceptance remain open.
- [ ] applicant table/search/filter/stage views match.
**W66-4 PARTIAL — Candidate detail:** A focused TPO applicant detail route now shows persisted application identity, eligibility and screening stage, latest applied round outcomes and recorded offer/accepted joining evidence with a scoped college/drive/application lookup. It links from the existing applicant stage table, with mobile, loading, error and non-leaking not-found states. Does not disclose private screening notes, staged results or fabricate employer selection. Remaining: legacy side drawer/modal, richer candidate sections/filters, positive PG/browser evidence and visual parity.

**W67-1 PARTIAL — Applicant review:** A scoped applicant detail action now supports confirmed shortlist/reject with a required note, stale screening updatedAt token (millisecond-safe CAS), existing transactional screening history and immutable activity audit. Rejection note is candidate-visible; shortlist note stays internal. Only active submitted applicants in published drives can transition from pending/hold. Tests authored but not executed; full legacy drawer, decision history UI, mobile/browser proof and product consent parity remain open.
- [ ] candidate detail drawer matches.
- [ ] bulk actions match.
- [ ] external-registration/company-id state matches.
- [ ] share-applicant workflow is available.
**W67-4 PARTIAL — Drive applicant CSV:** The TPO applicant table and workspace now link to /tpo/placements/jobs/[jobId]/applications-export. College-scoped persisted application/screening/role/channel data are projected into a formula-neutralized CSV, capped at 500 rows with an explicit TRUNCATED row when more exist. No private screening notes, phone numbers or staged round outcomes are exported. The existing shared exporter is unchanged for non-TPO roles. Remaining: exact legacy columns and filters, pagination past 500, browser/PG acceptance, and reconciliation with the shared export.
- [ ] export behavior matches.
- [ ] empty/error states match.

**W46 PARTIAL:** TPO drive workspace now links to a standalone current-shortlist view and formula-neutralized CSV at /tpo/placements/jobs/[jobId]/shortlist. Only persisted SUBMITTED applications with current SHORTLISTED screening, a same-job role option, and active same-college learner membership are shown; names, roll numbers, role options and known decision times are displayed without private screening comments. Counts reflect applications, not distinct learners. Legacy drawer/filter/share/export layout, historical shortlist versions, positive DB/browser acceptance remain open.

**W61 D PARTIAL:** The operational shortlist now links to /tpo/placements/jobs/[jobId]/share-preview, a TPO-only read-only report and formula-neutralized capped CSV using exclusively the same application ID, display name and email candidate fields already returned by the authorized recruiter round workspace. Current submitted/shortlisted applications and active same-college memberships only; only published/closed drives. No send, share grant, token, file, score, phone, roll number or private comments are exposed. The CSV notes truncation above 500 rows. Actual secure sharing, user consent/disclosure snapshots, live PostgreSQL/browser acceptance and legacy sharing UI remain open.

### Tab: Rounds

**Work Mode shared venue booking — PARTIAL:** Interview rescheduling and the generic calendar scheduling writer now use one transaction-scoped college/venue advisory lock and conflict query. Unknown duration/time and over-cap venue occupancy fail closed; adjacent half-open intervals remain allowed. Generic scheduling locks the parent drive to serialize with closure and advances version timestamps by at least one millisecond. ISO offset tokens normalize and TPO meeting links accept HTTP(S) only (unsafe URL schemes intentionally rejected). Unit and PG cross-writer collision/adjacency/denial/stale fixtures authored; sandbox non-root setup still blocks PG execution. Concurrent DB certification, candidate/interviewer conflicts, full notifications and browser acceptance remain open.

**Work Mode results follow-up — PARTIAL:** Result entry now validates form data through the canonical confirmed-result Zod contract, requires HOLD rank only when selected, separates internal PASS notes from candidate-visible feedback, and disables repeated submission after save. Closed/draft/archived drives show read-only entries. Result staging locks the parent drive before round/application locks to serialize against closure. Unit tests and PG fixtures cover boundaries, optimistic identity, wrong-role denial and closed-drive state; PG execution remains blocked by sandbox account setup. Full bulk/apply UX, cross-writer concurrency certification, pagination and desktop/mobile browser verification remain open.
- [ ] round list/order/status matches.
- [ ] add/edit/schedule round actions match.

**W60 D — PARTIAL / blocked write:** A TPO-only candidate round schedule view at /tpo/placements/jobs/[jobId]/candidate-schedule shows only persisted round-level times/venues and current progression-eligible applicants, with the existing 90-day venue-collision warnings and explicit unknown/incomplete states. Candidate-specific panel assignments, interviewer IDs and individual time slots have no migrated table, so no assignment POST or fictional candidate booking is introduced. Existing round-level scheduling can still be managed from the registered calendar round writer; individual-slot persistence, concurrency exclusion, actor audit and owner-approved conflict semantics remain missing.
**W67-3 PARTIAL — Interview reschedule:** Added confirmed IST rescheduling directly to the interview readiness page for SCHEDULED INTERVIEW rounds. Transactionally locks the round, uses millisecond-safe updatedAt CAS, serializes venue-specific writes via advisory lock, refuses occupied/unknown-duration same-college campus venues and writes immutable round history plus actor-attributed activity audit. Other scheduling writers do not yet share this advisory lock; full cross-writer collision safety, individual candidate slots, interviewers, notifications, executed PG/browser and legacy overlay parity remain open.
- [ ] round kind/date/time/mode/location fields match.
**W67-2 PARTIAL — Round result entry:** The TPO drive workspace now links to a mobile round-results entry table for shortlisted submitted applicants, with per-round staged/applied counts and individual PASS/FAIL/HOLD/ABSENT input. It calls the existing origin-guarded confirmed-result route, which uses current result-ID optimistic guards, locked eligibility/progression checks, versioned result history and immutable audit. Never auto-applies. Tests authored, unrun. Remaining: bulk editing, pagination, apply/reconciliation UX, browser verification and exact legacy table parity.
- [ ] auto-apply/results state matches.
- [ ] conflict/blocker states match.

**W46 PARTIAL:** TPO placement operations now links to /tpo/placements/schedule-conflicts. It checks only upcoming non-cancelled/non-completed rounds of published drives against persisted on-campus venue, start and positive duration and reports true overlapping [start,end) intervals. Virtual rounds are excluded and missing mode/venue/duration are explicitly unassessable, not conflict-free; results cap at 1,000 rounds with a truncation warning. This is not candidate/faculty overlap detection or a schedule-edit blocker. Exact legacy scheduling conflict taxonomy, job-level warnings, runtime/browser tests remain open.
- [ ] result progression into next stages matches.

### Tab: Offers
**W70 PARTIAL — LOI kind:** Persisted LOI record kind (migration 0060 `placement_offers.kind` OFFER|LOI): the TPO Offers panel issues an Offer or a Letter of intent through the same audited, serializable issue path (version history, learner notification titled Letter of intent received, audit metadata kind), the learner offers page and the HR Offers tab label LOI records, and re-issue is idempotent only for the same kind. No LOI document/file is generated or stored; no selection list is sent externally. A dedicated selection-list send, LOI document upload via src/modules/storage and browser acceptance remain open.

- [ ] offer/selection list matches.
- [ ] candidate offer state matches.

**W49 A — PARTIAL:** TPO Offers & Joining now includes a confirmed, all-or-nothing administrative lifecycle recorder for up to 200 offer IDs. Registered offer statuses remain ISSUED/ACCEPTED/DECLINED/WITHDRAWN; EXTEND changes only expiry, and JOINED records an accepted offer's PENDING joining outcome. The pure action/transition model and row-locked transaction enforce expected status, expiry, terminal joining constraints, tenant scope, mandatory evidence/reason, and immutable actor-attributed offer/joining history and activity events. TPO-recorded ACCEPTED/DECLINED are evidence-backed administrative entries, not learner self-actions; exact permission/product consent policy, positive PostgreSQL/browser certification and parity remain open.
- [ ] verify/selection actions match.
- [ ] release/response/joining data matches.

**W60 B — PARTIAL / blocked write:** A TPO-only offer letter evidence view at /tpo/placements/jobs/[jobId]/letters displays actual persisted offer issue/response states and explicitly labels letter issued/acknowledged as unavailable. P8 has no offer-letter documents, delivery/acknowledgement timestamps, approved transition history or proof of receipt, so the proposed bulk 200-row letter-issued/acknowledged mutation is not implementable safely without a registered table and owner-approved transition rules. This does not downgrade existing offer lifecycle DONE checks or claim offer response equals letter acknowledgement.
- [ ] candidate detail deep link/drawer matches.

**W45 PARTIAL:** Each TPO drive workspace now links to /tpo/placements/jobs/[jobId]/joining, a college-scoped read of persisted ACCEPTED offer joining states (PENDING/unrecorded, JOINED, DEFERRED, DID_NOT_JOIN) with per-offer confirmable updates through the existing same-origin PUT joining API, strict existing joining-outcome Zod rules, and correction-reason/history enforcement. Issued/declined/withdrawn offers do not show update forms; unrecorded outcomes are not called confirmed joins. This is not an offer letter/document tracker. Bulk joining updates, audit of sensitive reasons, positive DB/browser testing and exact legacy joining workflow remain open.

**W44 PARTIAL:** The existing Offers & Joining workspace now exposes a TPO-only, explicitly confirmed bulk withdrawal control for up to 50 issued/accepted persisted offers. A required reason is recorded by the existing single-offer audit/history transition. Already-withdrawn, stale, foreign-job, declined and recorded-joining offers are not treated as withdrawable. This is withdrawal only: learner ACCEPT/DECLINE remains self-service, and acceptance/response/joining status is never synthesized. Full legacy bulk selection/modal UX, executed positive concurrency certification and runtime/browser evidence remain open. An expected-status check now runs under the existing offer row lock, rejecting a stale selection instead of withdrawing a newly accepted offer.

### Tab: Drive Day
- [ ] active/completed round selector matches.
- [ ] Drive Day operations reachable from job.
- [ ] coordinator permissions match.
- [ ] attendance/results operational actions match.
- [ ] empty/no-round states match.

### Request/lifecycle overlays
Legacy includes:
- Reject request modal;
- Send Back request modal;
- Publish preview modal;
- Extend application deadline modal;
- Cancel Drive modal with reason;
- close/complete consequences where applicable;
- recruiter Messages drawer.

- [ ] Reject request modal/reason/consequence matches.
- [ ] Send Back modal/reason matches.
- [ ] Publish Preview modal checks and consequences match.
**W66-2 PARTIAL — Extend Deadline:** A confirmed TPO published-drive extension at /tpo/placements/jobs/[jobId]/extend-deadline updates only persisted applicationDeadline for an active season, requires a later future IST deadline, row-locked expectedUpdatedAt with millisecond-safe SQL CAS, and immutable actor audit. Unit/PG tests authored, unexecuted. Legacy overlay placement, borrower notifications, browser/race validation remain open.

- [ ] Extend Deadline modal validation matches.
**W66-3 PARTIAL — Close consequence preview:** A TPO-only drive close-preview page shows persisted applications, rounds, and offer versions. A confirmed same-origin POST checks signed-in college/actor, active season, PUBLISHED state, millisecond-safe job token and unchanged preview counts under a job lock, then closes and writes immutable audit. This is CLOSE only: the job enum has no CANCELLED state. Remaining: legacy CANCEL semantics, cross-writer serialization, consequence notifications, browser checks and executed PostgreSQL evidence.

**W69 PARTIAL — TPO applicant notes:** TPO-only private append-only notes on the applicant detail page (`/tpo/placements/jobs/[jobId]/applicants/[applicationId]`), persisted in `placement_application_notes` (migration 0059), stale-token protected and audited without text; recruiter notes are never shown there. Browser acceptance remains open.

**W66-4 PARTIAL — Cancel drive with consequence preview:** `/tpo/placements/jobs/[jobId]/cancel-preview` (TPO, published drive, active season) shows submitted applications, open rounds that will be cancelled, issued and accepted offers. A confirmed same-origin POST with a 10-character audited reason, job-lock millisecond token and unchanged-impact check closes the drive, cancels PENDING/SCHEDULED rounds with CANCELLED round events and writes an immutable PLACEMENTS_TPO_DRIVE_CANCELLED audit. Accepted offers block cancellation. There is no CANCELLED job state in the schema, so the drive reads as CLOSED and the cancellation is identifiable only in the audit. Issued offers and applications are retained. PG tests executed on a disposable DB; browser acceptance, learner notification and offer withdrawal remain open.

- [ ] Cancel Drive modal reason validation and downstream consequence preview match.
- [ ] Close/complete flow is accounted for.

**W60 C — PARTIAL:** A signed-in TPO drive close-out page at /tpo/placements/jobs/[jobId]/closeout reports persisted job-scoped distinct applicants, currently submitted and shortlisted learners, distinct offered/accepted/joined learners and offer versions, with the same pure evaluator driving a formula-neutralized CSV. Independent selected count remains null because PASS results and offers are not canonical final selection evidence; absent external/historical facts are not fabricated. Final closed-drive snapshot, selection owner semantics, positive PostgreSQL/browser proof and exact legacy reconciliation remain open.

**W49 B — PARTIAL:** The TPO drive workspace now has a separate confirmed publish/close/reopen control using only registered season, company-relationship, active role-option, evaluative-round, eligibility-policy, applied result and accepted-offer records. Publish/reopen refuse unready or expired-deadline drives; reopen also refuses any applied round result or accepted offer. CLOSE remains a distinct step from completing rounds. Status and blockers are rechecked under a job row lock with an optimistic expected status, and every successful change appends a college-scoped actor audit. The existing generic non-TPO lifecycle endpoint is preserved; uniform legacy behavior, browser/positive PostgreSQL execution and immutable historical snapshots remain open.
- [ ] Messages drawer matches recruiter conversation workflow.

## Page: Global Drive Day
**Legacy:** `/tpo/drive-day`

- [ ] today's/current rounds list matches.
- [ ] company/job/round/context matches.
- [ ] coordinator-scoped access matches.
- [ ] status/attendance/result readiness cues match.
- [ ] round click opens focused Drive Day.

## Page: Round Drive Day
**Legacy:** `/tpo/drive-day/[roundId]`

- [ ] round roster matches.
- [ ] attendance/check-in actions match.

**W58 PARTIAL:** TPO round roster now offers confirmed PRESENT check-in and explicit ABSENT no-show actions only on the currently scheduled India-local round date, for progression-eligible candidates. Strict Zod and same-origin POST, centralized college permission, row-locked expected-status checks, idempotent repeats and transactional immutable activity audit apply. IN_INTERVIEW/DONE marks cannot be downgraded. Bulk marking, final legacy UX, positive PostgreSQL and browser acceptance remain open.
- [ ] result/outcome capture matches.
- [ ] bulk result/attendance actions match.

**W52 PARTIAL:** The existing TPO-only round page now supports per-learner, confirmed result staging for PASS (progression), FAIL (not selected), HOLD (ranked waitlist) and ABSENT, and confirmation-based application of a STAGED result only after the evaluative round is COMPLETED. A new same-origin POST adapter uses strict Zod, central TPO placement-management scope and the existing result service; the confirmed path checks the expected current result identity under row locks and inserts a scoped immutable PLACEMENTS result-staged audit event in the same transaction as the durable STAGED version. The existing apply path already records a separate immutable result-applied activity. Learner-facing messages are mandatory for non-PASS outcomes. This is not an employer offer/hire selection and does not fabricate a SELECTED result status. Bulk APPLY, attendance bulk operations, exact legacy modal/column parity, mixed-role routing, privacy/browser acceptance and independently executed PostgreSQL evidence remain OPEN.

**W53 PARTIAL:** The TPO round roster now offers confirmed bulk **initial PASS/FAIL staging** for up to 25 eligible applicants without a current result. Strict Zod rejects duplicate application IDs and requires learner-facing messages for FAIL. Every row delegates to the existing scoped, row-locked transaction and immutable result-staged actor audit; the batch is explicitly **not atomic** and reports staged/ineligible per row. Operators still apply final results separately after round completion. Unknown/foreign rounds fail before any mutation, and stale row snapshots do not overwrite current results. Positive disposable PostgreSQL test execution, exact legacy bulk selection UX, bulk APPLY, HOLD/ABSENT mass marking, browser acceptance and mixed-role routing remain open.

**W41 PARTIAL:** The TPO round overview now provides an authorized, formula-safe CSV export of its current persisted attendance roster. It includes per-learner recorded attendance and only APPLIED result outcomes, without inventing missing marks or exporting recruiter contact details. Bulk attendance/result mutations, legacy CSV columns, completed-round historical snapshots and browser/DB acceptance remain open.

**W43 PARTIAL:** The round overview also links to a no-show reconciliation page that counts only persisted ABSENT marks among progression-eligible applicants; WAITING/unmarked and unrecognized statuses remain separately reported and are not inferred as absences. It flags non-completed rounds as a live snapshot. Historical immutable attendance snapshots, bulk corrections, exact legacy no-show taxonomy, positive PostgreSQL and browser acceptance remain open.

**W44 PARTIAL:** The existing no-show report now downloads a dedicated formula-safe CSV of explicit ABSENT rows only, using the existing college-scoped round roster service and same report CSV encoder. Headers-only output is used when no explicit absences exist; WAITING/unmarked learners are excluded instead of being labelled absent. Historical snapshot exports, full legacy format and executed database/browser verification remain open.
- [ ] progress/summary counts match.
- [ ] coordinator vs TPO permission differences match.
- [ ] completion confirmation matches.
- [ ] loading/not-found/error states match.

# Students

## Page: Students
**Legacy:** `/tpo/students`

### Intelligence summary
Legacy metrics:
- ready but not applying;
- needs readiness support;
- not registered;
- already applying;
- placed / placement pool;
- branch placement grid.

- [ ] All summary counts use correct season/registration denominator.
- [ ] metric click filters roster correctly.
- [ ] branch performance grid matches.

### Tab: Students roster
Legacy filters:
- view segmented filters;
- branch;
- company;
- minimum journey depth;
- outcome;
- shortcut filters "Rejected at interview or later" and "Reached final round".

Legacy columns:
- student identity;
- batch/branch;
- CGPA/backlogs;
- readiness;
- registration;
- best so far;
- applications;
- offers;
- placement status.

- [ ] View filters/counts match.
- [ ] Branch filter matches.
- [ ] Journey/company/depth/outcome filters match.
- [ ] shortcut filters match.
- [ ] table columns/derived journey values match.
- [ ] search/export/saved table behavior matches.

**W43 PARTIAL:** Each Students roster row now links to an authenticated, college-scoped placement history for that learner. The detail includes paginated applications across persisted seasons, applied round outcomes, offer versions, package evidence and explicit joining results. Unknown/foreign membership IDs reveal no data; registration choices and external placement offers are not inferred. Offer-version counts are not unique placed-student metrics. Exact legacy student drawer, academic/eligibility drill-ins, browser and positive PostgreSQL acceptance remain open.

### Bulk actions
- Add to Drive;
- Nudge;
- Assign Prep;
- Mark Higher Studies;
- Debar.

- [ ] Add to Drive modal matches.

**W54 PARTIAL — Students list bulk add:** The TPO Students roster now offers a current-page learner selection (up to 100 displayed learners), published ACTIVE-season internal drive selector and active role dropdown. Its confirmed POST reuses the established bulk-add service and strict 200-ID Zod contract, which checks exact college membership, academic eligibility, participation, deadlines and existing applications per learner and audits successful insertions. Per-learner results explain added/already-added/ineligible. Selections do not persist across roster page navigation; exact legacy bulk modal, multi-page selection, positive PG/browser verification remain open.
- [ ] Nudge text + confirmation matches.
- [ ] Prepared WhatsApp messages workflow matches.
- [ ] Assign Prep modal/course selection matches.
- [ ] Higher Studies confirmation/consequence matches.
- [ ] Debar modal/reason/consequence matches.

**W42 — PARTIAL (membership-level restriction, not legacy debarment lifecycle):** The learner's TPO participation page offers confirmed Debar with mandatory reason and confirmed Remove-debar for only Debar-tagged direct INELIGIBLE decisions, using the existing same-origin-guarded participation API, central college permissions, optimistic snapshot and transactional activity event. Learner placement access and the application writer enforce the learner override; clearing it restores inherited class/batch eligibility and may leave the learner unable to apply. There are no timed or drive-count debarments, restore-previous-override history, roster bulk action or legacy modal parity. Requires disposable PostgreSQL and browser verification.

### Academic import
- Import Academic Details;
- preview groups matched/unmatched;
- commit/update.

- [ ] import parser/columns match.
- [ ] preview counts/groups match.
- [ ] unmatched rows are actionable/explainable.
- [ ] commit is tenant/season safe.

### Tab: Requests
- [ ] Student Requests tab matches global request panel.
- [ ] counts/status/actions match.

## Page: Requests
**Legacy:** `/tpo/requests`

- [ ] all student exception/change request types are included.
- [ ] status/age/student/job filters match.
- [ ] request detail/context matches.
- [ ] approve/reject/send-back decisions match.
- [ ] reason/comment requirements match.
- [ ] decision consequences update authoritative learner/job state.
- [ ] empty/loading/error states match.

**W58 A — PARTIAL:** The college-scoped TPO Requests queue now exposes confirmed APPROVE/REJECT decisions for pending persisted request types (application withdrawal, round reschedule, offer extension), with required rejection note and an expected-updated-at optimistic token verified under a row lock. It reuses the authoritative request transaction/effect and immutable placement activity audit. CANCEL stays learner-controlled; send-back has no migrated state. Legacy request detail and reason taxonomy, executed isolated PostgreSQL confirmation and browser parity remain open.

# Calendar

## Page: TPO Calendar
**Legacy:** `/tpo/calendar`

Legacy modes:
- Week;
- Month;
- Agenda.

Legacy event types include rounds, talks, deadlines and recruiter follow-ups.

- [ ] Week mode matches.
- [ ] Month mode matches.
- [ ] Agenda mode matches.
- [ ] date range/navigation matches.
- [ ] company filter matches.
- [ ] event-type filters match.
- [ ] summary metrics for rounds/deadlines/follow-ups/next match.
- [ ] event popover/detail matches.
- [ ] event deep links to drive/lead match.
- [ ] create Follow-up modal matches.
- [ ] move Follow-up modal matches.

**W58 B — PARTIAL:** The TPO calendar links to a managed round scheduling page for existing migrated pending/scheduled drive rounds. A confirmed same-origin write uses IST wall-clock conversion, registered round action transactions/events, strict college-scoped permission, updated-at optimistic checks and conservative same-venue overlap assessment (unassessable venue durations are blocked). Creation means scheduling an existing pending round; it does not create a new arbitrary event or round. Cross-writer venue-lock serialization, room resources, owner confirmation of exact legacy UX, PostgreSQL/browser acceptance and comprehensive calendar modes remain open.

**W61 C PARTIAL:** TPO Calendar now links to /tpo/calendar/export for a validated maximum 93-day IST-date range and downloadable current future-round CSV from registered P6B rounds. Source is scheduled PENDING/SCHEDULED rounds on published same-college drives only; CSV formula cells are neutralized, private meeting links are excluded, the result caps at 500 and explicitly flags truncation. No ICS or sync is claimed. Exact legacy column/timezone UX, positive PostgreSQL/browser evidence and full calendar parity remain open.

**W38 PARTIAL:** The TPO calendar now offers a small create form for existing CRM leads and an IST reschedule form on each open follow-up event card, gated by the DB09 CRM write readiness flag. Same-origin POST/PATCH routes derive the college exclusively from the active TPO membership, validate payloads, and reuse the existing centralized placements scope and CRM follow-up mutations. Completion remains terminal. The legacy create/move modal UX, optimistic concurrency (no persisted follow-up version/update timestamp), browser acceptance, and executed disposable PostgreSQL tests are still open.
- [ ] empty/loading/partial-failure states match.
- [ ] timezone handling is verified.

# Reports

## Page: Reports Gallery
**Legacy:** `/tpo/reports`

Groups:
- Overview and performance;
- Student outcomes;
- Relationships and compliance.

Headline metrics:
- placement rate;
- students placed;
- offers;
- students accepted.

- [ ] Group headings/descriptions match.
- [ ] headline metrics match.
- [ ] report cards and help text match.
- [ ] management-view CTA opens Placement Summary.

## Report: Placement Summary
- [ ] table/data columns match.
- [ ] unique placed vs total offers semantics match.
- [ ] summary KPIs match.
- [ ] filters match.
- [ ] export matches.
- [ ] presentation mode matches.

## Report: By Branch
- [ ] branch metrics/table/chart match.
- [ ] drill-in/filter behavior matches.
- [ ] export matches.

**W49 C — PARTIAL:** A dedicated /tpo/reports/branch-season drill-in now reports unique application-holding learners, distinct members with currently ACCEPTED offers, accepted offer versions, and a clearly labeled accepted-applicants/applicants rate for one registered season. The placement-pool denominator uses only persisted, active-cohort PLACEMENTS choices if that relation is actually migrated; otherwise it and its official placement rate remain null. Ambiguous/missing current branch attribution is explicit rather than silently assigned. The same authorized model drives a formula-neutralized CSV. Original placement-time cohort/branch history, registration snapshot semantics, external offers, UI acceptance and executed PostgreSQL evidence remain open.

## Report: By Company
- [ ] company hires/average/highest package metrics match.
- [ ] drill-in/filter behavior matches.
- [ ] export matches.

## Report: CTC
- [ ] highest/average/median semantics match best-offer logic.
- [ ] internship exclusion matches.
- [ ] chart/table/export match.

## Report: Unplaced Students
- [ ] placement-pool definition matches.
- [ ] filters/table/export match.
- [ ] drill-in to student context matches.

## Report: Offers and Acceptance
- [ ] released/accepted/declined/expired metrics by company match.
- [ ] filters/table/export match.

## Report: Joining Status
- [ ] joined/deferred/did-not-join among accepted offers matches.
- [ ] filters/table/export match.

## Report: Failure Reasons
- [ ] rejection/no-show reason taxonomy matches.
- [ ] round/company/branch filters match.
- [ ] table/chart/export match.

## Report: Leads
- [ ] invited/joined/hired recruiter funnel matches CRM data.
- [ ] filters/table/export match.

## Report: Accreditation Export
- [ ] NAAC/NIRF column set matches.
- [ ] completeness preflight matches.
- [ ] blocking/warning missing-data list matches.
- [ ] CSV export matches.

## Shared report-detail behavior
Legacy report detail has Saved Filters, Mode, Type, dynamic table columns, chart, presentation view, export and report totals.

- [ ] saved filter behavior is implemented or explicitly redesigned.
- [ ] Mode filter matches.
- [ ] Category/Type filter matches.
- [ ] dynamic table and null rendering match.
- [ ] chart generation matches supported reports.
- [ ] presentation view matches.
- [ ] exports are audit-safe.
- [ ] loading/error/empty states match.

# Messages

## Page: Messages
**Legacy:** `/tpo/messages`

- [ ] conversation list matches.
- [ ] recruiter/company/drive context is visible.
- [ ] unread/last-message ordering matches.
- [ ] open thread behavior matches.
- [ ] send message/reply behavior matches.
- [ ] drive-context deep links match.
- [ ] failed-send/retry state matches.
- [ ] empty/loading/error states match.
- [ ] tenant boundaries are enforced.

# Settings

## Page: Settings shell
**Legacy:** `/tpo/settings`

Groups:
- Season and policy;
- People;
- Communication;
- Sharing and identity.

Legacy behavior includes unsaved-change warning when moving between sections or unloading.

- [ ] section navigation/grouping matches.
- [ ] active section URL/query state matches.
- [ ] unsaved-change indicator matches.
- [ ] leave-without-saving confirmation matches.
- [ ] browser unload protection matches where appropriate.

## Settings: Placement Season
- [ ] list multiple seasons.
- [ ] current/registration-open status.
- [ ] Edit Season modal.
- [ ] name/date range/registration deadline.
- [ ] blocked academic dates list.
- [ ] Start New Season modal.
- [ ] warning for earlier-season open drives.
- [ ] Open Registration confirmation and consequence.

**W56 PARTIAL:** TPO-only confirmed season creation reuses the established locked P9 season writer and immutable activity; editing an ACTIVE season now requires an unchanged updatedAt snapshot, validates ISO calendar dates/date order and unique college season code, and stores before/after actor audit in the same transaction. The Placement Rules page now offers confirmed, version-checked writes to registered DB09 college offer rules with immutable before/after audit. No registration-open state, learner registration deadline, historical closed-season editing, full modal/dirty-state behavior, browser or executed disposable-PostgreSQL acceptance is claimed.

## Settings: Placement Rules
- [ ] placed-count trigger setting matches.
- [ ] offer limits/uplift/response rules present in legacy match.
- [ ] validation and save behavior match.
- [ ] dirty-state protection matches.

## Settings: Placement Team
- [ ] placement-team member list matches.
- [ ] Add to Team modal with faculty search.
- [ ] TPO Admin / Faculty Coordinator role selection.
- [ ] removal impact lookup.
- [ ] reassign-and-remove modal.
- [ ] student coordinators list.
- [ ] Assign Student Coordinator modal with student + drive.
- [ ] remove coordinator confirmation.

## Settings: Recruiters
- [ ] recruiters with college access list matches.
- [ ] Active/Removed state matches.
- [ ] revoke access confirmation and immediate effect match.

**W57 PARTIAL:** TPO Recruiter Settings now includes a confirmed grant form for existing active users and active linked college-company relationships, plus row-level confirmed revocation. Registered recruiter profiles/grants are locked and checked for an active duplicate; revocation requires the exact unchanged grant updatedAt. Every changed grant and revocation inserts immutable actor activity inside its transaction. Email is used only as an admin-supplied lookup, not disclosed in the historical roster. Invitation, brand-new user provisioning, exact legacy modal UX, executed PostgreSQL/browser evidence and permission-session propagation remain open.

## Settings: Trusted Companies
- [ ] trusted domains list matches.
- [ ] add/normalize domain behavior matches.
- [ ] remove trust confirmation matches.

**W55 PARTIAL — college-company relationship trust only:** The Trusted Companies page now offers a TPO-only, explicitly confirmed, reason-required `isTrusted` toggle for each ACTIVE college-company relationship in registered P1 data. Strict Zod rejects duplicate/no-op input; a locked expected-state check denies stale writes. Each successful change inserts a PLACEMENTS activity event with actor and before/after trust flags in the same transaction. This is NOT the unmigrated recruiter-domain allowlist and does not claim grant/approval-policy parity. Real PostgreSQL and browser certification remain open.
- [ ] trust effect on request approval matches.

## Settings: Templates
- [ ] reusable communication templates match.
- [ ] save/edit fields and validation match.
- [ ] mail-provider/status dependencies match.

## Settings: Student Notices
- [ ] optional notices controls match.
- [ ] Prep & Readiness configuration matches.
- [ ] prep course multi-select matches.
- [ ] email-template readiness/status display matches.

## Settings: My Notifications
- [ ] personal notification preference options match.
- [ ] preferences are user-specific, not college-wide.
- [ ] save/error state matches.

**W61 A BLOCKED:** placement_tpo_user_preferences is declared only in an unregistered staged schema; no CREATE TABLE is in the current registered Drizzle migration journal. The existing read-only page correctly shows UNAVAILABLE. Persisted user preference writes and audit cannot be enabled without migration promotion and owner disposition. No fake save state was added.

## Settings: What Companies See
- [ ] field/data-sharing switches match.
- [ ] internal placement signals remain private where legacy does.
- [ ] changes affect recruiter/company preview consistently.

## Settings: Branding
- [ ] recruiter invite/share/email branding fields match.
- [ ] preview behavior matches if present.
- [ ] storage-backed assets remain explicit BLOCKED until live.

# Audit / Notifications / Profile / More

## Page: TPO Audit log
**Legacy:** `/tpo/audit`

Legacy summary includes:
- recent events;
- people and systems;
- shares/downloads;
- settings changes;
- latest activity.

- [ ] summary metrics match.
- [ ] event/entity/actor/date filters match.
- [ ] share/download events match.
- [ ] settings-change events match.
- [ ] detail text/context matches.
- [ ] search/pagination/export if present are accounted for.
- [ ] empty/loading/error/stale states match.

## Page: TPO Notifications
**Legacy:** `/tpo/notifications`

Legacy:
- All / Unread segmented filter;
- Mark all as read;
- opening marks notification read;
- groups Today / Yesterday / This week / Earlier;
- linked notifications;
- stale refresh alert.

**W68 PARTIAL — TPO Notifications page:** `/tpo/notifications` (linked from TPO More) lists only the signed-in TPO's own in-app notifications for their persisted current college, with All/Unread filter, unread count, cursor-paged Older link, Today/Yesterday/This week/Earlier grouping (shared NotificationList), linked notifications, per-item mark-read and confirmed Mark all as read. Services re-verify the live ACTIVE membership + TPO role + `placements.manage`; reads are idempotent and audit as identity.tpo_notification.acknowledged. Foreign-college, other-user, wrong-role and suspended access are denied without leaking. Loading and error states included. Browser acceptance, exact event-type coverage and sidebar placement remain open.

- [ ] All/Unread counts/filter match.
- [ ] Mark all as read matches.
- [ ] opening individual notification marks read.
- [ ] time grouping matches.
- [ ] notification event coverage matches placement domain.
- [ ] deep links match.
- [ ] loading/empty/error/stale states match.

## Page: TPO Profile
Shared Faculty profile schema.

- [ ] User summary/profile image/completeness matches.
- [ ] Resume matches.
- [ ] Contacts/social/address/personal/identity matches.
- [ ] Aadhaar/PAN storage flow accounted for.
- [ ] Experience/education/skills/certifications/languages match.
- [ ] Publications/awards/metadata match.
- [ ] Add/edit/delete dialogs/states match.
- [ ] partial-section failure tolerance matches.
- [ ] loading/retry behavior matches.

## Page: More
**Legacy:** `/tpo/more`

Groups:
- Work: Requests, Calendar, Messages;
- Insights: Reports;
- Account: Notifications, Settings, Audit log, Profile.

- [ ] All legacy destinations appear.
- [ ] labels/descriptions match intent.
- [ ] keyboard activation works.
- [ ] mobile navigation uses this page where legacy does.
- [ ] no secondary tool becomes unreachable on small screens.


## W05 CRM implementation checkpoint — 2026-10-10 (not final parity)

**Verified source heads:** `lms/prod-2026@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`,
`lms2-fe/prod-2026@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.
Current source routes were renamed to `/tpo/recruiters` and
`/tpo/recruiters/[recruiterLeadId]` (historical `/tpo/leads` path is a
stale matrix alias). The new vNext routes use UUID `leadId` values.

Implemented **code only**, behind `DB09_TPO_API_READY=DB09_VERIFIED`:
- table (manual-stage only), basic searchable Board, college-scoped add form and
  preflight duplicate lookup; server-side DB uniqueness remains the authority;
- recruiter detail, safe contact editing without implicit contact deletion,
  activity logging/timeline, follow-ups and done action, Not Now;
- abort-on-navigation to prevent stale detail display, hard error / retry states,
  phone/email actions, basic responsive layout, protected server account route;
- W05 unit schema tests + **opt-in** PostgreSQL scenarios for contacts, concurrency
  and cross-college denial, and route gate assertions.

**Do not check off the above parity checkboxes yet**: database migrations are
not registered by W01, API responds HTTP 503, no browser/device evidence and
no executed typecheck/DB tests. This is a PARTIAL source implementation, not
a working release. Remaining legacy `/tpo/recruiters` gaps include derived
Invited/Joined/Drive Planned/Recruited stages, column/owner/source/follow-up
and quiet filters, saved views, bulk actions, import preview/undo, invitation
issuance and acceptance, Companies aggregate view, stage drag semantics,
recruiter page company/drives panels, follow-up rescheduling UI, timeline
pagination, unsubscribe semantics, mobile accessibility/focus-trap verification,
outreach analytics, read receipts and report/setting workflows. Also confirm
that dashboard "Needs You" and team settings consume the same persisted
recruiter/follow-up data once live. Do not infer their closure from this route.

**Dependencies:** W01 owns promotion of staged `tpo-crm.ts` /`tpo-policy.ts`
schemas into generated registered Drizzle migrations and disposable PostgreSQL
tests; W04 owns Drive linkage and applicant/offer-derived recruiter stages;
W06 owns outbound invite email/SMS notification delivery contract. W05 owns
the invite token lifecycle and CRM UI, but must coordinate W01 identity and
W06 transport to activate invite acceptance safely.

## W47 — Drive schedule warnings and shortlist snapshot (PARTIAL)

- The TPO job workspace now shows the current persisted shortlisted-application count (or explicitly "unavailable") alongside direct links to the existing scoped shortlist page and formula-neutralized CSV. Only SUBMITTED applications with current SHORTLISTED screening and eligible same-college membership/role ownership contribute.
- The same job workspace now projects the registered venue collision service into each round scheduling control for upcoming published drives. Existing same-venue overlaps and missing scheduling data are warnings, not blockers. Truncated scans and unexpected read errors are explicitly labelled incomplete/unavailable, never "clear".
- The check covers persisted on-campus venue/duration/start facts within the next 90 days. Unsaved scheduling form edits, candidate conflicts, past/completed rounds, historical snapshots, and conflict-free certification remain unsupported.
- Both pages already have loading.tsx/error.tsx and explicit empty states. The new read-only affordances use existing Zod-validated, TPO-role/college-scoped services; no mutation route was added and existing writes retain same-origin protection.
- **Open:** exact legacy schedule-editor collision taxonomy, save-time authoritative locking, current-versus-historical shortlist semantics, browser/mobile checks and executed disposable-DB/TypeScript/ESLint acceptance.


**W54 PARTIAL (Audit):** A scoped actor-user UUID, subject-type/ID and IST date filter now shows paginated canonical PLACEMENTS activity with a formula-neutralized CSV capped at 2,000 records. Domain-history sources without consistent actors remain separate; actor directory, exact legacy coverage, executed tests and browser acceptance remain open.**Chat-2 2026-10-15 shared TPO backlog foundation — PARTIAL:** Added reusable URL filter panel and mobile fallback spreadsheet grid; bulk-action preview and stale-plan fingerprint; batch counts/next-step, eligibility decision/import/history pure models; five after-college choices, coding profile URL allowlist, calm home attention model, and associated unit tests. **Not DONE:** no persisted batch write/read services, audited undo transaction, import commit, send intents, fully mounted list/detail/settings/home/verification routes, inline grid editing, integration tests, or browser acceptance. Existing foundation is not a substitute for role/college-verified services.\n\n**Chat-2 R4 / Read principal verification — PARTIAL (2026-10-15):** TPO drive-lifecycle and applicant pipeline read services (including applicant CSV) independently require persisted active user, same-user same-college active membership and TPO role using existing `requireTpoJobActor`. Forged learner-membership PostgreSQL assertions added. Runtime PG/browser certification remains outstanding.

**Chat-10 continuation / Messaging, Engage and Team — PARTIAL (2026-10-15):** Shared adapters and batch service enforce APP_ENV and AUTH_TEST_EMAILS/AUTH_TEST_PHONES test allowlists; campaign-unsubscribe has an explicit same-origin confirmation POST guarded by existence of the DB10 suppression table. PII-free batch receipts/audit counters are STAGED only in src/modules/messaging/staged-schema.ts and docs/proposed-migrations. Engage now has evidence-based Unassigned/Not contacted filters and a source-attribution label. /tpo/team People reads existing scoped assignments; internal team conversations, campaign sends/history, TPO announcements, drive discussion/requests, registered rate-limit/audit persistence and end-to-end browser/PG verification remain open.\n\n**Chat-2 R4 / Read principal verification — PARTIAL (2026-10-15):** TPO drive-lifecycle and applicant pipeline read services (including applicant CSV) independently require persisted active user, same-user same-college active membership and TPO role using existing `requireTpoJobActor`. Forged learner-membership PostgreSQL assertions added. Runtime PG/browser certification remains outstanding.

**Chat-2 R4 / Applicant submitted window — PARTIAL (2026-10-15):** Drive-applicant list and filtered CSV now support ALL, last seven rolling days and last 30 rolling days, using persisted submitted_at UTC instants and SQL before aggregate/page/export limit. URL preserves age filter alongside stage/channel/eligibility/search/sort. Pure rolling-date boundary and isolated PG positive/tenant tests authored, not executed; browser/download/legacy acceptance remain outstanding.

**Chat-2 R4 / Applicant stable ordering — PARTIAL (2026-10-15):** Per-drive applicant list and its formula-safe CSV now share NEWEST, OLDEST and LEARNER_NAME ordering in scoped SQL, with application-ID tie-breakers so multi-page exports and views use consistent order. No screening status or employer selection is inferred. Pure Zod and isolated PG tests authored; actual browser/download verification pending.

**Chat-2 R4 / Applicant eligibility evidence filter — PARTIAL (2026-10-15):** TPO applicant stage rows, counts, pagination and applicant CSV now support persisted ELIGIBLE versus ELIGIBLE_WITH_MISSING_EVIDENCE state filters, without re-evaluating eligibility or changing application decisions. Tenant-scoped SQL, strict filters, unit and isolated PG scope assertions authored, not executed. Exact legacy review drawer and browser acceptance remain open.

**Chat-2 R4 / Applicant channel filter — PARTIAL (2026-10-15):** Per-drive applicant stage workspace and preview/download CSV now share validated INTERNAL/EXTERNAL channel filtering, combined in tenant-scoped SQL before counts/pages/export cap; pagination retains filter. This does not infer how external applications progress or share screening notes. Unit/parser and gated PG scoped read checks authored; execution/browser and legacy parity remain open.

**Chat-2 R4 / Drives deadline order — PARTIAL (2026-10-15):** Drive lifecycle now supports stable company, earliest-deadline and latest-deadline ordering in SQL with `NULLS LAST`, deterministic tie-breakers and URL-preserved sort across pages. Missing deadlines remain explicitly unknown, not interpreted as expired. Pure input and isolated PostgreSQL ordering tests authored; PG/browser acceptance outstanding.

**Chat-2 R4 / Drives employment-type filter — PARTIAL (2026-10-15):** Lifecycle list now filters registered FULL_TIME/INTERNSHIP/CONTRACT employment types in tenant-scoped SQL, combines with deadline/mode/season/search, and preserves the filter through pagination and counts. Strict Zod and isolated PG checks authored; browser/PG execution and legacy parity still outstanding.

**Chat-2 R4 / Drives work-mode filter — PARTIAL (2026-10-15):** TPO lifecycle supports server-enforced ON-SITE/REMOTE/HYBRID or ALL mode, combined with selected season/deadline/lifecycle/search in SQL before paginated rows and metric counts. The filter persists in page navigation; strict Zod and isolated PG role/tenant tests authored, not executed. Legacy view parity/browser sign-off outstanding.

**Chat-2 R4 / Drives deadline states — PARTIAL (2026-10-15):** Season-scoped drive lifecycle now filters published deadlines within seven precise days, published deadlines already passed, and jobs without recorded deadlines, using tenant-scoped SQL *before* status counts/pagination. URL/query and empty states reflect selected filter; unpublished jobs never labeled overdue. Unit query and gated PostgreSQL own/foreign/wrong-role assertions authored, unexecuted. Precise legacy columns and browser acceptance remain open.

**Chat-2 R3 / service membership hardening — PARTIAL (2026-10-15):** TPO follow-up read, export and confirmed write service now independently requires persisted ACTIVE same-user/same-college membership, persisted TPO role and ACTIVE user before accepting request-context permissions. Forged learner-membership ID, foreign college and wrong role are denied before row reads/writes. Isolated PG fixture explicitly grants and cleans test TPO role. Auth and 375px browser certification remain open.

**Chat-2 R3 / Joining next-seven-day outlook — PARTIAL (2026-10-15):** TPO joining follow-ups now offer a future calendar window using India-local date-only arithmetic (tomorrow through today+7, inclusive) for accepted pending/deferred offers. Due-now, missing-date and explicitly JOINED outcomes are excluded. Filter carries through the existing capped CSV route; unit temporal boundary and isolated PG scoped read fixtures authored, not executed. Actual communication scheduling and browser parity remain open.

**Chat-2 R3 / L? Joining missing-date follow-up — PARTIAL (2026-10-15):** Season-scoped, college-TPO joining follow-ups now expose a dedicated Missing joining date filter for accepted pending/unrecorded outcomes. The filter reuses the persisted-date unknown semantics and applies identically to authorized capped CSV; missing is never classified as overdue or joined. Pure and isolated PG mutation/read/foreign/wrong-role checks authored, not executed; browser/legacy acceptance and historical data completeness outstanding.

**Chat-2 R3 / L39 Follow-up CSV — PARTIAL (2026-10-15):** College-scoped TPO due/upcoming queue now downloads up to 500 matching tasks with exact My/Team/search/window filters, stable due ordering, CSV formula neutralization and an explicit cap warning. Contact phone/email deliberately excluded and no outbound dispatch is asserted. Pure CSV safety and gated PG wrong-role/foreign tests authored, not executed; browser/download/snapshot acceptance outstanding.

**Chat-2 R3 / L40 Safe Call and WhatsApp preparation — PARTIAL (2026-10-15):** Due queue conditionally exposes explicit user-initiated telephone and WhatsApp links from persisted normalized recruiter phone, withholds actions for unsubscribed or linked recruiters and rejects malformed schemes. No message or call is auto-sent/logged; users must record the audited outcome separately. Pure preflight tests authored, not executed. Provider/browser and legacy message templates remain open.

**Chat-2 R3 / L39 Follow-up queue pagination — PARTIAL (2026-10-15):** My/Team and due/upcoming recruiter queue now pages persisted college-scoped tasks 25 at a time with real filtered SQL total, stable due/id order and clamped page links preserving q/window/scope. A separate 200-record lead-selection cap remains disclosed. Pure parser/pagination and isolated PostgreSQL multi-page fixture authored, not executed; snapshot consistency under concurrent writes/browser review remain open.

**Chat-2 R3 / L39 Literal recruiter follow-up search — PARTIAL (2026-10-15):** Due/upcoming My/Team queue now uses a strict bounded literal recruiter/company name filter in tenant-scoped SQL before row limiting, preserving search in view URLs. SQL parameter explicitly cast to text; `%` and `_` are not wildcards. Unit URL/parser and gated PostgreSQL literal tests authored, not executed. Browser acceptance outstanding.

**Chat-2 R3 / L39 Scheduled future follow-ups — PARTIAL (2026-10-15):** TPO due queue now offers mutually exclusive Due now and Next 7 days windows, enforced in college-scoped DB query before the 200-row cap and retaining My/Team ownership scope. Empty states, explicit window semantics and future scheduled tasks use real DB09 due timestamps. Unit query and gated PostgreSQL boundary fixtures authored, not executed; longer horizon/calendar/browser parity remains open.

**Chat-2 R3 / L34 My Work vs Placement Team — PARTIAL (2026-10-15):** Due follow-ups have server-enforced owner membership filtering, via a strict TEAM/MINE query and URL tabs. Both views remain within the authenticated college; the My Work view never relies on client-only filtering of the capped list. Unit validation and isolated PG owner/role/foreign tests authored, not executed. Full Home queue semantics, browser and pagination remain open.

**Chat-2 Round 2 / Per-drive offers CSV — PARTIAL (2026-10-15):** Authenticated TPO offer register now downloads a strict status/search/joining-filtered CSV from registered, college-scoped offer facts, capped at 500 rows with explicit truncation warning and safe spreadsheet-formula neutralization. No learner email/phone, fabricated selected status, sending or letter-receipt claim. Pure-model and isolated PostgreSQL tenant/wrong-role export assertions authored, not executed. Browser download verification remains open.

**Chat-2 Round 2 / By Company report ranking — PARTIAL (2026-10-15):** TPO company report adds bounded user-selected sort (alphabetical, placed learners, accepted offers, or average accepted full-time CTC). Missing compensation values sort last, ties deterministic, and order persists across paginated URL filters. Report source, totals and scope unchanged. Unit regressions authored; independent PG/browser proof and exact legacy sort parity outstanding.

**Chat-2 Round 2 / By Company search and pagination — PARTIAL (2026-10-15):** Season/drive-scoped TPO company report now adds literal bounded company-name search with 25-row pagination, clamped page requests and preserved scoped report filters; chart totals and full-scope CSV are deliberately unchanged. Company record links match the visible slice. Unit filtering/query tests authored, browser/PG and large-cohort efficiency review outstanding.

**Chat-2 Round 2 / By Company drill-down — PARTIAL (2026-10-15):** The company performance report now exposes canonical company-ID links (first 100, with truncation disclosure) to the independently college-scoped relationship/history page. Free-text names are never treated as identity; the reporting scope stays read-only and season/drive filters continue to apply to figures. Pure dedupe/link tests authored; browser/PG acceptance remains open.

**Chat-2 Round 2 / Offer expiry evidence — PARTIAL (2026-10-15):** Offer register now displays persisted expiry and issued/responded timestamps formatted for IST, with a pure 7-day issued-offer expiry classifier (expired, due soon, open, unknown). Accepted/declined/withdrawn offers are never mislabeled expired; no email or acceptance changes occur. Unit boundary tests authored; PG/browser and exact legacy terminology remain open.

**Chat-2 Round 2 / Offer register joining filter — PARTIAL (2026-10-15):** Per-drive offers now filter by explicit accepted-offer joining evidence (pending/unrecorded, joined, deferred and did-not-join), with Zod-validated selector and preserved search/status/page links. Issued offers never masquerade as pending joins. Unit contract tests authored; runtime PG/browser and exact legacy filter parity remain open.

**Chat-2 Round 2 / Offer register search — PARTIAL (2026-10-15):** Authorized TPO offer register now supports validated 100-character literal case-insensitive learner/role search; it filters before pagination and keeps status/search across tabs and page links. All-status offer counts remain scoped to underlying registered records; no SQL wildcard interpretation or new contact disclosure. Unit regressions authored; browser/PG runtime proof and SQL-side search optimization remain open.

**Chat-2 Round 2 / Offers register pagination — PARTIAL (2026-10-15):** Per-drive TPO offer register now navigates every persisted offer version with 25-row pages, complete status counts, issue-time ordering, validated page query, status-preserving Previous/Next and stale-page clamping rather than hiding records after 200. Existing tenant read fence retained. Unit and gated PG assertions authored; runtime/browser proof and large-volume SQL pagination remain open.

**Chat-2 / Recruiter Companies → Create Draft Drive — PARTIAL (2026-10-15):** The recruiter CRM Companies table now has a draft-drive action for bounded non-empty company names. These CRM group names are expressly unverified hints: the destination preselects only a unique, exact, active company relationship in the same TPO college, and otherwise requests a manual choice with a warning. Model tests authored; full legacy board behavior and runtime PG/mobile/browser acceptance remain open.

**Chat-2 / TPO More → My Notifications — PARTIAL (2026-10-15):** More navigation now directly exposes the existing own-recipient, college-and-placement-scoped in-app notification inbox with its read action. This avoids dead /tpo/notifications navigation and reuses the registered DB-backed read-and-audit writer; nav destination tests updated. Exact legacy notification-tab and browser acceptance remain open.

**Chat-2 / Company contact-people drill-in — PARTIAL (2026-10-15):** The company People page links each persisted linked recruiter lead to its canonical TPO recruiter-detail workspace. The destination's existing college-scoped lead loader remains responsible for authorization; no unlinked contact identities or private applicant lists are exposed. Model test authored; desktop/mobile and PG acceptance remain open.

**Chat-2 / Company offer/joining timeline links — PARTIAL (2026-10-15):** Offer-issued, response and recorded-joining events now deep-link to their exact persisted TPO offer record instead of the drive only. The destination retains college/role checks. Unit regression added; legacy parity and PG/mobile/browser proof remain open.

**Chat-2 / Company hiring-history offer drill-in — PARTIAL (2026-10-15):** Each persisted company offer version can now open the canonical TPO offer detail page, preserving the exact job ID and offer ID instead of linking only to the parent drive. The destination independently authorizes its TPO college scope; no learner contact is exported. Pure-model regression authored; PG/browser acceptance remains open.

**Chat-2 / Company directory → Create Drive — PARTIAL (2026-10-15):** Every canonical, college-linked employer in the Companies directory now has a direct Create Draft Drive action; recruiter-only free-text company groups do not receive the action, because they are not proof of a canonical employer identity. The destination revalidates the active scoped relationship. Model tests authored; mobile and PG acceptance still open.

**Chat-2 / Recruiter Lead → Create Draft Drive — PARTIAL (2026-10-15):** A lead with a recorded company name now offers a draft-drive link. The target page resolves a case-insensitive exact name ONLY against active company relationships returned for this TPO's college; missing or ambiguous names produce a visible warning instead of fabricating a company link. New model tests cover unmatched/ambiguous names. Full legacy lead workflow and PG/mobile/browser acceptance remain open.

**Chat-2 / Company → Create Draft Drive — PARTIAL (2026-10-15):** Active company detail links to the quick draft creator with a canonical company ID. The creator resolves that ID only within its signed-in TPO college's active company relationships, preselecting its verified relationship ID and displaying a non-leaking warning for invalid/foreign/archived IDs; the existing same-origin, Zod-validated, audited draft writer remains authoritative. Pure-model regressions authored; end-to-end legacy wizard and runtime mobile/browser acceptance remain open.

**chat-8 L552/L556 Offers and Joining reports drill-down — PARTIAL (2026-10-14):** Persisted season/drive-filtered TPO reports now link scoped drive offer registers, joining workspaces, and company histories. UUID-gated bounded 100-link mobile-friendly lists, empty/cap disclosures, pure unit and isolated PG report success/foreign/wrong-role tests authored, not executed. Existing neutralized capped CSV unchanged. Remaining: exact legacy report columns/filter persistence, historical company season drill filters, >100 navigation pagination, PG/browser/privacy approval.\n\n**chat-8 L195 Company KPI/hiring pulse — PARTIAL (2026-10-14):** Canonical same-college company detail now shows currently published drives, distinct seasons with recorded drives, distinct accepted-offer learners, distinct explicitly joined learners and latest persisted event, with honest null recency. Pure-model and scoped isolated PG tests authored, not executed. Remaining: exact legacy KPI formula/season history, CRM recency and owner activity, browser/PG acceptance, large-company performance, frozen-oracle parity.\n\n**chat-8 L326 Offer evidence drill-in — PARTIAL (2026-10-14):** Authorized TPO-only offer detail reads registered status and joining transition histories and internal reasons in college scope. Pure model and isolated PG success/foreign/wrong-role/unmatched tests authored, not executed. Remaining: exact legacy release/selection UX, historical offer versions, missing evidence reconciliation, scale, browser/PG/privacy acceptance.\n\n**chat-8 L323 Offer register — PARTIAL (2026-10-14):** TPO-only per-drive persisted offer versions, status filters/counts and mobile rows, response date, explicit joining and learner links. Pure unit and isolated PG success/foreign/wrong-role tests authored, not executed. Remaining: exact legacy selection verification, full offer lifecycle/history, >200 pagination, browser/PG execution and privacy review.\n\n# TPO — Detailed Page Parity Spec

**W65 D / Joining Status follow-up drill-in — PARTIAL:** College-TPO-scoped season report shows ACCEPTED-offer pending/unrecorded, DEFERRED and explicit JOINED/DID_NOT_JOIN evidence, with date-only IST due semantics (missing date is unknown). Mobile follow-up rows deep-link to the existing drive joining record; strict filter and formula-neutralized capped CSV. This is read-only, no artificial learner communication/decision. 500-offer source cap and CSV truncation are disclosed; full scale pagination, employer confirmation, historical branch/season attribution, exact legacy filters, executed PG/browser and privacy review remain open.

**W65 C / Rounds and interview scheduling — PARTIAL:** Added college-TPO-scoped interview readiness view over persisted PENDING/SCHEDULED INTERVIEW rounds with bounded 1–90-day outlook, separate upcoming/live/start-passed/missing-duration/unscheduled counts and deep link to existing candidate readiness. The upstream round selector caps at 200 and its limitation is displayed. No interviewer IDs, per-candidate time slots, invitation delivery or external calendar data are fabricated. Legacy panel/slot assignment requires migrated storage; exact conflict integration, historical completed rounds, executed PG/browser tests and full calendar parity remain open.

**W65 B / Drive Applicants stage table — PARTIAL:** College-TPO-scoped per-drive application stage view now reads registered application+screening state, separates WITHDRAWN from SUBMITTED, and offers validated stage/search filtering, counts, applicant-role context and mobile rows. It excludes private screening comments and does not fabricate SELECTED. The 500-row limit is disclosed. Legacy candidate drawer, bulk mutations, external channel details, full filter/export parity, executed PG/browser acceptance and large-list pagination remain open.

**W65 A / Drives List lifecycle tabs/counts — PARTIAL:** A TPO-only mobile drive lifecycle list now filters persisted non-archived draft/published/closed jobs by college and season with deadline-within-seven-days counts and links to the canonical drive workspace. The legacy Requests tab is not fabricated from job status; source request-state reconciliation, 500-row pagination, search/export, exact legacy columns, stale-success caching, browser acceptance and executed PG tests remain outstanding.

**W64 D PARTIAL:** New TPO-only offers-expiry watchlist uses migrated ISSUED offers with non-null expiry, strict 1–90 day selector and lexically compared IST YYYY-MM-DD boundaries. Capped to 200 with honest truncation and formula-neutralized CSV. Pure-model/isolated PG success, tenant/role and status-exclusion tests authored, not executed. Browser and runtime acceptance remain open.

**W64 C PARTIAL:** Existing canonical TPO company detail already has linked contacts, drive history and offer/join timeline. It now shows college relationship trust/status/updatedAt from persisted scoped lifecycle read; a pure model and gated PostgreSQL success/foreign/wrong-role tests are authored. Historical CRM parity, executed PG/browser verification and full detail performance review remain open.
**W64 B PARTIAL:** /tpo/reports/placed-branch derives season/drive-scoped unique accepted-offer learners and explicitly confirmed JOINED learners from persisted offers/outcomes; uses current active academic enrollment for branch and exposes unmatched students as Unassigned. CSV is formula-neutralized, capped to 200 branch rows with total+notice. Unit and isolated PostgreSQL tests authored; runtime PG/browser acceptance and historically accurate branch snapshots remain open.


Legacy sidebar: Home, Placement eligibility, Engage, Drives, Team, Students, Requests, Verification, Calendar, Announcements, Reports, Messages, Settings, Audit log, Notifications. Secondary/mobile `More` also links Profile and the secondary tools.

TPO parity is a product-critical gate. A TPO page is not complete unless its operational actions, confirmations, failure states and role/tenant fences are complete.

# Home

**W62 D / L45 PARTIAL:** Season-pipeline report and neutralized, capped CSV from migrated offers/applications/joins; selected has no independent persisted final-selection source. Runtime/browser evidence outstanding.

**W63 A / optimistic token precision audit — PARTIAL:** Audited 54 `src/modules/placements/{tpo-,company-}*service.ts` files for direct `eq(table.updatedAt, date)` guards: none remain. `tpo-company-lifecycle-service.ts` on merged main already uses `date_trunc('milliseconds', column) = ISO::timestamptz`. Added isolated PostgreSQL regression fixture with SQL-default `now()` plus 123 microseconds, successful first edit, stale old-token denial and a following archive. Tests authored, not executed; never mark DONE until PG verification.

**W62 C PARTIAL:** TPO Drive Day now shows scheduled PUBLISHED rounds actually inside their persisted duration window; checked-in, explicit ABSENT no-shows, WAITING and unknown derive from the existing college-scoped roster and attendance. Unknown duration never implies live status. Browser/PG execution, refresh cadence and exact legacy hero remain open.

## Page: TPO Home / Command Center
**Legacy:** `/tpo/home`

Audited legacy areas:
- season selector/current vs past season;
- read-only warning for past season;
- setup checklist with collapse/expand and deep links;
- My Work / Placement Team toggle;
- live Drive Day hero when a round is active;
- Needs You queue, grouped repeated task types, first 8 + Show all;
- urgency types including Deadline Today, Applicants to Share, HR Messages, Drive Requests, HR Access, Requests, Slots to Confirm, Results Ready, Selections to Verify, Follow-ups;
- Follow-ups Due with Call, WhatsApp, outcome logging, Done;
- This Week agenda;
- Season headline numbers;
- Branch performance;
- Season pipeline;
- Company funnel;
- Compensation intelligence;
- stale-data alert distinct from hard failure.

Closure checklist:
- [ ] Season selection and past-season read-only state match.
- [ ] Setup checklist item set/completion/deep links match.
- [ ] Setup checklist collapse/expand behavior matches.
- [ ] My Work / Placement Team toggle changes the queue correctly.
- [ ] Drive Day hero appears only from real live operational state.
- [ ] Needs You event taxonomy matches all legacy task types.
- [ ] Grouping repeated task types and group expand/collapse matches.
- [ ] Urgency labels/tones are semantically equivalent.
- [ ] Show all/fewer behavior matches.
- [ ] Follow-ups Due list matches.
- [ ] Call and WhatsApp actions work safely.
- [ ] Follow-up outcome logging and Done action match.

**W49 PARTIAL:** A TPO-only /tpo/follow-ups queue now presents the earliest 200 college-scoped open due tasks joined to registered DB09 recruiter leads, explicitly signals truncation, and links to each contact. Confirmed Create and Record Outcome + Done actions use strict Zod and same-origin routes, college-scoped row locking, stale due-date rejection, one immutable actor-attributed recruiter activity audit per successful write, and full transactional rollback on audit denial. Missing/foreign records do not become successful completion. The due queue is reachable from the recruiter leads header; dashboard card placement, mobile legacy ordering, per-owner My Work/Team segregation, future-task visibility, exact legacy outcome taxonomy, browser and separately executed PG acceptance remain open. Existing lead-detail follow-up API behavior is preserved pending migration to audited actions.
- [ ] This Week agenda matches.
- [ ] Placement rate/registered/offers/live/ready-unplaced/employer-conversation metrics match.
- [ ] Branch performance matches.
- [ ] Season pipeline matches.
- [ ] Company funnel matches.

**W54 PARTIAL (L46/L47):** A new TPO report and formula-neutralized CSV project company applications and accepted offers with an explicit accepted-learner / distinct SUBMITTED-applicant denominator (null if absent). Separate CTC measures distinguish accepted full-time offer versions from per-learner best packages, preserving missing values as null. Historical cohort conversion, unavailable external offers, executed tests and exact legacy/browser parity remain open.
- [ ] Compensation intelligence matches.
- [ ] Every KPI/queue CTA lands on the intended filtered destination.
- [ ] Initial loading, hard error and stale-last-success states are distinct.
- [ ] Past-season mutations are blocked server-side, not only visually.
- [ ] Mobile order prioritizes Needs You as legacy does.

# Leads / CRM

## Page: Leads
**Legacy:** `/tpo/leads`

**W62 B PARTIAL:** The existing recruiter leads report now shows college-scoped actionable stage counts and contact-health: 14-day recent/quiet/no-contact, pending/due next steps and owner assignment from registered DB09 facts. Rates and latest contact are null without evidence. Pure-model and PG checks authored, not executed; legacy drill-ins and browser sign-off remain open.

### Header / health summaries
- Add Lead;
- Import;
- outreach-health strip: follow-ups due, no next step, gone quiet, unassigned;
- relationship-stage strip;
- stale-load and Companies-load error handling.

- [ ] Add Lead action is present.

**W45 PARTIAL:** The existing Add Lead modal now requires an explicit creation confirmation. Its same-origin POST uses strict nested Zod input and the migrated DB09 lead/immutable activity tables. The service commits lead and staff-attributed NOTE audit in one transaction, so audit failure rolls back creation; tenant management scope and database contact unique indexes still enforce denial/duplicates. Full legacy duplicate-confirm/open flow, import preview, browser acceptance and executed PostgreSQL tests remain open.
- [ ] Import action is present.

**W46 PARTIAL:** Recruiter Leads now exposes an import CSV dialog with a downloadable six-column template, strict quote-aware parsing and server-side Zod validation, 200-row/160,000-character caps, per-row preview, user confirmation and created/duplicate/invalid report. The authorized same-origin API derives college from the active TPO membership, then inserts accepted lead rows and each immutable actor-attributed NOTE in one database transaction; registered unique indexes reject existing contacts. Invalid/duplicate rows are skipped without overwriting contacts. Exact legacy New/Already/To-fix preview grouping, mapping of alternative source spreadsheets, browser acceptance and executed isolated PostgreSQL evidence are still outstanding. This work does not complete parity.
- [ ] Outreach-health metrics and drill-in filters match.
- [ ] Relationship-stage metrics and drill-ins match.
- [ ] stale-data vs hard-error handling matches.

### View: Table
Legacy table columns include Contact, Stage, Flags, Owner, Last activity, Next follow-up, Invite, Source, Drives, Students hired and action.

Filters/actions:
- Stage;
- Owner;
- Source;
- Follow-up due;
- Quiet;
- No next step;
- Unassigned;
- saved table search/export/filter infrastructure;
- bulk Assign Owner;
- bulk Mark Contacted;
- bulk Not Now;
- bulk Prepare WhatsApp Invites;
- bulk Invite by Email;
- row Invite/Resend;
- row Create Drive;
- row Mark Contacted;
- row Not Now.

- [ ] All columns/derived values match.
- [ ] Search/filter/export behavior matches.
- [ ] All seven filter controls/toggles match.
- [ ] Bulk Assign Owner uses review/confirmation.

**W50 PARTIAL:** DB09-backed TPO Bulk Assign Owner now offers active same-college placement staff (TPO/Faculty/College Admin) as target owners and lets operators confirm up to 100 filtered, non-joined, non-unsubscribed leads. Same-origin strict POST, TPO+college permissions, sorted row locks and an expected-current-owner check prevent stale reassignment. Every changed row and its actor-attributed immutable NOTE audit commit together; unchanged/foreign/stale/protected rows return honest per-lead outcomes. The registered DB09 principal guard validates the target under SHARE locks. Legacy owner filters, unassign semantics, large-staff pagination, exact selection/modal UX, browser verification and executed isolated PostgreSQL tests remain open.

- [ ] Bulk Mark Contacted uses review/confirmation.
- [ ] Bulk Not Now opens reason/revisit flow.

**W48 PARTIAL:** Bulk Mark Contacted and bulk Not Now are wired in the recruiter Leads table/board workspace for at most 100 filtered active, non-joined, non-unsubscribed lead IDs. Explicit confirmation and mandatory Not Now reason, optional revisit ISO date, strict discriminated Zod validation, central TPO/college-scope checks, same-origin POST, ordered row locking, expected-stage stale-state checks, and an immutable actor-attributed NOTE for every changed lead are implemented against registered DB09 tables. Results distinguish updated/unchanged/ineligible, with no false claim of manual recruiter conversion. The legacy bulk modal/board row-actions/selection ergonomics, delivery UI and full browser acceptance are still unverified. Unit and isolated PostgreSQL success/denial/rollback tests are authored but not yet executed at this SHA.
- [ ] Bulk WhatsApp invite preparation matches.
- [ ] Bulk email invite preflight/count/confirmation matches.
- [ ] Joined/unsubscribed leads are correctly skipped/disabled.
- [ ] Row Invite/Resend matches.
- [ ] Row Create Drive pre-fills company.
- [ ] Row Mark Contacted matches.
- [ ] Row Not Now matches.

**W45 PARTIAL:** Lead-detail Not Now confirmation now posts strict Zod input to the same-origin endpoint; the college-scoped writer locks the lead and atomically updates the manual stage/revisit decision and appends an immutable user NOTE audit. Identical repeats are idempotent; changed reasons/dates are audited. Row-action placement in the table, full legacy modal semantics, browser acceptance and positive/negative disposable PostgreSQL execution remain open.

### View: Board
- columns by CRM stage;
- cards;
- drag/drop or Move To stage;
- recruited terminal handling;
- overflow/collapsed indicator to Table.

- [ ] Stage columns/order match.
- [ ] Move/drag semantics match.
- [ ] Terminal/recruited restrictions match.
- [ ] Empty columns/collapsed-overflow behavior match.

### View: Companies
- Company;
- People;
- Drives;
- Students hired;
- company detail deep link.

- [ ] Company aggregate values match.
- [ ] Company search/export match.
- [ ] Detail deep link works.

**W54 PARTIAL — TPO Lead details:** Existing single-create and editable lead forms remain canonical; the edit dialog now requires explicit confirmation, and the shared strict Zod email field trims/lowercases before validation for both create and edit. The migrated DB09 create/edit writers retain duplicate contact checks and an immutable CRM activity audit. Exact legacy duplicate-open overlay, executed browser validation and owner sign-off remain open.

### Overlays
- Add Lead modal: Email/Phone, Name, Company;
- duplicate-lead confirmation with Open action;
- Not Now modal: reason + revisit date;
- Invite modal;
- Import Preview modal groups New / Already leads / To fix;
- Prepared Messages modal for WhatsApp.

- [ ] Add Lead modal fields/validation match.
- [ ] duplicate detection/open-existing behavior matches.
- [ ] Not Now modal fields/validation match.
- [ ] Invite modal workflow matches.
- [ ] Import preview/validation/commit matches. (W46 PARTIAL: preview + confirm + transaction + row report added; exact legacy group/reconciliation UX remains.)
- [ ] Prepared WhatsApp Messages workflow matches.

## Page: Lead Detail
**Legacy:** `/tpo/leads/[leadId]`

Legacy areas/actions:
- header: Invite/Resend, Create Drive, More;
- More: Not Now, Add Follow-up;
- Not Now alert;
- unsubscribed/not-hiring alert;
- Contact card + click-to-call + WhatsApp;
- Company card + company deep link + drive list;
- interaction log: note/call/email/meeting style event types + outcomes;
- Follow-ups list + Add + Done;
- Timeline;
- Invite modal;
- Add Follow-up modal;
- Not Now modal.

- [ ] Header identity/stage/company context matches.
- [ ] Invite/Resend disabled correctly for joined/unsubscribed.
- [ ] Create Drive prefill works.
- [ ] Not Now alert/state matches.
- [ ] Unsubscribed/not-hiring state prevents inappropriate outreach.
- [ ] Contact phone/email/designation fields match.
- [ ] Call/WhatsApp actions match.
- [ ] Company card and drive history match.
- [ ] Interaction-log event types/outcomes match.
- [ ] Note validation matches.
- [ ] Follow-up list matches.
- [ ] Add Follow-up modal date/note behavior matches.
- [ ] Mark Follow-up Done matches.
- [ ] Timeline event coverage/order matches.
- [ ] Not Now modal reason/revisit behavior matches.
- [ ] Loading/not-found/error states match.

## Page: Company Detail
**Legacy:** `/tpo/companies?name=...`

Legacy contract:
- Create Drive;
- Add Contact;
- company metrics: contacts/active, drives, hires, seasons hiring, latest activity;
- People;
- Hiring History;
- Documents/shared applicant lists;
- Drives;
- Timeline.

**W54 PARTIAL — Company directory create:** The Companies directory now links a confirmed Add company modal to a TPO-scoped same-origin POST. The existing canonical employer identity/college relationship transaction enforces case-insensitive name/domain reuse and conflicting-identity denial; each successful college link writes an actor activity event in the same transaction. Imported contacts, legacy Create Drive prefill, exact duplicate review, executed PG/browser verification remain open.

- [ ] Company lookup is tenant-safe and case/identity stable.
- [ ] Create Drive prefill matches.
- [ ] Add Contact opens Leads add flow with company prefill.
**W61 B PARTIAL:** Canonical Company detail links to /tpo/companies/[companyId]/manage. TPOs can edit only their own college's trusted relationship flag, archive it when no DRAFT/PUBLISHED drives remain, and restore it through the archived-company directory. All writes require a reason, confirmation, scoped principal and row-locked expected timestamp, with transaction-coupled immutable activity. The global company identity stays shared and is not editable here. Legacy global rename/domain UX, owner assignment, archived-filter scale/pagination, disposable PostgreSQL and browser proof remain open.

- [ ] Company KPI strip matches.
- [ ] People list/stage/activity/deep links match.

**W59 PARTIAL — Company contact people:** A linked recruiter-contact people page now uses the registered DB09 `placement_tpo_leads` relationship column for confirmed create/edit of a name, unique normalized college email, and designation. The signed-in TPO college owns every write; the service locks the active company relationship and existing lead, checks its optimistic timestamp, and appends an actor-attributed immutable NOTE activity within each changed transaction. Phone-only edits, full contact reconciliation, duplicate-open UX, browser and isolated PostgreSQL verification remain open. This is not an independent migrated contact directory.

**W45 PARTIAL:** A separate /tpo/companies/[companyId]/feedback page now shows internal NOTE-type CRM activity for only recruiter leads explicitly linked to the college-company relationship, with a confirmed append-only note form. The POST endpoint requires same-origin, central TPO placements.manage permission, college scope, strict Zod input and an existing scoped lead, and reuses the migrated DB09 activity writer with a relationship check under the lead row lock. A new note on a NEW lead also moves that lead to CONTACTED as the existing writer requires. Contactless/DB09-unavailable/empty-history states are explicit. This is not externally submitted company feedback, rating, sent communications, or a replacement for the legacy interaction log; positive database, private-note disclosure, browser and UX parity checks remain open.

**W41 PARTIAL:** Company detail now links to a paginated contact activity log backed by registered DB09 lead activities. College-company relationship ownership, central placements permission, event type filtering, recorded outcome and timestamp are enforced; unavailable activity storage is labeled rather than counted as zero. Raw private notes and contact addresses are not projected. Legacy document-sharing, exact history semantics, browser and positive DB verification remain open.

**W51 PARTIAL:** The company contact-log page now records confirmed internal CALL, EMAIL, WHATSAPP, MEETING or NOTE activities against explicitly linked, non-unsubscribed DB09 recruiter leads. Strict Zod prohibits SYSTEM/delivery impersonation, requires a note and an expected lead timestamp; same-origin POST and central can()/scope gate use the signed-in TPO college. Within one transaction the active company relationship is scoped and read-locked, the selected lead is row-locked and stale-checked, its updatedAt is advanced to reject duplicate replays, and exactly one immutable actor-attributed DB09 activity is inserted. This form deliberately does NOT change the lead's manual stage, send messages or certify actual calls. Authored model and gated disposable-PostgreSQL tests cover success, immutable audit, wrong role, foreign college and stale inputs. Executed tests, legacy lead-detail timeline/interaction consistency, browser acceptance and interaction-outcome taxonomy still require certification.
- [ ] Hiring History metrics/table match.
- [ ] Shared Documents history matches.
- [ ] Open Drive from document/history works.
- [ ] Drives table matches.
- [ ] Timeline matches.
- [ ] Loading/not-found/error/empty states match.

# Drives

## Page: Drives List

**Work Mode drive-list scale follow-up — PARTIAL:** Lifecycle listing now searches persisted company/drive names literally, pages 25 drives at a time, and derives complete scoped season/search counts in a repeatable-read transaction instead of truncating the first 500. Previous/Next retain season, lifecycle and search; stale page requests clamp to the last page. Pure pagination tests cover records beyond 500; isolated PG fixtures exercise two-page completeness, correct counts, literal wildcard search and role/foreign-season denials. PG runtime and desktop/mobile browser acceptance remain open, as do persisted Requests workflow and exact legacy columns/export parity.
**Legacy:** `/tpo/drives`

Legacy lifecycle tabs:
- Requests;
- Drafts;
- Live;
- Closed.

Legacy summary:
- live now;
- waiting for review;
- deadlines in next 7 days;
- companies this season.

Legacy table:
- company/role;
- mode;
- CTC;
- type;
- deadline;
- lifecycle status;
- Open;
- row More: Applicants, Rounds and schedule, Offers;
- Create Drive disabled for past season;
- stale-data alert.

- [ ] Lifecycle tabs/counts match.
- [ ] Summary metrics/drill-ins match.
- [ ] Table columns/status labels match.
- [ ] search/filter/export infrastructure matches.
- [ ] row Open matches.
- [ ] row Applicants/Rounds/Offers deep links match.
- [ ] Create Drive matches and is blocked for past season.
- [ ] empty state changes correctly by lifecycle tab.
- [ ] stale-data/hard-error/loading states match.

## Page: New Drive
**Legacy:** `/tpo/drives/new`

**W54 PARTIAL — Step 1 quick draft:** The TPO new-drive page links to /tpo/placements/new/draft, a lightweight create-draft first step using an active season, existing college company relationship, role title and description, employment/work mode, and optional explicit-IST deadline. Strict Zod, confirmation and signed-in TPO college scope guard an origin-checked POST. The existing job transaction creates one primary role and now records an immutable actor activity event; no publication occurs. Legacy multi-step wizard parity, schedule constraints, retries, runtime PG/browser acceptance and additional role/eligibility configuration are still open.

- [ ] Company/recruiter source context matches.
- [ ] Role/title/description/location/mode/category fields match.
- [ ] compensation/CTC fields match.
- [ ] application window/deadline fields match.
- [ ] eligibility rule fields match.
- [ ] role options if present match.
- [ ] rounds/template fields present in legacy match.
- [ ] preview/review before create matches.
- [ ] validation/duplicate/conflict states match.
- [ ] successful create navigates to intended workspace.
- [ ] past-season/permission restrictions are enforced.

## Page: Edit Drive

**Work Mode follow-up — PARTIAL:** Edit Drive now canonicalizes offset ISO optimistic tokens before its locked millisecond CAS, so the same version expressed in IST is accepted. Unit regression executed; integration regression authored against the existing in-test drive fixture. Typecheck, changed-file ESLint and complete unit suite are required before this push. PostgreSQL execution is blocked by sandbox account creation/user switching (apt and embedded-postgres attempted). Full legacy fields, dirty navigation, desktop/mobile browser acceptance and independently executed PG evidence remain open.

**W66-1 PARTIAL — Edit Drive:** New `/tpo/placements/jobs/[jobId]/edit` edits title, description, locations, openings and INR CTC on active-season DRAFT jobs only. TPO college-actor scope, confirmed PATCH, row lock, millisecond-safe timestamp CAS, synchronized active primary role and immutable activity audit. Unit and disposable PG tests authored, unrun. Remaining: full legacy fields, navigation dirty-state checks, browser validation and independent PG certification.

**Legacy:** `/tpo/drives/[jobId]/edit`

- [ ] Editable fields match lifecycle restrictions.
- [ ] fields locked after publish match.
- [ ] validation and unsaved-change behavior match.
- [ ] Save result refreshes drive workspace safely.
- [ ] permission/past-season/read-only behavior match.

## Page: Drive Detail
**Legacy:** `/tpo/drives/[jobId]`

### Header / mission control

**Work Mode lifecycle follow-up — PARTIAL:** Deadline extension and consequence-preview closure canonicalize equivalent offset ISO tokens before timestamp checks; closure consequence rows are defined outside JSX. Existing preview keeps applications, rounds and offers intact and rejects changed counts. Unit offset regressions executed before push; corresponding PostgreSQL success/stale/foreign/wrong-role fixtures updated, runtime blocked by sandbox non-root account setup. Exact cancellation semantics, full legacy fields and desktop/mobile browser parity remain open.
Legacy:
- job title/company/status;
- needs-attention cards;
- KPIs reachable/applied/rounds/offers;
- lifecycle stepper Request→Published→Applications→Rounds→Offers→Closed;
- partial section-load warning;
- overflow actions Edit, Export Applicants, Share with Company, Cancel where allowed.

- [ ] Header/status/lifecycle context matches.
- [ ] Needs-attention taxonomy matches.
- [ ] KPI calculations and click-through filters match.
- [ ] Lifecycle stepper matches.
- [ ] independent section failures do not zero healthy sections.
- [ ] Edit action rules match.
- [ ] Export Applicants matches.
- [ ] Share with Company flow matches.
- [ ] Cancel availability rules match.

### Tab: Overview
- [ ] overview sections/summary match.
- [ ] request state and recruiter request details match.
- [ ] publish readiness/preflight signals match.
- [ ] not-applied/reachability/attention sections match.
- [ ] activity/history matches.
- [ ] navigation into filtered Applicants/other tabs matches.

### Tab: Applicants

**Work Mode applicant scale follow-up — PARTIAL:** Pipeline search/stage filters now execute in scoped SQL with complete stage counts and 25-row pagination under one repeatable-read snapshot. Every matching application can be reached beyond the old 500-row cutoff; Previous/Next preserve filters and stale page requests clamp safely. Each page retains the review drawer and its persisted screening token. Pure pagination tests and independent read-only learner PG fixtures cover two-page completeness, withdrawal/PENDING separation, literal wildcard search, foreign college and wrong role. PG runtime, browser/navigation acceptance and full legacy candidate/history/bulk parity remain open.

**Work Mode filtered CSV — PARTIAL:** Export preview/download preserve pipeline stage and literal student/role search. Filters execute in scoped SQL before the 501-record truncation probe; newest matching rows export first, capped at 500 with a truncation row. CSV submitted dates display IST and every cell still uses canonical formula neutralization. Unit tests and PG fixtures cover wildcard escaping, null screening/PENDING, WITHDRAWN separation, filters and tenant/role denials. PostgreSQL runtime and browser download verification remain open, along with exact legacy columns and pagination beyond the cap.

**Work Mode review drawer — PARTIAL:** Pipeline rows now open a native modal drawer with persisted role, application, screening, eligibility, channel and IST submitted time. Pending/held submitted applications in published drives expose the existing confirmed shortlist/reject writer with required note and timestamp token. Escape/Close restores native dialog focus; mobile scroll is bounded. Successful saves disable repeat submission; version tokens accept equivalent ISO offsets. Pure availability and offset tests plus PG pipeline/read/write/foreign/wrong-role/stale fixtures authored; PG runtime blocked by sandbox account setup. Full candidate profile/history, exact legacy visual layout and browser acceptance remain open.
- [ ] applicant table/search/filter/stage views match.
**W66-4 PARTIAL — Candidate detail:** A focused TPO applicant detail route now shows persisted application identity, eligibility and screening stage, latest applied round outcomes and recorded offer/accepted joining evidence with a scoped college/drive/application lookup. It links from the existing applicant stage table, with mobile, loading, error and non-leaking not-found states. Does not disclose private screening notes, staged results or fabricate employer selection. Remaining: legacy side drawer/modal, richer candidate sections/filters, positive PG/browser evidence and visual parity.

**W67-1 PARTIAL — Applicant review:** A scoped applicant detail action now supports confirmed shortlist/reject with a required note, stale screening updatedAt token (millisecond-safe CAS), existing transactional screening history and immutable activity audit. Rejection note is candidate-visible; shortlist note stays internal. Only active submitted applicants in published drives can transition from pending/hold. Tests authored but not executed; full legacy drawer, decision history UI, mobile/browser proof and product consent parity remain open.
- [ ] candidate detail drawer matches.
- [ ] bulk actions match.
- [ ] external-registration/company-id state matches.
- [ ] share-applicant workflow is available.
**W67-4 PARTIAL — Drive applicant CSV:** The TPO applicant table and workspace now link to /tpo/placements/jobs/[jobId]/applications-export. College-scoped persisted application/screening/role/channel data are projected into a formula-neutralized CSV, capped at 500 rows with an explicit TRUNCATED row when more exist. No private screening notes, phone numbers or staged round outcomes are exported. The existing shared exporter is unchanged for non-TPO roles. Remaining: exact legacy columns and filters, pagination past 500, browser/PG acceptance, and reconciliation with the shared export.
- [ ] export behavior matches.
- [ ] empty/error states match.

**W46 PARTIAL:** TPO drive workspace now links to a standalone current-shortlist view and formula-neutralized CSV at /tpo/placements/jobs/[jobId]/shortlist. Only persisted SUBMITTED applications with current SHORTLISTED screening, a same-job role option, and active same-college learner membership are shown; names, roll numbers, role options and known decision times are displayed without private screening comments. Counts reflect applications, not distinct learners. Legacy drawer/filter/share/export layout, historical shortlist versions, positive DB/browser acceptance remain open.

**W61 D PARTIAL:** The operational shortlist now links to /tpo/placements/jobs/[jobId]/share-preview, a TPO-only read-only report and formula-neutralized capped CSV using exclusively the same application ID, display name and email candidate fields already returned by the authorized recruiter round workspace. Current submitted/shortlisted applications and active same-college memberships only; only published/closed drives. No send, share grant, token, file, score, phone, roll number or private comments are exposed. The CSV notes truncation above 500 rows. Actual secure sharing, user consent/disclosure snapshots, live PostgreSQL/browser acceptance and legacy sharing UI remain open.

### Tab: Rounds

**Work Mode shared venue booking — PARTIAL:** Interview rescheduling and the generic calendar scheduling writer now use one transaction-scoped college/venue advisory lock and conflict query. Unknown duration/time and over-cap venue occupancy fail closed; adjacent half-open intervals remain allowed. Generic scheduling locks the parent drive to serialize with closure and advances version timestamps by at least one millisecond. ISO offset tokens normalize and TPO meeting links accept HTTP(S) only (unsafe URL schemes intentionally rejected). Unit and PG cross-writer collision/adjacency/denial/stale fixtures authored; sandbox non-root setup still blocks PG execution. Concurrent DB certification, candidate/interviewer conflicts, full notifications and browser acceptance remain open.

**Work Mode results follow-up — PARTIAL:** Result entry now validates form data through the canonical confirmed-result Zod contract, requires HOLD rank only when selected, separates internal PASS notes from candidate-visible feedback, and disables repeated submission after save. Closed/draft/archived drives show read-only entries. Result staging locks the parent drive before round/application locks to serialize against closure. Unit tests and PG fixtures cover boundaries, optimistic identity, wrong-role denial and closed-drive state; PG execution remains blocked by sandbox account setup. Full bulk/apply UX, cross-writer concurrency certification, pagination and desktop/mobile browser verification remain open.
- [ ] round list/order/status matches.
- [ ] add/edit/schedule round actions match.

**W60 D — PARTIAL / blocked write:** A TPO-only candidate round schedule view at /tpo/placements/jobs/[jobId]/candidate-schedule shows only persisted round-level times/venues and current progression-eligible applicants, with the existing 90-day venue-collision warnings and explicit unknown/incomplete states. Candidate-specific panel assignments, interviewer IDs and individual time slots have no migrated table, so no assignment POST or fictional candidate booking is introduced. Existing round-level scheduling can still be managed from the registered calendar round writer; individual-slot persistence, concurrency exclusion, actor audit and owner-approved conflict semantics remain missing.
**W67-3 PARTIAL — Interview reschedule:** Added confirmed IST rescheduling directly to the interview readiness page for SCHEDULED INTERVIEW rounds. Transactionally locks the round, uses millisecond-safe updatedAt CAS, serializes venue-specific writes via advisory lock, refuses occupied/unknown-duration same-college campus venues and writes immutable round history plus actor-attributed activity audit. Other scheduling writers do not yet share this advisory lock; full cross-writer collision safety, individual candidate slots, interviewers, notifications, executed PG/browser and legacy overlay parity remain open.
- [ ] round kind/date/time/mode/location fields match.
**W67-2 PARTIAL — Round result entry:** The TPO drive workspace now links to a mobile round-results entry table for shortlisted submitted applicants, with per-round staged/applied counts and individual PASS/FAIL/HOLD/ABSENT input. It calls the existing origin-guarded confirmed-result route, which uses current result-ID optimistic guards, locked eligibility/progression checks, versioned result history and immutable audit. Never auto-applies. Tests authored, unrun. Remaining: bulk editing, pagination, apply/reconciliation UX, browser verification and exact legacy table parity.
- [ ] auto-apply/results state matches.
- [ ] conflict/blocker states match.

**W46 PARTIAL:** TPO placement operations now links to /tpo/placements/schedule-conflicts. It checks only upcoming non-cancelled/non-completed rounds of published drives against persisted on-campus venue, start and positive duration and reports true overlapping [start,end) intervals. Virtual rounds are excluded and missing mode/venue/duration are explicitly unassessable, not conflict-free; results cap at 1,000 rounds with a truncation warning. This is not candidate/faculty overlap detection or a schedule-edit blocker. Exact legacy scheduling conflict taxonomy, job-level warnings, runtime/browser tests remain open.
- [ ] result progression into next stages matches.

### Tab: Offers
**W70 PARTIAL — LOI kind:** Persisted LOI record kind (migration 0060 `placement_offers.kind` OFFER|LOI): the TPO Offers panel issues an Offer or a Letter of intent through the same audited, serializable issue path (version history, learner notification titled Letter of intent received, audit metadata kind), the learner offers page and the HR Offers tab label LOI records, and re-issue is idempotent only for the same kind. No LOI document/file is generated or stored; no selection list is sent externally. A dedicated selection-list send, LOI document upload via src/modules/storage and browser acceptance remain open.

- [ ] offer/selection list matches.
- [ ] candidate offer state matches.

**W49 A — PARTIAL:** TPO Offers & Joining now includes a confirmed, all-or-nothing administrative lifecycle recorder for up to 200 offer IDs. Registered offer statuses remain ISSUED/ACCEPTED/DECLINED/WITHDRAWN; EXTEND changes only expiry, and JOINED records an accepted offer's PENDING joining outcome. The pure action/transition model and row-locked transaction enforce expected status, expiry, terminal joining constraints, tenant scope, mandatory evidence/reason, and immutable actor-attributed offer/joining history and activity events. TPO-recorded ACCEPTED/DECLINED are evidence-backed administrative entries, not learner self-actions; exact permission/product consent policy, positive PostgreSQL/browser certification and parity remain open.
- [ ] verify/selection actions match.
- [ ] release/response/joining data matches.

**W60 B — PARTIAL / blocked write:** A TPO-only offer letter evidence view at /tpo/placements/jobs/[jobId]/letters displays actual persisted offer issue/response states and explicitly labels letter issued/acknowledged as unavailable. P8 has no offer-letter documents, delivery/acknowledgement timestamps, approved transition history or proof of receipt, so the proposed bulk 200-row letter-issued/acknowledged mutation is not implementable safely without a registered table and owner-approved transition rules. This does not downgrade existing offer lifecycle DONE checks or claim offer response equals letter acknowledgement.
- [ ] candidate detail deep link/drawer matches.

**W45 PARTIAL:** Each TPO drive workspace now links to /tpo/placements/jobs/[jobId]/joining, a college-scoped read of persisted ACCEPTED offer joining states (PENDING/unrecorded, JOINED, DEFERRED, DID_NOT_JOIN) with per-offer confirmable updates through the existing same-origin PUT joining API, strict existing joining-outcome Zod rules, and correction-reason/history enforcement. Issued/declined/withdrawn offers do not show update forms; unrecorded outcomes are not called confirmed joins. This is not an offer letter/document tracker. Bulk joining updates, audit of sensitive reasons, positive DB/browser testing and exact legacy joining workflow remain open.

**W44 PARTIAL:** The existing Offers & Joining workspace now exposes a TPO-only, explicitly confirmed bulk withdrawal control for up to 50 issued/accepted persisted offers. A required reason is recorded by the existing single-offer audit/history transition. Already-withdrawn, stale, foreign-job, declined and recorded-joining offers are not treated as withdrawable. This is withdrawal only: learner ACCEPT/DECLINE remains self-service, and acceptance/response/joining status is never synthesized. Full legacy bulk selection/modal UX, executed positive concurrency certification and runtime/browser evidence remain open. An expected-status check now runs under the existing offer row lock, rejecting a stale selection instead of withdrawing a newly accepted offer.

### Tab: Drive Day
- [ ] active/completed round selector matches.
- [ ] Drive Day operations reachable from job.
- [ ] coordinator permissions match.
- [ ] attendance/results operational actions match.
- [ ] empty/no-round states match.

### Request/lifecycle overlays
Legacy includes:
- Reject request modal;
- Send Back request modal;
- Publish preview modal;
- Extend application deadline modal;
- Cancel Drive modal with reason;
- close/complete consequences where applicable;
- recruiter Messages drawer.

- [ ] Reject request modal/reason/consequence matches.
- [ ] Send Back modal/reason matches.
- [ ] Publish Preview modal checks and consequences match.
**W66-2 PARTIAL — Extend Deadline:** A confirmed TPO published-drive extension at /tpo/placements/jobs/[jobId]/extend-deadline updates only persisted applicationDeadline for an active season, requires a later future IST deadline, row-locked expectedUpdatedAt with millisecond-safe SQL CAS, and immutable actor audit. Unit/PG tests authored, unexecuted. Legacy overlay placement, borrower notifications, browser/race validation remain open.

- [ ] Extend Deadline modal validation matches.
**W66-3 PARTIAL — Close consequence preview:** A TPO-only drive close-preview page shows persisted applications, rounds, and offer versions. A confirmed same-origin POST checks signed-in college/actor, active season, PUBLISHED state, millisecond-safe job token and unchanged preview counts under a job lock, then closes and writes immutable audit. This is CLOSE only: the job enum has no CANCELLED state. Remaining: legacy CANCEL semantics, cross-writer serialization, consequence notifications, browser checks and executed PostgreSQL evidence.

**W69 PARTIAL — TPO applicant notes:** TPO-only private append-only notes on the applicant detail page (`/tpo/placements/jobs/[jobId]/applicants/[applicationId]`), persisted in `placement_application_notes` (migration 0059), stale-token protected and audited without text; recruiter notes are never shown there. Browser acceptance remains open.

**W66-4 PARTIAL — Cancel drive with consequence preview:** `/tpo/placements/jobs/[jobId]/cancel-preview` (TPO, published drive, active season) shows submitted applications, open rounds that will be cancelled, issued and accepted offers. A confirmed same-origin POST with a 10-character audited reason, job-lock millisecond token and unchanged-impact check closes the drive, cancels PENDING/SCHEDULED rounds with CANCELLED round events and writes an immutable PLACEMENTS_TPO_DRIVE_CANCELLED audit. Accepted offers block cancellation. There is no CANCELLED job state in the schema, so the drive reads as CLOSED and the cancellation is identifiable only in the audit. Issued offers and applications are retained. PG tests executed on a disposable DB; browser acceptance, learner notification and offer withdrawal remain open.

- [ ] Cancel Drive modal reason validation and downstream consequence preview match.
- [ ] Close/complete flow is accounted for.

**W60 C — PARTIAL:** A signed-in TPO drive close-out page at /tpo/placements/jobs/[jobId]/closeout reports persisted job-scoped distinct applicants, currently submitted and shortlisted learners, distinct offered/accepted/joined learners and offer versions, with the same pure evaluator driving a formula-neutralized CSV. Independent selected count remains null because PASS results and offers are not canonical final selection evidence; absent external/historical facts are not fabricated. Final closed-drive snapshot, selection owner semantics, positive PostgreSQL/browser proof and exact legacy reconciliation remain open.

**W49 B — PARTIAL:** The TPO drive workspace now has a separate confirmed publish/close/reopen control using only registered season, company-relationship, active role-option, evaluative-round, eligibility-policy, applied result and accepted-offer records. Publish/reopen refuse unready or expired-deadline drives; reopen also refuses any applied round result or accepted offer. CLOSE remains a distinct step from completing rounds. Status and blockers are rechecked under a job row lock with an optimistic expected status, and every successful change appends a college-scoped actor audit. The existing generic non-TPO lifecycle endpoint is preserved; uniform legacy behavior, browser/positive PostgreSQL execution and immutable historical snapshots remain open.
- [ ] Messages drawer matches recruiter conversation workflow.

## Page: Global Drive Day
**Legacy:** `/tpo/drive-day`

- [ ] today's/current rounds list matches.
- [ ] company/job/round/context matches.
- [ ] coordinator-scoped access matches.
- [ ] status/attendance/result readiness cues match.
- [ ] round click opens focused Drive Day.

## Page: Round Drive Day
**Legacy:** `/tpo/drive-day/[roundId]`

- [ ] round roster matches.
- [ ] attendance/check-in actions match.

**W58 PARTIAL:** TPO round roster now offers confirmed PRESENT check-in and explicit ABSENT no-show actions only on the currently scheduled India-local round date, for progression-eligible candidates. Strict Zod and same-origin POST, centralized college permission, row-locked expected-status checks, idempotent repeats and transactional immutable activity audit apply. IN_INTERVIEW/DONE marks cannot be downgraded. Bulk marking, final legacy UX, positive PostgreSQL and browser acceptance remain open.
- [ ] result/outcome capture matches.
- [ ] bulk result/attendance actions match.

**W52 PARTIAL:** The existing TPO-only round page now supports per-learner, confirmed result staging for PASS (progression), FAIL (not selected), HOLD (ranked waitlist) and ABSENT, and confirmation-based application of a STAGED result only after the evaluative round is COMPLETED. A new same-origin POST adapter uses strict Zod, central TPO placement-management scope and the existing result service; the confirmed path checks the expected current result identity under row locks and inserts a scoped immutable PLACEMENTS result-staged audit event in the same transaction as the durable STAGED version. The existing apply path already records a separate immutable result-applied activity. Learner-facing messages are mandatory for non-PASS outcomes. This is not an employer offer/hire selection and does not fabricate a SELECTED result status. Bulk APPLY, attendance bulk operations, exact legacy modal/column parity, mixed-role routing, privacy/browser acceptance and independently executed PostgreSQL evidence remain OPEN.

**W53 PARTIAL:** The TPO round roster now offers confirmed bulk **initial PASS/FAIL staging** for up to 25 eligible applicants without a current result. Strict Zod rejects duplicate application IDs and requires learner-facing messages for FAIL. Every row delegates to the existing scoped, row-locked transaction and immutable result-staged actor audit; the batch is explicitly **not atomic** and reports staged/ineligible per row. Operators still apply final results separately after round completion. Unknown/foreign rounds fail before any mutation, and stale row snapshots do not overwrite current results. Positive disposable PostgreSQL test execution, exact legacy bulk selection UX, bulk APPLY, HOLD/ABSENT mass marking, browser acceptance and mixed-role routing remain open.

**W41 PARTIAL:** The TPO round overview now provides an authorized, formula-safe CSV export of its current persisted attendance roster. It includes per-learner recorded attendance and only APPLIED result outcomes, without inventing missing marks or exporting recruiter contact details. Bulk attendance/result mutations, legacy CSV columns, completed-round historical snapshots and browser/DB acceptance remain open.

**W43 PARTIAL:** The round overview also links to a no-show reconciliation page that counts only persisted ABSENT marks among progression-eligible applicants; WAITING/unmarked and unrecognized statuses remain separately reported and are not inferred as absences. It flags non-completed rounds as a live snapshot. Historical immutable attendance snapshots, bulk corrections, exact legacy no-show taxonomy, positive PostgreSQL and browser acceptance remain open.

**W44 PARTIAL:** The existing no-show report now downloads a dedicated formula-safe CSV of explicit ABSENT rows only, using the existing college-scoped round roster service and same report CSV encoder. Headers-only output is used when no explicit absences exist; WAITING/unmarked learners are excluded instead of being labelled absent. Historical snapshot exports, full legacy format and executed database/browser verification remain open.
- [ ] progress/summary counts match.
- [ ] coordinator vs TPO permission differences match.
- [ ] completion confirmation matches.
- [ ] loading/not-found/error states match.

# Students

## Page: Students
**Legacy:** `/tpo/students`

### Intelligence summary
Legacy metrics:
- ready but not applying;
- needs readiness support;
- not registered;
- already applying;
- placed / placement pool;
- branch placement grid.

- [ ] All summary counts use correct season/registration denominator.
- [ ] metric click filters roster correctly.
- [ ] branch performance grid matches.

### Tab: Students roster
Legacy filters:
- view segmented filters;
- branch;
- company;
- minimum journey depth;
- outcome;
- shortcut filters "Rejected at interview or later" and "Reached final round".

Legacy columns:
- student identity;
- batch/branch;
- CGPA/backlogs;
- readiness;
- registration;
- best so far;
- applications;
- offers;
- placement status.

- [ ] View filters/counts match.
- [ ] Branch filter matches.
- [ ] Journey/company/depth/outcome filters match.
- [ ] shortcut filters match.
- [ ] table columns/derived journey values match.
- [ ] search/export/saved table behavior matches.

**W43 PARTIAL:** Each Students roster row now links to an authenticated, college-scoped placement history for that learner. The detail includes paginated applications across persisted seasons, applied round outcomes, offer versions, package evidence and explicit joining results. Unknown/foreign membership IDs reveal no data; registration choices and external placement offers are not inferred. Offer-version counts are not unique placed-student metrics. Exact legacy student drawer, academic/eligibility drill-ins, browser and positive PostgreSQL acceptance remain open.

### Bulk actions
- Add to Drive;
- Nudge;
- Assign Prep;
- Mark Higher Studies;
- Debar.

- [ ] Add to Drive modal matches.

**W54 PARTIAL — Students list bulk add:** The TPO Students roster now offers a current-page learner selection (up to 100 displayed learners), published ACTIVE-season internal drive selector and active role dropdown. Its confirmed POST reuses the established bulk-add service and strict 200-ID Zod contract, which checks exact college membership, academic eligibility, participation, deadlines and existing applications per learner and audits successful insertions. Per-learner results explain added/already-added/ineligible. Selections do not persist across roster page navigation; exact legacy bulk modal, multi-page selection, positive PG/browser verification remain open.
- [ ] Nudge text + confirmation matches.
- [ ] Prepared WhatsApp messages workflow matches.
- [ ] Assign Prep modal/course selection matches.
- [ ] Higher Studies confirmation/consequence matches.
- [ ] Debar modal/reason/consequence matches.

**W42 — PARTIAL (membership-level restriction, not legacy debarment lifecycle):** The learner's TPO participation page offers confirmed Debar with mandatory reason and confirmed Remove-debar for only Debar-tagged direct INELIGIBLE decisions, using the existing same-origin-guarded participation API, central college permissions, optimistic snapshot and transactional activity event. Learner placement access and the application writer enforce the learner override; clearing it restores inherited class/batch eligibility and may leave the learner unable to apply. There are no timed or drive-count debarments, restore-previous-override history, roster bulk action or legacy modal parity. Requires disposable PostgreSQL and browser verification.

### Academic import
- Import Academic Details;
- preview groups matched/unmatched;
- commit/update.

- [ ] import parser/columns match.
- [ ] preview counts/groups match.
- [ ] unmatched rows are actionable/explainable.
- [ ] commit is tenant/season safe.

### Tab: Requests
- [ ] Student Requests tab matches global request panel.
- [ ] counts/status/actions match.

## Page: Requests
**Legacy:** `/tpo/requests`

- [ ] all student exception/change request types are included.
- [ ] status/age/student/job filters match.
- [ ] request detail/context matches.
- [ ] approve/reject/send-back decisions match.
- [ ] reason/comment requirements match.
- [ ] decision consequences update authoritative learner/job state.
- [ ] empty/loading/error states match.

**W58 A — PARTIAL:** The college-scoped TPO Requests queue now exposes confirmed APPROVE/REJECT decisions for pending persisted request types (application withdrawal, round reschedule, offer extension), with required rejection note and an expected-updated-at optimistic token verified under a row lock. It reuses the authoritative request transaction/effect and immutable placement activity audit. CANCEL stays learner-controlled; send-back has no migrated state. Legacy request detail and reason taxonomy, executed isolated PostgreSQL confirmation and browser parity remain open.

# Calendar

## Page: TPO Calendar
**Legacy:** `/tpo/calendar`

Legacy modes:
- Week;
- Month;
- Agenda.

Legacy event types include rounds, talks, deadlines and recruiter follow-ups.

- [ ] Week mode matches.
- [ ] Month mode matches.
- [ ] Agenda mode matches.
- [ ] date range/navigation matches.
- [ ] company filter matches.
- [ ] event-type filters match.
- [ ] summary metrics for rounds/deadlines/follow-ups/next match.
- [ ] event popover/detail matches.
- [ ] event deep links to drive/lead match.
- [ ] create Follow-up modal matches.
- [ ] move Follow-up modal matches.

**W58 B — PARTIAL:** The TPO calendar links to a managed round scheduling page for existing migrated pending/scheduled drive rounds. A confirmed same-origin write uses IST wall-clock conversion, registered round action transactions/events, strict college-scoped permission, updated-at optimistic checks and conservative same-venue overlap assessment (unassessable venue durations are blocked). Creation means scheduling an existing pending round; it does not create a new arbitrary event or round. Cross-writer venue-lock serialization, room resources, owner confirmation of exact legacy UX, PostgreSQL/browser acceptance and comprehensive calendar modes remain open.

**W61 C PARTIAL:** TPO Calendar now links to /tpo/calendar/export for a validated maximum 93-day IST-date range and downloadable current future-round CSV from registered P6B rounds. Source is scheduled PENDING/SCHEDULED rounds on published same-college drives only; CSV formula cells are neutralized, private meeting links are excluded, the result caps at 500 and explicitly flags truncation. No ICS or sync is claimed. Exact legacy column/timezone UX, positive PostgreSQL/browser evidence and full calendar parity remain open.

**W38 PARTIAL:** The TPO calendar now offers a small create form for existing CRM leads and an IST reschedule form on each open follow-up event card, gated by the DB09 CRM write readiness flag. Same-origin POST/PATCH routes derive the college exclusively from the active TPO membership, validate payloads, and reuse the existing centralized placements scope and CRM follow-up mutations. Completion remains terminal. The legacy create/move modal UX, optimistic concurrency (no persisted follow-up version/update timestamp), browser acceptance, and executed disposable PostgreSQL tests are still open.
- [ ] empty/loading/partial-failure states match.
- [ ] timezone handling is verified.

# Reports

## Page: Reports Gallery
**Legacy:** `/tpo/reports`

Groups:
- Overview and performance;
- Student outcomes;
- Relationships and compliance.

Headline metrics:
- placement rate;
- students placed;
- offers;
- students accepted.

- [ ] Group headings/descriptions match.
- [ ] headline metrics match.
- [ ] report cards and help text match.
- [ ] management-view CTA opens Placement Summary.

## Report: Placement Summary
- [ ] table/data columns match.
- [ ] unique placed vs total offers semantics match.
- [ ] summary KPIs match.
- [ ] filters match.
- [ ] export matches.
- [ ] presentation mode matches.

## Report: By Branch
- [ ] branch metrics/table/chart match.
- [ ] drill-in/filter behavior matches.
- [ ] export matches.

**W49 C — PARTIAL:** A dedicated /tpo/reports/branch-season drill-in now reports unique application-holding learners, distinct members with currently ACCEPTED offers, accepted offer versions, and a clearly labeled accepted-applicants/applicants rate for one registered season. The placement-pool denominator uses only persisted, active-cohort PLACEMENTS choices if that relation is actually migrated; otherwise it and its official placement rate remain null. Ambiguous/missing current branch attribution is explicit rather than silently assigned. The same authorized model drives a formula-neutralized CSV. Original placement-time cohort/branch history, registration snapshot semantics, external offers, UI acceptance and executed PostgreSQL evidence remain open.

## Report: By Company
- [ ] company hires/average/highest package metrics match.
- [ ] drill-in/filter behavior matches.
- [ ] export matches.

## Report: CTC
- [ ] highest/average/median semantics match best-offer logic.
- [ ] internship exclusion matches.
- [ ] chart/table/export match.

## Report: Unplaced Students
- [ ] placement-pool definition matches.
- [ ] filters/table/export match.
- [ ] drill-in to student context matches.

## Report: Offers and Acceptance
- [ ] released/accepted/declined/expired metrics by company match.
- [ ] filters/table/export match.

## Report: Joining Status
- [ ] joined/deferred/did-not-join among accepted offers matches.
- [ ] filters/table/export match.

## Report: Failure Reasons
- [ ] rejection/no-show reason taxonomy matches.
- [ ] round/company/branch filters match.
- [ ] table/chart/export match.

## Report: Leads
- [ ] invited/joined/hired recruiter funnel matches CRM data.
- [ ] filters/table/export match.

## Report: Accreditation Export
- [ ] NAAC/NIRF column set matches.
- [ ] completeness preflight matches.
- [ ] blocking/warning missing-data list matches.
- [ ] CSV export matches.

## Shared report-detail behavior
Legacy report detail has Saved Filters, Mode, Type, dynamic table columns, chart, presentation view, export and report totals.

- [ ] saved filter behavior is implemented or explicitly redesigned.
- [ ] Mode filter matches.
- [ ] Category/Type filter matches.
- [ ] dynamic table and null rendering match.
- [ ] chart generation matches supported reports.
- [ ] presentation view matches.
- [ ] exports are audit-safe.
- [ ] loading/error/empty states match.

# Messages

## Page: Messages
**Legacy:** `/tpo/messages`

- [ ] conversation list matches.
- [ ] recruiter/company/drive context is visible.
- [ ] unread/last-message ordering matches.
- [ ] open thread behavior matches.
- [ ] send message/reply behavior matches.
- [ ] drive-context deep links match.
- [ ] failed-send/retry state matches.
- [ ] empty/loading/error states match.
- [ ] tenant boundaries are enforced.

# Settings

## Page: Settings shell
**Legacy:** `/tpo/settings`

Groups:
- Season and policy;
- People;
- Communication;
- Sharing and identity.

Legacy behavior includes unsaved-change warning when moving between sections or unloading.

- [ ] section navigation/grouping matches.
- [ ] active section URL/query state matches.
- [ ] unsaved-change indicator matches.
- [ ] leave-without-saving confirmation matches.
- [ ] browser unload protection matches where appropriate.

## Settings: Placement Season
- [ ] list multiple seasons.
- [ ] current/registration-open status.
- [ ] Edit Season modal.
- [ ] name/date range/registration deadline.
- [ ] blocked academic dates list.
- [ ] Start New Season modal.
- [ ] warning for earlier-season open drives.
- [ ] Open Registration confirmation and consequence.

**W56 PARTIAL:** TPO-only confirmed season creation reuses the established locked P9 season writer and immutable activity; editing an ACTIVE season now requires an unchanged updatedAt snapshot, validates ISO calendar dates/date order and unique college season code, and stores before/after actor audit in the same transaction. The Placement Rules page now offers confirmed, version-checked writes to registered DB09 college offer rules with immutable before/after audit. No registration-open state, learner registration deadline, historical closed-season editing, full modal/dirty-state behavior, browser or executed disposable-PostgreSQL acceptance is claimed.

## Settings: Placement Rules
- [ ] placed-count trigger setting matches.
- [ ] offer limits/uplift/response rules present in legacy match.
- [ ] validation and save behavior match.
- [ ] dirty-state protection matches.

## Settings: Placement Team
- [ ] placement-team member list matches.
- [ ] Add to Team modal with faculty search.
- [ ] TPO Admin / Faculty Coordinator role selection.
- [ ] removal impact lookup.
- [ ] reassign-and-remove modal.
- [ ] student coordinators list.
- [ ] Assign Student Coordinator modal with student + drive.
- [ ] remove coordinator confirmation.

## Settings: Recruiters
- [ ] recruiters with college access list matches.
- [ ] Active/Removed state matches.
- [ ] revoke access confirmation and immediate effect match.

**W57 PARTIAL:** TPO Recruiter Settings now includes a confirmed grant form for existing active users and active linked college-company relationships, plus row-level confirmed revocation. Registered recruiter profiles/grants are locked and checked for an active duplicate; revocation requires the exact unchanged grant updatedAt. Every changed grant and revocation inserts immutable actor activity inside its transaction. Email is used only as an admin-supplied lookup, not disclosed in the historical roster. Invitation, brand-new user provisioning, exact legacy modal UX, executed PostgreSQL/browser evidence and permission-session propagation remain open.

## Settings: Trusted Companies
- [ ] trusted domains list matches.
- [ ] add/normalize domain behavior matches.
- [ ] remove trust confirmation matches.

**W55 PARTIAL — college-company relationship trust only:** The Trusted Companies page now offers a TPO-only, explicitly confirmed, reason-required `isTrusted` toggle for each ACTIVE college-company relationship in registered P1 data. Strict Zod rejects duplicate/no-op input; a locked expected-state check denies stale writes. Each successful change inserts a PLACEMENTS activity event with actor and before/after trust flags in the same transaction. This is NOT the unmigrated recruiter-domain allowlist and does not claim grant/approval-policy parity. Real PostgreSQL and browser certification remain open.
- [ ] trust effect on request approval matches.

## Settings: Templates
- [ ] reusable communication templates match.
- [ ] save/edit fields and validation match.
- [ ] mail-provider/status dependencies match.

## Settings: Student Notices
- [ ] optional notices controls match.
- [ ] Prep & Readiness configuration matches.
- [ ] prep course multi-select matches.
- [ ] email-template readiness/status display matches.

## Settings: My Notifications
- [ ] personal notification preference options match.
- [ ] preferences are user-specific, not college-wide.
- [ ] save/error state matches.

**W61 A BLOCKED:** placement_tpo_user_preferences is declared only in an unregistered staged schema; no CREATE TABLE is in the current registered Drizzle migration journal. The existing read-only page correctly shows UNAVAILABLE. Persisted user preference writes and audit cannot be enabled without migration promotion and owner disposition. No fake save state was added.

## Settings: What Companies See
- [ ] field/data-sharing switches match.
- [ ] internal placement signals remain private where legacy does.
- [ ] changes affect recruiter/company preview consistently.

## Settings: Branding
- [ ] recruiter invite/share/email branding fields match.
- [ ] preview behavior matches if present.
- [ ] storage-backed assets remain explicit BLOCKED until live.

# Audit / Notifications / Profile / More

## Page: TPO Audit log
**Legacy:** `/tpo/audit`

Legacy summary includes:
- recent events;
- people and systems;
- shares/downloads;
- settings changes;
- latest activity.

- [ ] summary metrics match.
- [ ] event/entity/actor/date filters match.
- [ ] share/download events match.
- [ ] settings-change events match.
- [ ] detail text/context matches.
- [ ] search/pagination/export if present are accounted for.
- [ ] empty/loading/error/stale states match.

## Page: TPO Notifications
**Legacy:** `/tpo/notifications`

Legacy:
- All / Unread segmented filter;
- Mark all as read;
- opening marks notification read;
- groups Today / Yesterday / This week / Earlier;
- linked notifications;
- stale refresh alert.

**W68 PARTIAL — TPO Notifications page:** `/tpo/notifications` (linked from TPO More) lists only the signed-in TPO's own in-app notifications for their persisted current college, with All/Unread filter, unread count, cursor-paged Older link, Today/Yesterday/This week/Earlier grouping (shared NotificationList), linked notifications, per-item mark-read and confirmed Mark all as read. Services re-verify the live ACTIVE membership + TPO role + `placements.manage`; reads are idempotent and audit as identity.tpo_notification.acknowledged. Foreign-college, other-user, wrong-role and suspended access are denied without leaking. Loading and error states included. Browser acceptance, exact event-type coverage and sidebar placement remain open.

- [ ] All/Unread counts/filter match.
- [ ] Mark all as read matches.
- [ ] opening individual notification marks read.
- [ ] time grouping matches.
- [ ] notification event coverage matches placement domain.
- [ ] deep links match.
- [ ] loading/empty/error/stale states match.

## Page: TPO Profile
Shared Faculty profile schema.

- [ ] User summary/profile image/completeness matches.
- [ ] Resume matches.
- [ ] Contacts/social/address/personal/identity matches.
- [ ] Aadhaar/PAN storage flow accounted for.
- [ ] Experience/education/skills/certifications/languages match.
- [ ] Publications/awards/metadata match.
- [ ] Add/edit/delete dialogs/states match.
- [ ] partial-section failure tolerance matches.
- [ ] loading/retry behavior matches.

## Page: More
**Legacy:** `/tpo/more`

Groups:
- Work: Requests, Calendar, Messages;
- Insights: Reports;
- Account: Notifications, Settings, Audit log, Profile.

- [ ] All legacy destinations appear.
- [ ] labels/descriptions match intent.
- [ ] keyboard activation works.
- [ ] mobile navigation uses this page where legacy does.
- [ ] no secondary tool becomes unreachable on small screens.


## W05 CRM implementation checkpoint — 2026-10-10 (not final parity)

**Verified source heads:** `lms/prod-2026@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`,
`lms2-fe/prod-2026@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.
Current source routes were renamed to `/tpo/recruiters` and
`/tpo/recruiters/[recruiterLeadId]` (historical `/tpo/leads` path is a
stale matrix alias). The new vNext routes use UUID `leadId` values.

Implemented **code only**, behind `DB09_TPO_API_READY=DB09_VERIFIED`:
- table (manual-stage only), basic searchable Board, college-scoped add form and
  preflight duplicate lookup; server-side DB uniqueness remains the authority;
- recruiter detail, safe contact editing without implicit contact deletion,
  activity logging/timeline, follow-ups and done action, Not Now;
- abort-on-navigation to prevent stale detail display, hard error / retry states,
  phone/email actions, basic responsive layout, protected server account route;
- W05 unit schema tests + **opt-in** PostgreSQL scenarios for contacts, concurrency
  and cross-college denial, and route gate assertions.

**Do not check off the above parity checkboxes yet**: database migrations are
not registered by W01, API responds HTTP 503, no browser/device evidence and
no executed typecheck/DB tests. This is a PARTIAL source implementation, not
a working release. Remaining legacy `/tpo/recruiters` gaps include derived
Invited/Joined/Drive Planned/Recruited stages, column/owner/source/follow-up
and quiet filters, saved views, bulk actions, import preview/undo, invitation
issuance and acceptance, Companies aggregate view, stage drag semantics,
recruiter page company/drives panels, follow-up rescheduling UI, timeline
pagination, unsubscribe semantics, mobile accessibility/focus-trap verification,
outreach analytics, read receipts and report/setting workflows. Also confirm
that dashboard "Needs You" and team settings consume the same persisted
recruiter/follow-up data once live. Do not infer their closure from this route.

**Dependencies:** W01 owns promotion of staged `tpo-crm.ts` /`tpo-policy.ts`
schemas into generated registered Drizzle migrations and disposable PostgreSQL
tests; W04 owns Drive linkage and applicant/offer-derived recruiter stages;
W06 owns outbound invite email/SMS notification delivery contract. W05 owns
the invite token lifecycle and CRM UI, but must coordinate W01 identity and
W06 transport to activate invite acceptance safely.

## W47 — Drive schedule warnings and shortlist snapshot (PARTIAL)

- The TPO job workspace now shows the current persisted shortlisted-application count (or explicitly "unavailable") alongside direct links to the existing scoped shortlist page and formula-neutralized CSV. Only SUBMITTED applications with current SHORTLISTED screening and eligible same-college membership/role ownership contribute.
- The same job workspace now projects the registered venue collision service into each round scheduling control for upcoming published drives. Existing same-venue overlaps and missing scheduling data are warnings, not blockers. Truncated scans and unexpected read errors are explicitly labelled incomplete/unavailable, never "clear".
- The check covers persisted on-campus venue/duration/start facts within the next 90 days. Unsaved scheduling form edits, candidate conflicts, past/completed rounds, historical snapshots, and conflict-free certification remain unsupported.
- Both pages already have loading.tsx/error.tsx and explicit empty states. The new read-only affordances use existing Zod-validated, TPO-role/college-scoped services; no mutation route was added and existing writes retain same-origin protection.
- **Open:** exact legacy schedule-editor collision taxonomy, save-time authoritative locking, current-versus-historical shortlist semantics, browser/mobile checks and executed disposable-DB/TypeScript/ESLint acceptance.


**W54 PARTIAL (Audit):** A scoped actor-user UUID, subject-type/ID and IST date filter now shows paginated canonical PLACEMENTS activity with a formula-neutralized CSV capped at 2,000 records. Domain-history sources without consistent actors remain separate; actor directory, exact legacy coverage, executed tests and browser acceptance remain open.

## 2026-10-15 source reconciliation against main ea1172d2

The current main/lane comparison and safe integration targets are recorded in the final reconciliation section of `docs/planning/account-surface-parity.md`; it is a source snapshot, not another tracker or runtime acceptance. Existing checkbox evidence is preserved. No required page/family becomes closed from this review.

Main already contains migration 0064, TPO batch list/student/rules/history readers, decisions/undo, verification read gating and configuration read pages. Thirteen stale MISSING labels across section 8 were changed to PARTIAL; no TPO detailed checkbox was closed. Job-type editor/APIs, blocked-date writes and import/lifecycle improvements are already authored on chat-2, while announcement read/write/lifecycle, campaign history/detail/export and Team read improvements are authored on chat-10. Review those exact sampled heads in the matrix before assigning duplicate work. TPO verification currently disables review, and configuration reads do not imply editors or scheduling consumers. Registration does not certify clean replay, drift or runtime acceptance. DEV-ONLY source still needs the specified oracle decision.

**Chat-2 2026-10-15 / Batch directory sort — PARTIAL:** /tpo/batches now supports strictly validated, URL-selected name A–Z/Z–A ordering over the authorized college batch result with immutable copy and deterministic ID tie-break. Independent browser/PG and full legacy batch directory contract remain open.

**Chat-2 2026-10-15 / Batch program filter — PARTIAL:** A strictly bounded program query now filters only the already-authorized college cohort names; the selector comes from that college's persisted programs. No academic classifications or placement eligibility are inferred; full legacy/browsers remain open.

**Chat-2 2026-10-15 / Batch department filter — PARTIAL:** Added independent URL-validated department selection over authorized cohorts; program, lifecycle, search and name-sort filters compose without mutating the source roster. Browser/large-list legacy parity is still open.

**Chat-2 2026-10-15 / Batch deadline filter — PARTIAL:** Eligible invited, unfinished batches can be filtered by exact upcoming seven-day, past-due or not-recorded deadline; unregistered lifecycle storage explicitly disables the filter. This does not infer invitations, reminder delivery, or timezone/date-only policy.

**Chat-2 2026-10-15 / Deadline sort — PARTIAL:** Batch directory sorting now orders recorded deadline timestamps asc/desc with unknown deadlines last and deterministic secondary name/ID order. Missing dates are not replaced with invented ones; browser/legacy acceptance remains open.

**Chat-2 2026-10-15 / Batch directory paging — PARTIAL:** Validated 12/24/48-item page sizes, nonnegative bounded page indexes, preserved URL filter navigation and out-of-range recovery over the already-authorized cohort snapshot. It remains a bounded UI slice, not database-level pagination; larger-cohort performance and browser acceptance remain open.

**Chat-2 2026-10-15 / Batch deadline presentation — PARTIAL:** Each cohort card now displays a real registered lifecycle deadline formatted in IST, an explicit no-deadline status, or unavailable when lifecycle storage cannot be read. No reminder, eligibility or consent is inferred.

**Chat-2 2026-10-15 / Batch next-action navigation — PARTIAL:** Per-batch primary links now use actual planning/invited/finished lifecycle facts to label the appropriate follow-up; all navigate to the existing authorized batch workspace. Unknown lifecycle state remains Review cohort, never an implied sent invitation.

**Chat-2 2026-10-15 / Drive Day explicit no-show filter — PARTIAL:** TPO-only live rounds can be filtered to those with persisted explicit ABSENT/no-show evidence, without treating WAITING or unknown attendance as absence. The first-20-round source cap is preserved and disclosed; browser acceptance remains open.

**Chat-2 2026-10-15 / Drive Day pending attendance focus — PARTIAL:** A separate filter highlights live rounds with positively recorded pending attendance; unknown and absent are separate categories. Filtered counts represent only the server's explicitly capped live-round snapshot, not all historical rounds.

**Chat-2 2026-10-15 / Drive Day attention sort — PARTIAL:** The TPO live, college-scoped 20-round snapshot offers validated original schedule order or descending pending/no-show counts, with deterministic name/ID ties and no client-mutated source data. Browser and real-PostgreSQL parity remain open.

**Chat-2 global Requests / 2026-10-15 — PARTIAL:** `/tpo/requests` now displays a dedicated TPO-only, college-authorized pending decision inbox with status/search/page controls and existing confirmed same-origin transactional Approve/Reject actions. The writer remains the already-established request endpoint; no outbound sends. Missing legacy company-level change requests, browser/PG tests and large-list SQL pagination still block complete parity.

**Chat-2 request-kind view — PARTIAL:** The global queue filters persisted application withdrawal, round reschedule, and offer-extension requests before pagination, with a strict URL allowlist. This still excludes unmigrated company request types.

**Chat-2 global Requests sort — PARTIAL:** The authorized request result is now sorted oldest/newest before pagination with immutable deterministic ID ties; no browser/runtime certification claimed.

**Chat-2 aged Requests — PARTIAL:** Global queue supports validated requests older than 7 × 24 hours, evaluated from the server clock before pagination; this is a triage filter, not a promised SLA, expiry or fabricated deadline.

**Chat-2 Requests status tabs — PARTIAL:** Status controls now include authoritative college-wide persisted status totals independent of the current page, with no inferred zero for unavailable external request categories. Full browser parity remains open.

**Chat-2 Requests elapsed age — PARTIAL:** Each visible request displays a deterministic hours/days age from one server render clock, explicitly not a business SLA or overdue policy. Original requested timestamp remains visible in IST.

**Chat-2 request context navigation — PARTIAL:** Each global request now deep-links to the persisted round, offer/joining workspace or drive according to its recorded type and target IDs. These links confer no extra permissions; missing targets safely fall back to the drive.

**Chat-2 global Requests CSV — PARTIAL:** GET `/api/placements/tpo/requests/export` reuses live scoped TPO authorization and URL filters; exports only the current bounded 25/50/100-row page, no request reason or decision note, with CSV formula neutralization and no-store headers. Full legacy/all-results export, real PG/browser execution and privacy certification remain open.

**Chat-2 global Requests navigation — PARTIAL:** The TPO More/Work Requests destination now leads to the functional global pending decision inbox rather than the Students-specific list. The existing Students Requests tab remains available; full legacy navigation/browser checks are open.

**Chat-2 TPO Home Requests attention — PARTIAL:** TPO Home now shows a college-scoped SQL COUNT of persisted pending learner requests and prioritizes the decision inbox when the existing job queue has no next-up task. The count service independently verifies a currently active persisted TPO membership via the existing actor guard; no private request payload is loaded for the dashboard. Full home legacy/DB/browser parity remains open.

**Chat-2 / TPO communication templates (PARTIAL, 2026-10-15):** A TPO-only Templates destination offers three static copyable manual drafts. Neither college-managed template storage nor outbound delivery is claimed; exact legacy editable template and provider integration remain open.

**Chat-2 batch invitation draft (PARTIAL):** A TPO-only batch-specific manual invitation preview uses the persisted cohort name and lifecycle/deadline where available, warns on already-invited/finished batches and offers a registration drill-in; it never sends or records an invite. Actual legacy invite delivery and receipt remain unavailable.

**Chat-2 batch registration reminder preparation (PARTIAL):** A scoped reminder draft uses live DB08 registration-summary counts, distinguishes unavailable evidence from zero, warns for finished batches and links to unrecorded-choice rosters; no contacts, consent, outbound send or delivery receipts are inferred.

**Chat-2 / batch WhatsApp/nudge preparation (PARTIAL):** A scoped 25-learner page exposes the registered no-choice subset and a manually copyable neutral reminder; unavailable registrations and already recorded choices are excluded, no contact data or outbound sending is performed. Full batch selection, contact consent/delivery and actual bulk messaging remain open.

**Chat-2 / Student Notices settings hub (PARTIAL):** TPO settings now has a distinct Notices/Preparation page linked to the live scoped announcements producer and registered prep-readiness editor with explicit missing-storage states. Bulk recipient notices, opt-in controls, external email templates/delivery, and browser parity remain open.

**Chat-2 / TPO student preparation support (PARTIAL):** A TPO-only 25-row readiness-evidence page takes registered placement-pool learners from the existing college-scoped Students source, offers individual manually copyable neutral follow-ups, separates missing evidence from ineligibility, and links to learner history. No actual assignment, delivery, contact-list access or job-readiness certification is implied.

**Chat-2 / Academic-details import preview (PARTIAL):** Batch Students now validates a bounded, strict CGPA/backlogs CSV locally against the currently scoped 25-learner page without persisting anything. Unmatched IDs are explicitly unverified outside the page, not definitively invalid; full-batch matching, approved academic evidence update writer, file handling and real importer remain missing.

**Chat-2 / Assign preparation planning preview (PARTIAL):** A TPO-only preparation-plan page resolves actual configured readiness-course IDs against the bounded, active same-college course catalog and shows missing/unregistered source states. It is an explicit planning view only; learner assignment/enrollment writes, completion checks and notifications are still absent.

**Chat-2 / batch eligibility import scaffold (PARTIAL):** A college/TPO-scoped GET now exports the currently authorized 25-row membership UUID list in the exact existing import CSV shape with intentionally blank decisions, no learner PII beyond IDs, no mutation, and private/no-store response headers. Operators must review/edit and use the existing confirmed preview/commit API; large-list and legacy wizard parity remain open.

**Chat-2 / eligibility import review export (PARTIAL):** The existing server-confirmed preview can now be copied locally as formula-neutralized CSV outcomes, omitting optimistic version tokens and contact PII; copying never commits an import. Full legacy import undo UX and browser/PG acceptance remain open.

**Chat-2 academic CSV validation hardening:** The preview parser now rejects blank/scientific notation numeric cells rather than coercing blank grades/backlogs to zero, and its typed match function retains the parsed fields used by the client preview. Unit cases authored; executed TypeScript/Vitest/browser results remain open.

**Chat-2 academic CSV parser correction:** Repaired regex-literal escapes so numeric validation recognizes actual decimal digits and decimal separators (not literal backslash sequences); blank/scientific values still reject. This is a source correction, not executed-test certification.

**Chat-2 academic preview typing correction:** The client state now carries complete parsed academic preview rows (CGPA/backlogs + match flag) instead of the erased generic return type. Runtime build and browser acceptance still unexecuted.

**Chat-2 2026-10-15 / Live Drive Day search — PARTIAL:** TPO-only live, already-scoped and capped rounds can be filtered by company/job/round name with a validated 100-character URL term. This does not expand the 20-round sample or expose coordinator-only learner rosters. Runtime/browser verification pending.

**Chat-2 live unrecorded attendance — PARTIAL:** Added separate UNKNOWN focus on actual records, never classifying unknown as a no-show; filters operate on authorized, capped rounds. Integration/browser verification remains open.

**Chat-2 live unresolved attention — PARTIAL:** Added pending-or-unrecorded focus from persisted counts. Explicit absent-only rounds are excluded and unrecorded is not inferred absent; TPO live sample cap persists.

**Chat-2 live unresolved ranking — PARTIAL:** TPO can prioritize scoped live rounds by sum of recorded WAITING and UNKNOWN counts with deterministic ties, without mixing explicit ABSENT/no-show into unresolved; runtime verification pending.

**Chat-2 / Drive Day all-attendance-unrecorded — PARTIAL:** Added a filter for live rounds with at least one roster member and no persisted attendance decisions; empty rounds are excluded. Kept unresolved sort backward-compatible with earlier tests omitting unknown; no fictional ABSENT statuses.

**Chat-2 / Drive Day live attendance KPI strip — PARTIAL:** Aggregates only fetched, college-authorized, max-20 live rounds before search/issue filters; separately shows explicit absent, WAITING and UNKNOWN without implying an all-college denominator.

**Chat-2 / Drive Day scheduled-time awareness — PARTIAL:** Live cards now show calculated elapsed and scheduled remaining minutes using the single server snapshot timestamp, with unknowns left blank and explicit notice that schedule end is not actual completion.

**Chat-2 / Live Drive Day filtered CSV — PARTIAL:** New read-only scoped GET uses the exact authorized TPO live-round reader and validated focus/search/sort query, capped at 20; includes no learner-level PII, neutralizes spreadsheet formulas and labels truncation via response header. Preserves compatibility for older filter tests with unspecified roster totals; PG/browser execution pending.

**Chat-2 / Live round drive navigation — PARTIAL:** Each TPO live round now links to its persisted parent drive via authorized job ID, independently guarded by the existing drive workspace; no mutable job state is inferred.

**Chat-2 / Live round venue — PARTIAL:** TPO live cards now include persisted round venue or an explicit unrecorded label; location and attendance are never inferred. Existing job-scoped permissions remain unchanged.

**Chat-2 / Drive Day evidence-based follow-up label — PARTIAL:** Live cards now prioritize purely observed unrecorded, pending and explicitly absent attendance, distinguish empty rosters, and avoid fabricated contact/delivery states. Manual operator review remains required.

**Chat-2 / batch Students current-page name search — PARTIAL:** Strict URL-bound search now filters only the already-authorized 25-person roster slice, with honest no-match and preserved pagination context. Cohort-wide SQL search and mobile/browser acceptance remain open.

**Chat-2 batch Students effective decision filter — PARTIAL:** A strict URL selector filters the current authorized roster page by eligible/ineligible/undecided/ambiguous; ambiguous enrollment is never misclassified as an ordinary decision. Full SQL-grid/browser parity open.

**Chat-2 batch Students inheritance source filter — PARTIAL:** Explicit LEARNER/CLASS/BATCH/NONE selection now composes over the authorized page and supports source audit; missing source never implies eligibility. Cohort-wide filtering and acceptance open.

**Chat-2 batch Students registration evidence filter — PARTIAL:** Current-page recorded/unrecorded selection is permitted only when registration storage is available; unavailable never means unrecorded or consent. Page-scope/browser acceptance pending.

**Chat-2 batch Students query parsing hardening:** All decision/source/registration URL parameters are now validated and applied rather than silently defaulting to ALL. Adds exact multi-filter regression tests; browser acceptance open.

**Chat-2 current-page student triage ordering — PARTIAL:** Name A–Z/Z–A and needs-review-first ordering now prioritize only verified ambiguous/undecided status with stable ties; no change to eligibility or database ordering.

**Chat-2 loaded page student evidence summary — PARTIAL:** Explicit slice-only counters separate eligible, ineligible, undecided, ambiguous and direct overrides without suggesting cohort-wide totals. Back-end and browser checks remain open.

**Chat-2 shared batch Student selection — PARTIAL:** Extracted the pure multi-filter and sort pipeline so the filtered CSV endpoint can reuse the exact page semantics and same authorized roster. This is a consistency guard, not full-cohort SQL filtering.

**Chat-2 filtered batch student CSV — PARTIAL:** TPO-only GET reuses persisted same-college, active learner batch roster; applies identical search/decision/source/registration/order filters to the current 25-row page. Exports only UUID/name/status/source/choice without eligibility notes; formula escaping, no-store headers and no inferred consent. PG/CI/browser verification remains open.

**Chat-2 batch decision-history event-kind filter — PARTIAL:** TPO can review DECIDE versus UNDO within the last 100 scoped cohort events using strict URL values, with honest sample-sized counts and empty states. Full historical pagination still absent.

**Chat-2 batch history after-state filter — PARTIAL:** A second bounded URL filter isolates transitions ending eligible, ineligible or undecided, composed after event-kind selection and without mutating the recorded event sample.

**Chat-2 / decision-history filtered CSV — PARTIAL:** New TPO-scoped read-only GET reuses the authorized latest 100 cohort history events and validated kind/after-state filters, returns formula-safe metadata-only rows, no-store headers and explicit 503 if storage is missing; cannot certify full historical export or independent PG/browser acceptance.

**Chat-2 / safe batch history undo affordance — PARTIAL:** History uses the existing source-backed newest, unreversed cohort action hint before applying view filters, suppressing stale old Undo controls; server DB08 transactional CAS remains authoritative for every attempted reversal. Real PG race tests and browser acceptance still open.

**Chat-2 batch Students pager compatibility:** Optional filter parameters retain the pre-existing q-only URL builder contract, while explicit newer filters remain serializable. Regression test added to prevent TypeScript mismatch on pre-existing callers. CI execution pending.

**Chat-2 / batch Registration source filter — PARTIAL:** Strict SELF/TPO/BACKFILL/UNRECORDED filtering now applies to the authorized 500-learner capped batch sample before 25-row pagination and is preserved in scoped CSV export. This is an observed source label, not consent proof; runtime/browser acceptance open.

**Chat-2 batch registration update recency — PARTIAL:** College-scoped 500-person sampled roster can focus choices updated in 7 days, older than 30 days, or no recorded choice; timestamp comparisons use one server clock and do not infer consent or actual delivery.

**Chat-2 batch registration sorting — PARTIAL:** Authorized roster sample now sorts by name or actual updated timestamp before pagination with deterministic membership-ID ties and unknown timestamps last. Search/source/recency filters compose into the existing CSV.

**Chat-2 / configurable batch registration page size — PARTIAL:** User-validated 25/50/100 rows are selected only after the capped authorized 500-person sample, preserving query state in navigation and current-page CSV. Unknown/too-large page sizes are rejected, not used for unbounded exports.

**Chat-2 / actual sampled registration breakdown — PARTIAL:** Added source-backed total, recorded, missing, each five choice counts and SELF/TPO/BACKFILL counts over the pre-filtered, already-authorized max-500 roster. Cap is disclosed; no rates or consent assumptions.

**Chat-2 / placement consent evidence clarity — PARTIAL:** The authorized batch roster now checks recorded PLACEMENTS consent timestamp plus version and explicitly distinguishes missing evidence versus other choices. This is placement registration evidence only, not permission for SMS/email/WhatsApp; raw version, actor or contact data is never shown. Runtime/PG/browser acceptance open.

**Chat-2 / registration timeline labels — PARTIAL:** Recorded registration updates are formatted explicitly in IST and show elapsed whole days from a single server render clock; missing/invalid/future values remain unknown, never converted to an implied deadline. Browser acceptance open.

**Chat-2 / scoped immutable learner registration history — PARTIAL:** Added a TPO-only per-batch learner history drill-in using registered DB08 event rows. Both active TPO college/batch and active subject learner-cohort membership are persisted-verified before the bounded 100-event read; no consent versions, contacts, or actor PII exposed. Runtime PG cross-college denial and browser verification open.

**Chat-2 / registration event history review filters — PARTIAL:** A scoped history drill-in can filter latest immutable registration events by SELF/TPO/BACKFILL and initial-versus-subsequent transition, while preserving limited-sample notice. Filters cannot change or infer consent; browser acceptance open.

**Chat-2 / immutable registration-history filtered export — PARTIAL:** GET reuses the persisted TPO+active-cohort-learner authorization and bounded latest-100 DB08 event service; exports only before/after choice, source and UTC date, formula-safe with no-store, truncation header and no consent versions, actors, IDs, phones or email. Missing DB negative tests and browser acceptance remain open.

**Chat-2 registration filter compatibility repair:** The shared base choice/name filter now retains the previous q/choice/page call signature despite the expanded page query Zod schema, while accepting the expanded parsed object by structural typing. Authored regression demonstrates both call patterns; execution remains open.


## 2026-10-28 source-only import reachability checkpoint — TPO (NOT ACCEPTED)

This section adds **verification targets to existing TPO page-family contracts**, not new page-family IDs, green states or official tasks. Pinned legacy FE: `9d56bb7a347b06f242ef615c19fdc298f83329e0`; vNext paths below checked at `7974c721b163f98ced26ada834f564922d28aba5`. Full evidence: `docs/audit/legacy-dev-census/2026-10-28-wave3-source-reconciliation.md` and wave-3 JSON batches.

- **Students → Requests and Requests queue:** legacy `src/components/tpo/RequestsPanel.js:L24-L30,L62-L70,L195-L270,L330-L390` exposes seven request kinds, decision effects, proof-sensitive bulk skips, optimistic pending/failure/retry and decided-by/when/why details. vNext `src/app/(authenticated)/tpo/students/requests/page.tsx` and `src/components/placements/tpo-request-decision-control.tsx` both exist and implement distinct decision UI; compare semantic request-type mapping (especially legacy `WITHDRAWAL` and vNext `APPLICATION_WITHDRAWAL`), per-type persisted side effects, authorization, student delivery, bulk skip policy and decision history with executed cross-role fixtures. **Existing but unverified, not automatically MISSING.**
- **Placement lists/grids:** legacy `src/components/tpo/grid/TpoGrid.jsx:L89-L107,L232-L274`, `SavedViewsManager.jsx`, `HeaderFilter.jsx`, `FilterPanel.jsx` and `ReasonPicker.jsx` warrant per-family verification of selected hidden rows on filter/search change, bulk safety, selected range, export, saved views, query state and keyboard access. Modern vNext tables need equivalent consequences, not AG Grid structure.
- **Batches and contextual workspaces:** legacy `src/components/tpo/batches/BatchRulesTab.jsx`, `DecidePanel.jsx`, `EligibilityGrid.jsx`, `IneligibleModal.jsx` and `src/components/tpo/students/StudentSidePanel.jsx` contain child UI. Current vNext `src/app/(authenticated)/tpo/batches/page.tsx` imports real cohort/eligibility, journey and undo services. Test nested reset/inherit/decision, invalid/stale/undo, scoped side panel actions and action results; source reachability is not acceptance.
- **Outreach and request interactions:** legacy `EmailsTab.jsx`, `FollowUpModal.jsx`, `MessagesPanel.js`, `RecruiterSidePanel.jsx`, `RequestsQueue.jsx` and `RequestsPanel.js` require distinct embedded-overlays/action-state reconciliation, not additional route counts.

**No TPO row was marked Implementation Green.** Actual source-to-handler, database and desktop/mobile tests remain required before accepting an individual existing page family.


## 2026-10-28 imported TPO command, communication and student-workspace descendants — source-only

Legacy source reference `9d56bb7a347b06f242ef615c19fdc298f83329e0`; see `docs/audit/legacy-dev-census/2026-10-28-wave4-6-reconciliation.md`. Continue within the **existing TPO Home, Students, Engage, Team, communications and Requests families**. Do not count reusable components as additional pages.

- `src/components/tpo/TpoCommandPalette.jsx:L8,L95-L139` is a Ctrl/Cmd+K finder with student, recruiter, company and drive search, listbox, active selection and recent item behavior; `TpoBellPanel.jsx`, `ui/ShortcutHelp.jsx`, `ui/recents.js` and `ui/shortcuts.js` add notification and keyboard paths. Verify vNext reachability, role/college isolation, shortcut precedence, keyboard/focus/close, recents privacy and empty/error states by browser rather than assuming a topbar matches.
- `emails/EmailDetail.jsx`, `EmailComposer.jsx`, `outreach/OutreachSession.jsx`, `TeamConversations.jsx`, `TeamPeople.jsx` and `TodayQueue.jsx` expose conditional message, audience, follow-up and operational workflows. Trace frontend service, authorized backend write, notification/side effect and recipient visible state with real disposable fixtures.
- Previous checkpoint identified legacy seven request kinds versus vNext `src/modules/placements/tpo-global-requests-model.ts` and `tpo-students-service.ts` three-kind model filters. VNext also has general request and bulk-decision implementations, so classify precise semantic coverage first; do not file a missing capability based only on this one enum.

**Closure:** The scoped literal/static UI-folder import frontier is exhausted at the pinned source SHA; action/state/API/runtime parity is NOT accepted. No TPO Implementation Green or tracker change.
