**2026-10-16 chat-9 wording / reachability follow-up (SOURCE IMPLEMENTED; ACCEPTANCE OPEN):** Restored the legacy College sidebar single-active-row rule (Dashboard no longer stays active on every /college/* descendant), prevented identical-named Super Admin and College rows from cross-highlighting in multi-role menus, and assigned visible entry-owner highlighting for College Announcements (Dashboard), Domains/branding/college-profile (Profile), and Contacts (People). These complement existing Faculty-first People landing, grouped tabs, three dividers, exact Companies/Analytics labels and one-strip Projects detail. Unit tests added for nested paths, multi-role isolation and orphan entry pages. **Not executed:** vitest/tsc/lint/PG/browser/375px; no new DONE assertion. Remaining P2: exact legacy actions and modal/table wording beyond audited pages, full cross-role mobile and permission-negative acceptance, custom branding logo asset owner decision.

**Profile verification section E follow-up (T-S2-09 / T-S2-10; PARTIAL):** T-S2-09 duplicate year, optional blank grades, persisted verified academic projection and absence-level pruning are implemented; disposable PostgreSQL publication tests now also assert an invalid approval rolls back both verified snapshots and eligibility projection. T-S2-10 has strict source-unit regressions for Aadhaar OR PAN plus matched CLEAN evidence, exactly three core grades+marksheets and optional unlinked education; CLEAN private resume receipts remain the documented privacy-preserving exception to the legacy public URL check. Registered migration 0081 backs the withdrawn UPDATE_PENDING route written in the prior chat-9 round. **These tests were authored but not run**, so release acceptance and backlog DONE certification remain open. No extra schema, identity numbers or public resume URLs were introduced.

**2026-10-16 chat-9 Phase 2 exact-copy follow-up (SOURCE IMPLEMENTED; NOT acceptance DONE):** Compared docs/audit/wording-gap-report.md and docs/audit/legacy-copy-A.md/-B.md with live main before editing. College Admin legacy People sidebar entry now opens the first Faculty tab (/college/faculty), the other Directory page remains accessible via the People strip. Three dividers appear after Activity Log, People, Projects; the shared sidebar highlights the active College group on every nested tab. Page titles updated to legacy Profile, Video, Lecture Halls, Batch Promotion and Progress, including invalid-filter paths. Shared sidebar accessible name is Main navigation. Activity Log button reads exact Export while its existing college-scoped/admin-scoped CSV endpoints remain unchanged. Tests for each literal label/section were authored but NOT executed. The existing Companies and Analytics tabs, Projects single-strip behavior and headings had already merged and were not rebuilt. Backlog: T-S2-09 original duplicate/blank-grade and stale-mark pruning code already exists; this round additionally tolerates optional null/omitted grades but still rejects malformed numeric grades; integrated eligibility re-evaluation is persisted-read based, yet PostgreSQL and post-approval browser acceptance remains OPEN. T-S2-10 Aadhaar OR PAN and three milestone marksheets already exist; CLEAN private resume receipt remains the documented security exception to an unverified legacy resume URL. Migration 0081 learner UPDATE_PENDING withdrawal and salted identity hashes already exist; execution and privacy approval OPEN. No new owner-managed migrations or production data operations. P1: real PG replay/eligibility/tenant-role tests, P2: 375px browser/menu active state, page buttons/empty/error copy across unreviewed College forms, optional template actions and complete historical analytics. Do not mark the tracker DONE on source-only work.

**2026-10-16 chat-9 Phase 2 follow-up — SOURCE IMPLEMENTED, ACCEPTANCE OPEN:** The legacy College sidebar and grouped headings, including Placements `Companies`/`Analytics` and Projects list tabs, were already on merged main and were not duplicated. This batch suppresses the College Projects outer six-tab strip only when a persisted workspace detail renders its own section tabs, preserving list and template pages. T-S2-09 now clears earlier SELF-only backlog/gap/lateral fields when approval promotes the candidate academic projection to VERIFIED; the eligibility service reads the persisted projection on each evaluation. A disposable-PG fixture is authored to show changed verified marks alter a placement result and prune stale PG marks. T-S2-10 continues to accept Aadhaar+document OR PAN+document and only three core education milestones, retaining the private CLEAN resume receipt exception. Migration 0081 WITHDRAWN is now exposed by a guarded same-origin learner-only POST and confirmed UPDATE_PENDING control; two disposable-PG scenarios (Identity and Education) include row-version conflict, role and identity denials and no Education republish on withdrawal. Salted fingerprints canonically normalize Aadhaar spaces and PAN case. **None of these tests were executed here; do not set tracker DONE or certify actual migrated-database/browser behavior.** Remaining: executed disposable PostgreSQL replay/scope/eligibility acceptance, browser and 375px tests, verified eligibility decisions across active drive pages, full legacy body-copy audit, and owner privacy approval for CLEAN private resume instead of legacy URL. Severity P1 for publication/approval, P2 for navigation/reachability.

**Legacy Projects bookmark redirects (2026-10-16, P2 source fix):** Redirect-only compatibility entry routes for /college/projects/workspaces, /workspaces/[workspaceId] and /workspaces/[workspaceId]/[section] now forward to the actual College Admin list and detail section pages; no duplicate project implementation or new unauthorized data access is added. The existing static /workspaces/new class-team creator remains intact. Unit route-contract tests authored, not executed. Browser/role-negative acceptance open.

**College Admin exact-copy + route reachability regression (2026-10-16, P1 source contract, acceptance open):** A single focused Vitest contract now asserts all ten literal lms-dev-2026 sidebar labels in order with exact vNext hrefs, verifies every destination exists as a Next.js page, checks all legacy group-tab destinations and exact Placements names, and traces the six previously unlinked College feature pages back to visible College actions. The test also guards the one-strip Projects rule. Source-level contract only: authored but not executed, no HTTP/role/375px browser certification; parity remains PARTIAL.

**Visible exact legacy group headings (2026-10-16, P2 source fix):** Nested College navigation displays the matching legacy heading: Academic Setup, Courses & Content, People, Placements or Projects. College Groups belongs under the People/People Directory tab, and Placement Evidence by Department inherits the Placements/Analytics tab rather than the broader Drives prefix. Companies and Analytics retain their exact legacy tab labels. No additional non-legacy tab was created. Browser/mobile heading and ARIA checks pending.

**Placements → Analytics department-readiness entry (2026-10-16, P2 source fix):** Analytics header now links to the existing College Placement Evidence by Department report in both normal and invalid-filter branches. It remains within College authorization scope and is not a new fifth Placements legacy tab. Query/browser/security acceptance pending.

**Projects → Bulk mentor reassignment entry (2026-10-16, P2 source fix):** The existing Workspaces landing page now links to the dedicated College Admin mentor reassignment workflow without adding a seventh non-legacy group tab. The route retains its persisted same-college project and mentor selection guards. Source link test authored, not run. Browser and permission-negative acceptance remain open.

**Academic Setup → Attendance department report entry (2026-10-16, P2 source fix):** The canonical Attendance tab now offers a visible link to its existing College Attendance by Department report beside correction windows and policy, without adding an extra legacy group tab. Unit source-route assertion authored; browser/runtime acceptance pending.

**People → Student groups entry (2026-10-16, P2 source fix):** People Directory links directly to the existing College group list, including membership and nested group detail. Legacy People tab names remain unchanged and this link uses the persisted destination heading. Source regression authored; runtime/browser acceptance open.

**College Dashboard/Profile lost entry links (2026-10-16, P2 source fix):** Announcements is reachable directly from the legacy Dashboard actions; Tenant domains is reachable from College Admin Profile without introducing non-legacy sidebar rows or reusing a Super Admin-only screen. Both routes exist and retain their own server-side permissions. Tests authored, not run; device/browser verification pending.

**College Admin navigation repair (2026-10-16; P1 source fix; acceptance open):** Legacy Projects sidebar and Workspaces tab now both target the actual /college/projects list (the prior /college/projects/workspaces has no page). Project cards continue to existing /college/projects/[projectId] → summary/detail; nested project sections remain reachable. Shared ProjectAdminNav suppresses itself on College routes because the College layout already owns the same tab strip. Longest-prefix tab activation prevents simultaneous Workspaces and At Risk/Readiness/other highlights. Focused source tests authored, not executed; 375px browser and exact legacy visual review remain open.

**Phase 2 verification of Companies contract tests (test repair, execution still pending):** Updated the original College Companies route assertion to match the new SQL-paged college-scoped service and owner lookup, eliminating a stale failing source assertion. This is a regression-test correction, not browser/PG acceptance or a declaration of full parity.

**College Shortlisted pagination recovery (Phase 2, source fix):** A bookmarked Shortlisted page beyond the current count redirects to the last valid, same-drive, same-search page only after scoped data authorization. A no-match search offers `Clear filters`, retaining the legacy recovery phrase. Source tests authored; actual PostgreSQL/browser proof pending. Severity: P2.

NaN**Phase 2 legacy DriveSubNav (source fix; browser acceptance open):** Drive detail now has the exact four shared legacy tabs `Overview`, `Applications`, `Schedule`, `Settings`. Schedule targets the existing college-scoped interviews page; direct Shortlisted remains a separately reachable workflow, not an invented fifth tab. All links stay within current-college routes. Unit tab model authored; desktop/mobile and unsaved-edit navigation guard parity remain open. Severity: P2.

**T-S2-09/T-S2-10 linked academic marks (source fix, acceptance open):** A proof-bearing verified snapshot now publishes only graded levels with a private marksheet receipt reference; optional unlinked grades cannot turn into VERIFIED eligibility evidence. An optional referenced document is revalidated for owner, purpose and CLEAN state before approval. Latest documented end year wins. Pure tests authored, disposable PostgreSQL and browser pending. Severity: P1.

**Phase 2 College drive Settings (UNKNOWN → PARTIAL, not closed):** Dedicated `/college/placements/jobs/[jobId]/settings` is backed by the college-guarded persisted drive Overview and safely supports the exact legacy `Drive status` and confirmed `Close drive`/`Yes`/`No` copy through the same-origin placement lifecycle endpoint. **Explicit deviation/blocker:** legacy `Open drive` for closed jobs and permanent `Delete drive` are NOT exposed: vNext lacks safe reopen and implements archive, not permanent delete. Existing draft edit/operations remain on their own route. Severity: P1. Unit/source tests authored; PostgreSQL/browser and product semantics approval open.

**Phase 2 College drive Shortlisted (UNKNOWN → PARTIAL, not closed):** A dedicated `/college/placements/jobs/[jobId]/shortlisted` route now reads persisted SUBMITTED+SHORTLISTED applicant rows through the college-guarded drive service, with strict bounded search, pagination, scoped CSV and a legacy `Shortlisted` entry from drive Overview. It cannot mutate screening state and does not infer unrecorded hiring stages. Legacy pipeline actions, role-specific statuses, browser and database execution remain open. Severity: P1.

**Phase 2 College Hiring Analytics (UNKNOWN → PARTIAL, not closed):** Dedicated `/college/hiring-dashboard` uses authoritative college-owned placement report metrics and legacy `Analytics` heading/tab through a strict season/job UUID query. It does not infer unrecorded funnel transitions. Legacy company and complete historical analytics charts, source/browser acceptance, and exact body copy remain open. Severity: P1 (previously missing daily-use surface).

**Phase 2 College Companies (UNKNOWN → PARTIAL, not closed):** Dedicated `/college/companies` now uses the registered, College Admin-authorized `listPlacementCompanies` + `listPlacementRelationshipOwners` services and existing scoped relationship actions. The legacy Placements tab label is exact `Companies`; no cross-college or Super Admin directory. Full legacy create/edit/delete UX, integration/browser acceptance and all feedback copy remain open. Source + scope contract test authored, not executed. Severity: P1 (previously missing daily-use surface).

# College Admin — Detailed Page Parity Spec

Legacy sidebar: Dashboard, Activity Log, Academic Setup, Courses & Content, People, Placements, Placement Cell, Projects, Profile.

Every page below also requires:
- correct College Admin role fence;
- fixed current-college scope;
- explicit "admin not assigned to a college" state where legacy has it;
- no cross-college object lookup by id;
- loading/empty/error states;
- responsive behavior;
- executed regression coverage.

# Chat-9 2026-10-15 follow-up — PARTIAL (runtime acceptance pending)

Contacts now show an honest page range, page-local Faculty/Learner/dual-role breakdown and a count of applied facets without treating a page as the whole college. Strict Contacts parsing rejects special-object keys rather than dropping them; the People membership directory now refuses repeated/unsupported URL params before sensitive listing. In verification, navigation and refresh are fenced while a bulk decision request is pending. Focused Vitest cases were added; actual browser, disposable PostgreSQL and global CI acceptance remain open. These are not DONE parity claims.

# Operations

**Chat-9 October 15 follow-up — PARTIAL; final acceptance open:** Faculty and Student directories now reject inherited/ambiguous URL query keys, give non-leaking reasons for incompatible role/date filters, distinguish unfiltered-empty from no-match states with clear-filter recovery, show bounded page ordinals and offer semantic narrow-screen cards with the same profile, Contacts, verification, class-move and faculty lifecycle actions. College People distinguishes no college memberships from filtered-empty results. College Contacts and People guard COLLEGE_ADMIN before parsing invalid filters; the verification queue likewise role-gates first, reuses one actor context and explains typed invalid date/tab/education combinations without echoing URL values. Bulk-review navigation remains frozen during in-flight decisions. Authored focused unit cases and source guards do not substitute for disposable PG denial, 375px mobile/browser, or final CI execution. No row is marked DONE solely from these changes.



**Personal-notification unread counts PARTIAL (2026-10-15):** College Admin announcements displays a separate exact unread own-recipient count from registered notifications, independently of the 50-row inbox cap and regardless of unread-only filter. Count reads enforce the signed-in college and recipient; no college-wide send or delivery is inferred. Model, isolated PG tenant/role fixture updates authored; runtime/browser acceptance outstanding.

**Announcements personal inbox unread filter PARTIAL (2026-10-15):** College Admin notices can filter unread, own-recipient *registered* notifications within the signed-in college before the 50-row cap. Toggle preserves the deleted-announcement selector. The draft college-wide DB10 announcement table remains gated and no broadcast sending is claimed. Pure model and isolated PG own/foreign/wrong-role tests authored; runtime/browser acceptance open.

**Phase 2 verification exact subtitle/empty-copy (source fix, acceptance pending):** College verification's header subtitle now matches the literal legacy `college-admin/verification.js` copy and its true empty Waiting/decided states use `Nobody is waiting` / `Nothing here yet`, plus the legacy guidance. Filtered-empty rows continue to explain no match instead of showing a misleading truly-empty queue. The shared Super Admin queue retains its own copy. Focused unit tests authored, but no local Vitest/browser run available.\n\n**Phase 2 College Admin landing-page title repair (source fix, acceptance pending):** `/college` now titles its actual dashboard `Dashboard`, `/college/people` uses legacy `People Directory` in both filtered and normal states, and the placements list heading uses exact `Drives`. The headings are centralized in a pure title model and covered by unit assertions. Mobile visual and browser-title certification remain pending.\n\n**Phase 2 nested College Admin tab names (source fix, acceptance pending):** A route-aware College layout renders dev-legacy exact Academic Setup (10), Courses & Content (8), People (4), available Placements (Drives/Interviews), and Projects (6) tabs with role-local existing routes and narrow-screen horizontal access. **Open P1 parity gap:** legacy Companies, hiring analytics and drive-detail Shortlisted/Settings have no verified College route mapping and must not be misrouted to Super Admin; similarly awaiting exact browser confirmation. Test cases authored, not yet executed.\n\n**Phase 2 College Admin account-menu copy (source fix, acceptance pending):** Top-bar account actions now use verbatim legacy `My Account` and `Logout` rather than vNext-only `Security` and `Sign out`; the My Account link targets the existing college profile. Other role lanes keep their original controls. Pure copy-model unit regression authored; browser and full shared-header parity still open.

**Phase 2 exact College Admin sidebar copy (source fix, acceptance pending):** The college-only sidebar now uses the ten verbatim legacy menu labels in source order from `docs/audit/legacy-copy-A.md` (Dashboard, Activity Log, Academic Setup, Courses & Content, People, Profile verification, Placements, Placement cell, Projects, Profile) and routes to existing grouped landing pages. Mixed-role additive navigation remains. Unit navigation contract authored, 375px browser/cross-role acceptance outstanding.

## Page: Profile Verification (legacy /college-admin/verification)

**Phase 2 UPDATE_PENDING withdrawal (staged only; DB gate BLOCKED):** An optimistic-version, learner-owned withdrawal planner restores the prior verified snapshot and emits a distinct WITHDRAWN audit action. The current registered PostgreSQL `profile_verification_events_action_ck` rejects WITHDRAWN, so no public route/UI is enabled. Orchestrator must register `docs/proposed-migrations/profile-verification-withdraw-action.sql`, replay on disposable PostgreSQL and review role/version tests before this action can be surfaced. Source tests authored, not executed.

**Phase 2 identity fingerprint (privacy hardening, source fix):** Aadhaar/PAN profile snapshots now keep only masked display tails and namespaced SHA-256 hashes with a random 256-bit per-learner salt preserved under the verification row lock between submissions. The persisted fingerprint changes when the underlying number changes without storing that number. No schema or environment changes. Regression unit coverage authored; independent privacy/security review and PostgreSQL acceptance remain open.

**T-S2-10 Phase 2 (source fix, acceptance pending):** Legacy OR identity evidence is now accepted only when the corresponding Aadhaar or PAN number **and** verified private document belong to the learner; required marked+documented education is limited to the three core milestones (10th; 12th/Diploma; UG/PG), not optional rows. **Documented privacy deviation:** legacy's non-blank resume URL is NOT accepted by itself; a CLEAN ownership-checked private resume receipt is still mandatory because raw/public document URLs cannot be published in a verification snapshot. The source-side tests are authored, with disposable PostgreSQL, scanned-object, and browser approval evidence pending. Implementation T-S2-09: 87900bb84b86fc141c58791a21f9c1993299a2b5 and 21953ad3d96c0fa7b11ee229913bc1962f070a02.\n\n**T-S2-09 Phase 2 (source fix, acceptance pending):** Education publishing now selects the latest end-year graded entry per supported level, ignores optional blank grades, and deletes prior verified-mark levels absent from the newly approved snapshot within the verification transaction. Core graded education and private receipt validation still gate approval. Fresh placement eligibility reads the newly published evidence; independent PostgreSQL and browser proof remain required before marking parity closed.


**Verification card decision-state clarity PARTIAL (chat-9):** The shared queue now clearly labels new SUBMITTED and updated UPDATE_PENDING items with the appropriate review action, while VERIFIED/SENT_BACK cards say View decision rather than suggesting another write. Pure presentation unit cases authored; 375px browser and end-to-end permission acceptance open.

**Submitted-evidence verification CSV PARTIAL (chat-9):** Capped scoped verification CSV now includes the count of submitted Education rows, count of those with no marksheet document reference, and public-safe attention cues, in addition to status/timestamps. Identity rows keep Education counters blank; no raw snapshot, receipt IDs, private URLs or identity values are exported. Formula-neutralized unit cases authored, real DB/browser acceptance outstanding.

**Elapsed waiting-age triage PARTIAL (chat-9):** The queue and capped CSV now partition active SUBMITTED/UPDATE_PENDING requests into under-48-hour, 2–7-day and at-least-7-day groups using one captured request clock, with future dates excluded. Only Waiting tab permits the filter, preventing misleading decided records. Unit boundary cases authored; real database/browser validation pending.

**Verification-to-Student context navigation PARTIAL (chat-9):** College review cards now open the exact current-learner Student detail using a validated membership UUID, delegating permissions to the existing scoped page. This link is enabled only on College Admin mounting, not the shared Super Admin queue. Unit URL validation authored; cross-role/browser acceptance open.

**Case-insensitive learner-name sorting PARTIAL (chat-9):** Verification cards, SQL paging, and capped CSV now share a typed learner-name A–Z ordering with membership/section UUID ties, without exposing identity or private contact values. Unit ordering tests authored; DB pagination/locale/browser acceptance pending.

**Database-side verification kind filtering PARTIAL (chat-9):** Education/Identity kind now narrows the current-college PostgreSQL queue and CSV before the 5,001-row safety cap; tab counts remain within the chosen kind. Unit and disposable PostgreSQL wrong-role/foreign negative cases authored. Runtime/index/browser acceptance still open.

**SQL date window before queue safety cap PARTIAL (chat-9):** The inclusive IST from/through submission-date window is now transformed to UTC half-open bounds in both verification queue and capped CSV SQL before the 5,001-row safeguard and in-memory marksheet/attention filters. Pure exact-midnight tests authored; runtime PG index-plan and browser acceptance pending.

**Active enrollment availability PARTIAL (chat-9):** Verification queue and masked CSV now distinguish students with/without registered active program enrollment, using correlated current-college ownership. Contradictory no-enrollment with exact program/batch/branch/class filters reject at page, service and export boundaries. Unit tests authored; disposable DB and browser verification pending.

**Single-enrollment academic filter correctness PARTIAL (chat-9):** Class+program+batch+branch verification filters now bind to the same current section enrollment and college-owned ancestry instead of accepting unrelated enrollments for the same learner. Queue and CSV share one scoped predicate. Pure query-mode tests authored; a multi-enrollment PostgreSQL negative fixture and browser proof remain required.

**Academic-program verification selector PARTIAL (chat-9):** The queue and capped CSV now share exact current-college active program-enrollment filtering. A persisted college-only program picker is bounded to 200 and retains unknown bookmark IDs without showing another tenant's labels. Pure URL/CSV contract tests authored; PostgreSQL/browser acceptance open.

**Unified verification CSV filter validation PARTIAL (chat-9):** The same strict date-window and pending-state compatibility checks now apply at the CSV URL boundary; invalid/ambiguous filters receive an explicit 400 without triggering protected reads. Disposable DB04-gated fixtures cover exact learner, lower-day and first-submission filters plus wrong-role/foreign tenant denials. These fixtures are authored but have not executed in this session.

**Named bulk review preview PARTIAL (chat-9):** Before a bulk Verify/Send back, the College Admin now sees the actual selected learner names, sections, versions and any locally skipped entries rather than only aggregate counts. Changing selection cancels the old preview; in-flight decisions lock select/clear. No preview claims receipt validation or server commit. Unit coverage authored, browser/DB acceptance remains open.

**Readable per-request bulk decision outcomes PARTIAL (chat-9):** Successful bulk API responses now retain the selected page's authorized learner names when displaying individual success/stale/document/permission outcomes; no shortened membership UUIDs are shown. Attempts/success/failure totals remain exact, and unknown rows use a neutral label. Pure outcome projection authored; browser/PG acceptance open.

**Explicit per-learner decision confirmation PARTIAL (chat-9):** Single-request Verify and Send back now require a second, cancellable confirmation displaying the action and correction reason before invoking the existing version-locked, audited same-origin writer. In-flight confirmation cannot be dismissed. Pure decision-copy tests authored; browser/API acceptance outstanding.

**Previous reviewer decision visibility PARTIAL (chat-9):** The authorized review drawer now displays the persisted last decision timestamp in IST and the stored correction note, explicitly labeling absent history. It does not invent earlier history or expose these fields through the public roster. Pure projection coverage authored; private read/browser acceptance open.

**Verification drawer keyboard dismissal PARTIAL (chat-9):** The private review drawer restores focus to the opener, focuses Close on entry and handles Escape. Dismissal is disabled while a decision request is in flight, avoiding an ambiguous discarded view. Pure keyboard-state tests authored; focus-trap and mobile browser acceptance remain open.

**Review drawer recovery PARTIAL (chat-9):** Authorized staff can explicitly retry an unsuccessful private verification-detail read without closing the drawer, clearing stale error/detail state before the new GET. No automatic repeated private reads or false success. Unit regression authored; browser/network acceptance remains open.

**Newest-first verification ordering repair PARTIAL (chat-9):** The shared card grid now respects the server-selected OLDEST/NEWEST mode instead of always reversing newest pages back into ascending order. The queue and CSV also tie-break same-timestamp, same-learner Education/Identity rows by section; attention flags use one captured read clock. Pure ordering tests authored, PostgreSQL/browser acceptance open.

**Waiting request-state triage PARTIAL (chat-9):** College verification now distinguishes first SUBMITTED requests from UPDATE_PENDING updates through the same status-scoped PostgreSQL query used by its capped CSV; incompatible decided tabs fail closed rather than show a false empty queue. A native dropdown, safe tab reset and pure filter tests authored; executed PG/browser acceptance outstanding.

**Exact learner lookup PARTIAL (chat-9):** College Admin staff can deep-link from a Student roster membership to a filtered verification queue and matching capped export, using a strict membership UUID. The stored-college/learner-role predicates remain authoritative, and foreign or forged IDs reveal no matching details. Unit and route integration coverage authored; real PostgreSQL/browser acceptance open.

**IST lower submission-date filter PARTIAL (chat-9):** Staff queue and capped CSV now support a matching inclusive Asia/Kolkata submitted-from date, with reversed date windows rejected before querying. Bounded URL contract, form feedback and pure date-boundary tests authored; real PostgreSQL/browser verification pending.

**No hidden-row bulk selection PARTIAL (chat-9):** College verification now disables the shared page-local search input while keeping the authorized server-side learner-name filter and status/kind selectors. Consequently select-all and preview address exactly the displayed college-scoped server page; Super Admin and any other consumers retain their existing local-search behavior. Contract tests authored; browser/CI acceptance pending.

**Bulk decision PostgreSQL success+failure fixture PARTIAL (chat-9):** A separate current-college verification fixture is now authored to assert a successful SEND_BACK row-version transition, exactly one activity event, recipient in-app notification, non-leaking foreign-college failure and stale replay without duplicate decision. The same batch includes a JSX duplicate-markup repair caught in source review. Fixture is gated on disposable registered DB04 and has not run here.

**Per-item bulk results PARTIAL (chat-9):** Bulk decisions display server-returned succeeded/failed counts and each public-safe outcome, including stale-version, unavailable target and missing-document failures. Successful HTTP transport never implies every learner was verified. An explicit refresh button rechecks the server queue; integration/browser acceptance remains open.

**Confirmed bulk Send back PARTIAL (chat-9):** College reviewer preview now accepts a required 3–500 character correction explanation and an explicit Send back confirmation, passing only the chosen waiting requests to the existing version-locked writer with individual audit/notification. The reason is saved only after server success, not inferred from local preview. Unit coverage authored; PG/browser acceptance remains open.

**Confirmed bulk Verify action PARTIAL (chat-9):** College reviewer preview offers a second explicit Verify confirmation, submitting only the first 20 waiting membership/section/version tuples through the same-origin guarded, DB04 receipt-attested bulk POST. The UI clears selection only on HTTP success, surfaces errors, and requests server refresh; per-item result details and independent execution remain open.

**Select-all and bulk preview PARTIAL (chat-9):** College Admin can select up to 20 currently visible waiting requests, clear the working selection and preview Verify/Send back eligibility using the existing status/version planner. Preview performs no mutation; Super Admin retains its existing single-review UI. Pure selection regression and browser acceptance open.

**Scoped verification card selection PARTIAL (chat-9):** Only submitted/updated waiting rows offer accessible selection checkboxes in the reusable workspace when mounted by College Admin; selection uses membership+section composite identity, is capped at 20 and is intersected with the current server-authorized page, with no bulk writes yet. Pure-model and browser acceptance open.

**Disposable PostgreSQL bulk isolation fixture PARTIAL (chat-9):** Gated integration exercise rejects LEARNER-role batch execution and maps foreign-college identity-review IDs to generic NOT_AVAILABLE without target metadata. Existing single-review fixture still covers version CAS, audit and in-app notification. Requires DB04_VERIFICATION_READY=1 and disposable DB target; not yet executed.

**College Admin bulk mutation route PARTIAL (chat-9):** `/api/college/verification/bulk-review` POST checks same-origin before JSON parsing, delegates to persisted actor/scoped, row-versioned DB04 per-item service and returns no-store per-record outcomes. The endpoint does not accept caller-provided college scope. Route-contract tests authored, runtime/API and browser acceptance open.

**Serialized bulk-review service PARTIAL (chat-9):** A bounded College Admin bulk command runs each selected request through the existing DB04 locked writer and private-document receipt validation, checking persisted reviewer membership again before each write. Audits and in-app notifications remain transactional per successful decision; recognized stale/foreign/invalid transitions report per-item outcomes. Unexpected failures abort remaining work rather than silently claiming success. Real DB/CI/browser evidence still open.

**Per-request bulk outcome model PARTIAL (chat-9):** Bulk review now has a typed per-learner result taxonomy and truthful attempted/succeeded/failed counts, with a distinct stale-version message. Pure-model tests authored; route/UI/independent acceptance remain open.

**Bounded confirmed bulk-review contract PARTIAL (chat-9):** Registered schema validates explicit user confirmation, at most 20 unique membership+section keys, positive expected versions, and reasoned send-back; caller-supplied tenant IDs and duplicate entries are rejected. Pure regression tests authored; service/UI and independent PG/browser acceptance remain open.

**Unambiguous verification URL parsing PARTIAL (chat-9):** College Admin queue now fails closed on repeated query parameters instead of silently using the first value, while rejecting caller-supplied college scope and preserving strict typed filters. Invalid input is shown without querying protected data. Unit tests authored, browser/running-service acceptance outstanding.

**Queue page-boundary recovery PARTIAL (chat-9):** If a filtered queue shrinks after a decision, the College Admin page redirects to the actual last page while preserving every validated filter, chosen page size and sort instead of displaying an empty page. Error and queue-limit rendering now occur outside try/catch. Pure model tests authored; browser and database state-transition verification still open.

**Strict verification CSV query parsing PARTIAL (chat-9):** College Admin export now rejects duplicate filter values and forged tenant parameters rather than silently overwriting them. Only the typed queue filter contract may reach the scoped service; existing formula-safe 1,000-row cap remains. Unit coverage authored; browser and actual runtime acceptance pending.

**Chronological verification queue order PARTIAL (chat-9):** Added typed OLDEST/NEWEST ordering by submitted timestamp with membership-ID ties; the same order is used before queue pagination and capped CSV. Current-college role gate remains enforced; unit plus PG denial checks authored, execution and browser proof open.

**Selectable 10/25/50-row verification pages PARTIAL (chat-9):** College verification queue supports strict bounded server slicing with stable URL navigation, independent full-view tab counts, and same-college authorization. CSV still exports the filtered view independently of page length. Unit and gated PostgreSQL scope fixtures authored; large-roster and browser/real-DB acceptance open.

**One-click triage shortcuts PARTIAL (chat-9):** The College queue presents three accessible needs-a-closer-look quick actions that switch to Waiting, preserve other filters and reset to first page, plus a reset to all states. These navigate the server-authorized filters, not current-page-only cards. Unit URL-patch acceptance authored; keyboard/mobile browser verification open.

**Seven-day overdue attention triage PARTIAL (chat-9):** Queue and CSV now filter only SUBMITTED/UPDATE_PENDING entries older than seven complete days using a single per-request server clock and pure shared domain attention rules. Sent-back/verified records never appear as overdue. Unit and gated tenant-denial coverage authored, pending execution/browser proof.

**Changed verified details triage PARTIAL (chat-9):** Added a queue-wide UPDATE_PENDING attention filter, across visible tabs and shared CSV, honoring the underlying verified-details state rather than guessing from a snapshot diff. Pure acceptance cases and role/tenant tests authored; executed PostgreSQL/mobile/browser and notification delivery checks open.

**Missing-marksheet attention triage PARTIAL (chat-9):** Added typed, server-side EDUCATION missing-marksheet selector shared with same-scope capped CSV, evaluated before 25-row pagination and with full-view counts. Unit positive/negative and gated PostgreSQL denial fixtures authored; real runtime/375px/browser acceptance open.

**Native class picker PARTIAL (chat-9):** Class UUID text input replaced by current-college ACTIVE section choices with batch/class names, bounded list, truncation and bookmarked-selection preservation. Existing same-college ACTIVE section-enrollment predicate remains authoritative; foreign class detail is never selected. Tests authored but not executed on disposable PostgreSQL/browser.

**Native branch picker PARTIAL (chat-9):** Replaced raw department UUID entry with a bounded, name-labeled selector of current-college nonarchived departments; unknown bookmarked UUIDs remain visible but never disclose another tenant name. Existing correlated learner enrollment predicate is unchanged. PostgreSQL actor-denial fixture and unit coverage authored; actual runtime/browser acceptance outstanding.

**Native batch picker PARTIAL (chat-9):** The verification queue now fetches up to 200 persisted batches through a fresh, active, same-college College Admin role check, with truncation disclosure and deep-linked selected UUID retained. Existing queue/export batch predicate remains canonical. Authored unit and gated PostgreSQL role fixtures; browser/real DB acceptance remains open.

**Server-initialized TPO switch PARTIAL (2026-10-15, chat-9):** The College verification header now receives the same-college persisted TPO verifier switch directly from its authorized queue read, including the legacy default when no setting exists. Eliminated first-load client GET and effect-driven setState while keeping same-origin audited PATCH, optimistic success-only state, error/refresh and disabled-busy UI. Independent PG/browser acceptance and TPO route enforcement remain open.

**Learner-name verification search PARTIAL (2026-10-15, chat-9):** The College Admin queue and matching capped CSV now apply escaped, bounded display-name substring search before the 5,001-row safety cap, scoped to active same-college learner verification requests. Private emails/phones/identity fields are never searched or revealed; query form resets safely without effect-driven state writes. Dedicated unit and gated disposable-PG tenant/foreign/name tests authored, not executed. Browser and full legacy search parity remain open.


**Staff verification workspace PARTIAL (2026-10-15, chat-9):** Added /college/verification and shared src/components/verification + src/modules/verification. The route loads College Admin-owned learner Education/Identity requests from DB04 profile_verifications, checked against a persisted active actor membership/role and active learner roles. The reusable queue has Waiting/Sent back/Verified counts, submitted-update attention cues, safe mobile cards, same-college cohort/branch display, section/kind/marksheet/batch/branch/IST waiting-date filters, bounded paging, explicit unavailable/retry states and 5,000-request fail-closed working-set limit. Batch/branch/class selectors currently accept UUIDs rather than native college-owned pickers; search is local to the displayed page, not full-roster search.

**Review and notification PARTIAL:** Submitted/previously verified fields are compared without raw identity values or receipt IDs; document access requires an authorized current-college receipt anchored in the submitted snapshot and the private-storage short-lived read signer with object attestation. A reasoned send-back or verify POST requires same-origin, Zod and expected version; the existing DB04 locked writer records the decision, immutable activity event, and learner in-app notification together. External email/SMS delivery still needs chat-10's shared messaging port, and bulk verify/send-back and bulk messaging are preview-only, not executed.

**TPO switch and export PARTIAL:** College header switch calls a same-origin checked, audited tpoCanVerifyProfiles setting service. This is *not* the TPO verifier-grant management page nor the TPO route owned by chat-2. GET CSV is scoped, caps output at 1,000 formula-neutralized rows, labels IST timestamps and truncation; the UI offers an explicit retry on failure. DB04 table availability is checked before reads/writes; no migrations or src/modules/storage files were changed.

**Open acceptance:** Independent PostgreSQL fixture is authored and explicitly gated on disposable DB03 target plus DB04_VERIFICATION_READY=1; not executed in this chat. Need registered DB04 schema, full database-side indexed pagination/counts beyond 5k, interactive native class/batch/branch choices, complete legacy bulk actions, real outbound messaging integration, Super Admin/TPO mounts by their owners, accessibility/375px browser QA and CI/typecheck/real-PG acceptance. This page remains PARTIAL, never DONE.

## Page: Dashboard
**Empty-source follow-ups PARTIAL (2026-10-15):** Dashboard adds an actionable, zero-only list of deep links to relevant directories. It never calls an unavailable count zero, and deliberately says an empty source is not a setup failure, readiness score or student-performance alarm. Pure-model and existing scoped PG read fixtures cover the projection; exact legacy priority cards and browser acceptance remain open.
**Legacy:** `/college-admin/dashboard`

**Count cards PARTIAL (2026-10-14):** `/college` now renders eight source-authored overview cards (active student/faculty memberships, active courses, non-archived batches, active classes, active teaching assignments, active lecture halls and published jobs). Counts reuse the same signed-in-college `getCollegeSetupChecklist` query as the setup evidence, with central `can()/requirePermission()` and fixed internal deep links. The pure model renders missing values as Unavailable, not zero; failing DB reads surface the dashboard error boundary. These are registered record counts, not attendance, readiness or total hours. Legacy KPI/attention definitions and executed browser/DB acceptance remain open.

**Setup evidence PARTIAL:** `/college` now renders the canonical dashboard setup phases with registered, college-scoped persisted counts for departments, courses, active lessons, published lesson content, programs, program terms, curriculum mappings, cohorts, sections, faculty/student role memberships, active teaching assignments, lecture halls and published jobs. Each step deep-links to its actual College Admin page. Nonzero count means source records exist, never that the complete legacy job or all setup prerequisites are finished. Counts load atomically as a response (no silent partial failure), with dashboard loading/error states. Exact KPI/attention cards, full readiness rules and browser acceptance remain open.
  
Legacy route maps dashboard quick actions to Departments, Courses, Programs, Faculty, Students, Lessons, Content, Semesters, Semester-Course Mapping, Batches, Classes, Batch Promotion, Faculty Assignment, Lecture Halls, Jobs, Hiring Dashboard, Attendance, Assignments, Quizzes and People.

- [ ] Dashboard KPI/summary cards match the legacy AdminDashboardView.
- [ ] Setup/attention/quick-action cards match.
- [ ] Every quick action resolves to the correct College Admin page.
- [ ] College-scoped counts use the active college only.
- [ ] "Admin not assigned to a college" warning state matches.
- [ ] Partial-data failure never renders false zeroes.
- [ ] Loading and responsive card layout are verified.

## Page: Activity Log
**Bounded audit page-size controls PARTIAL (2026-10-15):** College Activity Log permits only 10, 25, or 50 events per cursor page, applied at the current-college read service, preserving the selection across older-page links and date shortcuts. The independent 1,000-row CSV export cap is unchanged. Zod/URL and gated PostgreSQL pagination/role tests authored, pending runtime/browser verification.
**IST recent-activity shortcuts PARTIAL (2026-10-15):** Activity Log now offers Last 7 days and Last 30 days as exact inclusive Asia/Kolkata calendar intervals, plus Clear date range, preserving other actor/module/entity filters while resetting the pagination cursor. Unit tests cover IST midnight and year boundaries, with disposable PG bounded-search role fixtures; browser/runtime and legacy acceptance remain open.
**Non-UUID audit subject lookup PARTIAL (2026-10-15):** Activity Log accepts bounded exact persisted event subject identifiers up to 500 characters, including legacy/composite keys, rather than wrongly insisting every subject is UUID. The export already validates the same 500-character contract. The page label, Zod, URL and scoped PG denial/no-match fixtures were updated; acceptance remains pending.
**Actor-name audit triage PARTIAL (2026-10-15):** Actor display-name substring filtering is now available alongside exact actor UUID; it uses the existing escaped server search before scoped cursor paging and capped CSV export, with no direct user-directory disclosure. Zod, URL and isolated PG no-match/denial fixtures authored; real browser/PG and exact legacy taxonomy parity remain open.
**Scoped audit text search PARTIAL (2026-10-15):** College Admin can search persisted summary, subject label/ID/type and event type before cursor pagination using escaped literal PostgreSQL matching. The capped CSV export carries the query through the existing shared audit read service. Zod/URL and scoped PG positive/no-match/wrong-role fixtures authored; legacy/browser/executed database acceptance remain open.
**Entity-filtered CSV PARTIAL (2026-10-15):** The 1,000-row Activity Log CSV now carries the exact subject ID filter used by the web history. Subject IDs are bounded at 500 characters (audit subjects are not necessarily UUIDs); CSV service keeps server-derived college scope, no caller-supplied tenant selector, and isolated PG own/foreign fixtures. Historical CSV volume, legacy format and executed browser/PG acceptance remain open.

**Triage filters PARTIAL (2026-10-15):** Added registered module, importance and exact event-type filters to college-scoped activity history. The cursor preserves every filter, and capped CSV export receives the same triage selectors. Strict Zod rejects invalid modules/severity; isolated PG coverage checks filtering and cross-college scope. Noise grouping, legacy filter semantics and executed browser/PG acceptance remain open.

**CSV export PARTIAL (2026-10-14):** College Admin Activity Log adds a download matching actor/subject/IST date filters and the broader Activity Center adds module/importance/event filters. Both use the same read service, scoped to the current college, with a 1,000-event cap, spreadsheet-formula neutralization, and explicit truncation footer and HTTP headers. No data is mutated. Exact legacy export column parity and high-volume browser/PG acceptance remain open.

**Read-first PARTIAL (2026-10-14):** `/college/activity` provides explicit actor/entity/date filters, newest-first cursor pagination and `/college/activity/[eventId]` for sanitized audit metadata. Both reads are denied outside the active College Admin membership college. Records are never edited or deleted. Exact legacy event grouping, export, browser and independently executed PostgreSQL acceptance remain open.

**Legacy:** `/college-admin/audit`

- [ ] Timeline/list event taxonomy matches meaningful admin activity.
- [ ] Actor/entity/action/date filters match.
- [ ] Detail drill-in or expandable event context matches.
- [ ] High-volume/noisy activity remains usable via filtering/grouping.
- [ ] Empty/loading/error/stale states match.
- [ ] College boundary is enforced.

## Page: Profile
**Focused personal profile sections PARTIAL (2026-10-15):** College Admin profile follows legacy Personal, Contact, Address and Social sections, with only caller-owned registered name/phone/email displayed. Address/social stay clearly unavailable instead of fabricating or exposing a different learner/faculty profile. Personal-security and separate college-support links remain. Pure projection tests authored; actual address/social persistence and browser acceptance open.

**Legacy:** `/college-admin/profile`

Uses the shared Faculty-profile schema.

- [ ] User summary/profile image/completeness.
- [ ] Resume upload/import/remove.
- [ ] Contacts, social, address, personal details and identity.
- [ ] Aadhaar/PAN storage flows.
- [ ] Experience, education, skills, certifications and languages.
- [ ] Publications and awards.
- [ ] Metadata.
- [ ] Add/edit/delete dialogs/inline edit states for every collection section.
- [ ] Partial profile endpoint failures do not blank the page.
- [ ] Loading/hard-error/retry/visibility-refresh behavior.
- [ ] Learner/Faculty/Mentor/TPO role misroutes are fenced.


## Page: College Contact Profile

**Additional College Admin contact surface (PARTIAL):** `/college/college-profile` is separate from the legacy personal profile. Read public college display name, support email/phone and HTTPS terms/privacy links; confirmed edits use own-college scope, registered branding validation, optimistic version checks and a privacy-safe activity audit in one transaction. Does not expose personal account edits, sensitive identity data, college code/address or visual branding writes. Loading/error states and denial tests authored; executed disposable PostgreSQL/browser acceptance and final scope decision remain open.

## Page: Placement Interview Calendar
**Legacy:** `/college-admin/calendar`

- [ ] Calendar displays interviews across the college.
- [ ] Company/job/date filtering matches.
- [ ] Event click can open the relevant job/applications.
- [ ] Empty/no-college/error states match.
- [ ] Date/time/timezone handling is correct.

# Academic Setup

## Page: Departments
**Legacy:** `/college-admin/departments` using shared `Departments` component.

**College Admin hardening PARTIAL:** Create, rename and archive now use dedicated same-origin-guarded, context-derived College Admin routes with strict Zod, row locks, same-transaction immutable audit and actual historic program/course/faculty-profile dependency guards before archive. A new confirmed restore action is available for archived Programs with active-department/name/code-conflict checks. Legacy UI/browser and independent PG acceptance remain open.

Legacy contract:
- Create New Department card;
- Department Name;
- Existing Departments table;
- search;
- CSV export;
- refresh;
- Edit Department modal;
- delete confirmation;
- delete blockers when children exist;
- load-error retry.

- [ ] Create form and validation match.
- [ ] Existing table columns/metadata match.
- [ ] Search matches.
- [ ] CSV export matches.
- [ ] Refresh behavior matches.
- [ ] Edit Department modal matches.
- [ ] Delete confirmation and dependency blockers match.
- [ ] Department Chair/Vice Chair legacy-noise fields remain absent unless a real current user job exists.
- [ ] Load/error/empty states match.

**W06 College Admin directory implementation (2026-10-10):** the existing College Admin `/college/departments` page now reuses `DepartmentDirectory`, matching the Super Admin search, CSV export, refresh, ten-row pagination and Programs/Courses/Faculty dependency counts. The `/college` layout enforces an active COLLEGE_ADMIN membership; server list uses only the active membership collegeId and the `department.read` service permission check. Each usage lookup is made only on IDs returned by that authorized query. Failed usage lookups show unknown (—), not 0. Legacy `/college-admin/departments` URL/bookmark is not yet aliased; browser behavior is not yet verified. Authored code does not advance this page to DONE.

## Page: Programs
**Legacy duration-years editing PARTIAL (2026-10-15):** The College Admin edit dialog now accepts half-year increments, converts back to persisted terms for the unchanged validated endpoint, and compares normalized values for the unsaved-change prompt. Other admin roles retain terms-first editing. UI/browser acceptance open.

**Legacy duration-years form PARTIAL (2026-10-15):** College Admin create and list now use explicit years with half-year increments, converted exactly to registered integer terms for the existing scoped write service. Validation rejects fractions not representable as terms; no schema changes. Existing edit dialog still terms-first; browser acceptance open.

**Legacy:** `/college-admin/programs`

**Write-side PARTIAL (2026-10-14):** `/college/programs` now uses strict Zod College Admin mutation contracts for create/edit/archive, with current-college ownership, `can()`/`requirePermission()`, isSameOriginRequest on all mutation routes, program-row locks, same-transaction activity audit entries and case-insensitive name/code conflicts. Archive confirmation is required in UI and server body; current/historical cohort, enrollment and curriculum term dependencies all block archive. Edits preserve immutable department and deny lowering duration below authored semester or recorded batch progression. Loading/error/empty states and search/CSV remain. Isolated PostgreSQL success/cross-college/denial tests authored, pending execution here. Legacy duration-years input, blocker detail view and browser acceptance remain open. Dirty program edits now require explicit discard confirmation.

Legacy contract:
- Create Program;
- Department selector;
- Program Name;
- Duration Years;
- Existing Programs;
- search/table toolbar;
- Edit Program modal;
- unsaved-change discard confirmation;
- delete confirmation + blockers for linked semesters/batches/classes;
- department load retry/no-department prerequisite state.

- [ ] Create form fields/validation match.
- [ ] Department dependency and no-department state match.
- [ ] Table/search/pagination match.
- [ ] Edit modal matches.
- [ ] Unsaved-change discard confirmation matches.
- [ ] Delete blockers and confirmation match.
- [ ] Load/error/empty states match.

## Page: Semesters
**Maximum configured credit filter PARTIAL (2026-10-15):** The semesters directory and CSV now support inclusive upper credit bounds, with invalid minimum/maximum combinations rejected. Scoped PostgreSQL fixture and URL/model tests added; execution and browser/mobile acceptance remain open.

**Persisted minimum-credit filter PARTIAL (2026-10-15):** Semester directory and CSV now filter actual configured totalCredits inclusively before pagination, excluding unconfigured/null totals rather than inferring credits. Blank inputs are not coerced to zero. Unit and triggered-progression-safe PG fixture authored; execution/browser evidence open.

**Capped semester CSV PARTIAL (2026-10-15):** Filtered, college-authorized program terms export through a GET-only endpoint with 1,000-row limit, spreadsheet formula neutralization and explicit truncation headers/footer. Uses existing tenant-scoped pagination and a disposable-PostgreSQL tenant/role fixture; executed PG/browser and exact legacy column acceptance remain outstanding.

**Exact semester-number filter PARTIAL (2026-10-15):** Semesters now have bounded 1–24 term-number filtering in the college-scoped directory, URL pagination, accessible form and positive/negative isolated-Postgres fixture checks. Real PG/browser execution and legacy management parity still require acceptance.

**Subquery column collision repair PARTIAL (2026-10-15):** Semester directory projects distinct SQL aliases for term and program IDs/names, preserving the existing paginated API while avoiding PostgreSQL ambiguous-column errors (42702). Existing disposable-PG scope fixture now checks joined program identity; execution, legacy field comparison and mobile/browser acceptance remain outstanding.

**Term edit concurrency PARTIAL (2026-10-14):** The existing semester edit action now requires an explicit confirmed millisecond-safe updatedAt token and rejects stale writes. Deactivating a registered program term is blocked when its mapped curriculum courses exist or any active/non-archived cohort progression currently references its term number. Parent scope and immutable activity audit remain transactional; unit and in-test-fixture PostgreSQL stale/foreign-role/dependency checks updated. Exact legacy parity and executed gates remain open.

**Legacy:** `/college-admin/semesters`

**Academic-period lifecycle PARTIAL:** The separate `/college/academics` Academic Period table now requires confirmation for close/reopen. Registered `academic_periods` rows are locked in one transaction, active sections/scheduled sessions block closure, a stale or foreign-college target is rejected, and the same transaction writes immutable activity events. Reopen is explicit CLOSED → ACTIVE, distinct from PLANNED → ACTIVE. This does not equate an academic period with a numbered semester; browser/real-DB execution remains pending.

**Write-side PARTIAL (2026-10-14):** `/college/semesters` now supports create/edit/delete on registered DB-0050 `program_terms` via `/api/academics/semesters` and `/api/academics/semesters/[semesterId]`. Strict Zod requires semester name and validates configured credits/term number; editing keeps program and term number immutable. College role and central `academics.manage` scope are verified from request context, with same-origin checks on every mutation. Service locks program/term records in a transaction, validates program-duration limits, denies duplicate term numbers, and blocks deletion for mapped curriculum courses or any non-archived program cohort; all three mutation outcomes write an `activity_events` row in the same transaction. Inline edit and explicit deletion confirmation provided with honest errors. Added unit and disposable-PostgreSQL success/cross-tenant denial tests. Legacy dialog styling, final dependency inventory, independent executed lint/typecheck/DB/browser evidence remain open.

**Read-first PARTIAL (2026-10-14):** `/college/semesters` lists registered DB-0050 `program_terms` by program and term number, with mandatory authored name, isActive state, configured credits and only same-college `program_term_courses` counts. Uses server-side search, program/status filters, 25-row pagination and honest empty/loading/error states. This is a direct persisted term list, not an academic-period proxy. Legacy create/edit/delete, dependency confirmation, active-state transitions and UI/browser/database acceptance remain open.

Legacy contract:
- Program selector;
- Semester Number;
- Total Credits;
- mandatory Semester Name;
- Existing Semesters;
- filter by Program;
- search/table toolbar;
- Edit Semester modal with immutable program/semester number and editable credits/name/status;
- delete confirmation.

- [ ] Create fields/validation match, including mandatory Semester Name.
- [ ] Program prerequisite/selector behavior matches.
- [ ] Existing table/filter/search match.
- [ ] Edit modal fields and immutable fields match.
- [ ] Status edit behavior matches.
- [ ] Delete confirmation/dependency handling matches.
- [ ] Load/error/empty states match.

## Page: Semester–Course Mapping
**Exact saved course-code filter PARTIAL (2026-10-15):** College Admin persisted offering mappings now accept bounded exact course-code matching before totals and pagination, carried into CSV and URL state. Positive/empty PostgreSQL fixture and validation tests authored; numbered-term legacy semantics and browser acceptance remain open.

**Persisted offering lifecycle filter PARTIAL (2026-10-15):** Course-mapping directory and CSV can now filter exact ACTIVE/ARCHIVED offering states before college-scoped pagination, independently of CORE/ELECTIVE type. Uses the authoritative offering-state enum, strict URL schema, safe export retention and gated own-college PG fixture assertions. Numbered program-term mapping and executed/browser parity remain open.

**Offering mapping CSV PARTIAL (2026-10-15):** Own-college academic-period offerings can be exported with the same persisted program/period/type filters as the directory, formula-safe capped 1,000 rows, truncation headers and status fields. This is explicitly *not* the separate numbered-term curriculum mapping export. Gated PostgreSQL in-test-fixture success/foreign/wrong-role coverage authored; runtime and legacy column acceptance open.

**Registered offering-type filter PARTIAL (2026-10-15):** College Admin can filter mapped course offerings by CORE/ELECTIVE using the shared authoritative type enum, strict URL state and same-college SQL filtering before pagination; isolated PostgreSQL fixture checks the positive and excluded type. The separate numbered-semester mapping workflow and executed PG/browser parity remain outstanding.

**Offering-mapping subquery repair PARTIAL (2026-10-15):** The College Admin mapping list now projects unique names for course/cohort/program/period identifiers, titles and codes to avoid PostgreSQL 42702 in paginated reads; isolated PG test additionally asserts the ancestry fields. Dedicated program-term assignment mutations and executed PG/mobile/legacy parity evidence remain open.

**Legacy:** `/college-admin/semester-courses`

**Read-first PARTIAL:** `/college/semester-courses` lists persisted college-owned course offerings by cohort/program/academic period with CORE/ELECTIVE type, credits, filters and offering links. Academic periods are not yet certified as legacy numbered semesters; no create/remove mapping writes and no complete browser parity.

- [ ] Program + semester context selectors match.
- [ ] Existing course mappings table/list matches.
- [ ] Add/mapping form supports course, offering/type and required metadata present in legacy.
- [ ] Remove/unmap confirmation matches.
- [ ] Duplicate mapping validation matches.
- [ ] CORE/ELECTIVE semantics remain correct.
- [ ] Search/filter/loading/empty/error states match.

## Page: Batches
**Progression record availability PARTIAL (2026-10-15):** The batch directory now distinguishes registered progression rows from absent records rather than inferring progression; the filter applies to pagination and CSV, with strict enum input and tenant-scoped PG assertions. Trigger-created progression is respected; execution/mobile acceptance open.

**Recorded term progression filter PARTIAL (2026-10-15):** Batch view and capped CSV can isolate the exact migrated currentTermNumber from cohort_progression_state with 1–24 validation, same-college count/pagination and no inferred progression for missing rows. PostgreSQL fixture uses main\u0027s ON CONFLICT trigger-safe pattern; real execution/browser proof remains outstanding.

**Capped batch CSV PARTIAL (2026-10-15):** Batch catalogue now exports current-college, filter-matched persisted program/progression and active counts in a spreadsheet-neutralized CSV (1,000 max, explicit truncation headers/footer). The in-test-fixture PostgreSQL suite includes own/foreign/wrong-role export assertions; executed CI, mobile and legacy export column parity remain outstanding.

**Academic-year progression filter PARTIAL (2026-10-15):** Batch list can select the exact persisted progression academic-year start, rather than deriving a year from names or start periods; strict bounds, URL paging, absent-progression exclusion and positive/negative isolated PostgreSQL checks are authored. Browser and integration execution remain open.

**Subquery column collision repair PARTIAL (2026-10-15):** Batch directory now aliases cohort/program/starting-period IDs, names and codes individually before pagination (PostgreSQL 42702); the existing tenant-isolated fixture asserts joined identity and progression shape. No executed PostgreSQL/browser closure or legacy cohort form parity is claimed.


**Guarded batch removal PARTIAL (2026-10-14):** The Batches directory now offers an explicitly confirmed Remove action only for PLANNED cohorts. It archives the cohort instead of hard-deleting registered progression/state history; the transaction locks the college-owned cohort, applies millisecond-normalized optimistic updatedAt token, blocks any section, learner enrollment, course offering, progression event or advanced progression state, and appends immutable activity audit. Strict same-origin DELETE, unit model and gated disposable-PostgreSQL success/foreign/wrong-role/stale/dependency fixtures are authored. Remediation for retired batch codes (unique codes remain reserved), full legacy hard-delete policy and browser/real PG acceptance remain open; not DONE.

**Legacy:** `/college-admin/batches`

**Write-side PARTIAL (2026-10-14):** `/college/batches` adds a validated create form and confirmed edit dialog (name, code, expected end period) for PLANNED cohorts via dedicated `/api/college/batches` endpoints. Registered program, period, cohort and dependency rows are enforced under College Admin college scope; parent/subject locks, case-insensitive duplicate-name/code checks, same-college period date windows, child and progression-history guards, transactional audit and explicit cross-college denial are implemented. Create/edit do **not** allow start-period/program changes, bypass archived parents, mutate an existing progression state, or imply promotion. Legacy delete, student/class modal and move, academic-year recalculate, exact status/edit parity, browser/PG execution and full acceptance remain open.


**Read-first PARTIAL (2026-10-14):** `/college/batches` lists persisted cohorts with program, start academic period, status, and optional DB-0051 `cohort_progression_state` (current term and academic year), alongside scoped counts of active sections and active learner enrollments. Server-side search, program/status filters, 25-row pagination, explicit absent progression and empty/error states included. A cohort period is not interpreted as an exact legacy batch end date. Legacy create/edit/delete, learner drill-in/moves, promotion preview and true current-class attendance remain open. No database/browser acceptance claimed.

Legacy contract audited:
- Program;
- Batch Name;
- Start Date / End Date;
- Academic Year with recalculate helper;
- Status when editing;
- Program/status filters;
- Create/Edit/Delete;
- discard-edits confirmation;
- Students modal;
- class selector + student search;
- Move Student modal to another class;
- delete blockers when child data exists.

- [ ] Create form fields/validation match.
- [ ] Academic-year derivation/recalculate behavior matches.
- [ ] Status behavior matches.
- [ ] Program/status filters and table toolbar match.
- [ ] Edit modal + discard confirmation match.
- [ ] Delete blockers/confirmation match.
- [ ] Students modal is implemented.
- [ ] Class selector/student search inside Students modal match.
- [ ] Move Student modal and destination validation match.
- [ ] Student move history/state remains auditable.
- [ ] Loading/prerequisite/error states match.

## Page: Classes / Sections
**Department-code Classes filter PARTIAL (chat-3, 2026-10-15):** Exact bounded code is matched against the owning program department under existing college join, before paging and in capped CSV. Source unit and isolated PG own/foreign/absence tests authored, but not executed; browser/legacy parity open.

**Period end date on or before PARTIAL (chat-3, 2026-10-15):** Inclusive ISO calendar-date filtering uses persisted academic-period end boundary, not inferred class or attendance dates. Page/CSV selector and unit/isolated PostgreSQL tenant regression fixtures authored; runtime/browser validation remains open.

**Period start date on or after PARTIAL (chat-3, 2026-10-15):** Inclusive ISO calendar-date filtering uses persisted academic-period start boundary, not inferred class or attendance dates. Page/CSV selector and unit/isolated PostgreSQL tenant regression fixtures authored; runtime/browser validation remains open.

**Authored section course deliveries PARTIAL (chat-3, 2026-10-15):** New persisted Section relationship presence/absence triage queries courseSectionDeliveries under College Admin's own-program/college joins. No missing event, assignment or course record is invented. Filter carries into paging/capped CSV; strict unit and isolated PostgreSQL own/foreign fixtures authored. Runtime/browser verification remains open.

**Current section Faculty assignments PARTIAL (chat-3, 2026-10-15):** New persisted Section relationship presence/absence triage queries sectionFacultyAssignments under College Admin's own-program/college joins. No missing event, assignment or course record is invented. Filter carries into paging/capped CSV; strict unit and isolated PostgreSQL own/foreign fixtures authored. Runtime/browser verification remains open.

**Saved section schedule PARTIAL (chat-3, 2026-10-15):** New persisted Section relationship presence/absence triage queries sectionScheduleEvents under College Admin's own-program/college joins. No missing event, assignment or course record is invented. Filter carries into paging/capped CSV; strict unit and isolated PostgreSQL own/foreign fixtures authored. Runtime/browser verification remains open.

**Exact cohort name PARTIAL (chat-3, 2026-10-15):** College-scoped exact persisted exact cohort name matching now applies before pagination and to the matching capped CSV. Bounded URL, unit and disposable-PostgreSQL tenant/denial fixtures authored; browser/runtime verification remains open.

**Exact class name PARTIAL (chat-3, 2026-10-15):** College-scoped exact persisted exact class name matching now applies before pagination and to the matching capped CSV. Bounded URL, unit and disposable-PostgreSQL tenant/denial fixtures authored; browser/runtime verification remains open.

**Exact program code PARTIAL (chat-3, 2026-10-15):** College-scoped exact persisted exact program code matching now applies before pagination and to the matching capped CSV. Bounded URL, unit and disposable-PostgreSQL tenant/denial fixtures authored; browser/runtime verification remains open.

**Academic period status PARTIAL (chat-3, 2026-10-15):** Added a college-scoped persisted academic period status selector for the Classes directory, preserved across page links and capped CSV exports. Strict query validation, source unit checks and isolated PostgreSQL success/denial fixtures authored; executed DB/browser acceptance remains open.

**Class capacity combination validation PARTIAL (2026-10-15):** Contradictory minimum/maximum seat filters and numeric bounds combined with UNSET capacity are rejected consistently by the directory and CSV validation; valid adjacent bounds remain supported. Unit tests authored; execution open.
**Unconfigured capacity filter PARTIAL (2026-10-15):** Admin Classes now distinguish NULL configured class capacity from numeric seat counts before pagination/export. Filter state is URL-persistent and strictly validated; own-college fixture checks genuine unset rows rather than treating them as zero. Acceptance pending.

**Batch-code filter PARTIAL (2026-10-15):** Classes now support an exact batch/cohort-code filter against persisted in-college records. Filter state is preserved in pagination and the capped CSV, with bounded input and own-college PostgreSQL fixture assertions. Browser/mobile acceptance still open.

**Configured upper-seat threshold PARTIAL (2026-10-15):** Classes list and capped CSV now support inclusive maximum configured Section capacity, separate from minimum capacity and registered active enrollment counts. Null capacities are not treated as zero; typed URL, blank-field and isolated PG boundary tests authored. Runtime/browser acceptance remains open.

**Class capacity filter PARTIAL (2026-10-15):** Admin Classes directory and capped CSV export now share strict minimum-configured-capacity filtering against saved Section capacity (unknown/null does not match), with URL retention and PG fixture for boundary inclusivity. No real PG/browser gates run; recurring scheduling and full parity remain open.

**Section lifecycle PARTIAL (2026-10-14):** The College Admin Classes directory now adds confirmed ACTIVE/ARCHIVED transitions for persisted Sections. Dedicated same-origin PATCH uses exact college and role permission, row lock, millisecond-truncated updatedAt token, an all-history dependency blocker covering enrollments, Faculty assignments, schedules and course deliveries, parent eligibility/active name-code collision on restore, and same-transaction immutable audit. Authored pure unit and disposable PG success, cross-college NOT_FOUND, wrong-role, stale-token and dependency tests. Executed real DB/browser acceptance and legacy/archive versus hard-delete semantics remain open.

**Legacy:** `/college-admin/classes`

**Recurring execution PARTIAL (2026-10-14):** `/college/classes/recurring-preview` adds an explicit, confirm-gated execution of its IST weekday pattern with a section-updatedAt millisecond token; the server rechecks current Section/Period/Faculty/Hall college scope, persisted section/faculty/hall overlaps and aborts the entire transaction on any conflict. The inserted session IDs and immutable section activity audit are returned only for a full success. Pure-model tests and disposable-PG fixture success/foreign-college/wrong-role/stale-token tests authored. Limits: the advisory lock serializes this writer by college+Section, but independently managed faculty/hall scheduling writers require broader shared lock policy or exclusion constraints; no cross-writer race guarantee or real CI/browser closure is claimed. Recurrence editing, bulk failure reports and course attachment remain outstanding.

**Recurring preview PARTIAL (2026-10-14):** `/college/classes/recurring-preview` accepts a selected class, weekday pattern, date range (maximum 93 days), IST-local start/end and optional in-college Faculty/lecture hall; it expands timestamps without server timezone dependence and reads migrated `section_schedule_events` to identify overlapping class, Faculty and hall sessions. It never writes sessions and is not an execution success forecast; the write must revalidate conflicts atomically. Confirmation, session materialization, linked course, historical series report and browser acceptance remain open.

**Write-side PARTIAL (2026-10-14):** `/college/classes` adds a confirmed College Admin create/edit flow through strict Zod, college-scoped, same-origin POST/PATCH routes. Transactions serialize with the cohort and period ancestry, enforce unique active class name/code, valid cohort-period range, capacity not below active enrolled learners and dependency guards on identity change, and append one actor audit event per success. Cancel/discard confirmation and empty/loading/error states retained. Legacy recurring scheduling, archival, detailed min/max students, browser/database acceptance and full parity remain open.

**Read-first PARTIAL (2026-10-14):** `/college/classes` now shows migrated class/section rows with program, cohort, academic period, configured capacity, active enrollments and lifecycle state. Includes program/status filters, search, 25-row pagination, college-scoped permissions, honest empty/loading/error states and a link to the existing section detail. Active enrollment counts use joined learner program/section enrollments with current in-college LEARNER memberships; no attendance, scheduled-session, or capacity-utilization metric is inferred. Legacy create/edit/delete, recurring-series scheduling, conflicts, moving learners, real-DB execution and browser parity remain open.

Legacy contract audited:
- Program;
- Batch;
- Class/Section Name;
- Description;
- min/max students;
- filters by program/batch;
- Create/Edit/Delete;
- unsaved edit confirmation;
- Schedule recurring sessions modal;
- schedule fields: title, date range, start/end, repeat days;
- optional course/faculty/lecture hall;
- series result report with failed rows.

- [ ] Create form fields/validation match.
- [ ] Program→Batch dependency matches.
- [ ] Capacity bounds validation matches.
- [ ] Filters/search/table match.
- [ ] Edit modal + discard confirmation match.
- [ ] Delete confirmation/consequences match.
- [ ] Schedule button exists where allowed.
- [ ] Recurring-session modal fields match.
- [ ] Course/Faculty/Lecture Hall option failures are recoverable.
- [ ] Created/failed series result summary matches.
- [ ] Schedule conflicts are surfaced, not silently dropped.

## Page: Batch Promotion
**Preview-binding PARTIAL (2026-10-14):** A confirmed PROMOTE now supplies the exact server-preview learner count, next term and academic year, and the transactional apply rechecks these after its normal blocker/version checks. A changed preview rejects with PROMOTION_PREVIEW_CHANGED instead of silently promoting a different cohort state. Unit and disposable PG stale-preview tests authored; the existing all-or-nothing progression history/audit remains. Graduation and independently executed browser/PG gates remain outstanding.

**Legacy:** `/college-admin/batch-promotion`

**Write-side PARTIAL (2026-10-14):** `/college/batch-promotion` retains the server-authored preview of up to 2,000 learner blocker checks and adds explicit confirmation for eligible **PROMOTE** cases. Same-origin POST requires strict Zod, College Admin and college scope. The transaction locks cohort/progression/enrollments, reruns the preview, rejects blockers and stale expected versions, updates term/year and version (+1), inserts registered cohort progression history and college-scoped immutable activity audit. No inferred period/class transfer. **GRADUATE** remains unavailable because registered history only permits PROMOTION (+1) and CORRECTION (same term); exact legacy/browser/runtime acceptance remains open.


Legacy contract:
- select Program;
- show/hide completed/inactive;
- batch table/current semester;
- Promote;
- Graduate when at max semester;
- server preview before promotion;
- Promotion modal;
- academic year override;
- student/class counts;
- invalid-preview/blocker alerts;
- explicit Graduate confirmation.

- [ ] Program filter and show-all toggle match.
- [ ] Promotion eligibility calculation matches.
- [ ] Server-side preview is required before mutation.
- [ ] Promotion modal counts/consequences match.
- [ ] Academic-year override validation matches.
- [ ] Invalid/blocking preview states match.
- [ ] Promotion mutation updates learner progression/class state atomically.
- [ ] Graduate confirmation and consequences match.
- [ ] Loading/error states match.

## Page: Lecture Halls
**Upcoming-schedule filter PARTIAL (2026-10-15):** Administrators can isolate rooms with or without any future SCHEDULED class. The database predicate applies before pagination and capped CSV export; missing sessions are never interpreted as occupancy. Bounded choices and PostgreSQL fixture added; real execution/mobile review remain open.

**Maximum configured seats filter PARTIAL (2026-10-15):** College Admin rooms support an inclusive maximum-capacity bound, alongside the existing minimum, across the list, pagination and filter-matched CSV. Contradictory bounds are rejected. Added unit and disposable-PostgreSQL fixture assertions; execution and mobile/browser acceptance remain pending.

**Lecture hall CSV PARTIAL (2026-10-15):** The filter-matched College Admin hall directory exports up to 1,000 authorized room rows including configured seats/department/upcoming persisted scheduled-class count, neutralized for spreadsheet formulas with truncation indicators. CSV does not disclose scheduling contacts or personal data. Gated existing hall fixture adds own/foreign/role assertions; executed and UI/browser proof remain open.

**Seating-capacity filter PARTIAL (2026-10-15):** Room directory now accepts 1–5000 minimum configured seats, enforced by the shared scoped list query before pagination and persisted in filter links. Isolated PG fixture checks inclusive boundaries, with existing tenant and wrong-role denials unchanged. Execution and mobile/browser acceptance still open.

**Hall cancellation PARTIAL (2026-10-14):** A confirmed per-session Cancel action on the hall availability page now persists SCHEDULED→CANCELLED, takes a required reason and millisecond-safe updatedAt token, locks the owning college hall and session, and blocks sessions already started or linked to attendance/course-delivery evidence. One immutable section audit event is written transactionally. Same-origin PATCH, pure-model test and disposable-PostgreSQL cross-college, wrong-role, stale/evidence and positive fixtures authored. Rescheduling, cross-writer universal Hall locking and real browser/database execution remain open; PARTIAL only.

**Hall Faculty concurrency PARTIAL (2026-10-14):** The single-session booking writer now locks the selected Faculty account, membership and role exclusively before reading schedule overlap. Requests for the same Faculty in different halls/classes serialize through that lock; disabled Faculty are rejected. Pure active-identity tests and an in-test two-hall/two-class PostgreSQL concurrent overlap witness added. This covers this booking writer only: other schedule writers still need a shared lock convention or registered exclusion constraints. PostgreSQL execution remains blocked by sandbox user restrictions; legacy/browser verification and full rescheduling remain open.

**Hall booking PARTIAL (2026-10-14):** The per-hall IST availability page adds a confirmed single-session write with a validated IST-local date/time/title, same-college Section and optional Faculty, millisecond-normalized Section optimistic token, configured class capacity vs hall capacity guard, and fresh persisted SCHEDULED overlap checks for hall, Section or Faculty. It locks Section then Hall through the audit/insert transaction and advances the Section token; appends a college-scoped immutable event. Dedicated same-origin POST, pure time/capacity model tests and disposable PostgreSQL success, cross-college denial, wrong role, stale and overlap tests authored. Other scheduling writers without shared Hall locks or exclusion constraints can still race; exact legacy workflow and real DB/browser proof remain open; this is not guaranteed booking availability.


**IST hall availability PARTIAL (2026-10-14):** Each hall links to `/college/lecture-halls/[hallId]` for a strict 1–31-day IST date-range read of registered SCHEDULED section sessions. Own-college hall and academic lineage checks, not-found tenant concealment, persisted hall capacity, nullable configured class capacity, overlapping booking flags and configured capacity conflict badges are included. Overlap is a diagnostic of current persisted records, not guaranteed bookability or actual student occupancy. Rows are capped at 500 with truncation warning; pure tests and gated disposable-PostgreSQL read/denial fixtures authored. Runtime and browser acceptance remain open.
**Legacy:** `/college-admin/lecture-halls`

**Read/manage PARTIAL (2026-10-14):** `/college/lecture-halls` uses registered `lecture_halls` with the existing add/edit/archive/restore dialogs and college-scope API writes. Added server-side hall-name, status, room-type and department filtering with 25-row pagination, separate filtered/unfiltered empty messages, loading/error boundaries and dashboard setup navigation. Archived and active halls are included by default. No new write route was introduced; the existing create/PATCH routes enforce `isSameOriginRequest`. The legacy delete semantics (vNext uses archive), detailed room location, complete scheduling-conflict UI, executed new tests and browser parity remain open.

- [ ] Hall list/table fields match.
- [ ] Create Hall form fields/validation match.
- [ ] Edit Hall modal matches.
- [ ] Delete confirmation/dependency conflicts match.
- [ ] Search/filter/pagination match.
- [ ] Capacity/location/identifier semantics match.
- [ ] Schedule-conflict-related data needed by Classes is available.
- [ ] Loading/empty/error states match.

## Page: Electives
**Elective linked period ends on or before PARTIAL (chat-3, 2026-10-15):** Inclusive validated ISO date filter uses only the persisted same-college linked academic period; slots without a period do not match a dated query. Page navigation and tenant-scoped capped CSV share the predicate; unit/disposable-PostgreSQL fixtures authored. Browser, executed PG and legacy workflow acceptance remain open.

**Elective linked period starts on or after PARTIAL (chat-3, 2026-10-15):** Inclusive validated ISO date filter uses only the persisted same-college linked academic period; slots without a period do not match a dated query. Page navigation and tenant-scoped capped CSV share the predicate; unit/disposable-PostgreSQL fixtures authored. Browser, executed PG and legacy workflow acceptance remain open.

**Elective description availability PARTIAL (chat-3, 2026-10-15):** Recorded versus NULL description presence, without disclosing freeform text. The filter is included in page navigation and the tenant-scoped CSV with unit/PG fixtures authored; runtime and browser acceptance remain open.

**Linked academic-period lifecycle PARTIAL (chat-3, 2026-10-15):** Persisted same-college period state, with unlinked slots retained only for ALL. The filter is included in page navigation and the tenant-scoped CSV with unit/PG fixtures authored; runtime and browser acceptance remain open.

**Semester through PARTIAL (chat-3, 2026-10-15):** Bounded semester maximum against persisted slot term (not learner progression). The filter is included in page navigation and the tenant-scoped CSV with unit/PG fixtures authored; runtime and browser acceptance remain open.

**Semester from PARTIAL (chat-3, 2026-10-15):** College Admin can filter by persisted elective semesterNumber with inclusive numerical constraints, validated in URL and CSV export, scoped by the owning College. Authored unit and isolated-PG positive/negative fixtures; executed database/browser acceptance and full legacy parity outstanding.

**Maximum allowed elective choices PARTIAL (chat-3, 2026-10-15):** College Admin can filter by persisted elective maxPick with inclusive numerical constraints, validated in URL and CSV export, scoped by the owning College. Authored unit and isolated-PG positive/negative fixtures; executed database/browser acceptance and full legacy parity outstanding.

**Minimum required elective choices PARTIAL (chat-3, 2026-10-15):** College Admin can filter by persisted elective minPick with inclusive numerical constraints, validated in URL and CSV export, scoped by the owning College. Authored unit and isolated-PG positive/negative fixtures; executed database/browser acceptance and full legacy parity outstanding.

**Elective owning department code PARTIAL (chat-3, 2026-10-15):** Exact, bounded persisted Electives matching now applies before pagination, carries through URL navigation and the scoped capped CSV export. Unit and isolated PostgreSQL own/foreign/absent fixtures authored, pending execution and browser/oracle parity.

**Exact elective program code PARTIAL (chat-3, 2026-10-15):** Exact, bounded persisted Electives matching now applies before pagination, carries through URL navigation and the scoped capped CSV export. Unit and isolated PostgreSQL own/foreign/absent fixtures authored, pending execution and browser/oracle parity.

**Exact elective slot name PARTIAL (chat-3, 2026-10-15):** Exact, bounded persisted Electives matching now applies before pagination, carries through URL navigation and the scoped capped CSV export. Unit and isolated PostgreSQL own/foreign/absent fixtures authored, pending execution and browser/oracle parity.

**Elective maximum credit filter PARTIAL (2026-10-15):** Inclusive upper credit-bound filtering now applies to persisted elective slots in the college directory and capped CSV; combined contradictory credit bounds fail validation, URL pagination retains the bound. Unit test added; scoped PG/browser execution remains outstanding.

**Minimum configured-credit selector PARTIAL (2026-10-15):** Elective slot catalogue and capped CSV now filter by saved slot credits before pagination; bounded numeric input and blank-value handling distinguish unconfigured filters from invalid zero. Unit and isolated PG positive/negative thresholds authored; browser and runtime gates open.

**Elective slot CSV PARTIAL (2026-10-15):** College Admin can export selected current-college slot search/program/status/semester matches with recorded pick limits and offerings, capped at 1,000 rows, formula-neutralized and explicit truncation. The isolated PostgreSQL own/foreign/wrong-role fixture is extended for this endpoint. This does not imply learner selections or finalized enrollment; executed acceptance remains open.

**Semester-scoped elective filter PARTIAL (2026-10-15):** College elective slot catalogue now filters on the persisted semester number (1–24) with route-preserved pagination and strict class/elective filter separation. Isolated PG fixture checks included/excluded terms and still checks foreign-college and wrong-role denials. Executed and browser acceptance, selection finalization remain open.

**Lifecycle PARTIAL (2026-10-14):** College Admin elective slot rows expose confirmation-gated ARCHIVE/RESTORE using strict Zod, same-origin PATCH, college-scoped active role and revalidated persisted actor, integer version CAS and immutable activity audit. Archive is blocked when any active offering or persisted learner selection exists; restore requires a currently active parent program and eligible IST academic period. The registered slot only supports ACTIVE/ARCHIVED; selection FINALIZE was intentionally not invented. Pure-model/unit and disposable PG own/foreign/wrong-role/stale tests authored, unexecuted. Full selection/finalization mechanics, UI/browser acceptance and real PG gates remain open.

**Legacy:** `/college-admin/electives`

**Write-side PARTIAL:** `/college/electives` includes confirmed slot create/edit via same-origin POST/PATCH, own-college program/period checks, versioned update, enrollment-impacting edit guard, atomic audit, unit and gated DB tests. Feature enablement, full offering capacity, learner choice/finalize and exact legacy/browser parity remain open.

**Read-first PARTIAL (2026-10-14):** `/college/electives` now shows registered DB-0037 elective slots with program, term, optional academic year/period, choice constraints, credits, status and counts of active college-owned course offerings. Search, program/status filters, 25-row pagination, loading/error and honest empty states included. Presence of a slot does **not** verify the college feature switch or a learner choice window. Feature-disabled state, creation/editing, selection/enrollment, capacity enforcement, close/finalize, executed DB/browser parity remain open.

- [ ] Feature-disabled state matches ("Electives is turned off for this college").
- [ ] Elective offerings/list match.
- [ ] Create/edit lifecycle and eligibility/selection fields match.
- [ ] Student choice/enrollment management matches.
- [ ] Capacity/selection rules match.
- [ ] Close/finalize actions and confirmations match.
- [ ] Loading/empty/error states match.

## Page: Attendance
**Legacy:** `/college-admin/attendance`

**Department attendance export PARTIAL:** `/college/attendance/departments` now exposes the active college correction policy in read-only form and a server-scoped CSV export of departmental marked-session and explicit status-record counts; formula-like cells are neutralized. These metrics do not imply learner-level attendance percentages. Exact legacy CSV, browser and executed PostgreSQL checks remain open.


**Department-summary read-first PARTIAL (2026-10-14):** `/college/attendance/departments` reports marked scheduled-session counts and explicit attendance status rows by the authenticated college department, using registered session/event/record tables. It cannot derive true attendance percentages, because PRESENT can be implicit and eligible learner/session denominators are not computed. Search, pagination, loading/error and honest no-data states are included. Exact legacy reporting, database runtime and browser acceptance remain open.

Legacy contract audited:
- Attendance Policy card;
- retroactive marking window;
- exam-eligibility threshold;
- Class selector;
- Course selector;
- "only courses taught to this class" vs all college courses;
- month previous/next;
- monthly learner grid;
- per-cell state;
- session chooser modal when multiple sessions/day;
- attendance record modal;
- marked by/at;
- correction: Mark present / Mark absent;
- correction policy;
- CSV export;
- empty/error/prerequisite states.

Implementation note (2026-10-14): `/college/attendance` has a policy card, Class/Course filters and all-college catalogue toggle, monthly grid/day chooser, record drawer, status corrections and escaped CSV export. Existing Faculty-compatible PRESENT-as-no-record semantics and super-admin acting-college scope are retained. These checks remain open pending disposable-PostgreSQL test execution, exact legacy oracle/source comparison, and desktop/mobile browser verification.

- [ ] Attendance policy values are visible/authoritative.
- [ ] Class/Course selectors and class-course narrowing match.
- [ ] Show-all-courses toggle matches.
- [ ] Month navigation matches.
- [ ] Grid semantics/percentages match.
- [ ] Session chooser modal matches.
- [ ] Attendance record modal matches.
- [ ] Marked-by/marked-at audit metadata is shown.
- [ ] Correction window is enforced server-side.
- [ ] Correction actions and confirmations match.
- [ ] CSV export matches.
- [ ] Empty/prerequisite/error/loading states match.

# Courses & Content

**Offering lifecycle PARTIAL (2026-10-14):** The existing offering page supports confirmed path publish/unpublish, denying publish without active lessons and unpublish once learner progress/submissions/attempts are present. Mutation and audit share a transaction; exact legacy behavior and browser/real-PG acceptance are not yet confirmed.

## Page: Courses
**Legacy:** `/college-admin/courses`

**Write-side hardening PARTIAL:** Existing `/college/courses` create/edit/archive remains the operational entrypoint, with same-origin API guards, strict Zod, central `can()`/`courses.manage`, and database locks where needed. Create, edit and archive now record immutable college-scoped activity in the same transaction as their canonical row mutation; editing checks live department ownership under lock, while archive blocks active offerings. Confirmation UI already exists for archive. Existing course catalogue DONE status is not changed; legacy field-by-field and independently executed DB/browser acceptance are still open.

- [ ] Course catalogue table/card fields match.
- [ ] Create Course form/modal matches.
- [ ] Edit Course flow matches.
- [ ] Archive/delete/deactivate consequences match.
- [ ] Search/filter/pagination match.
- [ ] Course detail/deep links match.
- [ ] Duplicate code/name validation matches.
- [ ] Loading/empty/error states match.

## Page: Course Detail / Offering
**In this course PARTIAL (2026-10-15):** Offering workspace now shows counts of existing shared lessons, videos (VIDEO/YOUTUBE), resources, live classes, assignments and quizzes. These are persisted authored-record counts, not published or student-visible totals, with a responsive small-screen grid and pure-model tests. Section-specific content/legacy acceptance and browser checks remain open.

**Offering metadata PARTIAL (2026-10-14):** College Admin `/college/courses` offers confirmation-gated edit of persisted offering CORE/ELECTIVE type, optional credits and display order. Dedicated same-origin PATCH uses College Admin college scope, row and parent guards, millisecond-truncated optimistic updatedAt comparison, an active-delivery dependency fence for credit/type changes, monotonic write token, and immutable same-transaction audit. Pure-model and isolated PostgreSQL success/foreign/wrong-role/stale/dependency tests authored; executed CI/browser acceptance and exact legacy action parity remain open.

**Legacy:** `/college-admin/courses/[id]`

- [ ] Course identity/metadata sections match.
- [ ] Offering/semester/class associations match.
- [ ] Teaching assignments match.
- [ ] Learning/content summary matches.
- [ ] Edit/lifecycle actions and confirmations match.
- [ ] Access/not-found/error states match.

## Page: Lessons
**Live-content coverage PARTIAL (chat-3, 2026-10-15):** A true persisted LIVE_CLASS authoring-presence facet is now available for Lessons and its college-fenced CSV; it does not imply a meeting took place or expose links. Authored unit and isolated PG cases require execution and browser parity review.

**Lesson-resource coverage PARTIAL (chat-3, 2026-10-15):** The registered RESOURCE kind can be filtered as present or absent before College Admin pagination and export; the operation never fetches private storage identifiers. Unit/gated-PG source tests authored, execution and browser parity open.

**Video authoring coverage PARTIAL (chat-3, 2026-10-15):** College Admin lesson list can isolate absence/presence of VIDEO or YOUTUBE metadata using registered in-college records, including CSV. This is not playback or learner access; PG/browser acceptance open.

**Hidden published content triage PARTIAL (chat-3, 2026-10-15):** Finds persisted PUBLISHED rows with visibleToStudents=false before tenant-scoped paging/CSV; not a learner authorization or playback test. Unit/PG fixtures authored; not executed, browser/legacy acceptance open.

**Content audience facet PARTIAL (chat-3, 2026-10-15):** Lessons can filter registered shared content (NULL delivery) separately from section-bound records before pagination and safe CSV; no student permissions are inferred. Unit and gated PostgreSQL test source added, not executed; browser acceptance open.

**Saved content lifecycle PARTIAL (2026-10-15, chat-3):** Filter saved DRAFT/PUBLISHED/ARCHIVED lesson-content metadata within tenant-owned lessons before paging and capped CSV. This does not imply visibility to a learner. Source tests authored; runtime/legacy/browser acceptance open.

**Starting lesson order PARTIAL (2026-10-15, chat-3):** The 1-based persisted sequence lower bound filters in-college lesson ordering before paging and CSV. It is not a progress/completion rank. Typed and gated-PG tests authored; execution/browser/legacy acceptance outstanding.

**Ending lesson order PARTIAL (2026-10-15, chat-3):** A 1-based persisted sequence upper bound narrows Lessons and CSV before pagination, combinable with the existing lower bound. Source tests authored; actual PG/browser and legacy matching open.

**Exact lesson title PARTIAL (2026-10-15, chat-3):** Adds a bounded exact-title selector over registered lessons (distinct from fuzzy search) with same-college pagination and capped CSV parity. Unit/isolated PG source authored; browser/runtime and full legacy acceptance open.

**Lesson-to-progress navigation PARTIAL (chat-3, 2026-10-15):** Each visible college-owned lesson links to the progress aggregate filtered by its persisted offering ID, deliberately including archived delivery so the deep-link does not claim absence. The destination revalidates college scope. Unit/PG source authored; real browser and DB acceptance open.

**Maximum authored content bound PARTIAL (chat-3, 2026-10-15):** College Admin can find empty/underpopulated lesson rows using a bounded ceiling, including zero, applied in SQL before count/pagination and matching CSV export. Authored tests await real PG and browser execution; counts are authored metadata only.

**Minimum content-authoring count PARTIAL (chat-3, 2026-10-15):** A bounded, nonzero lower limit on persisted lesson_contents rows filters full college-scoped lesson/CSV sets before paging; all statuses count as authored metadata, not learner availability. Fixtures authored, PostgreSQL/browser runtime proof open.

**Exact learning-path lesson drill-in PARTIAL (chat-3, 2026-10-15):** Registered path UUID resolves its lessons through signed-in-college course, cohort/program and period ownership; paged web and CSV match, while unknown/foreign paths do not leak. Tests authored, runtime/browser acceptance pending.

**Exact offering-scoped lessons PARTIAL (chat-3, 2026-10-15):** A validated offering UUID narrows lessons before paging and capped CSV, enabling direct navigation from existing course workspaces without accepting a caller-supplied college. Unknown/foreign offerings show no rows; unit/PG fixtures authored, runtime/browser pending.

**Exact lesson drill-in PARTIAL (chat-3, 2026-10-15):** The directory and filtered CSV accept a strictly validated persisted lesson UUID, resolved through the existing college-owned paths and offering joins. Unknown and foreign lessons yield no records; authored unit/disposable-PG cases await execution and browser proof.

**Live-content coverage PARTIAL (chat-3, 2026-10-15):** A true persisted LIVE_CLASS authoring-presence facet is now available for Lessons and its college-fenced CSV; it does not imply a meeting took place or expose links. Authored unit and isolated PG cases require execution and browser parity review.

**Lesson-resource coverage PARTIAL (chat-3, 2026-10-15):** The registered RESOURCE kind can be filtered as present or absent before College Admin pagination and export; the operation never fetches private storage identifiers. Unit/gated-PG source tests authored, execution and browser parity open.

**Video authoring coverage PARTIAL (chat-3, 2026-10-15):** College Admin lesson list can isolate absence/presence of VIDEO or YOUTUBE metadata using registered in-college records, including CSV. This is not playback or learner access; PG/browser acceptance open.

**Hidden published content triage PARTIAL (chat-3, 2026-10-15):** Finds persisted PUBLISHED rows with visibleToStudents=false before tenant-scoped paging/CSV; not a learner authorization or playback test. Unit/PG fixtures authored; not executed, browser/legacy acceptance open.

**Content audience facet PARTIAL (chat-3, 2026-10-15):** Lessons can filter registered shared content (NULL delivery) separately from section-bound records before pagination and safe CSV; no student permissions are inferred. Unit and gated PostgreSQL test source added, not executed; browser acceptance open.

**Saved content lifecycle PARTIAL (2026-10-15, chat-3):** Filter saved DRAFT/PUBLISHED/ARCHIVED lesson-content metadata within tenant-owned lessons before paging and capped CSV. This does not imply visibility to a learner. Source tests authored; runtime/legacy/browser acceptance open.

**Starting lesson order PARTIAL (2026-10-15, chat-3):** The 1-based persisted sequence lower bound filters in-college lesson ordering before paging and CSV. It is not a progress/completion rank. Typed and gated-PG tests authored; execution/browser/legacy acceptance outstanding.

**Ending lesson order PARTIAL (2026-10-15, chat-3):** A 1-based persisted sequence upper bound narrows Lessons and CSV before pagination, combinable with the existing lower bound. Source tests authored; actual PG/browser and legacy matching open.

**Exact lesson title PARTIAL (2026-10-15, chat-3):** Adds a bounded exact-title selector over registered lessons (distinct from fuzzy search) with same-college pagination and capped CSV parity. Unit/isolated PG source authored; browser/runtime and full legacy acceptance open.

**Saved content kind PARTIAL (2026-10-15, chat-3):** Exact authored content-kind filter matches persisted lesson content before totals/pagination and follows filter-matched capped CSV. This is metadata only; no signed media is exposed. Unit and disposable-PG fixtures authored, not executed; browser and legacy parity acceptance open.

**Lesson quiz-authoring triage PARTIAL (2026-10-15):** College Admin Lessons now filter independently by persisted course_quizzes authorship, using the canonical lesson ownership scope rather than quiz attempt totals. All lifecycle states count as authored; query/export/page state and disposable-PG empty/matching fixtures authored, executed CI/browser acceptance pending.

**Lesson assignment-authoring triage PARTIAL (2026-10-15):** The lesson catalogue now filters by actual course_assignments rows related to each college-owned lesson (including draft and archived), rather than assuming assessments exist when content exists. Filtered pagination and safe CSV share the state; strict Zod and isolated-PG fixtures authored, execution and browser acceptance open.

**Saved content visibility flag triage PARTIAL (2026-10-15):** College Admin now isolates lessons having any PUBLISHED content with stored visibleToStudents=true, versus no such content, using EXISTS on the in-college lesson ancestry before pagination. This is a metadata flag, not an access-grant claim. URL/CSV propagation and disposable PostgreSQL branch assertions authored; execution pending.

**Published content existence PARTIAL (2026-10-15):** College Admin can identify Lessons with/without at least one saved PUBLISHED lesson-content record through a tenant-owned EXISTS/NOT EXISTS predicate before pagination and capped CSV; this does not imply parent publication or actual learner access. Model and isolated PostgreSQL assertions authored; execution/browser gates pending.

**Lessons with/without authored content PARTIAL (2026-10-15):** College Admin can isolate lessons that have any persisted content or have none using a correlated database existence check before pagination, without treating empty lessons as unpublished or without assignments/quizzes. Filter carries to CSV and unit/PG assertions; browser/runtime acceptance pending.

**Course department name filter PARTIAL (2026-10-15):** College Admin lessons now support exact course-owning department name filtering within the authenticated college; URL pagination and CSV preserve this state. Typed URL and same-college PG fixture authored. Execution/browser acceptance pending.

**CORE/ELECTIVE lesson type PARTIAL (2026-10-15):** College Admin lessons can now be filtered by the registered offering CORE/ELECTIVE type before pagination, with stable URL and formula-neutralized CSV. Own-college positive/negative disposable-PG fixture authored; execution and responsive browser acceptance open.

**Batch-code scoping PARTIAL (2026-10-15):** College Admin Lessons aggregate now supports exact persisted batch code filtering, including page state and the formula-safe CSV. Query is confined to same-college course and cohort ancestry; strict validation and a disposable-PG matching/nonmatching fixture authored. Runtime and browser acceptance open.

**Publication versus visibility counts PARTIAL (2026-10-15):** Lessons aggregate now distinguishes all authored content, published content, and published content with the persisted student-visibility flag enabled. These are actual per-lesson counts, not guaranteed learner access when parent path/lesson or section gating blocks it. CSV parity and existing database fixtures updated; runtime/browser acceptance open.

**Learning-path lifecycle selector PARTIAL (2026-10-15):** College lesson rows and capped exports can now distinguish DRAFT, PUBLISHED and ARCHIVED owning learning paths independently of lesson and offering state. Query applies at signed-in-college scoped joins before page counts; strict schema and guarded PG inclusion/exclusion authored. Legacy/browser/CI acceptance remains open.

**Period-specific lesson catalogue PARTIAL (2026-10-15):** Lessons now filter by saved academic-period code without conflating numbered semesters and calendar periods; scoped SQL runs before pagination/content counts and matching CSV uses the same selector. Own/other period PostgreSQL fixture authored; runtime/mobile/browser checks remain open.

**Program-scoped lesson catalogue PARTIAL (2026-10-15):** Lesson list and capped CSV can select exact registered program codes, scoped by both course department and cohort-program department. Filter survives pagination and combines with title, course and lifecycle selectors; PG positive/missing tests authored. Execution and browser acceptance remain open.

**Exact course-code lesson catalogue PARTIAL (2026-10-15):** Lessons can now be narrowed by authoritative saved course code, independently from lesson-title text search, with scoped SQL count/pagination, filter-preserving links and capped CSV. Isolated PostgreSQL positive/negative and unit bounds authored; runtime/browser proof remains open.

**Lessons CSV PARTIAL (2026-10-15):** The registered college Lessons catalogue exports bounded filter-matched course/cohort/lesson/path and authored versus published content counts, respecting parent offering lifecycle, 1,000-row cap, formula-neutralized cells and truncation signals. The existing isolated PostgreSQL success/foreign/wrong-role fixture includes export assertions. This is metadata only; file keys and contact details are never selected. Executed/browser and legacy column parity remain open.

**Offering-lifecycle lesson filter PARTIAL (2026-10-15):** Lesson catalogue now separates lesson lifecycle filtering from parent offering lifecycle (ALL/ACTIVE/ARCHIVED), without confusing archived offerings with deleted content. Strict dedicated lesson Zod query, URL paging and tenant-bound PostgreSQL include/exclude fixtures authored. Runtime/database/browser evidence and complete lesson edits remain outstanding.

**Legacy:** `/college-admin/lessons`

**Read-first PARTIAL:** `/college/lessons` lists migrated lessons with course, cohort, academic-period and learning-path context, status filter/search, 25-row pagination and persisted authored/published content counts. Create/edit are available in the existing offering editor and now include transaction-coupled immutable audit. Offering lesson up/down reorder adds a stale-sequence fence, same-origin API, and confirmation. Full bulk drag reorder, exact legacy modals, upload, and browser/PG execution remain open.

- [ ] Aggregate Lessons list/search/filter matches.
- [ ] Course/lesson path context is visible.
- [ ] Create Lesson flow matches.
- [ ] Edit Lesson flow matches.
- [ ] Delete/reorder actions match.
- [ ] Deep link to Course/learning path works.
- [ ] Loading/empty/error states match.

## Page: Video Content
**Department-specific content search PARTIAL (2026-10-15):** Video/Resource directories can filter by the owning course department name using in-college ancestry. URL/page and bounded CSV preserve this filter; strict inputs plus PostgreSQL own/unknown department fixtures authored. Real execution and browser acceptance open.

**Learning-path lifecycle filter PARTIAL (2026-10-15):** Video and Resource catalogues filter by the actual DRAFT/PUBLISHED/ARCHIVED learning path state independently of content publication, including pagination and capped metadata CSV. A disposable PostgreSQL fixture and strict query tests are authored; executed gates and browser parity open.

**Visibility mutation PostgreSQL fixture PARTIAL (2026-10-15):** In-test real resource verifies College Admin success, foreign-college non-leaking not-found, wrong-role rejection, stale-version denial, persisted visibility filtering and audited restore. Fixture authored for disposable PG execution; not yet executed or browser-accepted.

**Administrator-only visibility writer PARTIAL (2026-10-15):** A same-origin PATCH endpoint and serializable college-scoped service now guard the real registered content visibility switch with Zod, millisecond version CAS, persisted current College Admin membership/permission recheck, ancestor ownership joins, and same-transaction activity audit. No Faculty or learner writes; UI integration, runtime DB/browser acceptance open.

**Program-code filter PARTIAL (2026-10-15):** Video and Resource aggregates now filter by an exact registered, college-owned program code before pagination. Filter persists in CSV/download URL and rejects overlong codes. No cross-college program lookup or media URL exposed. Unit coverage authored; PG/browser acceptance open.

**Registered student-visibility filter PARTIAL (2026-10-15):** Video and Resource aggregate now show and filter the actual `lesson_contents.visible_to_students` setting, using college-scoped query/pagination and matching capped metadata CSV. This flag is not proof the parent path/lesson is published or that a given student belongs to the delivery. UI/model tests authored, independent PostgreSQL/mobile/browser acceptance open.

**Owning-offering lifecycle filter PARTIAL (2026-10-15):** VIDEO and YOUTUBE metadata catalogues now distinguish ACTiVE/ARCHIVED registered course offerings independently of content status; scoped list/CSV preserve the choice and disclose no storage credentials. PostgreSQL fixture authored, executed PG/browser acceptance outstanding.

**Video metadata CSV PARTIAL (2026-10-15):** Admins can export a capped, formula-neutralized set of filtered VIDEO/YOUTUBE rows, including persisted course/lesson/audience metadata and publication state, without meeting URLs, storage keys or private notes. Current-college and wrong-role fixture assertions authored; executed PG/browser checks remain open.

**Persisted audience-scope filter PARTIAL (2026-10-15):** Stored video and YouTube metadata share the offering-shared versus section-specific delivery-scope filter, with current-college authorization, linked filters and isolated PostgreSQL fixture. No playback URL/key disclosure and no executed acceptance claimed.

**Mobile catalogue parity PARTIAL (2026-10-15):** The content catalogue now shows self-contained course/lesson/status/scope cards at narrow widths rather than a minimum-800px data table; desktop retains the wide table. A shared pure scope-label model has unit coverage and the existing isolated-PG fixture validates persisted delivery scope. Actual 375px browser verification and full legacy actions remain open.

**Video-type filtering PARTIAL (2026-10-15):** The read-only catalogue supports persisted VIDEO versus YOUTUBE subtype filtering, strict URL parsing, deep-link pagination and a compact responsive select. Existing isolated PG fixture asserts both subtype partitions and same-college privacy. Playback/storage access, executed PG/browser proof and remaining legacy actions are open.

**Content aggregate column collision repair PARTIAL (2026-10-15):** The combined VIDEO/RESOURCE register now aliases joined content, learning-path, offering and college ancestry projection columns uniquely (PostgreSQL 42702), with in-college PG fixture asserting labels/links and non-disclosure of private URLs/keys. Executed PG/browser and media/file workflow acceptance remain outstanding.

**Legacy:** `/college-admin/lesson-content?type=video`

**Read-first PARTIAL (2026-10-14):** `/college/videos` now lists owned, migrated VIDEO/YOUTUBE authoring metadata across offerings, with search/status filters and 25-row pagination. Neither media playback nor signed file authorization is implemented; storage keys and external video URLs are intentionally omitted. The existing offering editor remains the authoring surface. Exact legacy/browser and disposable-DB acceptance remain open.

- [ ] Video aggregate list/filter matches.
- [ ] Create/edit video metadata matches.
- [ ] Schedule/visibility controls match.
- [ ] Upload/provider fields match.
- [ ] Delete/replace consequences match.
- [ ] Signed playback is explicit BLOCKED until storage is live.
- [ ] Loading/empty/error states match.

## Page: Resources
**Parent lesson archival triage PARTIAL (2026-10-15):** Video and Resource catalogues isolate content belonging to ACTIVE versus ARCHIVED lessons, separately from content publication and learning-path lifecycle; same-college filtering precedes count/pagination and matches safe CSV. Tests authored; runtime/browser gates pending.

**CORE and ELECTIVE course content PARTIAL (2026-10-15):** Video and Resource catalogues now distinguish actual persisted course offering CORE/ELECTIVE type, independently of content format, status and audience. Filter survives pagination and capped CSV. Isolated PG fixture authored, executed/browser parity open.

**Academic-period-specific content search PARTIAL (2026-10-15):** Video and Resource views filter by exact persisted in-college academic-period code before pagination, retaining the filter in CSV. Typed URL and isolated positive/negative PostgreSQL fixtures authored; runtime and browser acceptance outstanding.

**College Admin visibility control PARTIAL (2026-10-15):** Registered Video/Resource rows now offer a confirmed mobile/desktop Visible-to-students toggle calling the same-origin, version-checked College Admin mutation. Optimistic UI state updates only after confirmed response; stale/denied/network errors retain the prior state and request a refresh. Unit checks cover accessible labels; independently executed PG/browser/375px acceptance open.

**Student visibility CSV column PARTIAL (2026-10-15):** Capped Video and Resource metadata export now explicitly labels the persisted Visible-to-students boolean as Yes/No instead of inferring visibility from publication. Metadata never includes private media keys or URLs. Formula-safe export unit assertions authored; runtime/browser verification open.

**Batch-specific content metadata PARTIAL (2026-10-15):** Video/Resource aggregate filters now match an exact persisted cohort code through the already college-checked offering ancestry, preserve batch code in pagination and safe CSV, and reject excessive selector lengths. A disposable-PG own/missing-batch fixture authored; browser acceptance open.

**Owning-offering lifecycle filter PARTIAL (2026-10-15):** RESOURCE metadata now supports a separate offering ACTIVE/ARCHIVED selector, server-enforced inside the own-college ancestry joins before pagination and capped download. Own/missing lifecycle fixture authored; private notes and storage keys still omitted. Browser/DB execution open.

**Resource metadata CSV PARTIAL (2026-10-15):** Own-college RESOURCE authoring metadata can be exported with matching search/status/course/scope filters and 1,000-row cap, spreadsheet-formula neutralization and truncation disclosure. Private text notes, URLs, keys and meeting links are not returned. Tenant and wrong-role PG fixture assertions authored; executed/browser parity remains open.

**Persisted audience-scope filter PARTIAL (2026-10-15):** Resources list can distinguish offering-shared metadata from section-bound records using nullable deliveryId before pagination; a section-specific scope is never inferred. Strict query validation, URL-persisted selector and PG fixture for shared/section exclusion authored; browser/real-DB acceptance remains pending.

**Mobile catalogue parity PARTIAL (2026-10-15):** The content catalogue now shows self-contained course/lesson/status/scope cards at narrow widths rather than a minimum-800px data table; desktop retains the wide table. A shared pure scope-label model has unit coverage and the existing isolated-PG fixture validates persisted delivery scope. Actual 375px browser verification and full legacy actions remain open.

**Course-code filter PARTIAL (2026-10-15):** Registered resource/video catalogue queries now accept an optional exact course-code filter, applied inside the same tenant-fenced JOIN before count and pagination. The responsive filter keeps its value in links; pure-model and disposable-PG fixtures cover invalid/absent matches. Executed PG/browser proof, secure downloads and resource write parity remain open.

**Content aggregate column collision repair PARTIAL (2026-10-15):** The combined VIDEO/RESOURCE register now aliases joined content, learning-path, offering and college ancestry projection columns uniquely (PostgreSQL 42702), with in-college PG fixture asserting labels/links and non-disclosure of private URLs/keys. Executed PG/browser and media/file workflow acceptance remain outstanding.

**Legacy:** `lesson-content?type=resources`

**Read-first PARTIAL (2026-10-14):** `/college/resources` lists migrated RESOURCE authoring metadata by lesson/offering with search/status filters and 25-row pagination, excluding text notes, external URLs, private object paths and signed downloads. The offering workspace remains the editor; exact legacy/browser and disposable-DB acceptance remain open.

- [ ] Resource aggregate list/filter matches.
- [ ] Link/file fields match.
- [ ] Add/edit/remove actions match.
- [ ] File upload/download remains explicit BLOCKED until storage is live.
- [ ] Empty/error states match.

## Page: Live Classes
**Live-session audience filter PARTIAL (2026-10-15):** Live Classes now distinguishes saved shared-offering from section-bound sessions using actual deliveryId and a scoped SQL predicate, not a default assumption. Audience label, pagination and privacy-safe CSV carry the filter; own/empty PG and invalid-value unit fixtures authored. No meeting URL displayed; executed PG/browser validation pending.

**IST date-window CSV parity PARTIAL (2026-10-15):** Downloaded live-class schedule metadata now uses the same chosen from/through IST dates as on-screen pagination, without leaking meeting links. Calendar selectors pass through bounded service validation, with owned/absent-date fixture assertions; runtime and browser proof still pending.

**IST day-range scheduling filter PARTIAL (2026-10-15):** Saved LIVE_CLASS content now filters on configured start/end instants overlapping bounded IST-local days, preserving day selectors in paginated URLs. Strict range and tenant-scoped PostgreSQL fixture authored; independent runtime/browser acceptance remains outstanding.

**Live-class schedule CSV PARTIAL (2026-10-15):** A strictly own-college, formula-neutralized 1,000-row Live Classes schedule export lists persisted session/course/lesson metadata and UTC ISO start/end instants; no private meeting URLs or storage keys. The downloaded CSV is explicit about UTC timestamps, unlike the IST UI. PG fixture covers current-college/foreign/wrong-role and secret exclusion; runtime/browser acceptance remains open.

**Course-specific live sessions PARTIAL (2026-10-15):** Admin Live Classes now exposes an exact persisted course-code selector carried into pagination. The underlying join already validates both course department and offering ancestry within the signed-in college; invalid and missing code fixtures are authored. Executed PG/browser proof remains open.

**Upcoming/past persisted session filter PARTIAL (2026-10-15):** Live-class list now filters by actual saved endsAt timestamps before pagination; ongoing counts as upcoming. Null-ended sessions are excluded from both time-filtered views and remain visible under ALL. URL view selector survives pagination, and bounded schema plus isolated PostgreSQL fixture assertions were authored. Runtime and browser acceptance remain outstanding.

**Persisted College Admin live-class catalogue PARTIAL (2026-10-15):** /college/live-classes now renders same-college LIVE_CLASS content with lesson/course links, IST start/end times, search, publication and 25-record pagination. It selects unique named Drizzle columns using the shared alias helper and never selects private meeting URLs or storage keys. Read-only mobile cards, strict URL schema and own/foreign/wrong-role disposable PostgreSQL fixtures authored. Upcoming/past state and editor parity, executed PG/browser gates remain open.

**Legacy:** `lesson-content?type=live-classes`

- [ ] Live-class aggregate list matches.
- [ ] Meeting URL/start/end/schedule fields match.
- [ ] Create/edit/remove actions match.
- [ ] Upcoming/past state matches.
- [ ] Empty/error states match.

## Page: Assignments
**Authenticated batch scope for assessments PARTIAL (2026-10-15):** Assignment and Quiz aggregates now join persisted cohort/program ownership and a separate department alias, requiring the course and cohort program to belong to the selected college. Exact cohort code filtering runs before counts/pagination; strict model and PG own/other batch assertions authored. Runtime/browser gates pending.

**College-owned academic-period assessment filter PARTIAL (2026-10-15):** Both Assignment and Quiz aggregates now join a registered academic period in the signed-in college and optionally filter by exact period code, before pagination and activity counts. URL/model plus positive/negative disposable-PostgreSQL evidence authored; browser/runtime verification pending.

**375px assessment cards PARTIAL (2026-10-15):** Both College Admin assessment catalogues now render stacked min-width-safe cards for narrow viewports, preserving lesson/offering link, scope, due timestamp, points and recorded submissions/attempts, while the desktop table remains. No global horizontal table overflow is required on mobile; browser/accessibility acceptance pending.

**Missing assessment deadline triage PARTIAL (2026-10-15):** College Admin Assignment and Quiz directories now isolate persisted NULL deadlines from configured due timestamps before the record cap. Strict Zod, pagination and own-college PostgreSQL fixture coverage added; no due date is inferred. Browser acceptance pending.

**Exact course-code aggregate filter PARTIAL (2026-10-15):** College Admin quizzes and assignments accept an exact persisted course code before paginated totals with a URL-preserved filter and strict validation. The database fixture tests positive/negative matches in the existing college-owned assessment ancestry. Browser/runtime acceptance open.

**Legacy:** `/college-admin/assignments`

**Read-first aggregate PARTIAL:** `/college/assignments` lists persisted college-owned assignments, with title/status filters, due dates, lesson/course context, submission-row counts, an offering deep link, loading/error/empty states and no assignment or file-storage mutations. Legacy authoring/edit/delete, report and browser parity remain unchecked.

- [ ] Aggregate list/filter/pagination match.
- [ ] Create Assignment fields/validation match.
- [ ] Edit/delete actions match.
- [ ] Due-date/schedule/visibility match.
- [ ] Submission counts/report deep links match where legacy exposes them.
- [ ] File attachment workflow is explicit BLOCKED until storage is live.
- [ ] Loading/empty/error states match.

## Page: Quizzes
**Program-specific assessment catalogue PARTIAL (2026-10-15):** Assessment totals and pages now filter by exact registered program code through the already college-validated cohort program ancestry. Query/URL round-trip and positive/negative disposable-PG fixture authored. No inferred learner eligibility or completion totals; executed/browser acceptance pending.

**Past/upcoming due windows PARTIAL (2026-10-15):** Both assessment directories apply database timestamps before pagination (strictly before versus at/after now), excluding missing due timestamps. Typed query tests authored; independent PostgreSQL and browser execution pending.

**Persisted quiz result-publication triage PARTIAL (2026-10-15):** College Admin quiz listing now filters by actual `results_published`, shows the state separately from quiz publication, and preserves the result selector in pagination. The Assignment endpoint rejects quiz-only result filters. Isolated PostgreSQL and strict-model fixtures authored; browser acceptance pending.

**Shared versus section-specific assessment scope PARTIAL (2026-10-15):** The quizzes and assignments aggregates now distinguish actual NULL versus non-NULL delivery associations before page totals; URL state and strictly typed filter options are preserved. Disposable PostgreSQL own-college scope fixtures authored; browser acceptance pending.

**Legacy:** `/college-admin/quizzes`

**Read-first aggregate PARTIAL:** `/college/quizzes` lists persisted college-owned quizzes, with title/status filters, due dates, lesson/course context, attempt-row counts, an offering deep link, loading/error/empty states and no quiz-answer disclosure. Legacy authoring/edit/question/results management and browser parity remain unchecked.

- [ ] Aggregate list/filter/pagination match.
- [ ] Create/Edit Quiz workflow matches.
- [ ] Questions/answers/points/attempts fields match.
- [ ] Schedule/open/close/results-publication controls match.
- [ ] Delete/close confirmation matches.
- [ ] Loading/empty/error states match.

## Page: Course Progress
**Offering section-bound content triage PARTIAL (chat-3, 2026-10-15):** Authored content with a non-NULL delivery relation is now filterable per current-college offering, including CSV; absence does not prove absence of section activity or enrolled learners. Source tests authored, execution and browser parity pending.

**Offering shared-content authoring PARTIAL (chat-3, 2026-10-15):** Scoped offerings now distinguish lesson content without section delivery association using persisted NULL deliveryId. Filter applies before CSV and paging; student rollout is not inferred. Authored PG/browser gates open.

**Hidden published metadata PARTIAL (chat-3, 2026-10-15):** Offering triage now detects PUBLISHED lesson content explicitly marked visibleToStudents=false; no student-access denial or release state is inferred. Read, URLs and safe CSV agree; authored PG/browser acceptance remains outstanding.

**Saved content publication coverage PARTIAL (chat-3, 2026-10-15):** The course progress offering list distinguishes records with/without PUBLISHED lesson content in registered paths. It does not claim parent path or learner visibility. CSV/pagination scope retained; authored tests require PG/browser execution.

**Video-content authoring coverage PARTIAL (chat-3, 2026-10-15):** Progress offering list can filter saved VIDEO/YOUTUBE content through scoped lesson paths, without interpreting watch or completion rates. Capped CSV uses the same predicate. Unit/PG tests authored, execution/browser acceptance open.

**Offering authored lesson triage PARTIAL (2026-10-15, chat-3):** Filters on persisted lessons attached through learning paths, before college-scoped counts, paging and safe capped CSV. Source tests authored; independent PG/browser acceptance open.

**Persisted authored assignment triage PARTIAL (2026-10-15, chat-3):** A college-scoped offering filter checks actual assignment records through paths and lessons before totals and CSV. It does not imply submissions, grading or delivery. Tests authored; PG/browser verification open.

**Authored quiz triage PARTIAL (2026-10-15, chat-3):** The offering directory can isolate saved quizzes through course lessons without inferring quiz attempt/result evidence; server filters apply before CSV and pages. Unit/isolated-PG tests authored, not run. Browser/legacy acceptance open.

**Resource-presence selector PARTIAL (2026-10-15, chat-3):** Filters actual saved RESOURCE records in same-college offerings, before pagination and CSV. No private links or publication inference. Tests authored; runtime and browser validation open.

**Live-class metadata presence PARTIAL (2026-10-15, chat-3):** College Admin progress now finds offering paths containing saved LIVE_CLASS content and separately those without; no external meeting links or attendee states read. Tenant-scoped CSV matches the filter; authored tests need execution and browser acceptance.

**Progress-to-lessons navigation PARTIAL (chat-3, 2026-10-15):** Each college-scoped offering progress row links to the corresponding authored lessons via the exact persisted offering ID, showing archived lesson records instead of silently dropping them. Destination remains centrally authorized and tenant-scoped. Unit and PG test source authored; runtime/browser acceptance open.

**Archived authored-content triage PARTIAL (chat-3, 2026-10-15):** Offering list now filters persisted ARCHIVED content presence in scoped lessons, distinguishing archival from missing content. CSV is predicate-identical; tests authored, no real PG/browser signoff yet.

**Saved draft metadata triage PARTIAL (chat-3, 2026-10-15):** Offering list can isolate presence/absence of DRAFT lesson-content records through college-scoped learning paths, before page and capped CSV. This is not a learner-availability decision; authored tests need PG/browser execution.

**Exact offering progress lookup PARTIAL (chat-3, 2026-10-15):** A strongly typed offering UUID isolates one persisted college-owned delivery context and its recorded progress evidence; CSV and paged results agree, while foreign/unknown IDs return no rows. Unit/PG fixtures authored, execution/browser pending.

**Offering section-bound content triage PARTIAL (chat-3, 2026-10-15):** Authored content with a non-NULL delivery relation is now filterable per current-college offering, including CSV; absence does not prove absence of section activity or enrolled learners. Source tests authored, execution and browser parity pending.

**Offering shared-content authoring PARTIAL (chat-3, 2026-10-15):** Scoped offerings now distinguish lesson content without section delivery association using persisted NULL deliveryId. Filter applies before CSV and paging; student rollout is not inferred. Authored PG/browser gates open.

**Hidden published metadata PARTIAL (chat-3, 2026-10-15):** Offering triage now detects PUBLISHED lesson content explicitly marked visibleToStudents=false; no student-access denial or release state is inferred. Read, URLs and safe CSV agree; authored PG/browser acceptance remains outstanding.

**Saved content publication coverage PARTIAL (chat-3, 2026-10-15):** The course progress offering list distinguishes records with/without PUBLISHED lesson content in registered paths. It does not claim parent path or learner visibility. CSV/pagination scope retained; authored tests require PG/browser execution.

**Video-content authoring coverage PARTIAL (chat-3, 2026-10-15):** Progress offering list can filter saved VIDEO/YOUTUBE content through scoped lesson paths, without interpreting watch or completion rates. Capped CSV uses the same predicate. Unit/PG tests authored, execution/browser acceptance open.

**Offering authored lesson triage PARTIAL (2026-10-15, chat-3):** Filters on persisted lessons attached through learning paths, before college-scoped counts, paging and safe capped CSV. Source tests authored; independent PG/browser acceptance open.

**Persisted authored assignment triage PARTIAL (2026-10-15, chat-3):** A college-scoped offering filter checks actual assignment records through paths and lessons before totals and CSV. It does not imply submissions, grading or delivery. Tests authored; PG/browser verification open.

**Authored quiz triage PARTIAL (2026-10-15, chat-3):** The offering directory can isolate saved quizzes through course lessons without inferring quiz attempt/result evidence; server filters apply before CSV and pages. Unit/isolated-PG tests authored, not run. Browser/legacy acceptance open.

**Resource-presence selector PARTIAL (2026-10-15, chat-3):** Filters actual saved RESOURCE records in same-college offerings, before pagination and CSV. No private links or publication inference. Tests authored; runtime and browser validation open.

**Live-class metadata presence PARTIAL (2026-10-15, chat-3):** College Admin progress now finds offering paths containing saved LIVE_CLASS content and separately those without; no external meeting links or attendee states read. Tenant-scoped CSV matches the filter; authored tests need execution and browser acceptance.

**Published learning path triage PARTIAL (2026-10-15):** The Course Progress offering list now distinguishes registered PUBLISHED learning paths from drafts, archived paths or absent paths. This is an authored structure state, not proof of learner visibility or course completion. Filtered totals, safe CSV, strict schema and disposable-PG fixture are authored; execution/browser acceptance open.

**Missing shared learning path triage PARTIAL (2026-10-15):** College Admin now distinguishes offerings with/without a persisted course_learning_paths row before activity pagination and CSV. An offering without a path is not described as failed learning or absent enrollment. Strict Zod/URL and own-college PostgreSQL fixtures authored; execution and browser acceptance open.

**Recorded completed-content triage PARTIAL (2026-10-15):** A second college-scoped EXISTS predicate distinguishes offerings with at least one LEARNER-role record whose completedAt is populated from those without. It does not classify whole courses as complete. Strict URL/CVS and disposable-PG fixture tests authored; browser and CI execution pending.

**Observed activity versus no events PARTIAL (2026-10-15):** The offering directory now filters by EXISTS/NOT EXISTS of real LEARNER-role learner-content progress, restricted to college memberships and course learning paths before pagination and capped CSV. An empty result does not mean attendance or enrollment absence. Strict and disposable-PG tests authored, execution/browser acceptance open.

**Department-specific course progress PARTIAL (2026-10-15):** College Admin can filter persisted learner-content activity offerings by exact owning department name, without inferring course completion or changing the recorded learner denominator. Pagination and capped CSV follow the same scope. PostgreSQL and validation fixtures authored; acceptance open.

**CORE/ELECTIVE course progress filter PARTIAL (2026-10-15):** The persisted activity directory now partitions course offerings by registered CORE/ELECTIVE type before pagination and safe CSV; counts still refer only to recorded learner content events. Strict input and scoped-PG fixture authored; execution/browser acceptance open.

**Registered cohort code filter PARTIAL (2026-10-15):** Course Progress supports a cohort-code filter against persisted offering membership rather than inferred learner groups. Combined course/program/period/cohort selectors survive navigation and scoped CSV. PostgreSQL own/missing-cohort fixtures authored; no completion-rate inference or executed PG/browser sign-off.

**Persisted academic-period filter PARTIAL (2026-10-15):** Course Progress now uses exact academic-period codes from registered offerings, before college-scoped pagination and content-activity counts. Search, CSV and page links preserve the selector; own/other period fixture coverage authored. Runtime/browser verification remains open.

**Exact program-code progress filter PARTIAL (2026-10-15):** Course Progress now supports a bounded persisted program-code selector over own-college offerings, retained in pagination and capped CSV. Positive/negative program-scoped PG evidence authored, without inventing eligibility denominators or activity totals; executed PG/browser closure remains open.

**Exact recorded-course filter PARTIAL (2026-10-15):** Per-offering content-progress evidence now supports an exact registered course-code selector across paginated UI and formula-safe export; it never computes inferred learner completion or attendance. Existing college/foreign PostgreSQL fixture covers a matching and missing code; runtime/browser evidence open.

**Recorded content activity export PARTIAL (2026-10-15):** The College Admin Course Progress page now exports a max-1,000-row CSV of actual per-offering learner-content records, completed content rows and distinct learners with recorded activity (not eligible learner denominator or course completion). Export is restricted to active own-college admins, formula neutralized and truncation labeled. Isolated PG own/foreign/wrong-role coverage authored, unexecuted.

**Legacy:** `/college-admin/course-progress`

**Read-first PARTIAL:** `/college/course-progress` reports persisted per-offering learner-content activity, completed content records and distinct learners with any progress records. Absent activity displays zero recorded rows, not zero learner completion. Cohort/section eligibility denominators, detailed learner breakdown, completion rate, export, exact legacy and browser parity remain open.

- [ ] Program/course/class filters match.
- [ ] Learner progress table/metrics match.
- [ ] Lesson/content completion breakdown matches.
- [ ] Search/sort/export if present are accounted for.
- [ ] Drill-in behavior matches.
- [ ] Loading/empty/error states match.

# People
**Roster-to-Contacts drilldown PARTIAL (chat-9):** Faculty and Students roster entries now link to their read-only Contacts detail by validated persisted membership UUID, instead of forcing staff to rediscover the same person. The existing current-college detail authorization and masked learner/phone policy remain authoritative. Unit/source authored; browser/permission acceptance pending.
**Contradictory Contacts academic combinations PARTIAL (chat-9):** An explicit typed gate now prevents impossible no-active-enrollment/program/batch/class and no-active-class/exact-section filters across UI, service and capped CSV, returning input errors rather than misleading zero contacts. Pure boundary tests authored; runtime/browser acceptance open.
**Faculty academic-title Contacts search PARTIAL (chat-9):** A bounded title-substring filter uses escaped literal ILIKE against persisted faculty-profile academic titles under the existing Faculty membership and college authorization. Same predicate runs before cards/paging/masked CSV. Pure wildcard and URL tests authored; real DB/browser acceptance pending.
**Faculty live teaching-role Contacts filter PARTIAL (chat-9):** Contacts now filter by persisted PRIMARY, CO_TEACHER or TA assignment on a current-college, non-ended course delivery. The role is independent of employment type, and contradictory no-teaching combinations fail closed in the page/service/export contract. Authored unit checks; PostgreSQL/browser acceptance outstanding.
**Faculty employment-type Contacts facet PARTIAL (chat-9):** Contact cards and masked CSV now share a same-college Faculty-only exact employment-type filter from persisted faculty profiles. A bounded 100-option current-college dropdown retains the bookmarked choice without exposing other colleges. Unit/source authored; database/browser proof open.
**Active-class Contacts filtering PARTIAL (chat-9):** The read-only Contacts page now filters learner memberships by registered active section enrollment and same-college cohort/program ancestry, before list/CSV paging, using capped own-college class choices. Faculty-only contacts cannot match; PostgreSQL/browser acceptance remains open.
**Scoped Contacts program selector PARTIAL (chat-9):** Registered college-owned programs now filter active learner enrollment by exact program before contact pagination and masked CSV export, with a bounded authorized dropdown and neutral unknown-selection label. Faculty-only rows never match. Unit contract authored; PostgreSQL/browser acceptance pending.

**Scoped Contact detail route PARTIAL (2026-10-15, chat-9):** Each Contacts card links to `/college/contacts/[membershipId]` for a read-only public detail anchored to a persisted current-college COLLEGE_ADMIN membership. Foreign IDs return identical not-found, and learner/dual-role email and all phone numbers stay masked. Positive, foreign and wrong-role isolated PG cases authored; execution/375px browser and exact legacy card metadata remain open.

**Invalid Contacts date-window rejection PARTIAL (2026-10-15, chat-9):** Reverse IST joined-from/through intervals now fail closed in both page and export parsing and cannot silently return empty results. Service rechecks even for programmatic callers. Unit scenarios authored; browser/PG execution pending.

**Contact joined-through filter PARTIAL (2026-10-15, chat-9):** The read-only contact tabs support inclusive IST end-day filtering, persisted in URLs and exports with a next-midnight exclusive DB bound. Cross-college isolation and privacy masks are unchanged; runtime/browser acceptance pending.

**Contacts joined-from IST filter PARTIAL (2026-10-15, chat-9):** Contacts can limit memberships to a validated inclusive local calendar day lower bound, converted to Asia/Kolkata midnight and applied in college-scoped SQL before count/paging/CSV. Browser and real-DB acceptance remain open.

**Contact name-initial selector PARTIAL (2026-10-15, chat-9):** Native A–Z initials select filters persisted display names before total/paging/export, scoped to the current college and combined with role/status/search. Prefix is a single validated alphabetic character, not a user-supplied SQL pattern. PG/browser checks outstanding.

**Mixed-role Contacts triage PARTIAL (2026-10-15, chat-9):** A role-audience control distinguishes Faculty-only, Learner-only and dual Faculty+Learner memberships in a single current-college SQL filter. Dual-role learner contact fields remain masked even on Faculty tab and exports; no recipient privilege is inferred. Real database/browser acceptance pending.

**Reverse-name Contacts sorting PARTIAL (2026-10-15, chat-9):** Contacts All/Faculty/Student tabs now support case-insensitive Z–A persisted-name order with deterministic UUID ties and identical ordering for export. Query schema and UI tests authored; database/browser evidence pending.

**Longest-serving Contacts order PARTIAL (2026-10-15, chat-9):** A typed OLDEST order pages by persisted join time then membership UUID, avoiding page churn on identical timestamps. Corresponding URL, UI and export filters preserve order. DB/browser execution pending.

**Contacts platform-account filter PARTIAL (2026-10-15, chat-9):** College contacts can independently filter registered ACTIVE/DISABLED user accounts and ACTIVE/SUSPENDED/ENDED college memberships; server SQL applies both before count/paging/CSV. Tenant authorization and student masks remain unchanged. Isolated runtime and browser checks outstanding.

**Contacts page-size selector PARTIAL (2026-10-15, chat-9):** Contact tabs support strict 10/25/50 server-side page sizes and URL-preserved pagination, while the CSV retains a fixed 25-row service batch and independent 1,000-row cap. Unit contract authored; real DB/browser acceptance remains open.


## Page: Faculty
**Contradictory academic roster filters PARTIAL (chat-9):** Faculty cannot request no current teaching and a specific active teaching role simultaneously; Students cannot combine no active enrollment with an active batch or class. The page and service reject invalid combinations instead of silently showing zero people. Unit cases authored; real PostgreSQL/browser acceptance pending.
**IST joined-date range PARTIAL (chat-9):** Faculty and Students now support strict inclusive IST local join-date intervals, validated before protected reads and applied as UTC-timestamp SQL bounds before paging/count. Reversed/impossible dates fail closed; pure boundary tests authored. Executed scoped-PG, browser and oracle acceptance remain open.
**Faculty employment-type bookmark retention PARTIAL (chat-9):** A selected employment-type URL filter remains visible when it is outside the bounded first 100 options. No new values or records are inferred; persisted college-filtered SQL and strict 128-character bound remain authoritative. Unit/source authored, execution pending.
**Bounded Faculty department bookmark retention PARTIAL (chat-9):** Current-college department option lists retain a previously selected filter UUID beyond the first 200 via a neutral placeholder and preserve server-side college ownership checks. Unit/source authored; 375px and PG/browser acceptance open.
**Persisted College Admin roster guard PARTIAL (chat-9):** Faculty and Students listing now executes its actor SHARE-lock/role/college recheck and paged academic joins inside one read transaction, rejecting forged or revoked membership claims without cross-college leakage. Isolated PostgreSQL forged-admin fixture authored; real DB/browser execution outstanding.
**Reverse-name role directory sort PARTIAL (chat-9):** Persisted-name Z–A ordering with case-folded comparison and membership-ID tie-break now applies before paging in both Faculty and Students. Strict URL handling and pure URL regression authored; PG/browser acceptance open.
**Bounded Faculty/Students page sizes PARTIAL (chat-9):** Both directories now offer 10/25/50-row server paging with typed query bounds, correct database LIMIT/OFFSET/count-driven page total and URL-preserved navigation. Pure validation authored; PG/browser execution pending.
**Directory stale-page recovery PARTIAL (chat-9):** Faculty and Students redirect an out-of-range page to the final authorized page while preserving validated filters instead of leaving an empty/invalid page after roster changes. Pure URL regression authored; browser/PG acceptance remains open.
**Role-directory URL ambiguity PARTIAL (2026-10-15, chat-9):** Faculty and Students directories now reject repeated/unknown query parameters before protected reads, rather than silently choosing the first of multiple values. Pure unit regressions authored; executable service/browser acceptance outstanding.
**Faculty history teaching-role drilldown PARTIAL (2026-10-15):** The Faculty detail history can filter registered PRIMARY, CO_TEACHER or TA assignments in conjunction with active/ended lifecycle before its 100-row cap, while separately retaining all-time totals. Strict no-forged-college model and own-college PG fixture tests authored; runtime/browser acceptance pending.
**Primary-department assignment coverage PARTIAL (2026-10-15):** Faculty roster now distinguishes registered same-college primary department assignments from absent/invalid links before pagination; archived departments remain distinguishable from missing links, without exposing other college names. Model and isolated PostgreSQL partition/role tests authored, not executed; legacy UI acceptance remains open.
**Academic-title profile completeness PARTIAL (2026-10-15):** The Faculty roster filters memberships with and without a nonblank academic title in persisted faculty profiles, before scoped pagination; no title is inferred from teaching duties or employment type. Pure model and gated PG partition/wrong-role fixtures authored; runtime/browser acceptance remains outstanding.
**Query/empty form repair PARTIAL (2026-10-15):** Optional roster selects with empty default values are discarded before strict Zod parsing; pressing Apply without selecting a department/cohort/employment type now uses valid unfiltered defaults. Faculty history query unit coverage added for allowed ALL/ACTIVE/ENDED and scope-forgery rejection. Independently executed tests/browser still pending.
**Teaching-history status filters PARTIAL (2026-10-15):** The Faculty detail page now distinguishes live versus ended course-teaching assignments with SQL filtering before the 100-row history cap. All-time total/active/unique-offering evidence remains unchanged and is separately labeled, and foreign-college members are still not found. Strict detail query model and isolated PostgreSQL active/ended/denial fixtures authored; browser/runtime verification open.
**Employment-type roster filter PARTIAL (2026-10-15):** Faculty directory can filter exact authored employment type on own-college Faculty profile rows before pagination, rather than assuming undocumented FULL_TIME/PART_TIME enums. A bounded list of persisted distinct employment strings is provided, with truncation disclosure; Learner-role selection is rejected. Scoped PG denial and strict query/URL model tests authored, pending execution and browser parity.
**Role-specific active teaching PARTIAL (2026-10-15):** The Faculty directory can filter active teaching by registered PRIMARY, CO_TEACHER or TA course-teaching roles, using the same-college delivery and course joins before pagination. Distinct from staff employment role, and unsupported for Learners. Strict enum, URL, bounded UI and scoped PostgreSQL denial fixtures authored; browser/DB execution and workload parity remain open.
**Scoped faculty-department selector PARTIAL (2026-10-15):** Faculty roster now filters by exact primary department against own-college registered department/profile ancestry before pagination. The dropdown shows up to 200 active own-college departments and explicitly discloses truncation. Unsupported Learner department filters reject, and foreign UUIDs return empty (not existence). Zod/URL and isolated PG tenant/role fixtures authored; exact legacy/browser checks remain open.
**Profile metadata search PARTIAL (2026-10-15):** Faculty name/email directory search now includes authored academic title, employment type and registered own-college department name using correlated FACULTY profile rows. No cross-college or private identity columns are searched; pagination and membership-role restrictions remain unchanged. Pure hint and in-test PG metadata fixtures with role denials authored; runtime/browser parity remains open.
**Role-restricted CSV export PARTIAL (2026-10-15):** Faculty directory links to the canonical college people CSV exporter with FACULTY role fixed and current search/membership status. Teaching/account-status filters are not applied and UI discloses the difference. Unit and existing isolated PG role/tenant coverage extended; detailed legacy roster/browser checks remain open.
**Teaching-presence filter PARTIAL (2026-10-15):** Faculty directory adds server-filtered ASSIGNED/NONE for persisted non-ended teaching assignments on live course deliveries in the admin’s college, before pagination. Counts are assignments, not teaching hours. Own/foreign/wrong-role and URL/model PG fixtures authored; browser evidence and legacy scheduling parity remain open.
**Account-status filter PARTIAL (2026-10-15):** Faculty memberships now filter persisted ACTIVE/DISABLED platform account status independently from membership lifecycle, with strict Zod, URL-persisted pagination and isolated PG role/tenant checks. Browser and legacy profile/edit parity remain open.

**Lifecycle audit link PARTIAL (2026-10-14):** Faculty directory and detail now link to a scoped Activity Log filter using the target membership UUID; server-side subjectId filtering operates after the existing college permission scope, including stable pagination. Lifecycle PATCH remains confirmed and transactionally audited. CSV export deliberately does not inherit subjectId filtering and the UI labels that limitation; full legacy/browser proof remains open.
**Legacy:** `/college-admin/teachers`

**Detail PARTIAL (2026-10-14):** `/college/faculty/[membershipId]` now provides scoped Faculty name, academic title, employment type, department and persisted teaching assignment history with active/ended counts and distinct offerings. No hours or availability are inferred and no private identity fields are disclosed. Foreign-college/nonexistent memberships get indistinguishable not-found behavior. Browser/PG acceptance and full legacy workload parity remain open.

**Read-first PARTIAL:** `/college/faculty` lists persisted Faculty-role college memberships with search, status/pagination, user status, and count of active college-owned teaching assignments. The College Admin shell and dashboard link to it. This is not the legacy faculty onboarding, edit or complete-profile workflow; exact legacy and browser acceptance remain open.

**Lifecycle PARTIAL:** Faculty rows now include a confirmed deactivate/reactivate action. The transaction locks the same-college FACULTY membership, requires the expected status, blocks deactivation while any live course teaching or section faculty assignment remains, and writes the state transition plus immutable actor-scoped activity event. No cross-college lifecycle writes are permitted. Legacy complete profile editing and independent runtime/browser evidence remain open.

- [ ] Faculty list columns/profile metadata match.
- [ ] Search/filter/pagination match.
- [ ] Create/invite Faculty flow matches.
- [ ] Edit Faculty flow matches.
- [ ] Active/inactive lifecycle matches.
- [ ] Profile/detail drawer/page actions match.
- [ ] Loading/empty/error states match.

## Page: Faculty Assignment
**Exact class-code filter PARTIAL (2026-10-15):** Faculty teaching assignments now support an exact persisted section code predicate in the college-scoped query, page state and bounded CSV; strict Zod and isolated PG fixtures authored. Runtime/browser evidence and legacy edit parity remain open.

**Exact course code filter PARTIAL (2026-10-15):** College Admin teaching assignments now filter by the saved course code before pagination, with the same filter carried to spreadsheet-safe capped CSV. Validation, URL round-trip and in-test PostgreSQL own/empty assertions authored; browser/mobile checks open.

**Teaching roster CSV PARTIAL (2026-10-15):** Matching persisted assignments can be exported as a 1,000-row formula-neutralized CSV with role/lifecycle, offering/class and IST-labeled timestamps (UTC ISO evidence is preserved), explicit truncation and no Faculty/learner contacts. Uses the signed-in College Admin roster query with existing tenant/role tests extended to export. Runtime/legacy/browser checks remain outstanding.

**Teaching-role filter PARTIAL (2026-10-15):** Faculty assignments can be narrowed to PRIMARY, CO_TEACHER or TA using the authoritative teaching-role enum and current-college persisted assignments. Model and isolated PG fixtures cover valid/invalid roles and role-specific matches. Executed PG/browser proof and remaining mutation/legacy behavior are not closed.

**Teaching-assignment directory repair PARTIAL (2026-10-15):** Joined assignment/offering, course/class/cohort/period and two independently sourced end timestamps now carry unique subquery column aliases; the isolated-PG fixture checks the correct delivery and active/ended meaning. Atomic reassignment conflict and scheduling acceptance still needs executed PG/browser verification and legacy comparison.


**Reassignment actor safety PARTIAL (2026-10-14):** The transaction now rechecks the persisted acting account, membership and College Admin role under SHARE locks and rejects revoked actors even with a cached active request context. Replacement Faculty account, membership and role are locked through commit; disabled accounts return TARGET_NOT_FOUND. Pure policy coverage and PostgreSQL revocation/no-side-effect fixtures added using a dedicated admin. PostgreSQL execution is blocked in this sandbox by OS user creation/switch restrictions; timetable conflicts, legacy/browser verification and remaining reassignment variants remain open.

**Reassignment timetable guard PARTIAL (2026-10-14):** Reassignment now checks registered future SCHEDULED sessions linked to the target delivery against the replacement Faculty’s explicitly scheduled commitments. Overlap rejects atomically; adjacent sessions and the same session are allowed. More than 2,000 windows fails closed instead of silently accepting a truncated schedule. Unit boundaries and PostgreSQL overlap/no-teaching-change/no-audit plus adjacent-success fixtures added. This does not reinterpret implicit teaching workload or rewrite existing scheduled Faculty; universal scheduling concurrency, legacy/browser proof and PostgreSQL execution remain open.

**Atomic reassignment PARTIAL (2026-10-14):** Active rows on `/college/faculty-assignment` now offer a confirmation-gated replacement Faculty selector. The College Admin service requires same-college live delivery plus active FACULTY membership, an exact old-membership expectation and millisecond-normalized PostgreSQL timestamp token, locks the live delivery/assignment, checks duplicate/primary role policy, ends the old row, inserts one same-role successor and writes immutable audit within one transaction. Foreign/missing assignments return the same NOT_FOUND. Unit and disposable-PostgreSQL success/foreign/wrong-role/stale fixtures authored. Different delivery/role reassignment, timetable workload checks, executed database/browser evidence and legacy dialog parity remain open.

**Legacy:** `/college-admin/faculty-assignment`

**Write-side PARTIAL (2026-10-14):** `/college/faculty-assignment` retains the college-scoped list/search/status/pagination and adds a live course/class delivery + Faculty + role assignment form and end-assignment action. Both require explicit user confirmation. Existing registered `course_teaching_assignments` unique constraints remain the concurrency backstop; the create transaction also checks duplicate faculty/live primary teacher before insert, locks live delivery/membership/Faculty role and writes an immutable actor-scoped `activity_events` audit row. End keeps teaching history and audits in the same transaction. Read-only options filter active same-college deliveries, courses, cohorts/programs, academic periods, section and Faculty account/membership. A maximum 200-option truncation is disclosed; no silent fallback. Change/reassign in one operation, timetable conflict evaluation, exact legacy dialogs and executed DB/browser acceptance remain open.

- [ ] Course/Class/Faculty selectors match.
- [ ] Existing assignment list/table matches.
- [ ] Assign Faculty action matches.
- [ ] Change/reassign/remove actions match.
- [ ] Duplicate/conflict validation matches.
- [ ] Active/inactive assignment state matches.
- [ ] Loading/prerequisite/error states match.

## Page: Students
**Filtered Faculty/Students directory CSV PARTIAL (chat-9):** Both role rosters now export their actual validated platform, employment, academic, search, date and sorting facets through a dedicated GET-only current-college permissioned reader, capped at 1,000 rows and spreadsheet-formula neutralized. The previous generic People CSV ignored most roster filters. Each source page rechecks persisted actor authorization; multi-page reads are not one point-in-time snapshot. Pure parser/neutralization tests authored; actual PostgreSQL/browser and large-directory consistency acceptance open.
**Exact active-class Students filter PARTIAL (chat-9):** Student roster can now isolate live section enrollment by exact registered class ID and same-college program/batch ancestry, with a bounded class picker and neutral bookmarked selection. Faculty and impossible no-class combinations reject before querying. Pure-model and gated-PG denial coverage authored; executed PostgreSQL/browser acceptance open.
**Exact academic-program Students directory PARTIAL (chat-9):** Learner roster now uses college-joined active program enrollment selection, with bounded authorized program choices, neutral bookmarked IDs and matching paging. Faculty selection throws rather than silently misusing the filter. Unit and gated-PG scope fixtures authored; executed PG/browser acceptance open.
**Bounded batch-selector bookmark retention PARTIAL (chat-9):** Student directory keeps a selected batch UUID in the filter form even when outside its first 200 current-college choices, showing only a neutral placeholder instead of a foreign name. Server-side academic college scope remains authoritative; source/unit coverage authored, browser acceptance open.
**Strict quoted CSV tokenization PARTIAL (2026-10-15):** Student CSV preview/import now fails structurally malformed quoted fields with trailing content (for example, a closed quoted name followed by extra characters), rather than silently merging them into identity data before onboarding. Escaped quotes, embedded commas and CRLF remain supported. Pure positive/negative tests authored; identity/PG/browser acceptance outstanding.
**Learner enrollment lifecycle drilldown PARTIAL (2026-10-15):** Student detail now filters recorded program/batch enrollments by ACTIVE, COMPLETED or WITHDRAWN while retaining the separate all-time enrollment count and current class/recorded attendance views. The filter is exact and no cross-college record is disclosed. Strict model and isolated PG role/not-found tests authored; real execution and browser acceptance remain.
**Registration-number coverage triage PARTIAL (2026-10-15):** Student roster now filters learners with a nonblank recorded registration number or missing registration data, preserving role/college query scope and server pagination. Distinct from roll number; no inferred identity values. Strict URL/model and disposable PostgreSQL partition/denial tests authored; executed acceptance pending.
**Roll-number coverage triage PARTIAL (2026-10-15):** The learner directory now filters those with nonblank registered roll numbers versus missing values using a correlated learner profile before pagination, retaining college and role scope. No roll number is invented or written; strict query/URL and gated PostgreSQL partition/denial fixtures authored. Executed acceptance outstanding.
**Active batch membership filter PARTIAL (2026-10-15):** College Admin student directory can select one persisted batch/cohort and only see that cohort\u2019s active learner enrollments, checking registered program/dept college ancestry before pagination. The selector reads up to 200 own-college batches, displays program context and discloses truncation. Role/tenant PG and URL/query fixtures authored; browser/DB execution pending.
**Active class placement filter PARTIAL (2026-10-15):** The Student roster can now partition registered learners by presence or absence of a live section enrollment within their own college and active program enrollment before server pagination. It does not reinterpret missing placement as an absence record. Faculty rejects this learner-only query. Model/URL and disposable PG partition/role tests authored; independent execution and mobile acceptance remain.
**CSV case-variant identity deduplication PARTIAL (2026-10-15):** Student CSV import preview and confirmed-import per-row validation now treat email addresses differing only by case as duplicates in the same file before identity provisioning. Phone and row-limit rules remain intact, and no external user lookup is disclosed. Pure parser test authored; identity/DB acceptance and legacy import parity still open.
**Active program/batch search PARTIAL (2026-10-15):** College Admin learner directory can search persisted active program or batch name/code through a correlated, same-college enrollment lookup, alongside name/email and learner identity identifiers. Archived/non-active enrollments are not presented as current. Unit label and disposable PG signed-in college/role checks authored; browser/legacy and full fixture execution remain open.
**Identity-key search PARTIAL (2026-10-15):** The College Admin student directory can search registered learner roll and registration numbers in addition to name/email, using correlated membership-scoped profile predicates before pagination. Faculty searches do not expose learner identifiers. Pure model and disposable PG in-test own-college/denied-role fixtures authored, not executed; mobile/browser and legacy roster parity still open.
**Role-restricted CSV export PARTIAL (2026-10-15):** Students directory now exposes the existing, signed-in-college export with LEARNER role fixed and current name/email and membership-status selectors. Contacts are visible only with College Admin permissions; 1,000-record cap, truncation footer and CSV formula neutralization remain. Enrollment/account-status filters are explicitly *not* reflected in export. Unit and existing isolated PG role/tenant tests extended; browser and legacy report parity remain open.
**Enrollment-presence filter PARTIAL (2026-10-15):** Student directory can distinguish an active college-owned program enrollment from no active enrollment using a correlated registered-table EXISTS predicate *before pagination*. It does not infer missing enrollment as a failed student record. Pure URL/Zod and isolated PG partition/role/tenant tests authored; full legacy moves and browser acceptance remain open.
**Account-status filter PARTIAL (2026-10-15):** Learner memberships now filter persisted ACTIVE/DISABLED platform account status independently from cohort/class context, with the same college-only query, URL-persisted pagination and PG isolation witness. Browser and full learner lifecycle parity remain open.

**Class-move guard PARTIAL (2026-10-14):** Directory move now returns the same non-leaking `STUDENT_NOT_FOUND` code for a foreign or absent membership, resets stale destination selection on reopening, and distinguishes no alternative eligible section. Persisted move remains version-checked, same-cohort and same-period, transactionally audited. Legacy modal/browser acceptance remains outstanding.
**Legacy:** `/college-admin/students`

**Detail PARTIAL (2026-10-14):** `/college/students/[membershipId]` shows in-college learner name, roll/registration numbers, program/cohort, active section and explicitly recorded marked-session attendance statuses. It excludes identity documents and other private profile fields; foreign-college/missing IDs get the same not-found. Attendance denominator intentionally excludes unrecorded present defaults, so this is not an overall attendance rate. Browser and exact legacy drill-in acceptance remain open.

**Read-first PARTIAL:** `/college/students` lists persisted Learner-role college memberships with search, status/pagination, and active program/batch/class information when registered. Missing enrollments are shown explicitly, not inferred. Create/import/edit, academic moves, full-profile detail, exact legacy/browser verification remain open.

**CSV import PARTIAL:** `/college/students/import` accepts bounded CSV (100 learners, 100 KB) with exact headers, per-row Zod validation, duplicate-in-file checks and a dry-run of registered, college-owned program/cohort status. A confirmed import calls the existing canonical person onboarding and learner-enrollment services in sequence, retaining each service audit. Rows report IMPORTED, FAILED, INVALID or PARTIAL (membership created, enrollment failed). The result CSV is formula-neutralized. Identity and PostgreSQL cannot share one ACID transaction, so bulk atomic rollback is not promised; external identity collision and recovery may require manual action. Exact legacy CSV contract, executed write-positive PostgreSQL/browser acceptance and learner profile extras remain open.

**Class-reassignment PARTIAL:** The Students directory offers a confirmed class move only within the learner's active cohort and academic period. The service enforces current placement and active learner guards, a live destination class and period, capacity, stale-state denial, an atomic MOVED/ACTIVE history transition, and an immutable college-scoped activity event. Cross-batch and cross-period transfers, legacy import/edit and browser acceptance are not provided.

- [ ] Learner list/profile metadata match.
- [ ] Search/filter/pagination match.
- [ ] Create/import/add learner flows present in legacy are accounted for.
- [ ] Edit learner fields/lifecycle actions match.
- [ ] Program/batch/class assignment state matches.
- [ ] Profile/detail drill-in matches.
- [ ] Loading/empty/error states match.

## Page: People Directory
**Role-directory ordering PARTIAL (2026-10-15):** Student and Faculty directories now use server-side NAME/NEWEST/OLDEST sort before 25-row pagination, with membership-UUID tie breaking and URL-persisted sort state. This is membership-join chronology, not program admission chronology. Strict query and isolated PG sort/role tests authored; browser/legacy parity remains open.
**Legacy:** `/college-admin/people`

- [ ] Combined role directory fields match.
- [ ] Role/status/search filters match.
- [ ] Person detail/profile action matches.
- [ ] Membership/role/lifecycle actions match College Admin permissions.
- [ ] Loading/empty/error states match.

## Page: Student Groups List
**Navigation parity (2026-10-15):** Legacy keeps the Student Groups route available but hides it from the College Admin sidebar until a generic-groups feature needs it. vNext now omits `/college/groups` from College Admin navigation for single- and mixed-role memberships without deleting its direct route. This resolves the legacy navigation mismatch only; group workflow remains PARTIAL.

**Legacy:** `/college-admin/student-groups`

**CSV validation PARTIAL (2026-10-14):** For STUDY_GROUP only, `/college/groups/[groupId]/import-preview` reads a bounded email CSV (500 rows, 128 KiB) and reports in-college active learner matches, repeated rows, already-present members, capacity blockers and formula-neutralized validation CSV. This route performs no writes and does not claim confirmed imports or enrollment acceptance. All page checks remain open.

**Write-side PARTIAL:** `/college/groups` now provides Study Group create/edit/activate/close/archive on migrated `lms_groups`, with same-college duplicate-name, version and member/capacity guards. All changes use persisted actor rechecks and transactional `activity_events` audits. Group types with additional semantics (PROJECT_TEAM/ELECTIVE) remain read-only here. Complete legacy dynamic rules, CSV, member moderation and browser acceptance remain open.

Audited contract:
- search toolbar;
- Kind filter;
- Status filter;
- New Group;
- Open;
- status transition dropdown;
- Delete confirmation;
- 20-row pagination.

- [ ] Search/kind/status filters match.
- [ ] Table columns/seat/status data match.
- [ ] New Group modal/form matches.
- [ ] Open route works.
- [ ] Status transition rules match.
- [ ] Delete confirmation preserves members/history as legacy describes.
- [ ] Loading/empty/error states match.

## Page: Student Group Detail

**Waitlist eligibility safety PARTIAL (2026-10-14):** Promotion now locks the learner account, membership and learner role through commit and rejects disabled accounts without changing the seat count, queue row/version or member history. A pure decision model preserves lock, stale-member, FIFO and capacity denials; PostgreSQL fixtures cover disabled-account no-side-effects and stale member tokens. Local type/lint/unit evidence is required before publishing; PostgreSQL remains blocked by sandbox OS user restrictions. Rule refresh, automatic scheduling, legacy/browser proof and remaining waitlist workflows stay open.

**Waitlist and rule writes PARTIAL (2026-10-14):** `/college/groups/[groupId]` now exposes version-checked, confirmed manual promotion of the first unlocked WAITLISTED learner when group capacity permits, and scoped V1 criteria rule editing with a clearly identified autoRefresh setting (saving never executes refresh). Dedicated same-origin PATCH uses the persisted College Admin actor check, own-college STUDY_GROUP lock, integer group/member optimistic versions, exact learner role/capacity/FIFO guards and one atomic membership change plus immutable member event and activity audit. Rule changes validate linked programs/cohorts stay in college and reject unsupported rule versions, then audit atomically. Pure unit and disposable-PostgreSQL success/foreign/wrong-role/stale tests authored. Full rule refresh UI, automatic refresh scheduling, learner consent/queue fairness edge cases, complete legacy/browsers and independently executed database gates remain open; parity stays PARTIAL.


**PARTIAL read-only dynamic rule preview:** College Admin can open `/college/groups/[groupId]/rule-preview` from the group detail for configured supported V1 rules. Shows persisted criteria and a bounded candidate eligibility projection without writing memberships or exposing applicant evidence. No assertion of capacity/waitlist outcome or full college-wide counts above cap. Rule edit/refresh controls, original legacy behavior, PG execution and browser verification remain open.

**Legacy:** `/college-admin/student-groups/[id]`

Audited contract:
- back to groups;
- Edit Group modal;
- status transition;
- summary card: members/term/created/description;
- tabs;
- roster toolbar/filter;
- lock/unlock member decision;
- Remove;
- Remove & Lock;
- Recount;
- Add Students modal;
- identify-by mode + pasted list;
- source/manual-vs-import + note;
- capacity/waitlist result;
- rule fields: branches, passing years, CGPA, backlogs, 10th/12th/diploma/UG %, gap years;
- Save Rule;
- Preview Matches;
- Apply to Roster confirmation;
- Remove Rule confirmation;
- rule preview table;
- history/audit table.

- [ ] Edit Group modal matches.
- [ ] Status transitions match.
- [ ] Summary metadata matches.
- [ ] All detail tabs are represented.
- [ ] Member state filter/search match.
- [ ] Lock/unlock semantics match.
- [ ] Remove and Remove & Lock confirmations match.
- [ ] Recount behavior matches.
- [ ] Add Students modal and parsing/validation match.
- [ ] Capacity/waitlist behavior matches.
- [ ] Eligibility/rule form fields match.
- [ ] Save Rule behavior matches.
- [ ] Preview Matches and counts/table match.
- [ ] Apply Rule confirmation/consequences match.
- [ ] Remove Rule confirmation matches.
- [ ] History/audit tab matches.
- [ ] Archived group is read-only where legacy enforces it.
- [ ] Not-found/cross-college state matches.

# Placements

## Page: Drives
**Legacy:** `/college-admin/jobs`, `/college-admin/jobs/all`

- [ ] Landing/current/all views and filters match.
- [ ] Search/sort/pagination match.
- [ ] Create drive action matches College Admin permission.
- [ ] Status/lifecycle badges match.
- [ ] Needs-attention cues match.
- [ ] Row/card actions and deep links match.
- [ ] Empty/loading/error states match.

## Page: Drive Overview
**Legacy:** `/college-admin/jobs/[jobId]`

- [ ] Job/company/role summary matches.
- [ ] lifecycle/status controls match.
- [ ] KPI/application/round/offer summary matches.
- [ ] publish/close/cancel/edit actions and confirmations match.
- [ ] activity/history summary matches.
- [ ] not-found/access/error states match.

## Page: Applications
**Legacy:** `/college-admin/jobs/[jobId]/applications`

- [ ] Applicant table fields/filters/search match.
- [ ] Eligibility/application status views match.
- [ ] Bulk status actions match.
- [ ] Candidate detail drawer/modal matches.
- [ ] Export if present matches.
- [ ] Empty/error states match.

## Page: Interviews
**Legacy:** `/college-admin/jobs/[jobId]/interviews`

- [ ] Round/interview schedule views match.
- [ ] Add/edit round/interview actions match.
- [ ] Date/time/location/slot fields match.
- [ ] Candidate assignment/result actions match.
- [ ] conflict validation matches.
- [ ] Empty/error states match.

## Page: Shortlisted
**Legacy:** `/college-admin/jobs/[jobId]/shortlisted`

- [ ] Shortlisted candidate list and filters match.
- [ ] Selection/export/next-step actions match.
- [ ] Candidate detail drill-in matches.
- [ ] Empty/error states match.

## Page: Job Settings
**Legacy:** `/college-admin/jobs/[jobId]/settings`

- [ ] Eligibility/rule fields match.
- [ ] application/deadline settings match.
- [ ] lifecycle/visibility settings match.
- [ ] destructive/closing actions require correct confirmation.
- [ ] save validation/unsaved-change behavior match.

## Page: Companies
**Legacy:** `/college-admin/companies`

- [ ] Company list/search/filter matches.
- [ ] Company detail/contact/history data matches.
- [ ] Add/edit company/contact actions match admin permission.
- [ ] Drive links/history match.
- [ ] Loading/empty/error states match.

## Page: Hiring Dashboard
**Legacy:** `/college-admin/hiring-dashboard`

- [ ] headline placement metrics match.
- [ ] funnel/stage metrics match.
- [ ] branch/company/CTC/outcome analytics present in legacy are accounted for.
- [ ] date/season filters match.
- [ ] drill-ins/deep links match.
- [ ] partial-data vs empty states are distinct.

## Placement Cell / TPO
College Admin can act inside TPO in the legacy product.

- [ ] College Admin guest access to TPO respects the same page-level contract in `docs/parity/tpo.md`.
- [ ] Admin-only vs TPO-only actions are explicitly differentiated.
- [ ] No strict-portal redirect blocks intended College Admin TPO access.

# Projects

## Page: Workspaces list
- [ ] List columns/cards/status/mentor/team/template data match.
- [ ] Search/filter/status views match.
- [ ] Create Workspace action matches.
- [ ] Row actions/deep links match.
- [ ] Empty/loading/error states match.

## Page: Create Workspace
- [ ] Template chooser/catalog context matches.
- [ ] project title/team/mentor/dates/cadence fields match.
- [ ] validation and creation consequences match.
- [ ] creation result navigates correctly.
- [ ] no stale template references.

## Page: At Risk
- [ ] Cross-project risk metrics/reasons match.
- [ ] filters/sort match.
- [ ] project/mentor/student drill-ins match.
- [ ] empty/loading/error states.

## Page: Readiness
- [ ] Cross-project readiness criteria/status match.
- [ ] filters/search match.
- [ ] drill-ins match.
- [ ] empty/loading/error states.

## Page: Submissions
- [ ] Cross-project submission queue matches.
- [ ] status/reviewer/team filters match.
- [ ] submission/review detail actions match admin permissions.
- [ ] empty/loading/error states.

## Page: Templates Catalogue
- [ ] assigned template list/metadata/version match.
- [ ] search/filter match.
- [ ] template detail deep link works.
- [ ] College Admin remains read-only where legacy is read-only.

## Page: Template Detail
- [ ] overview/sprints/tasks/resources information matches.
- [ ] version metadata matches.
- [ ] read-only behavior enforced.
- [ ] use-template/create-workspace action matches.

## Page: Project Audit
- [ ] cross-project audit event taxonomy matches.
- [ ] filters/search/time range match.
- [ ] event detail/drill-in matches.
- [ ] empty/error states.

## Page: Reassign Mentor
- [ ] eligible project/mentor selection matches.
- [ ] bulk selection/reassignment workflow matches.
- [ ] preview/confirmation consequences match.
- [ ] partial failure reporting matches.

## Page: Deleted Workspaces
- [ ] Product decision is explicitly made: recreate or RETIRE.
- [ ] If retained, deleted list, restore/permanent-delete actions and confirmations are fully specified.
- [ ] If retired, rationale is recorded in master matrix.

## Workspace section: Summary
- [ ] identity/status/template/team summary matches.
- [ ] archive/delete/status actions match admin permission.
- [ ] confirmation/consequence states match.

## Workspace section: Overview
- [ ] narrative/problem/goals/deliverables/definition-of-done fields match.
- [ ] edit/save validation matches.

## Workspace section: Team
- [ ] team/mentor/member data match.
- [ ] add/remove/reassign actions match.
- [ ] confirmations and protected-member rules match.

## Workspace section: Sprints
- [ ] sprint rows/fields including goal/acceptance/release/date match.
- [ ] create/edit/delete/reorder lifecycle matches.
- [ ] cross-reference integrity with tasks remains safe.

## Workspace section: Tasks
- [ ] task fields/status/type/priority/estimate/sprint linkage match.
- [ ] create/edit/delete/move actions match.
- [ ] cross-reference integrity matches.

## Workspace section: Resources
- [ ] type/title/url/access notes/pinned/required fields match.
- [ ] add/edit/delete match.
- [ ] file uploads remain explicit BLOCKED until storage is live.

## Workspace section: Meetings
- [ ] meeting fields/status/type/date/time/url/linked sprint/task/agenda/notes match.
- [ ] add/edit/cancel/complete actions match.
- [ ] cross-reference integrity matches.

## Workspace section: Readiness
- [ ] criteria/status/notes match.
- [ ] admin overrides/actions present in legacy match.

## Workspace section: Delivery
- [ ] final submission/review/readiness fields match.
- [ ] admin review/override actions match.
- [ ] history/consequence behavior matches.

## Workspace section: Audit
- [ ] project audit/history event coverage matches.
- [ ] actor/time/detail representation matches.
- [ ] filters/empty/error states match.


### W06 College Admin Departments outstanding verification
- [ ] Execute `tests/unit/admin-department-directory.test.ts`; confirm College Admin unauthorized-role redirect and negative cross-college API access.
- [ ] Desktop/mobile browser checks: search, CSV download, refresh after create/edit/archive, modal keyboard interactions, pagination and empty/error states.
- [ ] Verify bookmarked legacy `/college-admin/departments` route behavior and route-map exception.
- [ ] Confirm archive blockers with real DB tests, including concurrent dependency creation.


**W06 legacy department bookmarks, 2026-10-10:** authenticated, role-fenced redirects for `/college-admin/departments` -> `/college/departments` (active college membership with COLLEGE_ADMIN) and `/superadmin/departments` -> `/admin/departments` (active SUPER_ADMIN). This preserves entry URL behavior without duplicating editor logic or weakening current scope checks. `tests/unit/legacy-department-links.test.ts` authored with negative role/disabled status cases; **execution/browser evidence pending**, so the Departments family is still PARTIAL.


### W06 Programs source-authored checkpoint — 2026-10-10
- Distinct daily-use Programs pages added at `/college/programs` and `/admin/programs`, discovered via their Academics overview links. Both reuse existing `listPrograms`/`listDepartments` scoped read services, existing `POST /api/academics/programs` and `ProgramActions` PATCH/DELETE with cohort-dependent archive checks.
- UI implemented: create with department prerequisite, name/code/duration-terms validation, search by program/department/code, case-insensitive sorting, scoped CSV export with formula-injection protection, Refresh, 10-row pagination, Edit and Archive dialogs via existing component.
- **Material legacy mismatch remains:** legacy creates `durationYears` (1–10 years) and offers Department editable in Edit modal; vNext persists `durationTerms` (1–24) and currently has immutable Department ownership. Do not assume 2 terms/year nor silently claim equivalence; W01 must settle DB02 source semantic decision before full page parity.
- [ ] Execute `tests/unit/admin-program-directory.test.ts` plus admin role and wrong-tenant API tests on disposable DB.
- [ ] Browser verify desktop/mobile, tab order, create/edit/archive, search/CSV/refresh, dependent-cohort rejection and independent-page navigation.
- [ ] Legacy `/college-admin/programs` and `/superadmin/programs` bookmark aliases are not yet implemented. Match source-route manifest before closing.

**Status remains PARTIAL; tests authored and not run, no migration or W01 shared schema changes.**


**W06 Programs bookmark alias:** `/college-admin/programs` and `/superadmin/programs` now enter their respective existing scoped Programs page via authenticated, role-fenced redirects. Existing vNext pages and service permissions remain authoritative. Negative role tests authored; run/browser evidence still OPEN.


### W06 People Directory checkpoint — 2026-10-10

**Legacy oracle:** `lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`, `src/pages/superadmin/sections/PeopleDirectory.js` reused by College Admin; backed by `lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`. The legacy People Directory is a **read-only contacts page** with **All Contacts**, **Faculty Contacts**, **Student Contacts** tabs and separate navigation to manage students/faculty/faculty assignments. The current vNext `/college/people` is a membership management table and must **not** be marked as full clone parity.

**Authored W06 UI improvement:** server-side, college-bound People pagination (50 rows/page) replaces a hard-coded first 100; `?page=` back/forward semantics, range/total display and out-of-range reset preserve selected college. Existing permission-checked repository and onboarding/role/lifecycle dialogs remain unchanged. This addresses an operational truncation but **does not implement the three contact tabs**, managed accounts links, search or export.

- [ ] Run `tests/unit/admin-people-pagination.test.ts` and seeded PostgreSQL multi-page tests including cross-college negative checks.
- [ ] Build and browser-verify College Admin page >100 people, scope switching, permission revocation, stale link and mobile pagination.
- [ ] Implement a server-filtered read-only All/Faculty/Student contacts directory, not a misleading client-side filter of 50 rows; preserve management pages separately.
- [ ] Compare legacy contact-card fields/private-field visibility and account-management navigation before closing page.

**Status: PARTIAL / tests authored, not executed.**


**Contact profile availability PARTIAL (chat-9, 2026-10-15):** All/Faculty/Student contact tabs can isolate memberships with or without persisted learner/faculty role profile records; mixed-role memberships remain eligible if the corresponding role is incomplete. Scoped SQL is combined with status, account and role predicates before pagination and formula-safe CSV; learner and dual-role contact details remain masked. Source and gated PostgreSQL cases authored; independent execution/browser acceptance pending.

**Learner active enrollment PARTIAL (chat-9):** Separates learner-role contacts with ACTIVE owned program enrollment from learners without one; no inferred completion state. Filtered count and 1,000-row capped CSV share the same current-college SQL predicate, with learner masking unchanged. Unit and disposable PG coverage authored; execution/browser acceptance open.

**Faculty current teaching PARTIAL (chat-9):** Distinguishes Faculty-role contacts who hold current active college-delivery teaching assignments, without leaking learner-only rows. Filtered count and 1,000-row capped CSV share the same current-college SQL predicate, with learner masking unchanged. Unit and disposable PG coverage authored; execution/browser acceptance open.

**Learner roll number availability PARTIAL (chat-9):** Allows admins to locate LEARNER members with or without saved nonblank roll values without returning roll identifiers. Applied to same-college SQL before result totals, paging and masked CSV; private profile values are not returned. Unit and gated PostgreSQL tests authored; runtime/browser acceptance pending.

**Learner registration availability PARTIAL (chat-9):** Separates absent and persisted nonblank learner registration numbers without showing those identifiers. Applied to same-college SQL before result totals, paging and masked CSV; private profile values are not returned. Unit and gated PostgreSQL tests authored; runtime/browser acceptance pending.

**Faculty academic-title availability PARTIAL (chat-9):** Distinguishes FACULTY members who have saved nonblank academic titles from those missing them, without guessing from teaching assignments. Applied to same-college SQL before result totals, paging and masked CSV; private profile values are not returned. Unit and gated PostgreSQL tests authored; runtime/browser acceptance pending.

**Faculty primary-department coverage PARTIAL (chat-9):** Faculty-role contacts can identify missing valid own-college primary-department links without displaying foreign department metadata. Query predicates apply before SQL count, paginated cards and formula-safe masked CSV; College Admin scope comes from persisted membership. Unit and isolated-PG tests authored; execution and mobile browser acceptance open.

**Learner active-class placement PARTIAL (chat-9):** Learner contacts can be filtered by active section enrollment linked through matching cohort/period and a current-college department, without misrepresenting a missing class as withdrawal. Query predicates apply before SQL count, paginated cards and formula-safe masked CSV; College Admin scope comes from persisted membership. Unit and isolated-PG tests authored; execution and mobile browser acceptance open.

**College Contacts cohort selector PARTIAL (chat-9):** A native, name-labeled current-college cohort chooser filters active learner enrollments before SQL count, pagination and masked CSV. Selector is capped to 200 with truncation disclosure; bookmarked unknown UUIDs show a neutral placeholder, never a foreign-college name. Unit plus gated PG role/tenant coverage authored, pending runtime/browser execution.

**Contacts faculty department chooser PARTIAL (chat-9):** Native dropdown lists up to 200 own-college nonarchived departments, carrying exact Faculty primary-department filter to SQL, paging and CSV. Bookmark ids beyond the bound get a neutral option without leaking foreign department labels. Unit and gated PG actor/tenant regression cases authored; browser/PG execution remains open.

**Clear all Contacts facets PARTIAL (chat-9):** Clearing the Contacts directory now resets all advanced academic, status, date, search, and paging filters while preserving the selected role tab, rather than retaining hidden stale facets. Pure model regression authored; browser acceptance remains open.

**Read-only College Contacts workspace PARTIAL (2026-10-15, chat-9):** New `/college/contacts` has distinct server-filtered All Contacts, Faculty Contacts and Student Contacts tabs, rather than pretending `/college/people` membership mutations clone the legacy contact directory. The underlying PostgreSQL read uses persisted College Admin membership/role checks, strictly derives the college from that actor, de-duplicates dual-role people by membership, filters name or authorized staff email and membership lifecycle, supports name/newest sort with 25-row server paging, and recovers from out-of-range pages. Student and dual-role learner contacts are masked in cards and exports; phone is masked for all roles. Student email search is intentionally disabled to prevent masked-address enumeration; this privacy deviation needs a need-to-know product review before claiming exact legacy parity.

**Contacts operations PARTIAL:** Source-specific Faculty/Student detail links use already scoped role detail routes. The separate `/college/people` page remains the role/lifecycle management surface and now links to Contacts; the College Admin overview links to Contacts and Profile Verification. Export is a read-only, college-scoped GET, strictly parsed with duplicate-key rejection, 1,000-row cap, formula-safe CSV and explicit truncation metadata. Narrow mobile cards, status/search/sort forms, loading/invalid/error/retry states and stable pagination are authored. Pure model/unit tests and a disposable-Postgres in-test fixture covering own-college, foreign-college, wrong-role and masked CSV reads have been authored but **not executed here**.

**Contacts acceptance remaining:** Legacy contact-card metadata/pictures, accurate read-only contact recipient semantics, need-to-know authorized contact reveal, possible dedicated Mentor contacts, browser accessibility at 375px, real PostgreSQL fixture execution, CI/typecheck, 1,000-row cap/truncation browser validation and source-to-target comparison. The existing People membership-management and legacy People Contacts family remains PARTIAL, not DONE. No role-permission additions, migrations, or planning matrix edits were made.

### W06 Activity Log date-boundary correction — 2026-10-10

Legacy College Admin audit is college-scoped and calendar-driven; vNext already improves the old first-page-only audit feed with keyset paging and grouped meaningful events. W06 found a date-only correctness bug in vNext: browser `<input type="date">` values such as `2026-10-10` were coerced as UTC midnight, so the `To` filter could exclude almost the entire selected day for India users. The shared activity query now interprets date-only From/To as **00:00:00.000–23:59:59.999 Asia/Kolkata**, while preserving explicitly offset ISO datetimes and rejecting timezone-ambiguous datetimes. The page labels the calendar filters as IST.

Authored regression: `tests/unit/activity-date-boundary.test.ts` covers IST→UTC boundaries, invalid calendar dates, ambiguous timestamps and explicit-offset preservation. **Not executed in this session; browser/DB evidence remains OPEN.** Activity Log stays PARTIAL until taxonomy/producer coverage, detail drill-in, error states and browser checks are verified.


### W06 College Admin announcements staging — 2026-10-10

**Personal college notice read PARTIAL (2026-10-14):** The college announcements page now also shows up to 50 persisted `in_app_notifications` addressed to the active College Admin and tied to activity events within the same college, with an explicit link to the full personal inbox. This does not implement, infer or enable the unregistered DB10 college-wide `announcements` table; no broadcast publication/delivery is claimed. New isolated PostgreSQL read-positive/foreign-recipient/foreign-event/wrong-role checks and pure projection tests are authored. Runtime/browser acceptance remains pending.

A College Admin management workspace is source-authored at `/college/announcements` with server-derived own-college audience targets, create/edit/retarget, schedule/expiry, pin, soft delete/restore, active/deleted views and stable older-page continuation. Cross-college target IDs are resolved and rejected server-side. The page is deliberately inactive until W01 promotes DB10 Announcements; browser evidence is absent, so this is **not a DONE page**.


### W06 Activity detail drill-in — 2026-10-10

The shared Activity Center now has a tenant-safe `/activity/[eventId]` drill-in showing event/action, actor, entity, scope, time and structured context. A College Admin may open only events whose persisted `collegeId` equals the active membership college; an out-of-college UUID is returned as not-found. Metadata is bounded and credential/identity-secret key names are redacted before browser rendering. This advances the "detail drill-in / expandable event context" job, but the page remains PARTIAL because exact legacy category chips, all producer coverage, request IP/User-Agent, actor-role snapshot and executed browser tests remain OPEN.


### W06 source-matched Dashboard quick actions and setup phases (2026-10-10)

Legacy FE `lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`: `college-admin/dashboard.js` + `components/admin/dashboard/config.js` define **11 Quick Actions** and **14 first-time Setup Guide steps** across 5 phases. `/dashboard` now shows these rows only when the current membership carries COLLEGE_ADMIN; existing metrics remain. Each correctly available vNext destination links to its real college-scoped page, while missing exact daily-use jobs (Faculty, Students, Attendance, Assignments, Quizzes, Hiring Dashboard, read-only Contacts tabs, Semesters, Semester-Course Mapping, Batches, Classes, Faculty Assignment, Lecture Halls, Lessons and Lesson Content) remain clearly non-clickable, not falsely mapped to a generic page. This is **visible navigation parity inventory, not completed feature parity**.

- [ ] Implement missing daily-use destinations and turn their non-clickable items into source-backed links one page at a time (coordinate W02 course/assessment, W04 placement UI; W06 owns master/admin pages).
- [ ] Wire Setup Guide progress to real persisted college readiness; current phase cards do not claim completion.
- [ ] Compare AtAGlance and AttentionBoard data/KPIs against legacy and add per-card permission/error/empty/mobile tests.
- [ ] Execute `tests/unit/admin-dashboard-navigation.test.ts`, build/typecheck and authenticated desktop/mobile College Admin browser workflow.

**State: PARTIAL / source-authored navigation only / tests not run.**

## College Admin Department Placement Evidence (read-first PARTIAL)

`/college/placements/readiness-by-department` lists active enrolled learners, recorded candidate-academic-evidence profiles, verified profiles, and placement preference profiles by owning department. It does not assert job eligibility or actual readiness, and is not a replacement for legacy Hiring Analytics. This reports only migrated source evidence with College Admin permission and strict college scope; full funnel reporting, browser and runtime DB acceptance remain open.

**Classes CSV export PARTIAL (2026-10-14):** `/college/classes` reuses existing persisted search/program/status filters, exports up to 1,000 same-college registered sections across server-paged results, neutralizes spreadsheet formulas, and emits CSV footer plus HTTP cap/truncation headers. Auth derives college from context, not query; no private learner data. Pure unit and gated own/foreign-college PostgreSQL tests authored; CI and browser acceptance pending.

**College offering lifecycle PARTIAL (2026-10-14):** College Admin `/college/courses` now includes archived offerings in the list, while create selectors and delivery aggregation exclude archived rows. Confirmed archive reuses the existing transactional delivery guard and immutable audit; restore validates own-college ancestry, current parent statuses and active offering uniqueness, locks and writes audit transactionally. New origin-protected route, Zod/role checks and unit/PG success/foreign/stale tests authored. Browser/PG execution remains pending; no DONE row change.

**Attendance corrections read PARTIAL (2026-10-14):** `/college/attendance/corrections` now displays authorized current college policy, labels saved versus default policy, and lists persisted scheduled sessions for a strict 1–31-day IST window with recorded attendance marking status and existing Faculty correction-window calculation. It explicitly does not infer actual correction requests or totals because a dedicated migrated request-history table is unavailable. Gated PostgreSQL own/foreign/role checks, pure-model unit tests and error/loading/mobile states authored; independent CI/browser verification pending.

## 2026-10-15 source reconciliation against main ea1172d2

The current main/lane comparison and safe integration targets are recorded in the final reconciliation section of `docs/planning/account-surface-parity.md`; it is a source snapshot, not another tracker or runtime acceptance. Existing checkbox evidence is preserved. No required page/family becomes closed from this review.

Thirty of chat-3's 43 comparison paths already match main byte-for-byte, including visibility producer/API/control/export, content directories/overview and profile work. Its residual includes program-directory/academic actions, assessment aggregate routes/component/model/service/tests and parity prose. Do not rebuild the 30 integrated paths or repeat the migration. College verification and class-to-team workspace creation also exist on main; their section-8 inventory is now PARTIAL, with full PG/concurrency/browser/cross-role gates still open. Chat-9's remaining Contacts export/privacy/navigation batch is different from main but 29 commits behind at the refreshed snapshot; preserve main's verification and ESLint fixes during reconciliation. No academic/people parent contract is certified by file identity alone.

**2026-10-15 College Admin Batches PARTIAL:** Added batch start on or after over registered, same-college start-period dates, with strict date validation and matching CSV. Unit and isolated PG fixtures authored; browser/executed DB and exact legacy parity open.

**2026-10-15 College Admin Batches PARTIAL:** Added batch start on/before registered start-period date with Zod/CSV and own-college tests. PG execution/browser/oracle validation remain open.

**2026-10-15 Batches PARTIAL:** Batch active class evidence now filters only persisted own-college classes, with URL/CSV and unit/isolated-PG assertions. Exact legacy UI and executed PG/browser acceptance still open.

**2026-10-15 Batches PARTIAL:** Batch active learner evidence now filters only persisted own-college learner enrollments, with URL/CSV and unit/isolated-PG assertions. Exact legacy UI and executed PG/browser acceptance still open.

**2026-10-15 Classes PARTIAL:** Class academic period code uses a bounded exact code match on a registered same-college academic relation, with matching CSV, navigation and isolated-PG tests authored; execution/browser/legacy comparison remains open.

**2026-10-15 Classes PARTIAL:** Class exact section code uses a bounded exact code match on a registered same-college academic relation, with matching CSV, navigation and isolated-PG tests authored; execution/browser/legacy comparison remains open.

**2026-10-15 Electives PARTIAL:** Elective selection choice constraints reflects persisted, tenant-scoped min/max choice constraints, keeping pagination/CSV aligned; unit and disposable-PG tests authored, executed/browser/legacy gates open.

**2026-10-15 Electives PARTIAL:** Elective active offering presence reflects persisted, tenant-scoped active linked course offerings, keeping pagination/CSV aligned; unit and disposable-PG tests authored, executed/browser/legacy gates open.

**Cross-lane delegated TPO spreadsheet wiring PARTIAL (chat-9):** Per orchestrator request, shared grid, column chooser and URL-kept canonical filters are now mounted on TPO Students and drive Applications, retaining scoped server reads and row actions. Export-only fields do not enter visible columns. UI/browser acceptance and legacy inline-edit parity open.
**Cross-lane delegated Custom 500 boundary test PARTIAL (chat-9):** Root global-error.tsx now has an SSR unit test checking heading, retry, Go back/Home and suppression of thrown error messages, digest and stack details. Unit execution/browser recovery and telemetry acceptance still open.
**Delegated TPO grid URL persistence PARTIAL (chat-9):** Both spreadsheet pages retain the bounded visible-column URL preference across form submit and next/previous links. Server-read filters and permissions unchanged; browser acceptance open.
**Delegated TPO All-state grid filter consistency PARTIAL (chat-9):** Shared filter panel now maps canonical ALL values to an explicit All option and removes them from the URL when resetting, while preserving unrelated URL state and resetting stale page. Type/model tests authored; browser acceptance open.
**Bulk-feedback freshness PARTIAL (chat-9):** Changing verification selections, select-all/clear or URL-backed queue filters now invalidates previous batch outcomes and errors, resets shared correction text, and prevents a previous result from appearing to apply to a new candidate set. Explicit outcome model tests authored; browser acceptance pending.
**Verification SQL sort order preserved PARTIAL (chat-9):** College Admin grid no longer re-sorts a SQL-paginated page with differing JavaScript locale semantics (especially learner-name mode). Local-only shared workspaces still sort locally; unit checks authored, browser/SQL collation acceptance open.
**Verification attention-age intersection guard PARTIAL (chat-9):** The queue/page/CSV explicitly reject overdue-waiting attention with younger age bands and updated-details attention with first-submission-only state. Filter form reports a focused correction message. Shared pure tests authored; browser/API acceptance open.
**Bulk confirmation draft hygiene PARTIAL (chat-9):** Changing selected learners or switching bulk action clears prior shared correction reasons; controls and draft input lock during in-flight saves. This prevents accidentally applying a previous batch’s correction text to new learners. Count/busy-state unit tests authored; browser/API acceptance remains open.
**Frozen single-review confirmation inputs PARTIAL (chat-9):** When a Verify/Send back confirmation is open, staff cannot silently change correction reasons or swap actions before clicking Confirm; Cancel returns to editable inputs. In-flight saves remain locked. Pure transition tests authored, browser/end-to-end acceptance pending.
**Reliable verification attention shortcuts PARTIAL (chat-9):** One-click triage now clears stale waiting subtype/age restrictions; Missing marksheets explicitly switches to Education and clears conflicting document-presence filtering. These shortcuts no longer strand reviewers on an invalid Identity-only query. Pure route-filter tests authored; browser acceptance open.
**Selected-tab SQL export pushdown PARTIAL (chat-9):** CSV now narrows SQL to the selected verification status tab (and first-submission/update substate) before the 5,001-row cap instead of reading unrelated decision history. Queue still reads all statuses for truthful cross-tab counts. Author-time status matrix tests added; disposable PostgreSQL/CI evidence pending.
**Elapsed-age SQL pushdown PARTIAL (chat-9):** Waiting-age selections now apply elapsed timestamp bounds in scoped queue and CSV SQL before the working-set cap, using one read clock and retaining row checks. Boundary unit tests authored; database execution pending.
**Verification review modal keyboard focus containment PARTIAL (chat-9):** Tab and Shift+Tab now wrap inside the private review dialog instead of moving focus to underlying college pages; keyboard Escape and opener-focus restoration remain in place. Pure focus-boundary cases authored; screen-reader/browser focus QA still required.
**Verified roster-to-masked Contacts navigation PARTIAL (chat-9):** College Admin verification cards now link directly to the existing masked Contacts detail under persisted actor scope, rather than forcing staff to search for the learner twice. Shared Super Admin/TPO consumers do not receive College-specific links. Pure navigation contract authored; browser/role acceptance open.
**In-flight bulk selection lock PARTIAL (chat-9):** Verification row checkboxes now disable while a bulk decision is in progress, in addition to the existing select/clear and confirmation guards, preventing changes to the submitted set during asynchronous processing. Pure selection state checks authored; browser interaction acceptance pending.
**Stale single-decision recovery PARTIAL (chat-9):** After a row-version conflict the drawer now invalidates the stale snapshot and disables further decisions until the reviewer explicitly reloads the fresh private detail. No stale replay or blind success is presented. Source contracts authored; actual DB concurrency/browser acceptance outstanding.
**Waiting-only verification attention cues PARTIAL (chat-9):** Updated-details and overdue-waiting triage now reject decided tabs at the page, query service and CSV boundaries. Navigating to a decided tab clears only incompatible attention selections while preserving supported filters. Pure parser contract tests authored; browser acceptance pending.
**Identity/Education evidence-filter guard PARTIAL (chat-9):** An Identity-only queue cannot silently apply marksheet-present/missing or missing-marksheet triage. Page, service and CSV reject impossible combinations, and switching the visible kind to Identity clears the incompatible fields. Model tests authored; PG/browser acceptance pending.
**Role directory filter denial parity PARTIAL (chat-9):** A single shared validator now rejects every Faculty/Students role-incompatible filter at the page and CSV boundary rather than returning a server error after service authorization. The data service still enforces the same restrictions. Unit and negative export parser tests authored; browser/PG acceptance open.
**Deduplicated Faculty/Students CSV PARTIAL (chat-9):** The role-specific 1,000-record exports now suppress repeated membership IDs if directory pages shift during export and visibly mark incomplete results. The persisted same-college authorization still applies on each page; snapshot-level repeatable-read proof remains open.
**Combined program/batch/class Students scope PARTIAL (chat-9):** The learner directory now applies all exact academic and optional class-presence facets within a single active current-college enrollment; unrelated past/parallel enrollments cannot jointly satisfy a filter. Matching export uses the same directory service. Scoped negative PostgreSQL evidence remains to be executed.

**Chat-9 college contact/verification hardening (2026-10-15) — PARTIAL:** The Contacts tab pivot now drops an impossible Faculty-only / Learner-only audience combination while preserving other filters, exact-member bookmarks have a reversible directory exit, filtered-empty states have a same-tab reset, and the pager offers first/last jumps retaining query context. Verification filter drafts run the same cross-field guards as page/export before navigation, stale private detail dialogs close on queue changes, unknown server failure text is not echoed, and bulk outcome receipts must match only submitted eligible candidate keys and authoritative aggregate counts. Dedicated unit tests are authored; no executed unit, PostgreSQL, browser, privacy or cross-role acceptance evidence is claimed for this batch.

**Chat-9 URL/validation round PARTIAL (2026-10-15):** College Contacts now gives bounded, non-leaking specific explanations for invalid joined-date windows, impossible academic combinations and role/audience contradictions before any directory read, with generic fallback for unrecognized errors. Automated unit cases authored; not executed in this connector-only round. Live/browser and exact legacy wording acceptance remain open.
**2026-10-15 Super Admin template creation safety (chat-3, source-authored):** Direct `/admin/projects/templates/new` navigation in a selected college/organization scope now renders a non-leaking access-denied panel with a route back to the catalogue instead of throwing `project-template.manage`; unscoped global creation retains its permission gate. Regression guard and scoped permission checks authored; actual browser acceptance pending.

**College Admin Batches filter validation PARTIAL (2026-10-15 chat-3):** batch start-date order rejects contradictory URL and CSV choices before querying tenant data, with page/CSV regression tests authored. Execution, browser and legacy oracle verification remain open.

**College Admin Batches filter validation PARTIAL (2026-10-15 chat-3):** missing progression versus recorded term rejects contradictory URL and CSV choices before querying tenant data, with page/CSV regression tests authored. Execution, browser and legacy oracle verification remain open.

**College Admin Batches filter validation PARTIAL (2026-10-15 chat-3):** unrecorded academic year versus year filter rejects contradictory URL and CSV choices before querying tenant data, with page/CSV regression tests authored. Execution, browser and legacy oracle verification remain open.

**College Admin Batches filter validation PARTIAL (2026-10-15 chat-3):** missing progression versus academic year filter rejects contradictory URL and CSV choices before querying tenant data, with page/CSV regression tests authored. Execution, browser and legacy oracle verification remain open.

**College Admin Semesters filter validation PARTIAL (2026-10-15 chat-3):** Recorded credits cannot simultaneously be required by a numeric bound and classified as UNSET. Shared page/CSV refinement and regression cases authored, execution/browser/oracle acceptance pending.

**College Admin Electives filter validation PARTIAL (2026-10-15 chat-3):** elective semester interval rejects contradictory persisted-term choices before read queries and capped CSV exports. Authored unit page/CSV regression cases; runtime, browser and legacy parity remain OPEN.

**College Admin Electives filter validation PARTIAL (2026-10-15 chat-3):** elective required versus allowed picks rejects contradictory persisted-term choices before read queries and capped CSV exports. Authored unit page/CSV regression cases; runtime, browser and legacy parity remain OPEN.

**College Admin Electives filter validation PARTIAL (2026-10-15 chat-3):** elective linked period date interval rejects contradictory persisted-term choices before read queries and capped CSV exports. Authored unit page/CSV regression cases; runtime, browser and legacy parity remain OPEN.

**College Admin Electives filter validation PARTIAL (2026-10-15 chat-3):** exact elective semester inside selected interval rejects contradictory persisted-term choices before read queries and capped CSV exports. Authored unit page/CSV regression cases; runtime, browser and legacy parity remain OPEN.

**College Admin Electives filter validation PARTIAL (2026-10-15 chat-3):** unlinked elective period without linked-only selectors rejects contradictory persisted-term choices before read queries and capped CSV exports. Authored unit page/CSV regression cases; runtime, browser and legacy parity remain OPEN.

**College Admin Classes filter validation PARTIAL (2026-10-15 chat-3):** Reversed linked academic-period date bounds now fail identically in the class page query and same-college CSV; authored unit cases, executed PG/browser and legacy parity pending.

**College Admin directory validation feedback PARTIAL (2026-10-15 chat-3):** Classes, Electives, Batches and Semesters error states now render bounded, actionable field-specific messages for contradictory filters instead of a generic failure. Invalid raw values and internal authorization strings are not echoed; unit tests authored, browser verification pending.

**College Admin semesters and batches empty-state recovery PARTIAL (2026-10-15 chat-3):** Both directories show a keyboard-reachable clear-filters action without choosing another college or exposing tenant data, including empty pages beyond the last result. Regression guard added, browser/accessibility validation pending.

**College Admin classes and electives empty-state recovery PARTIAL (2026-10-15 chat-3):** Both directories show a keyboard-reachable clear-filters action without choosing another college or exposing tenant data, including empty pages beyond the last result. Regression guard added, browser/accessibility validation pending.

**College Admin semester and batch mobile table accessibility PARTIAL (2026-10-15 chat-3):** Result table region has a bounded scroll container, keyboard focus, semantic region label and a small-screen horizontal-scroll hint. Desktop layout unchanged; source regression test authored, actual touch and screen-reader checks pending.

**College Admin class and elective mobile table accessibility PARTIAL (2026-10-15 chat-3):** Result table region has a bounded scroll container, keyboard focus, semantic region label and a small-screen horizontal-scroll hint. Desktop layout unchanged; source regression test authored, actual touch and screen-reader checks pending.

**College Admin Electives CSV transparency PARTIAL (2026-10-15 chat-3):** Visible mobile-wrapping export link and capped-row/truncation notice clarify that the downloadable CSV uses the current persisted, permission-scoped filters. Source/unit regression guard authored; executed browser/download parity pending.

**College Admin Semesters CSV transparency PARTIAL (2026-10-15 chat-3):** Visible mobile-wrapping export link and capped-row/truncation notice clarify that the downloadable CSV uses the current persisted, permission-scoped filters. Source/unit regression guard authored; executed browser/download parity pending.

**College Admin Batches CSV transparency PARTIAL (2026-10-15 chat-3):** Visible mobile-wrapping export link and capped-row/truncation notice clarify that the downloadable CSV uses the current persisted, permission-scoped filters. Source/unit regression guard authored; executed browser/download parity pending.


## 2026-10-28 imported shared academic/people section checkpoint — source-only

The legacy source investigation at FE `9d56bb7a347b06f242ef615c19fdc298f83329e0` traced `src/pages/Dashboard/course/syllabus/{liveclass,resource,video,youtube,syllabusDetail}.js`, `src/pages/Dashboard/course/Attendance/{TakeAttendance,StudentAttendanceView,TeacherAttendanceView}.js/jsx`, `src/components/admin/courses/AdminCourseSyllabus.jsx`, `src/components/contacts/ContactsGrid.js` and extensive reused Super Admin `sections/*.js` modules. See `docs/audit/legacy-dev-census/2026-10-28-wave4-6-reconciliation.md`.

Before accepting existing College Admin academic/course/people families, map child tabs, editors, uploads, order changes, contextual menus, attendance corrections, unsaved/invalid states and tenant boundaries to actual vNext child workspaces. Shared source files do not imply identical permission semantics between college and Super Admin. This checkpoint adds no page count, tracker task or green status; backend and browser acceptance remain required.
