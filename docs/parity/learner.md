**2026-10-16 chat-5 Phase 2 Round 7 — 10 pushed commits; authored only, tests NOT RUN:** Fast-forwarded chatgpt/chat-5 to main `36392aa5d02517c1fedebc6c7d406eae5031f3d4` before editing. The orchestrator's real migrations 0085–0089 were verified on main and **not rewritten or re-staged**. P-S1-05 / DB08-C `d89c053`: guarded the `placement_external_offers` relation-presence read so absent staging-only tables do not crash the learner list/application/offer issuance; FKs/checks/parent guards now registered as migration 0094. Full externally verified held-offer counting was unblocked when DB08-C was registered as migration 0094 (the absent-table fallback remains only as a safety net). P-S2-01 `b553cf9` real 0089 requireVerifiedEvidence read/write and non-bypass gate before individual INCLUDE; P-S2-02 `35f84aa` real 0087 minPctThroughout read/write/eligibility comparison; P-S2-04 `ae78276` real 0086 section whitelist college-scoped writer validation and active-section evaluator before overrides, plus list visibility `eca226a`. P-S1-06 `0fd32a1` uses real 0088 structured cascade_id for accept, sibling offer/application history, and compensation service; manager undo endpoint, rollback race tests and explicit user confirmation still not implemented. P-S2-11 `6ff661b`: real 0088 WITHDRAWN→SUBMITTED history for current-eligible uncomplicated applications only; prior offers, staged/applied rounds, reviewed screening, channel mismatch explicitly block revival. P-S2-12 / D11 `f036f04` atomically revokes ISSUED offers on close, preserving accepted outcomes; `95356d9` supplies explicit CANCELLED transition and concurrency-protected archive, but cancellation HTTP interface and broader integration proof remain. P-S1-07 / P-S2-07 EXPIRED exists through 0085 and batch sweep uses it; corrected stale staged comments this commit, **15-minute scheduler not wired** and notification/application lifecycle effects remain. Learner wording L1–L8 (Home/Schedule/Notices/Your offers, subtitle, Back to courses and search placeholder) was already correct on main; no speculative new user-visible labels. No protected schema, Drizzle journals, auth, storage, deployment, package, env, AI or main branch changes. **Not run:** TypeScript/typecheck, ESLint, unit Vitest, real PostgreSQL integration, migration replay, cross-tenant/concurrency tests, scheduler and browser/mobile acceptance. **Backlog source changes:** P-S2-01/02/04 runtime paths complete pending acceptance, P-S2-11 partial, P-S2-12 partial, P-S1-06 partial, P-S1-05 DB08-C missing. **Still open:** P-S1-07 scheduled expiry and side effects; P-S1-06 undo route; P-S1-05 DB08-C registration and CTC proof; P-S2-05 dream exemption end-to-end; P-S2-06 Sunday-skipping response deadlines E2E; P-S2-08 SELECTED evidence/report parity; P-S2-09 waitlist promotion; P-S2-10 manager round-result stage transitions; P-S2-13 season decision; P-S2-14 interview-slot clashes; D12/D14/D15 as remaining owner scope. No tracker DONE flips without independently executed evidence.\n\n**2026-10-16 chat-5 Phase 2 Round 6 — 10 pushed commits (NO TEST EXECUTION):** Fast-forwarded `chatgpt/chat-5` to main `2442603d76dd5cdcc7bc06e3693cb2af1924250c` before implementation; restricted all writes to chat-5, no protected schema/journal, CI, security, deployment or main changes. Re-read Section A, Phase2 chat-5, wording gap report, and exact dev-legacy copy. *Changes in this round:* P-S2-05 main report's placed/branch/drive/company counts exclude accepted internships while keeping their offer counts (`44ee67d`); P-S2-08 main reports now load/enforce college `counts_as_placed_at` policy for OFFER_RELEASED/OFFER_ACCEPTED (`f3fd945`) and detailed unplaced pool uses same rule, omitting LOI/internships (`8d67a7c`); SELECTED needs an independently verified selected-outcome event feed and remains PARTIAL, do not infer it from screening. P-S2-10 learner application browse stage derived from most recent applied round outcome (REJECTED/WAITLISTED) and persisted official offer status (OFFERED/HIRED), without mutating stored application state (`1a20c93`); remaining manager workflows and event-state transitions are open. D4 exact decimal half-up rounding in academic evidence `scaleHundredths` and its regression (`d58e97e`, regexp escape corrected in this final commit); D16 ambiguous duplicate active enrollments now fail closed before INCLUDE overrides (`8064702`). Dev-legacy wording L6 My Placements Home subtitle `c7f7c7d`, L7 Back to courses `0c5f872`, L8 learner search placeholder `cb3fde7`; My Placements tabs Home/Schedule/Notices and heading Your offers already merged and left unchanged. **Backlog implemented in source in this round:** D4, D16, substantive P-S2-05 internship counting and P-S2-08 OFFER_RELEASED/OFFER_ACCEPTED summary/detail reports, P-S2-10 learner display derivation. **Still open:** P-S2-01 and P-S2-04 staged rule columns undergoing orchestrator registration, P-S2-02 throughout-pct registered enforcement, P-S2-05 persisted dream exemption and TPO-side reporting parity, P-S2-07 expiry registration, P-S2-08 SELECTED signal/other report surfaces, P-S2-09 waitlist promotion, P-S2-10 manager result-stage transitions, P-S2-11 audited reapply, P-S2-12 cancellation, P-S2-13 active-season policy decision, P-S2-14 interview slots. Section A S1 offer expiry scheduler/DB and accept undo remain pending. **Not run:** TypeScript, ESLint, unit Vitest, integration PostgreSQL, migration replay, race/tenant and browser/mobile checks. This batch creates no DONE claim in the binary tracker; orchestrator must independently execute acceptance. Wording-gap L1–L5 for My Placements was already done on main; L6–L8 authored this round.\n\n**2026-10-16 chat-5 Phase 2 Round 5 — ten pushed commits, authored tests NOT RUN:** Fast-forwarded `chatgpt/chat-5` to main `4d575ad4fe7c99090d8b1d0b7f7f2735fa4de302` first. Reviewed Section A and the exact dev legacy My Placements tab/heading inventory; made no new user-visible copy changes. P-S1-05 / T-S1-04: registered VERIFIED outside offers now count as campus-college held offers (lakh decimals converted exactly to INR, unverified/rejected/revoked excluded) through `src/modules/placements/held-offer-facts-service.ts` (`6cfd299`) and wired learner listing, locked application and official release to the common source (`f87ed89`); accompanying unit regressions authored, not run. P-S2-01 verification-only policy is a tested pure comparator with proposed unregistered `require_verified_evidence` field (`87b6339`); it is NOT a live feature until column registration and runtime wiring. P-S2-04 is a tested pure section-target predicate with proposed unregistered `allowed_section_ids` (`36475db`); not runtime-gated until registration. Authored isolated disposable PostgreSQL integration suite `tests/integration/placements-phase2-learner-gates.test.ts`: verified outside held-offer inclusion/revocation (`62b5de6`), college-scoped debarment with lift (`dce789a`), cohort-target discovery/apply (`4458bbf`), exact-time offer expiry sweep, persisted EXPIRED status/history, idempotency and active-unique slot (`903825b`), accepted-offer sibling cascade, shared event id and repeated accept idempotency (`5c6d0a9`). The expiry integration scenario deliberately throws a clear migration prerequisite error if the registered `EXPIRED` status is missing; its batch service is NOT scheduled. Tests are authored, not executed, so none of these items gains certified tracker DONE here. **Section A status:** P-S1-02/03/04/08 have existing runtime paths on main but still require end-to-end acceptance; P-S1-05 has verified-external held-offer coverage but dream exemption requires registered `is_dream` and cross-writer concurrency proof; P-S1-06 atomic accept cascade exists, but undo remains staged until history-transition DDL registration; P-S1-07 expiry service is source-authored, but the registered `EXPIRED` constraint, 15-minute scheduler, downstream application effects, migration replay and race evidence remain. P-S1-01 counts-as-placed setting/report integration remains open; P-S2-02 throughout pct still pure/staged; P-S2-03 lateral derivation already wired; P-S2-05 dream/internship exemptions remain; P-S2-06..14 remain as applicable. **Not run:** TypeScript/typecheck, ESLint, Vitest unit/integration, PostgreSQL migration replay, tenant and concurrency acceptance, scheduler execution, browser/mobile checks. No protected schema, drizzle, storage, auth, CI, deploy, package, env, AI or main-branch files changed by this builder.\n\n**2026-10-16 chat-5 Phase 2 next round (10 commits; branch-only, source tests authored):** Merged main via fast-forward at `53a7d5fe563f760f99947562239bf77d6a9093fd` before editing. Section-A S1 already on main: P-S1-02 active debarment checks in learner apply/list, offer issuance and TPO bulk add; P-S1-03 cohort/program targeting; P-S1-04 finished-batch/registration/held gating; P-S1-06 accept cascade + correlation and staged undo; P-S1-08 once-per-job counted-drive event at publish; D3 and D5. In this round P-S1-07 expiry predicate and non-wired atomic batch worker were added (`c93658e`, `d2c4bc0`), with a 15-minute future orchestration contract and focused regressions. NOT DONE: EXPIRED still rejected by registered DB constraints; orchestrator must register `docs/proposed-migrations/placement-job-cancelled-offer-expired.sql`, add scheduler invocation every 15 min, application-level effects and PostgreSQL race/tenant evidence. P-S1-01 countsAsPlacedAt in placement rules, P-S1-05 dream exempted drives and verified external offers still require schema/service integration. P-S1-06 reversible undo is gated by staged history constraints/route. Dev-legacy copy `docs/audit/legacy-copy-A.md` L378–388: tab strip now exactly Home, Drives, Applications, Schedule, Offers, Notices, Placement cell (`3cc06a8`); authenticated Schedule page over membership-scoped rounds and reschedule instants (`6749696`) with URL navigation kept under /schedule (`ee1f022`); offers title `Your offers` (`be1e7fa`) and notices title `Notices` (`60186af`). Existing older routes kept for deep links but removed from the visible tab strip. S2: P-S2-03 derived lateral-diploma check is now used by eligibility (`0166812`); P-S2-02 pure minimum-percentage-throughout policy and proposed column staged (`0975955`), but not yet enforced until registered column is wired. P-S2-01, P-S2-04, P-S2-05, P-S2-06..14 remain. All changes only on chatgpt/chat-5, no protected runtime schema files, AI, release claims, or production operations. Typecheck, lint, Vitest, PostgreSQL migration replay, cross-tenant/concurrency and responsive browser checks NOT EXECUTED by this builder; orchestrator executes acceptance. None of these statuses is a certified DONE until verified.\n\n**2026-10-16 chat-5 Phase 2 Round 3 (10 commits including this note; implementation only, acceptance pending):** Branch `chatgpt/chat-5` was fast-forwarded to main `f70d0df617b109cca783bf0ab5a577aa266c3f3a` before changes. D5 exact expiry rejection `c4195f0` prevents response when `now >= expiresAt` in preflight and transaction; D3 transaction-bound eligibility `14e393d` passes the same `tx` to job/membership/policy/evidence reads; D2 deterministic duplicate row handling `a444735` reads the persisted existing application under the write transaction and does not silently revive WITHDRAWN rows. These three defect implementations have focused unit regressions but require orchestrator execution to certify. P-S1-04 registration, finished-batch, debarment and held-offer `canApply` gates were aligned across list and locked apply; listing `40050aa` now uses held-offer rules, but release acceptance is still needed. P-S1-05 uplift is shared with offer release and college-scoped in application `0c4545c`; the dream-drive entitlement remains blocked until a real registered `is_dream` column exists. `339d5a9` stages SQL and column contract only, not a live migration. P-S1-06 already had accept cascade on merged main; `0180ddc` persists its correlation ID on accepted history and returns it (also on an idempotent accepted retry). `7f12955` adds strict manager-scoped compensating undo service and pure tests; it is deliberately not route-exposed until history reversal constraints are registered. P-S2-11 learner withdrawal now blocks ISSUED/ACCEPTED offers `51230da`. Explicit re-apply via `WITHDRAWN -> SUBMITTED` and undo `DECLINED -> ISSUED` / `ACCEPTED -> ISSUED` still require orchestrator promotion of `docs/proposed-migrations/placement-phase2-dream-cascade-undo.sql`, runtime integration and PostgreSQL concurrency tests. No protected schema/journal, production, AI or secrets changed. UI labels and messages were not newly invented. Run focused unit tests, typecheck, PG tenant/role/concurrent state acceptance, and browser checks before declaring full parity. Backlog SOURCE-CODE COMPLETED for D3 and D5 (D2's duplicate path completed but its reapply dependency remains), PARTIAL: P-S1-04/P-S1-05/P-S1-06/P-S2-11, REMAINING: P-S2-01..05, full legacy-wording audit and the stage-to-registered DB integration. No checklist/family/tracker item is newly certified CLOSED by this source-only batch.\n\n**2026-10-16 chat-5 Phase 2 follow-up — PARTIAL, not certified DONE:** Refreshed main into chatgpt/chat-5 (merge ae6694303cc780b1108dfcf46971b2b00641c28c). P-S1-04 registration-choice policy now distinguishes REGISTER_FIRST (no batch registration), CHOSE_OTHER (any non-PLACEMENTS choice), and CAN_APPLY (explicit placements registration), with pure unit tests in tests/unit/placement-batch-registration-policy.test.ts; learner job list and locked apply path both enforce registration choice. Prior finished-batch rejection remains in both paths. Commits: 9b6a72ba6215592263ffe87cc7748f93adc2c402, 66250356fda4fedd1b351c231090dea01d114bd1, 87934fb0c68a2e89f60bab0e7f037060b59ea2a4, a974a3a4f67a9985a49bceb56ad25fa1160d9e2c. P-S1-05 held-offer cap/uplift comparison now uses active official OFFER rows, maxHeldOffers/upliftPct college rule, and unknown-CTC fail-closed in learner application and offer issuance; pure tests cover threshold, LOI exclusion, accepted offers, and dream override. Commits: f8c03cb3a832b7017eeaa10c52ccc4e6ea5d4627, 5ef42515adb4dcb4d48571a7bcf69851c6bc2801, 7be248161e5fec4c9a6f7445f390b2a3465a4967, 597fa744db1cfd58c582115a6678fdac87cb6d1f. This is NOT full P-S1-05 parity: the schema has no registered isDream job column, so both live writers set isDream=false until a staged schema/migration is approved; learner canApply listing also does not yet reflect the held-offer cap. P-S1-02 still lacks issuePlacementOffer and drive-day checks. P-S1-06 accept cascade, P-S2-11 withdrawal/reapply, D2/D3/D5, P-S2-01..05, exact learner wording audit and UI parity browser work remain outstanding. No protected migrations, AI, release claims or secondary tracker changes. Focused Vitest, TypeScript, lint, PostgreSQL concurrency/tenant tests and browser verification were not executed via this GitHub-only connector; changes remain PARTIAL pending independent acceptance evidence. Legacy-facing labels/messages were not changed in this batch (existing non-disclosing errors are reused).\n\n**2026-10-15 chat-5 follow-up to malformed-date offer safety, PARTIAL:** The same round also patches the actual learner offer card formatter so invalid saved issued/expiry instants display as unavailable instead of throwing during rendering; it retains the response block from the earlier fail-closed timing change. Focused unit test authored in `tests/unit/learner-offer-display-invalid-date.test.ts` and separately pushed; not executed here. No parity closure or phase change claimed.\n\n**2026-10-15 chat-5 learner-placement follow-up, PARTIAL only:** Eleven incremental fixes were each committed and pushed after refreshing `main`: deterministic college-notice previews when recorded dates are malformed; formula-injection-safe CSV cells shared by already-owned application and offer exports; CSV resilience to invalid application timestamps; nonnegative valid offer-CTC display/export; fail-closed malformed offer response timing (no acceptance action when records cannot be validated); verification review-date resilience; stable offer priority with invalid timestamps; malformed-date notice isolation; invalid-date personal alert resilience; separate Education and Identity correction actions when both reviews are sent back; and distinguishing corrupt verification submission time from no submission. Each implementation has a focused authored unit regression. Legacy behavior reference remained FE `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2` / BE `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`. No schema/journal, permissions, recipient scope, public metrics publication or recruiter-enquiry writes changed. Runtime TypeScript, ESLint, Vitest, PostgreSQL denial/concurrency, and browser/mobile tests **have not been executed** in this GitHub-only branch workflow. The DEV-ONLY announcements/public-enquiry production-oracle decisions and upstream producer acceptance remain open. No row or tracker task is certified CLOSED by this source-only round.

**2026-10-16 chat-5 Phase 2 follow-up — PARTIAL, not certified DONE:** Refreshed main into chatgpt/chat-5 (merge ae6694303cc780b1108dfcf46971b2b00641c28c). P-S1-04 registration-choice policy now distinguishes REGISTER_FIRST (no batch registration), CHOSE_OTHER (any non-PLACEMENTS choice), and CAN_APPLY (explicit placements registration), with pure unit tests in tests/unit/placement-batch-registration-policy.test.ts; learner job list and locked apply path both enforce registration choice. Prior finished-batch rejection remains in both paths. Commits: 9b6a72ba6215592263ffe87cc7748f93adc2c402, 66250356fda4fedd1b351c231090dea01d114bd1, 87934fb0c68a2e89f60bab0e7f037060b59ea2a4, a974a3a4f67a9985a49bceb56ad25fa1160d9e2c. P-S1-05 held-offer cap/uplift comparison now uses active official OFFER rows, maxHeldOffers/upliftPct college rule, and unknown-CTC fail-closed in learner application and offer issuance; pure tests cover threshold, LOI exclusion, accepted offers, and dream override. Commits: f8c03cb3a832b7017eeaa10c52ccc4e6ea5d4627, 5ef42515adb4dcb4d48571a7bcf69851c6bc2801, 7be248161e5fec4c9a6f7445f390b2a3465a4967, 597fa744db1cfd58c582115a6678fdac87cb6d1f. This is NOT full P-S1-05 parity: the schema has no registered isDream job column, so both live writers set isDream=false until a staged schema/migration is approved; learner canApply listing also does not yet reflect the held-offer cap. P-S1-02 still lacks issuePlacementOffer and drive-day checks. P-S1-06 accept cascade, P-S2-11 withdrawal/reapply, D2/D3/D5, P-S2-01..05, exact learner wording audit and UI parity browser work remain outstanding. No protected migrations, AI, release claims or secondary tracker changes. Focused Vitest, TypeScript, lint, PostgreSQL concurrency/tenant tests and browser verification were not executed via this GitHub-only connector; changes remain PARTIAL pending independent acceptance evidence. Legacy-facing labels/messages were not changed in this batch (existing non-disclosing errors are reused).\n\n**2026-10-15 chat-5 follow-up to malformed-date offer safety, PARTIAL:** The same round also patches the actual learner offer card formatter so invalid saved issued/expiry instants display as unavailable instead of throwing during rendering; it retains the response block from the earlier fail-closed timing change. Focused unit test authored in `tests/unit/learner-offer-display-invalid-date.test.ts` and separately pushed; not executed here. No parity closure or phase change claimed.\n\n**2026-10-15 chat-5 learner-placement follow-up, PARTIAL only:** Eleven incremental fixes were each committed and pushed after refreshing `main`: deterministic college-notice previews when recorded dates are malformed; formula-injection-safe CSV cells shared by already-owned application and offer exports; CSV resilience to invalid application timestamps; nonnegative valid offer-CTC display/export; fail-closed malformed offer response timing (no acceptance action when records cannot be validated); verification review-date resilience; stable offer priority with invalid timestamps; malformed-date notice isolation; invalid-date personal alert resilience; separate Education and Identity correction actions when both reviews are sent back; and distinguishing corrupt verification submission time from no submission. Each implementation has a focused authored unit regression. Legacy behavior reference remained FE `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2` / BE `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`. No schema/journal, permissions, recipient scope, public metrics publication or recruiter-enquiry writes changed. Runtime TypeScript, ESLint, Vitest, PostgreSQL denial/concurrency, and browser/mobile tests **have not been executed** in this GitHub-only branch workflow. The DEV-ONLY announcements/public-enquiry production-oracle decisions and upstream producer acceptance remain open. No row or tracker task is certified CLOSED by this source-only round.
**2026-10-16 file and video backend (PARTIAL, UI pending):** the learner-facing backend for assignment file submissions, project resource downloads and signed lesson video playback now exists (branch storage-video; routes in `docs/architecture/file-and-video-apis.md`, design and legacy limits in `docs/architecture/file-and-video-storage.md`). Learners stage up to 10 files (50 MiB each, PDF/Office/TXT/CSV/RTF/JPEG/PNG/WebP/ZIP) with `POST /api/courses/assignments/{id}/submission-files`, confirm with `.../complete`, and submit with `POST .../submit-files`; downloads use `POST /api/courses/assignment-submission-files/{id}/download-grant`. Project members list and download READY resource files through `/api/projects/{id}/resource-files`. Enrolled learners list `GET /api/courses/lessons/{id}/learner-videos?deliveryId=` and play through `POST /api/courses/videos/{id}/playback-grant` (presigned R2 GET, HTTP Range seeking, `resumePositionSeconds`). Uploads become usable only after the dev-only attestation (APP_ENV development or test); production stays unserved until a real scanner exists. No UI page changed; the matrix rows stay MISSING. Verified with unit tests and PostgreSQL integration tests (mocked S3, no network).

**2026-10-15 chat-5 follow-up to malformed-date offer safety, PARTIAL:** The same round also patches the actual learner offer card formatter so invalid saved issued/expiry instants display as unavailable instead of throwing during rendering; it retains the response block from the earlier fail-closed timing change. Focused unit test authored in `tests/unit/learner-offer-display-invalid-date.test.ts` and separately pushed; not executed here. No parity closure or phase change claimed.\n\n**2026-10-15 chat-5 learner-placement follow-up, PARTIAL only:** Eleven incremental fixes were each committed and pushed after refreshing `main`: deterministic college-notice previews when recorded dates are malformed; formula-injection-safe CSV cells shared by already-owned application and offer exports; CSV resilience to invalid application timestamps; nonnegative valid offer-CTC display/export; fail-closed malformed offer response timing (no acceptance action when records cannot be validated); verification review-date resilience; stable offer priority with invalid timestamps; malformed-date notice isolation; invalid-date personal alert resilience; separate Education and Identity correction actions when both reviews are sent back; and distinguishing corrupt verification submission time from no submission. Each implementation has a focused authored unit regression. Legacy behavior reference remained FE `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2` / BE `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`. No schema/journal, permissions, recipient scope, public metrics publication or recruiter-enquiry writes changed. Runtime TypeScript, ESLint, Vitest, PostgreSQL denial/concurrency, and browser/mobile tests **have not been executed** in this GitHub-only branch workflow. The DEV-ONLY announcements/public-enquiry production-oracle decisions and upstream producer acceptance remain open. No row or tracker task is certified CLOSED by this source-only round.

**2026-10-15 chat-5 learner-placement incremental corrections (PARTIAL, runtime acceptance not claimed):** Ten separately pushed commits improve already learner-scoped workflows: application URL edits retain valid filters despite stale/duplicated fields; application activity sorting avoids stack overflows for long histories and ignores invalid imported dates; UUID-validated offer and college-notice focus links match case-insensitively and reject invalid page sizes; stale offer result-page recovery shows the corrected page; incompatible expired-vs-due-soon offer URL filters receive explicit feedback; dashboard college-notice previews open the correct authorized notice card; visible college-notice search normalizes whitespace while keeping authorization scope; personal-alert preview searches can be cleared without resetting notice-author, query, sort or unread facets. Ten focused regression tests were authored and pushed. Legacy FE oracle `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`, BE oracle `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`. DEV-ONLY announcement producer and public-enquiry gates remain unresolved. No schema, broad permission, read-scope, notification publication or recruiter write has changed. TypeScript, ESLint, Vitest, disposable PostgreSQL and browser/mobile tests were **not executed**: the GitHub-only tool environment lacks an accessible runtime checkout and no branch workflow checks are reported. No parity row or tracker task newly CLOSED.

**2026-10-15 chat-5 learner placements round — PARTIAL (acceptance pending):** Against legacy FE `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2` and BE `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, this branch adds: (1) source-labeled TPO-authored notice filtering over current membership-authorized college notices (not an invented standalone publisher), (2) source-scoped notice deep-link recovery, (3) stale notice-page recovery, (4) personal alert failure isolation on the Placement Cell page, (5) independent placement-request read failure isolation with offer extension actions disabled when the pending request history is unknown, (6) distinct declined vs withdrawn official offers, (7) offer-to-own-application links, (8) expired/undated ISSUED-offer filters with deadline predicates and URL state, (9) placement-cell-authored notice navigation from dashboard/cell, (10) honest no-official-offers state and return to applications, and (11) retained source state on personal alert search and accurate notice empty labels. Each is an individually pushed commit with authored focused unit regressions. Existing service membership authorization, central permissions, offer-response routes and guarded destinations are reused; there are no database schema writes, notification producers, private file access, registration changes or owner approvals. **TypeScript, ESLint, Vitest, disposable PostgreSQL, cross-role authorization, signed-document flow and desktop/mobile/browser acceptance have not been executed by this builder.** DEV-ONLY legacy-delta source status and public recruiter-enquiry producer remain unresolved; no L11/L14/L18/L29/L30 family or tracker task has been marked CLOSED.

**2026-10-15 chat-5 learner-placement follow-up round (PARTIAL — independent acceptance pending):** Eleven incremental learner-placement changes were committed individually on `chatgpt/chat-5`: malformed offer-query feedback; formula-neutralized, displayed-only CSV exports for filtered own applications and own offers; learner dashboard links to persisted Education/Identity verification states and sent-back section editors; own-offer deep-link recovery that retains the validated focus UUID when filters hide a record; privacy-safe public-placement branding failure fallback; unread-state-preserving link from placement alerts to personal notification history; independently recovered valid Applications filters amid malformed/duplicate URL fields; and membership-scoped, pagination-aware deep links with non-disclosing missing-link recovery for visible college notices. Each has a focused unit regression authored, not executed in this GitHub-only run. No canonical migrations, read-scope expansions, outbound notifications, recruitment-enquiry submissions, or verification approvals were added. Production-oracle/DEV-ONLY classification, placement announcement producer, real private-document/storage acceptance, PostgreSQL role/tenant denials, TypeScript/ESLint/Vitest, and desktop/mobile browser evidence remain outstanding. No ledger row, family, tracker DB item or phase was newly certified CLOSED.

**2026-10-15 chat-5 follow-up (PARTIAL):** The learner placement feed gains a bounded, URL-backed local search over already delivered and membership-scoped personal alert previews, distinct from college-wide notice search, preserving pinned/unread/sort navigation; no server-wide search or announcement producer is claimed. Offers additionally handle deep-link pagination and request-history transport failure without enabling duplicate extension requests, applications preserve saved history during optional round-source outages and reject ambiguous links, and public placement reporting suppresses transport failures without revealing private records. Focused unit regressions authored; execution, PostgreSQL and browser proof pending. Existing learner parity ledger statuses remain open.

**2026-10-15 chat-5 learner placements incremental parity (PARTIAL — acceptance pending):** Learner offers now provide persisted joining-outcome tabs (including pending/deferred/did-not-join/no record), whitespace-normalized own-offer search, distinct faceted-empty states, status-preserving filter reset and UUID-scoped in-page deep links. Learner announcements retain sort and other filters across navigation, clear-search and alert retries, expose invalid filters, search only the already membership-visible notices by persisted sender/audience metadata, and isolate college-notice read failures without masking permission denials or suppressing personal placement alerts. Each item has a focused unit regression authored. Branch commits are pushed but no local TypeScript/ESLint/Vitest, registered PostgreSQL or desktop/mobile browser execution was available here; existing detailed Learner ledger, source-oracle freshness and upstream producer gates remain open. No row or family marked CLOSED and no database tracker completion claimed.

**2026-10-15 chat-7 Learner round 9 (PARTIAL — acceptance pending):** Course list empty states now distinguish term/progress/text/type filters and its course-type control matches the effective authorized selection after enrollment changes. Standalone Quiz draft autosave now refuses to write answers when the loaded Quiz/delivery no longer matches the route; a successful submit stays acknowledged when a subsequent read-only attempt refresh fails. Final Assignment LINK submissions are bounded to 2048 characters by both UI and Zod API validation; immutable TEXT/LINK submissions require explicit confirmation. Signed Assignment byte uploads may be cancelled without displaying a cancellation control during the potentially persisted final POST, and submission-type switching remains disabled during an in-flight action. Global All Assignments/Quizzes offers a combined filter-and-page reset. Class Schedule initial delivery selections are intersected with server-authorized Course choices, with stale selections falling back to the available courses and explicit empty selections preserved. Project Activity page-level empty states and pagination names no longer claim no historical data or global text matches when only the current authorized page was searched. Pure unit tests authored; TypeScript, ESLint, Vitest, PostgreSQL membership/tenant denial, cloud signed-object scanning/receipts and mobile/browser acceptance have NOT executed. No globally closed rows, schema migrations or other lane implementations claimed. All remaining checkboxes for these surfaces remain PARTIAL.

**2026-10-15 chat-7 incremental learner security and parity round (PARTIAL — runtime gates pending):** Secured file-backed assignment PUTs against redirects, expiry after the signed upload finishes, and missing/mismatched byte-size metadata. The browser uses a deterministic injected clock in the expiration regression; private-file attestation and actual scanning still require configured infrastructure and executed PostgreSQL/browser tests. Standalone Quiz requests cancel on quiz/delivery navigation, previous route contents are hidden until the newly authorized response is loaded, and the returned quiz ID must exactly match the requested UUID before draft restoration. Learner Quiz correct-option indicators additionally require both result publication and own-attempt visibility. Project Activity cursor now advances from the final authorized fetched event rather than filtered visible events. Aggregate Assignments/Quizzes recover from a stale selected Course when enrollments change; published Assignment scores distinguish missing marks from real zero, and saved submission links are clickable only when they meet the existing HTTPS/no-credentials policy. Tests have been authored but not executed here. All affected legacy surfaces remain PARTIAL pending TypeScript, ESLint, unit, PG role/tenant denial, signed-storage and responsive-browser verification.

**2026-10-15 chat-7 next Learner PARTIAL batch (source/model tests authored, CI and browser gates outstanding):** Learner Attendance threshold status now compares exact persisted marked/present counts rather than rounding a near-threshold percentage, and its session-history status/order selectors have a Course/month-preserving Reset control. The Class Schedule Today action uses the selected LOCAL/IST day convention, and its IST learner Week/Day views offer an explicitly scoped selected-day .ics download using the already authorized filtered agenda and existing 100-event truncation disclosure. Standalone Quiz review no longer fabricates a zero score for a published but missing score; Courses support persisted most-recent-activity sorting with null activity last. Project Activity declares loaded-page-only matching counts; a reused Board task dialog resets its return-navigation guard. File-backed assignment links reject URL fragments; signed upload grants require PENDING scan metadata and a valid declared byte size. No auth/storage/migration changes, no new global matrix status; browser/mobile, database role denials, runtime signed-object attestation and final parity verification remain open.

**2026-10-15 chat-7 learner follow-up (PARTIAL — source and unit checks authored, gates pending):** File-backed assignment signed-PUT grants now require the expected private-storage metadata headers and filename extension/MIME consistency at the validated boundary. Course list falls back safely if the currently selected semester or course-type filter disappears from the authorized membership set. Quiz attempt returns cancel the pending navigation on unmount, recheck the published deadline immediately after the final confirmation, and retain an explicit server-accepted receipt even when browser session-storage cleanup fails. Class Schedule uses one clock snapshot for Today/Next/upcoming filters and preserves the agenda date when shifting periods or switching Month/Week/Day modes. Project Board task preview now distinguishes persisted blocked/done and high/critical states with accessible text plus semantic badge tones. These are not claimed as full file-storage, signed-scanner, cross-tenant PostgreSQL, mobile-browser, or legacy screenshot verification; all named surfaces remain PARTIAL until the release gate executes.

**2026-10-15 chat-7 round-6 upcoming filter clock correction (PARTIAL):** The upcoming-only schedule filter now refreshes its cutoff on a one-minute client clock rather than a stale memoized render-time snapshot. An effect cleans up its interval; filtering remains read-only and authorized-scope only. Browser acceptance open.

**2026-10-15 chat-7 round-6 assessment attention metrics (PARTIAL):** The global Assignments/Quizzes header now reports counts of genuinely actionable work and overdue/missed items based on the identical persisted state policy used by list filters. Expired quizzes do not inflate actionable counts, and submitted work is excluded; no new cross-course reads. Pure model regression authored; PG/browser acceptance outstanding.

**2026-10-15 chat-7 round-6 attendance exception drill-ins (PARTIAL):** Global Attendance now distinguishes persisted `LATE`, `EXCUSED` and `MEDICAL` session statuses individually in addition to the grouped exceptions filter. Course/month and CSV selection remain the authorized source, with no reinterpretation of absence or denominator policy. Pure regressions authored; DB/browser verification pending.

**2026-10-15 chat-7 round-6 empty-task Project filter (PARTIAL):** Learners can identify their current/planned Projects with genuinely zero persisted tasks, without conflating missing progress with zero or including archived/completed work. Available in desktop/mobile selectors and retained through URL-backed pagination; pure tests authored, PG/browser gates remain open.

**2026-10-15 chat-7 round-6 upcoming Class Schedule only (PARTIAL):** Learners can hide completed sessions while retaining sessions currently in progress, based on true persisted end instants. The selector composes with course/section/kind/text search and affects both calendar and exports from the same authorized set; it does not alter stored sessions. Pure clock-boundary tests authored; browser/timezone acceptance open.

**2026-10-15 chat-7 round-6 Board task ordering (PARTIAL):** Learners can sort authorized Project Board tasks by persisted priority, update time or title while preserving search, status, sprint, release and task-modal deep links. Default keeps project order. Pure ordering regressions authored; browser and PG scope acceptance outstanding.

**2026-10-15 chat-7 round-6 Attendance threshold recovery (PARTIAL):** Learner Attendance now estimates how many additional *marked-present* sessions could mathematically lift the existing marked-session ratio above the college threshold. It never counts unmarked/future sessions as already held, explicitly handles unreachable 100%, and does not imply exam eligibility. Pure boundary/unit tests authored; browser and persisted-policy acceptance pending.

**2026-10-15 chat-7 round-6 overdue/missed assessment filter (PARTIAL):** Aggregate Assignments distinguish overdue unsubmitted work from submitted work; Quizzes distinguish genuinely missed closed/deadline-expired attempts without suggesting expired attempts are still submittable. Based on real persisted dueAt and completion fields in the actual union types. Pure regression authored; PostgreSQL/browser acceptance pending.

**2026-10-15 chat-7 round-6 Course term-state selection (PARTIAL):** Learners can distinguish current actionable Courses from past read-only Courses within an authorized semester using the service-supplied `readOnly` flag, not device dates. Semester changes reset the selection, and existing search/type/progress filters compose. Pure tests authored; PG/browser gates open.

**2026-10-15 chat-7 round-5 aggregate assessment course counts (PARTIAL):** Learner All Assignments and All Quizzes now show the number of published, already-authorized items associated with each Course selector choice, plus an accessible “showing X of Y” filtered-result summary. This avoids confusing global metrics with filtered list counts, without extra database reads. Pure counts tests authored; PostgreSQL/browser acceptance outstanding.

**2026-10-15 chat-7 round-5 Project Activity page text search (PARTIAL):** Learners can search the currently fetched, membership-scoped Project activity page by actor display name, subject, or summary, with matching CSV export and a clear filtered-empty message. Older-page pagination deliberately uses the unfiltered page cursor so text matches cannot skip history; the UI explicitly disclaims global historical search. Pure tests authored; browser/privacy acceptance pending.

**2026-10-15 chat-7 round-5 Class Schedule event-kind filtering (PARTIAL):** Learners can distinguish Course delivery classes from general section events while preserving current section, course and text filters. The selector applies consistently to calendar, Today/Next cards and day exports because it filters the same authorized event set. Pure model tests authored; PG/browser acceptance pending.

**2026-10-15 chat-7 round-5 Attendance chronological history (PARTIAL):** Learner Attendance now sorts session history newest-first or oldest-first by persisted start instant, keeping the chosen order in the URL when course/month/status changes. Exports follow the same visible ordering; attendance totals remain unaffected. Pure order tests authored; browser/PG verification open.

**2026-10-15 chat-7 round-5 pre-submit Quiz review (PARTIAL):** Learners can open a compact review of every question and actual selected-answer count before submission, jump directly to unresolved questions, then submit using the existing confirmation and server policy. The review does not reveal correctness or unpublished results and uses only the currently scoped quiz questions. Pure model tests authored; real browser/session acceptance outstanding.

**2026-10-15 chat-7 round-5 Course progress-state filtering (PARTIAL):** Courses can be filtered by not started, in progress, completed, or unmeasured progress using actual tracked-item counts. Empty/unpublished learning paths are never misleadingly treated as zero-progress enrolled courses, and semester switches reset the filter. Pure model tests authored; PG and mobile/browser acceptance open.

**2026-10-15 chat-7 round-5 inline Board task acceptance criteria (PARTIAL):** Learner task cards display authenticated authored acceptance criteria in an expandable plain-text disclosure beside task actions, without changing Mentor authoring behavior. Unit model regression authored; PostgreSQL/browser acceptance pending.

**2026-10-15 chat-7 round-5 Board acceptance-criteria search (PARTIAL):** Project Board searches authorized task titles, descriptions **and persisted acceptance criteria**, allowing learners to locate tasks by their definition of done while still applying sprint/priority/status/release filters. No new data retrieval is introduced. Pure model regression authored; PostgreSQL/browser acceptance open.

**2026-10-15 chat-7 round-4 Project Board priority drill-ins (PARTIAL):** The Board displays interactive Low/Medium/High/Critical task counts sourced only from the authorized persisted workspace, with status, sprint, release and search carried through on selection. Unknown priorities are not counted and this introduces no write or authorization bypass. Pure model tests authored; DB/browser acceptance outstanding.

**2026-10-15 chat-7 round-4 Class Schedule session search (PARTIAL):** Learners can search their already-authorized class sessions by title, course, faculty display name, location and section; the search composes with existing course/section selectors and updates calendar, Today/Next metrics and .ics exports consistently. General section-wide sessions remain searchable. A pure query model/unit tests are authored; shared Teacher view defaults unchanged, runtime/browser scope acceptance outstanding.

**2026-10-15 chat-7 round-4 Attendance course-history drill-in (PARTIAL):** The global learner Attendance workspace links the currently selected and already-authorized delivery/month to the canonical read-only full course attendance-history page. UUID/month are validated before constructing the deep link; no forged member lookups, cross-course reads, or attendance mutations are introduced. Pure URL tests authored; runtime/PG/browser verification pending.

**2026-10-15 chat-7 round-4 assessment Due Soon filter (PARTIAL):** Learner Assignments and Quizzes offer a `Due within 72 hours` state filter derived from the live assessment clock and real deadlines. Submitted assignments, attempted or closed/expired quizzes, exhausted attempts, and undated assessments are not presented as actionable deadlines. Pure deadline-boundary tests authored; runtime/PG/browser acceptance outstanding.

**2026-10-15 chat-7 round-4 Quiz draft integrity (PARTIAL):** On loading the authenticated quiz, session-stored draft question and option IDs are intersected with the current persisted quiz payload before being restored or autosaved; stale/deleted/foreign IDs are discarded, and single-choice responses are limited to one permitted option. Pure regression authored; server still independently authorizes submitted questions. PG/browser/multi-tab verification open.

**2026-10-15 chat-7 round-4 Quiz clear-answer action (PARTIAL):** Standalone quiz attempts now let learners clear the current single- or multiple-choice response, including radio answers that could not previously be deselected. The pure model never mutates another question's answers and the existing per-quiz session draft persists the result. Pure regression authored; browser/multi-tab acceptance pending.

**2026-10-15 chat-7 round-4 Course list sort options (PARTIAL):** Learner Courses now sort by name, measured progress, or next persisted assessment deadline without breaking legacy regular-then-elective grouping. Unknown progress and missing deadlines sort last within their groups, and semester switching resets the order. Pure model regression authored; browser/PG acceptance open.

**2026-10-15 chat-7 round-4 Project list sorting (PARTIAL):** Learner Projects can sort by persisted most-recent update, alphabetical title, or lowest measured progress with unknown progress last; archived projects remain last. The chosen sort survives pagination and mobile filters without affecting Mentor controls. Pure regression authored; source/PG/browser verification open.

**2026-10-15 chat-7 round-3 selected schedule day calendar export (PARTIAL):** Learners can download an iCalendar (.ics) file for the selected IST calendar day, restricted to the same authorized course/section-filtered sessions shown in the agenda, with an explicit 100-event export cap. The pure model validates day/instants and escapes text to prevent iCalendar property injection; no external sending or extra read. Unit tests authored; live calendar-client/browser acceptance outstanding.

**2026-10-15 chat-7 round-3 quiz unanswered navigation (PARTIAL):** Standalone learner quiz attempts show answered/unanswered totals and a keyboard-accessible jump to the first unanswered question. The pure model counts only answer-option IDs actually present on the loaded quiz; invalid/stale draft IDs do not masquerade as answers. Existing submission confirmation uses the same model. Pure tests authored; browser/mobile and PG acceptance outstanding.

**2026-10-15 chat-7 round-3 Attendance export (PARTIAL):** Learner Attendance adds a capped (200-row) CSV download for the currently selected, authorized course/month/status history. It includes no learner contacts; session metadata is escaped and spreadsheet formula prefixes are neutralized, with explicit truncation disclosure. Export reads the existing scoped workspace only. Pure CSV tests authored; runtime/PG/browser/privacy review outstanding.

**2026-10-15 chat-7 round-3 Project Activity export (PARTIAL):** Learners can download a capped CSV of the currently visible and already authorized Project activity page (up to 100 events), reflecting category/IST-date filters. CSV cells are length-capped, quoted, and spreadsheet-formula-neutralized, with no contact fields or extra tenant reads; pagination still explicitly limits history. Pure CSV tests authored, PG/browser/privacy acceptance outstanding.

**2026-10-15 chat-7 round-3 Board task workflow navigation (PARTIAL):** The learner task-details dialog now offers an explicit deep link to the actual scoped Board task card and its existing submission/status controls. The link keeps active filters, removes the modal token, uses an anchor to the real task element, and avoids the dialog onClose navigation race; read-only preview remains read-only. Pure URL regression authored; PG/browser verification pending.

**2026-10-15 chat-7 round-3 Board status drill-in (PARTIAL):** The learner Board now shows mobile-friendly counts for persisted task statuses; clicking a count filters tasks while retaining sprint, release, search, and priority. Counts derive exclusively from the already authorized project workspace. Pure model/unit tests authored; PostgreSQL/browser acceptance outstanding.

**2026-10-15 chat-7 round-3 assessment sorting (PARTIAL):** All Assignments and All Quizzes can sort the authorized filtered set by earliest due deadline, most recently created, or title before the existing 20-item pagination. Missing/malformed deadlines sort last instead of being presented as urgent; source is not mutated. Pure sorting regressions authored, runtime/PG/browser verification open.

**2026-10-15 chat-7 round-3 Course next-step shortcut (PARTIAL):** Active Course cards retain their Course Home entry but expose a separate direct link to the exact learner-visible next published lesson/content/assessment item; historical or unpublished paths have no misleading shortcut. UUID-validated pure link model and tests authored; server membership scope remains on the existing Course route. PostgreSQL/browser acceptance outstanding.

**2026-10-15 chat-7 Course list Continue learning filter (PARTIAL):** The Courses page adds a responsive pressed-state `Continue learning only` filter, showing only active courses with a published learning path and a real persisted next lesson or assessment. Historical/unpublished courses are not mislabelled as actionable; switching semester clears the filter and show-more resets. Pure-model regression authored, runtime/PG/browser acceptance open.

**2026-10-15 chat-7 Attendance session status filter (PARTIAL):** Learner Attendance history adds a validated URL-persisted status selector for present, absent, unmarked, future scheduled, and other marked sessions, while preserving all original monthly totals/threshold calculations. An empty filtered result differs from a truly empty month, and changing course/month preserves the selected state. Pure-model tests authored; PG and responsive browser gates remain open.

**2026-10-15 chat-7 Class Schedule session details (PARTIAL):** Learner Class Schedule cards expose already-authorized authored session descriptions in an accessible expandable disclosure, including section-wide events without a course link. The disclosure is outside the course Link to avoid nested interaction targets; text is rendered as text rather than HTML. Pure normalization model/test authored; browser/PG verification open.

**2026-10-15 chat-7 Class Schedule section filter (PARTIAL):** Learners with multiple authorized sections can filter the month/week/day schedule by their specific section. Filtering happens over the server-returned scoped event set after course selection and applies to Today/Next summaries, with an all-sections recovery choice. Zod-backed model tests authored; runtime tenant/role fixtures and mobile verification remain open.

**2026-10-15 chat-7 Project tab filter continuity (PARTIAL):** Switching learner Project sections preserves bounded, explicitly allowlisted Board and Activity filter parameters, so returning to a previous section does not silently reset an investigation. Transient task-modal IDs and activity pagination cursors are deliberately dropped. A pure URL-model test is authored; browser/back-forward acceptance is outstanding.

**2026-10-15 chat-7 filtered Board deep-link guard (PARTIAL):** Task-detail deep links now resolve only against the learner's already authorized **and currently visible** filtered task collection, so manually adding a task UUID cannot silently bypass active Board status/sprint/priority filters. The generic recovery notice does not disclose task existence; unit regression authored, PG/browser acceptance open.

**2026-10-15 chat-7 assessment state filters (PARTIAL):** Learner All Assignments/All Quizzes now filter already-authorized cards into needs-action, submitted/attempted, and published-feedback/results buckets, with the immutable assessment clock determining quiz deadline eligibility. Filter changes reset pagination; unpublished results remain hidden. Pure model tests authored, PostgreSQL fixtures and browser verification pending.

**2026-10-15 chat-7 assessment list search (PARTIAL):** All Assignments and All Quizzes now search authorized loaded cards by title, lesson, description, course name and code, combined with course filtering; changing search resets 20-item pagination. Pure model/unit cases authored; PG fixture, mobile and browser acceptance remain open.

**2026-10-15 chat-7 Schedule filter summary correctness (PARTIAL):** On learner Class Schedule, Today and Next class cards now consume the same selected-course event set as the calendar. Deselected course sessions no longer inflate those counts or future sessions; authentic section-wide events remain included. Pure model regression authored using fixed UTC instants and IST date grouping, runtime/PG/browser acceptance outstanding.

**2026-10-15 chat-7 Project Board stale task deep links (PARTIAL):** When an authenticated learner opens a valid task UUID that no longer belongs to the authorized project workspace, the Board renders a recoverable, non-leaking notice instead of silently showing nothing. Malformed IDs are ignored and do not disclose project/task existence. The action returns to the Board with active filters retained. Pure-model test authored; browser/PG verification outstanding.

**2026-10-15 chat-7 Blocked Project filter (PARTIAL):** Both desktop and mobile learner Project lists support a scoped `Has blocked tasks` filter derived only from persisted BLOCKED task counts, not an invented project blocker field. Archived projects are excluded; empty/filter-empty messaging and pagination remain intact. Pure-model check authored, tenant/role PG + browser acceptance still open.

**2026-10-15 chat-7 Project list mentor search (PARTIAL):** Learner Project search includes the display name of the mentor from the same previously authorized project-team summary, without a global people directory or contact fields. Bounded pure matching model and unit test authored; persisted learner/foreign-team PG and browser proof remain open.

**2026-10-15 chat-7 Semester-switch recovery (PARTIAL):** Switching the learner Course list semester now clears the prior search, resets the 48-card window, and crucially clears an elective-only filter. This avoids a hidden filter with no visible selector in a semester without electives. Pure-model regression authored; browser acceptance remains pending.

**2026-10-15 chat-7 Course list instructor search (PARTIAL):** The learner Course list search now matches the already scoped course's instructor display names alongside code, name, section, programme and period. It does not retrieve or reveal contact information; the trimmed bounded pure model has authored unit checks. Scoped course PG and responsive browser acceptance remain open.

**2026-10-15 chat-7 Course cards fallback media (PARTIAL):** Course tiles now render a bundled local decorative course illustration rather than a media-empty header, with a pure, tested fallback source. This does not claim authored course thumbnail parity: the canonical course image field and producer, runtime/PG acceptance, and legacy visual comparison remain open.

**2026-10-15 chat-7 Board status filter (PARTIAL):** Learner project Board now filters its already authorized task set by persisted TODO/IN_PROGRESS/BLOCKED/IN_REVIEW/DONE status, alongside search, sprint, release, and priority. Invalid URL status values fail closed to no filter, existing modal deep links retain valid filter state, and mobile controls expose the same selector. Source/unit verification authored; executed PG/browser gates still open.

## 2026-10-05 current-oracle L0 re-audit

The current production learner sidebar does not expose Projects/Placements statically. Projects follows hierarchical optional-module access; Placements additionally requires the college-level paid-module switch and learner placement eligibility (learner/class/batch in legacy, membership/section/cohort in vNext). vNext now models and resolves both layers and feeds them into the shared shell with optional links failing closed when current access cannot be trusted. Conditional Drive Day is still open because its coordinator producer and learner workspace are not yet cloned.

# Learner — Detailed Page Parity Spec

> **Freshness gate:** this detailed spec contains historical checks from the earlier oracle. Current Learner final verification is governed by `docs/planning/clone-parity-protocol.md` + `docs/planning/learner-family-verification.md`. Current observed legacy FE/BE heads are newer than the original spec baseline; checked boxes are not final-release proof until the matching family is VERIFIED.

Legacy navigation: Courses, Quizzes, Assignments, Class Schedule, Attendance, My Placements, Projects, Notifications, Profile.

**Operational execution ledger:** `docs/planning/learner-ui-surface-ledger.md`.

Use the ledger for row-by-row work and status. This file remains the detailed behavioral contract. A checked item here does not automatically make a ledger row `CLOSED`; closure requires the ledger's second comparison / verification rule.

## Clone-first learner naming and route lock

The legacy learner information architecture is canonical in vNext. Use the exact legacy sidebar labels and canonical routes before deeper page reconstruction. Do not rename learner surfaces to vNext alternatives such as "My Courses", "/learn/quizzes", "/learn/assignments", "/learn/placements", or a shared "/notifications" entry. Those older vNext routes may exist only as compatibility redirects.

Layer-0/Layer-1 shell parity materializes the sidebar, legacy route tree and nested Course/Placement/Project navigation. It does **not** close the deeper checklists below; each page still needs section/action/modal/state/backend verification.

## Page: Courses list

**2026-10-14 Course Overview progress-availability warning (PARTIAL,
L2-027):** the Home tab now distinguishes an unpublished learning path,
a published path with no lessons, and lessons with no trackable items.
When there is no completion denominator, the Overview shows a warning
instead of a measured `0%`. When persisted learning items exist, it
retains their actual tracked percentage. The pure model has unit tests;
legacy screenshot/browser comparison remains open.


**Mobile/source parity pass:** course-type filters use equal responsive columns on narrow screens, with pressed-state semantics. The mixed All view renders the Electives heading as a separate full-grid-width row rather than widening the first elective card. Browser/mobile acceptance and course thumbnail mapping are still open.

**Legacy route:** `/learn/courses`  
**vNext:** `/learn/courses`

Legacy contract:
- course cards for the learner's enrolled/active and historical semesters;
- program/semester metrics and semester switcher;
- Regular/Elective filter, search and 48-card show-more behavior;
- course name/code, instructor, section, credits and elective context;
- legacy course thumbnail with fallback image;
- progress/continue-learning signal in vNext;
- navigation into course detail;
- shape-matched loading, empty and request-failure states.

Closure checklist:
- [x] Course list membership/enrollment scope exactly matches legacy expectations.
- [x] Course card metadata and progress/continue-learning information are present.
- [x] Course click/deep-link behavior lands on the correct delivery/course context.
- [x] Loading, empty and error states are explicitly implemented.
- [x] Unauthorized/non-learner access is fenced server-side.
- [x] Instructor, mixed Electives grouping and 48-card show-more behavior are implemented.
- [ ] Legacy thumbnail/fallback-image parity remains open because the vNext Course domain has no canonical image field yet.
- [ ] Mobile card/list behavior is browser-verified.
- [x] Historical semester courses remain browseable and are explicitly read-only.
- [ ] Regression coverage executes successfully.

## Page family: Course detail
**Legacy routes:** `/learn/courses/[courseId]`, `/learn/courses/[courseId]/[...courseTab]`  
**Legacy tabs:** Overview, Learning Path, Attendance, Discussions.

### Overview

**Priority correction (2026-10-13):** Upcoming due assignments/quizzes
take precedence over live sessions even when the live session is earlier,
and a due assessment cannot be hidden by the six-item activity-feed limit.
Within a type, choose the earliest deadline. Next published content is
the fallback, linked to the exact lesson and item. Source/unit implementation
is FIXED pending cross-role/browser verification.

**Time-consistency fix:** Upcoming activity uses the course-service load
snapshot for content availability and quiz deadlines, instead of an impure
React-render-time clock call. Regression and browser proof remain outstanding.

**Source-only implementation update:** sanitized course descriptions use legacy 350-character Read more / Show less, and long discussion-backed course updates can independently expand. Full browser and family acceptance remain outstanding.

Legacy contract:
- course identity/teacher/class context;
- course summary and learner progress;
- obvious route into the next learning item;
- correct not-found/access-error behavior.

- [x] Overview content is compared section-by-section: About/learning takeaways, faculty/class context, next action, progress, upcoming assessments/live sessions, and course-team updates are represented. Exact faculty-side announcement authoring UI is tracked in the Faculty parity pass.
- [x] Class/course context cannot leak another section's data.
- [x] Continue/next-learning action matches the learner's real progress.
- [x] Loading/not-found/access-error states are implemented.

### Learning Path
Legacy contract:
- ordered lessons;
- lesson expand/collapse;
- content rows for video/resource/live class/assignment/quiz;
- locked/scheduled/available/completed state;
- content open/play/read actions;
- assignment/quiz interaction and progress refresh.

- [x] Lesson ordering and grouping match.
- [x] Expand/collapse state and deep links work.
- [x] Every legacy content type has a vNext representation.
- [x] Availability/schedule/locked/completed states are represented and future live-class URLs are withheld.
- [ ] Video/resource/live-class actions are implemented end-to-end: YouTube progress, authenticated range-capable Cloud Storage video streaming, protected resource open/download and scheduled live-class links are wired. Final browser verification still requires a configured GCS bucket.
- [x] Assignment submit/view state is verified including late submission.
- [x] Quiz attempt/result state is implemented with attempt/deadline/result policy.
- [x] Progress updates without stale cross-lesson state are protected by monotonic progress writes.
- [x] Empty and partial-content states are implemented.
- [x] Roadmap lesson headers now expose current/completed/in-progress state plus per-lesson lecture/resource/assessment/live counts.
- [x] Roadmap rows expose assignment overdue, expired-unattempted quiz, and partial video/YouTube watched-percentage cues from the same progress/deadline data used by the interaction controls.
- [ ] Exact legacy compact-row → content modal/drawer interaction remains open; vNext still expands the rich interaction inline.

### Attendance tab
Legacy contract:
- course/class attendance summary;
- session/day detail;
- present/absent/percentage presentation;
- no-data and error states.

- [x] Course-level attendance domain exists.
- [x] Attendance summary and percentage are month-scoped like legacy.
- [x] Previous/direct month picker/next navigation is implemented.
- [x] Future classes remain visible as Scheduled and are excluded from held/percentage math.
- [x] Threshold messaging includes legacy-style can-miss / must-attend recovery guidance.
- [x] Session/day detail is implemented.
- [x] No-data/error/loading states are implemented through the Course route boundary.
- [x] Learner cannot mutate attendance.
- [ ] Responsive mobile cards are implemented but await browser verification.

### Discussions tab
Legacy contract:
- classroom discussion feed;
- post/reply interaction where allowed;
- author/time context;
- empty/loading/error states;
- class/course isolation.

- [x] Discussion read model exists.
- [x] Create/delete-own actions match the learner permissions of the legacy flat discussion feed.
- [x] Author/time/Faculty context is preserved.
- [x] Empty/loading/error states are implemented.
- [x] Cross-class isolation is covered by integration regression tests.
- [x] Consecutive messages from the same sender are visually grouped within the legacy five-minute window and day boundaries are preserved.
- [x] Initial load lands on the newest message; background polling keeps the reader in place and shows a new-message counter while they read history.
- [x] Multiple pinned messages expose count/context and the composer keeps the legacy persistent invitation/help cue.
- [ ] Responsive/mobile discussion behavior still needs browser verification.

## Page: All Assignments

**2026-10-13 implementation improvement:** aggregate assignment due/late
labels now use an immutable service snapshot, with pure-model unit tests
for overdue-but-submittable, due-soon, submitted-late and unpublished-grade
states. Browser/file-backed submission parity remains open.

**Legacy:** `/learn/allAssignments`  
**vNext:** `/learn/allAssignments`

Legacy contract audited from `AssignmentsContent`:
- page header;
- aggregate assignment list across courses;
- course filter;
- pagination;
- course/created/due metadata;
- learner states: Not submitted, Due soon, Overdue + late submission allowed, Submitted, Submitted late, Graded;
- primary card action to view/submit;
- assignment submission/view drawer;
- metrics/summary pills;
- loading skeleton, request error, zero-assignments and filtered-empty states.

- [x] Aggregate list includes every published assignment in learner scope.
- [x] Course filter behaves like legacy and resets pagination appropriately.
- [x] Legacy 20-row pagination behavior is implemented.
- [x] Created/due metadata and Not submitted / Due soon / Overdue / Submitted / Submitted late / Graded labels are represented.
- [x] Published overdue assignments remain submittable.
- [x] Aggregate assignment cards open an in-page right-side assignment drawer with due/status/instructions, existing learner submission, published grade/feedback and a secondary exact Learning Path deep link.
- [x] Written-response and HTTPS-link submission/view flows are available directly in the drawer.
- [ ] File-backed assignment submission remains BLOCKED on the shared secure Cloud Storage workflow; do not treat text/link parity as file parity.
- [x] Grade visibility is masked until published.
- [x] Metrics use the full aggregate set rather than page-only counts.
- [x] Loading/error/first-run/filtered-empty states are implemented.
- [x] Deep link identifies the exact lesson + assignment under the Assessments filter.
- [ ] Mobile behavior is verified.

## Page: All Quizzes
**Legacy:** `/learn/allQuizzes`  
**vNext:** `/learn/allQuizzes`

Legacy contract:
- aggregate published quizzes across courses;
- course filter + pagination;
- attempt/result state;
- due/close timing;
- primary open/take/view-result action;
- loading/error/empty states.

- [x] Aggregate list scope matches legacy published/closed learner quiz scope.
- [x] Course filter and 20-row pagination are implemented.
- [x] Not attempted / attempted / missed / result-published states are represented.
- [x] Attempt limit and close/deadline behavior are represented.
- [x] Deep link opens the exact quiz + delivery in the standalone attempt/review flow.
- [x] Loading/error/empty/filtered-empty states are implemented.
- [ ] Mobile behavior is verified.

## Page: Standalone Quiz Attempt

**2026-10-13 implementation improvement:** session-storage answers and
question index are restored with validation after quiz data loads and before
autosave begins. Missing/invalid drafts no longer block quiz loading, and
the quiz deadline clock advances while the page stays open. Unit/browser
reverification remains required, especially multi-tab and refresh races.

**Legacy:** `/quiz`

Legacy contract:
- full-screen/no-layout attempt experience;
- question navigation;
- answer state;
- submit/confirm;
- result/error handling;
- inline error boundary with retry.

- [x] Question rendering supports the legacy Single and Multiple choice types.
- [x] Previous/next/question navigation is preserved.
- [x] Answer state survives question navigation and refresh through session-scoped persistence.
- [x] Submission confirmation includes the legacy unanswered-question warning plus in-memory/session duplicate-submit locks; the database unique attempt-number constraint is the final race guard.
- [x] Result visibility follows publish policy.
- [x] Fatal render/request error gives a recoverable retry state.
- [x] Back behavior returns to prior context with All Quizzes fallback, and successful submission returns after the legacy-style short confirmation window.
- [ ] Mobile layout is implemented responsively but still needs browser verification.

## Page: Class Schedule
**Legacy:** `/learn/calendar`

Legacy contract:
- learner class schedule;
- course/class filtering where exposed;
- calendar navigation/current period;
- session details;
- loading/empty/error.

- [x] Derive schedule only from learner's active section(s); no arbitrary section-id access.
- [x] Calendar/date navigation is implemented.
- [x] Course/class filters match legacy.
- [x] Session title/time/course/faculty/location details are represented.
- [x] Today/upcoming cues are equivalent.
- [x] Loading/no-sessions/error states are implemented.
- [x] Timezone/date handling is implemented with browser-local calendar grouping and offset-aware persisted timestamps.
- [x] Mobile agenda/list fallback is implemented in the responsive component; final browser verification remains.
- [x] Schedule route has explicit loading and retryable error boundaries, distinct from true empty/filtered-empty states.
- [x] Event links land directly on Course Overview without an intermediate redirect.
- [ ] Regression coverage executes successfully in CI/browser.

## Page: Attendance Summary

**2026-10-14 per-course attendance-history drill-down (PARTIAL):**
`/learn/courses/[deliveryId]/attendance-summary` is a read-only course
details view linked from the canonical Course workspace. It groups only
existing held, marked/unmarked, and scheduled sessions by IST month;
displays the stored college threshold and no-data/filtered-empty states,
and never treats missing records as absences. Zod validates the delivery UUID
and optional month, central `academics.read` plus persisted active learner
membership protect the data, and the existing delivery-scoped attendance
reader supplies the authorized course records. No mutations or unregistered
tables. Browser parity and executed DB results remain outstanding.

**Legacy:** `/learn/attendance`

- [x] Overall attendance summary exists.
- [x] Per-course attendance breakdown exists.
- [x] Eligibility/threshold messaging matches configured policy where legacy shows it.
- [x] Present/absent/session totals are correct.
- [x] Empty/loading/error states are implemented; route failure is explicitly distinct from a zero-record month and exposes Retry.
- [x] Server-resolved course choices eliminate the legacy raw-course-id hydration flash and auto-select the first valid course.
- [x] Desktop table and responsive mobile attendance cards are implemented; final browser verification remains.
- [x] Learner view is read-only and tenant scoped.
- [ ] Attendance regression coverage is authored but must actually execute successfully in CI/browser verification.

# My Placements

## Page: Placements Home

**2026-10-14 activity addition (PARTIAL):** recent placement activity now
projects up to eight persisted events from the learner's own journey:
application submissions/withdrawals, published screening decisions and
applied round results. No staged/internal results, inferred dates or
fabricated history. The responsive dashboard section displays IST dates,
links to the owned application and keeps a truthful no-events state.
Exact legacy card layout, deep-link/browser proof and executed DB tests
remain open.


**2026-10-13 source parity expansion:** a real learner-scoped dashboard
now summarizes distinct open drives, active applications, scheduled
assessments/interviews and issued offers. Its next action prefers assessments
in the coming seven days, then interviews, then the next real scheduled event,
then Browse Drives. The same timeline powers a chronological seven-day
preview and actionable alerts. Effective approved reschedules override the
original slot. A first-run browse hero appears when no applications exist.
A source-independent, testable model covers ordering, counts, and edge cases.
Legacy funnel/status segmentation, partial-source failures, responsive/browser
evidence and all cross-route workflows remain open; do not count this page DONE.

**Legacy:** `/learn/my-placements`

Legacy contract includes:
- hero/next action;
- placement funnel/status breakdown;
- applications/offers metrics;
- "needs attention" assessments/interviews;
- rolling career-calendar preview;
- first-run vs failure distinction;
- navigation into jobs/applications/assessments/interviews/calendar.

- [ ] Hero/next-action logic is recreated without false urgency.
- [ ] Funnel/stage breakdown matches source states.
- [ ] Application/offer metrics use the correct denominator/time window.
- [ ] Needs-attention prioritization is reproduced.
- [ ] Calendar preview and upcoming counts are reproduced.
- [ ] First-run, partial-load and hard-error states are distinct.
- [ ] Every dashboard CTA lands on the intended filtered subpage.

## Page: Applications

**2026-10-14 confirmed self-withdrawal (PARTIAL, related to L14-015):**
The existing Applications detail drawer now offers **Withdraw application**
only for a submitted own-member application. A responsive confirmation
dialog displays employer and role, describes the immediate status change,
requires a trimmed reason of 5–500 characters, and supports safe cancel,
pending, validation error, server failure and confirmed-success feedback.
The existing `POST /api/placements/applications/[applicationId]/actions`
now uses a strict Zod action/confirmed/reason payload and same-origin
protection; the existing transactional write rechecks central
`can(..., "placements.read")`, active persisted Learner membership, user
and role, and own application ID in the conditional update. It stores
the reason in private application-status history and the existing
withdrawn activity audit event only records whether a reason was given,
not its text. Duplicate POSTs are idempotent. Page-specific loading
and retryable error boundaries distinguish read failure from no data.

**Parity limitation:** the legacy **withdrawal request** (approval-driven)
is not the same as immediate `WITHDRAWN` status mutation. The Job Detail
request-for-review workflow is separate. The legacy modal/request semantics
and whether to consolidate or keep both actions still need explicit
product-owner disposition before L14-015 can be CLOSED. The Applications
parent remains PARTIAL. Authored unit and disposable PostgreSQL tests
cover real success/history/audit, idempotence, forged-college, suspended,
wrong-role and bad-input denial; executable/browser acceptance remains open.



**2026-10-14 offer expiry visibility (PARTIAL):** `LearnerPlacementOffers` now prioritizes issued actionable offers by the recorded nearest expiry, warns for a response due within 48 hours, and hides Accept/Decline after a recorded expiry while showing why. The action endpoint still transactionally enforces eligibility/status/expiry. The clock is a server-authored ISO snapshot, not `Date.now()` in React render. Pure unit and independent learner PostgreSQL tests cover timing and own-member denials. Remaining: execution of typecheck/lint/unit/PG, responsive browser test of an expiry boundary, offer history/legacy modal comparison.

**2026-10-14 offers-browse addition (PARTIAL):** a dedicated
`/learn/my-placements/offers` page lists all persisted offers belonging
to the authenticated learner and provides All/Awaiting/Accepted/Closed
views with honest first-run/filtered empty states. Applications and the
placements dashboard link to it; existing offer-response actions are
reused without adding a write endpoint. No unregistered notice or
saved-job persistence is read. Full legacy offers modal and browser
verification remain open.


**2026-10-14 application detail extension (PARTIAL):** the existing
applications drawer now links to separate read-only Application History and
Company Preview pages. History reads only registered
`placement_application_status_history` (migration 0021), showing actual status
transitions or a truthful no-records state without private actor/reason fields.
Company Preview reads registered company/relationship records (migration 0016)
only for an application owned by the authenticated learner, sanitizes HTTPS
website links and shows honest no-biography/logo states. Both preserve central
learner placement access checks, explicit `placements.read`, UUID validation,
loading/retry, responsive layouts and unknown/cross-member not-found. These
pages do not yet reproduce legacy in-page modals; executed browser and
database acceptance remain open.

**2026-10-13 implementation update:** learner's application list now has
URL-aware search, All/In Progress/Completed views, stage filters,
recent-activity/company/oldest sort and 20-row pages. Each Journey
card offers an explicit application-ID link that opens a detail drawer,
including screening feedback, confirmed round history and routes to
assessment/interview workspaces. The labels derive only from persisted
journey status, with deterministic unit tests. Full legacy history modal,
employer company preview, withdrawal-request dialog, offer confirmations,
and browser/edge-state verification remain open.

**Legacy:** `/learn/my-placements/applications`

Legacy contract audited from `ApplicationsContent`:
- search with URL state/back-forward hydration;
- stage filter chips and All/In Progress/Completed views;
- sort: recent activity/stage/company;
- attention banner and offered-list CTA;
- application cards + journey visualization;
- contextual actions: assessment/interview/offer/similar roles/details;
- Application Detail modal;
- Application History modal;
- Company Preview modal;
- withdrawal-request modal with reason;
- offer accept/decline confirmation flows;
- empty/filtered-empty/loading/error states.

- [ ] Search, URL-state and browser Back/Forward behavior match.
- [ ] **PARTIAL (L14-003):** stage chips now derive from own persisted application screening, display counts, and update the existing URL-backed filter. In Progress/Completed views already exist. Remaining: executed PostgreSQL/unit, TypeScript/ESLint and mobile/Back-Forward browser parity.
- [ ] Sort options match.
- [ ] Attention banner opens the complete relevant filtered list.
- [ ] **PARTIAL (2026-10-14 — application milestones):** the Applications detail drawer now presents an own-application timeline from real submitted/screening/round-result/withdrawal timestamps, newest first, with an exact link to the existing read-only persisted status-history page. It does not fabricate missing time/outcomes or duplicate append-only records. Pure and independently seeded PostgreSQL tests cover own data and forged-college, suspended, wrong-role denial. Remaining: executed tests, full legacy timeline/modal parity, browser accessibility and history consistency verification.
- [ ] Detail modal contains every legacy section/action.
- [ ] History modal is implemented.
- [ ] Company-data preview modal is implemented with retry/empty states.
- [ ] Withdrawal request modal/validation is implemented.
- [ ] Offer accept/decline confirmation and consequences are implemented.
- [ ] Assessment/interview/job deep links work.
- [ ] Loading/error/first-run/filtered-empty states are verified.

## Page: Assessments

**2026-10-14 assessment due-bucket addition (PARTIAL, L15-005/006):**
The Assessments workspace now provides count-backed "Due today" and
"Due this week" quick filters sourced only from the learner's own
shortlisted, scheduled TEST/VENDOR_TEST rounds in registered tables.
Buckets use effective approved reschedules and Asia/Kolkata days; the
calendar week is Monday–Sunday (including due today), not a rolling seven
days. Past and unscheduled rounds are not in these due buckets. No
scheduled round is inferred to be submitted or employer-completed.
Conflicting generic filters are reset when choosing a quick bucket.
An adapter checks the persisted active learner access and central
`placements.read` before reading rounds. Dedicated route loading/error
with Retry, responsive filter chips and truthful filtered-empty behavior
are authored, as are IST boundary unit and PostgreSQL denial tests.
Employer-submission/other bucket/source parity, executed tests and
browser acceptance remain open.


**2026-10-14 official-results extension (PARTIAL):** linked, read-only
`/learn/my-placements/assessments/results` lists persisted, applied
TEST/VENDOR_TEST results from the Learner's authorized applications.
All/Passed/Not passed/Other views show stored scores and shared candidate
feedback, if any, with actual IST timestamps, application/drive links and
truthful first-run or filtered-empty states. Unpublished results, other round
types and scheduled-but-unreported assessments are not treated as outcomes.
The legacy Pending/Completed employer-submission workflow, browser and
executed DB checks remain outstanding.


**Learner schedule browser update (2026-10-13):** dedicated Assessment rounds
now support employer/round search, Upcoming/Past/Awaiting schedule buckets,
Today/7-day urgency filters, sorting, empty/filter states and a details drawer.
Only existing learner-authorized scheduled rounds are listed; no provider
submission or employer result is inferred from the calendar time. Approved
reschedules replace the original start. A local, membership-scoped mark-submitted reminder with undo is now available
inside Assessment round details. It explicitly does not submit the assessment
or record employer completion; validated browser storage and corruption
fallback are tested. Provider completion and browser acceptance remain open.

**Legacy:** `/learn/my-placements/assessments`

Legacy contract:
- Pending / Completed views;
- search;
- urgency filter;
- buckets: Due today, Due this week, Later, Waiting on employer link, No deadline, Overdue;
- open external assessment;
- local "mark submitted" reminder + undo/dismiss-change behavior;
- safety notice that local marker is not employer submission;
- time-critical confirmation before leaving for provider;
- job/application navigation;
- loading/error/empty/filter-empty states.

- [ ] Pending/Completed views match.
- [ ] Search and urgency filters match.
- [ ] All urgency buckets are represented correctly.
- [ ] Employer-link unavailable state is explicit.
- [ ] External-provider launch confirmation is implemented.
- [ ] Any local reminder state is clearly non-authoritative.
- [ ] Undo/dismiss/change behavior is accounted for or intentionally redesigned.
- [ ] Job/application deep links work.
- [ ] Loading/error/empty states match.

## Page: Interviews

**Learner schedule browser update (2026-10-13):** dedicated Interview/GD
rounds now support company/round search, honest Upcoming/Past/Awaiting
schedule buckets, urgency filtering, sorting and a details drawer with
approved reschedule details and sanitized meeting links. A scheduled time
is not treated as confirmed attendance; learner confirmation and browser acceptance remain open. The Interview
detail drawer now deep-links to the existing real placement request workflow,
preselecting only a round already authorized in the Learner's request workspace.
Creating a request never changes the shared schedule until approved.

**Legacy:** `/learn/my-placements/interviews`

Legacy contract audited from `InterviewsContent`:
- Upcoming / Past;
- search;
- join-state countdown/live/past badges;
- Confirm;
- Join now;
- Details;
- .ics download;
- Google Calendar link;
- Request new slot;
- Cancel reschedule request;
- Decline interview;
- Interview Detail modal;
- designed confirmation modal for destructive/final actions;
- Reschedule Request modal: reason, preferred date/daypart/details;
- Reschedule Summary modal + copy;
- withdrawal-request modal;
- empty/loading/inline-error states.

- [ ] Upcoming/Past partition and countdown logic match.
- [ ] Search and highlight deep link work.
- [ ] Confirm/Join/Details actions match status gating.
- [ ] .ics and Google Calendar actions are supported or explicitly redesigned.
- [ ] Reschedule request form fields/validation match.
- [ ] Cancel-reschedule behavior is implemented.
- [ ] Decline confirmation makes consequences explicit.
- [ ] Detail modal is complete.
- [ ] Reschedule summary/copy behavior is accounted for.
- [ ] Withdrawal request is implemented.
- [ ] Loading/error/empty states are verified.

## Page: Career Calendar

**2026-10-13 source parity improvement:** Career Calendar now has
Agenda / Month / Week / Day modes with period navigation, Today,
event-kind filters, a month/week date grid and a mobile-friendly agenda.
Times are displayed in India timezone using saved UTC instants; an
approved round reschedule replaces the original slot. Export produces
an .ics calendar for the learner-visible rounds and deliberately avoids
invented event duration or protected employer URLs. Calendar date
grouping, leap/edge navigation, rescheduling and escaping are covered
by pure unit tests. Legacy job-deadline, TALK and college BLOCKED event
sources, event detail drawers, full responsive/browser acceptance and
cross-page navigation still remain open.

**Legacy:** `/learn/my-placements/calendar`

Legacy contract:
- Agenda / Month / Week / Day modes;
- previous/today/next navigation;
- date picker;
- event-type filters;
- event chips;
- selected-event detail drawer;
- partial source failure alert + retry;
- empty calendar state.

- [ ] All four calendar modes are implemented.
- [ ] Previous/Today/Next and date picker behavior match.
- [ ] Event-type filters match.
- [ ] Event detail drawer is implemented.
- [ ] Event deep links/actions work.
- [ ] Partial-data errors do not masquerade as empty.
- [ ] Timezone handling is verified.
- [ ] Mobile agenda fallback is verified.

## Page: Jobs

**2026-10-14 closing-soon extension (PARTIAL):** the published Learner
Drives page has an URL-backed seven-day application-deadline toggle. It
uses a single server clock snapshot passed through the authoritative
membership-scoped job service and existing deadline policy, and does not
invent deadlines for unscheduled or already-expired jobs. Pure-model and
DB scope-denial tests are authored; saved-job storage is still unregistered,
and legacy tab/browser parity remain open.


**2026-10-13 browse update:** the dedicated Learner Drives page now
filters the persisted role-option feed by search text, employment type,
location and ability to apply, sorts by deadline/CTC/role title,
and paginates at 20 rows. Filter/search/page values use query parameters
and rehydrate the search field on browser Back/Forward; filtering does
not alter eligibility decisions or application submissions. Source/pure
regression tests were authored. Saved drives, closing-soon facet,
full legacy tab composition and browser acceptance remain open.

**Legacy:** `/learn/my-placements/jobs`

Legacy contract:
- All drives / Saved tabs;
- search with URL state/back-forward;
- sort: deadline/newest/highest CTC;
- job-type filter;
- location filter;
- eligible-only and closing-soon toggles;
- save/unsave;
- pagination;
- not-open/closed grouping;
- deadline urgency labels;
- saved-jobs load failure distinct from all-jobs failure;
- first-run/filtered-empty states.

- [ ] Tabs, search, URL state and Back/Forward match.
- [ ] All sorts and filters match.
- [ ] Eligibility filter is based on authoritative eligibility.
- [ ] Closing-soon semantics match legacy.
- [ ] Save/unsave behavior and failure state are implemented.
- [ ] Pagination and closed/not-open grouping match.
- [ ] Deadline labels match.
- [ ] Loading/partial-failure/empty states are verified.

## Page: Job Detail

**Learner detail implementation (2026-10-14):** dedicated role-aware
published-drive detail replaces the generic full-page job cards. Breadcrumb
navigation, company/description/location/work/deadline facts, scoped eligibility
breakdowns (rule pass/fail/missing with actual/required), applicant status and
real role-specific apply/withdrawal actions are composed from the existing
authorized Learner job service. Safe external URLs reject non-web schemes.
Learner job cards now link to the authorized dedicated Drive Detail
route, so details are discoverable from Browse Drives and the placements
dashboard rather than direct URL navigation only.

Job action confirmations now use explicit learner withdrawal request and external
submission dialogs instead of `window.prompt` or an immediate declaration.
Withdrawal text follows the 3–2000-character API contract and does not
change application status until the placement team approves. External
submission is explicitly learner-declared, not independently verified.
Legacy resume attachment/preview, rich employer company facts, receipts and
browser acceptance remain open.

**Legacy:** `/learn/my-placements/jobs/[jobId]`

Legacy contract:
- eligibility panel;
- verified job/company details;
- apply/application-state CTA;
- navigation to Applications/Jobs;
- retry/not-found/access handling.

- [ ] Eligibility checklist/reasons match.
- [ ] Job/company/role/compensation/location/deadline details match.
- [ ] Apply/current-application state is authoritative.
- [ ] Registration/external-action requirements are represented.
- [ ] Retry/not-found/closed/not-eligible states are explicit.
- [ ] Back/navigation behavior matches.

## Page: Placement Cell

**2026-10-14 offer-response preview (PARTIAL, L18-012):**
Acceptance of an ISSUED, still-unexpired persisted offer now requires a
confirmation dialog with the recorded company, role, CTC, joining date and
deadline. The preview is informational; the same existing Zod-validated,
same-origin guarded POST rechecks learner placement permission, persisted
own-membership, status and expiry transactionally. Closed/expired offers
cannot be confirmed in the preview. An empty offer list remains an honest
first-run state on the dedicated Offers page. Decline flow and full legacy
offer/letter parity remain open; do not claim complete workflow parity.


**2026-10-14 personal placement alerts (PARTIAL):** a read-only section on
`/learn/my-placements/placement` shows up to eight actual PLACEMENTS-module
personal notifications for the authorized learner, sourced from registered
activity events and in-app notifications. The service checks persisted active
learner membership, paid placement participation and central
`placements.read`; events must belong to the same college and user.
Unsafe action URLs are removed, and timestamps use IST. The UI explicitly
does not call these records official college-wide notices: a separate
college-published notice/dispute source is still absent, and L18-023/024
remain GAP. No client mutation route was introduced; loading/error/empty
states are explicit.

**Legacy:** `/learn/my-placements/placement`

Legacy contract audited from `PlacementCellContent`:
- debar alerts;
- registration card with choice Placements/Higher Studies/Not Interested + consent;
- Placement Rules link;
- Offers card with Accept and Decline confirmation;
- "Your rounds" with Confirm and Ask to reschedule;
- Requests list + New Request;
- request types: registration change, correction, external offer, absence dispute, offer extension;
- offer-letter/file flow where applicable;
- Notices from placement cell + dispute action;
- New Request modal;
- Reschedule modal;
- Offer acceptance preview modal;
- page-level retry/error/loading/empty.

- [ ] Registration/choice/consent workflow matches.
- [ ] Debar state is explicit and correctly scoped.
- [ ] Offers actions and confirmation consequences match.
- [ ] Round confirm/reschedule workflow matches.
- [ ] Request list and all request types are implemented.
- [ ] New Request modal dynamically shows correct fields.
- [ ] Notice dispute flow is implemented.
- [ ] Offer acceptance preview is implemented.
- [ ] Loading/error/empty states are verified.

## Page: Placement Rules

**2026-10-14 learner rules-preparation parity (PARTIAL):** The existing
`/learn/my-placements/rules` now shows a context-aware Back link, accepting
only the Zod-validated `from=dashboard|cell|drives` values and falling
back to My Placements. Placement Cell and Drives link into this page
with their return context. A read-only personal "Where you stand" panel
shows only real membership-scoped academic evidence (CGPA, backlog count,
gap years) and recorded job preferences. A numeric zero is recorded,
not missing. This is explicitly **not** a global eligibility verdict,
verified academic certification, college-approved placement clearance or
an invented readiness score. The backend validates the current persisted
active LEARNER membership, program/section inheritance, paid placement
participation and central `placements.read` before reading registered
source tables. Missing evidence is an honest unknown state; scoped per-drive
eligibility remains accessible via Drives. Mobile cards, dedicated loading
and error/retry boundaries, pure-model unit and PostgreSQL role/tenant denial
tests are authored. No writes were introduced; actual CI/browser evidence
remains open. College-authored policy and applicability-version wording
remain blocked/partial because there is no registered policy source.


**Learner navigation correction (2026-10-14):** academic evidence and job
preferences links now lead to anchored, working editors on the Learner
Placements workspace, rather than removed Learner Profile panels. The
college-authored policy remains database/product dependent.

**Legacy:** `/learn/my-placements/rules`

- [x] Back action uses validated origin or a safe dashboard fallback; browser verification pending.
- [x] Personal "Where you stand" note uses recorded own-member data only, not invented policy.
- [ ] College placement rules summary uses authoritative current policy.
- [ ] Rule-change applicability wording is preserved.
- [x] Loading/error/retry states are implemented with explicit route boundaries; executed browser proof pending.

# Projects

## Page: Projects list
- [ ] Project cards/rows expose title/status/team/mentor/progress signals present in legacy.
- [ ] Active/archived/attention states match.
- [ ] Empty/loading/error states match.
- [ ] Navigation opens the correct learner project.

## Page family: Project detail
Legacy areas include Overview, Team, Sprints/Board, Tasks, Resources, Meetings, Delivery and Activity.

- [ ] Overview narrative, goals and project status are complete.
- [ ] Team members/roles/mentor information is complete.
- [ ] Sprint list/current sprint/state matches.
- [ ] Task board/list, task detail, status changes and submissions match learner permissions.
- [ ] Resource links/files/pinned/required state match.
- [ ] Meeting list/request workflow/status/timezone handling match.
- [ ] Delivery/final submission/status/review feedback match.
- [ ] Activity/history feed matches meaningful legacy events.
- [ ] Archived/read-only behavior is enforced.
- [ ] Loading/not-found/access/error states are verified.
- [ ] Mobile task/project interaction is verified.

# Notifications

## Page: Notifications

**2026-10-14 placement-notification deep links (PARTIAL):** Personal placement notifications now validate and canonicalize persisted application UUID drawer links and offers status tabs, removing untrusted college/user query selectors. Assessment actions retain their own round validation; all targets still enforce the signed-in learner at the destination. Unit and isolated PostgreSQL tests use a fresh learner and scoped notification, with forged-college/suspended/wrong-role denial. Remaining: test execution, producer-level link coverage, browser navigation and unread/read acceptance.


**2026-10-14 Learner positive-path + scoped acknowledgement addition
(PARTIAL, L29-017):** New disposable PostgreSQL integration fixture
creates a learner user, active college membership and enrollment,
shortlisted application + scheduled test round, a personal PLACEMENTS
notification, and a same-recipient notification originating from a
different college. The tests assert actual Profile academic identity,
assessment round/day bucket, notification history, placement alert
projection, idempotent single mark-read, scoped bulk mark-read, and
cross-college/cross-role denial. The tests are **authored, not yet
executed**, so they are not green evidence.

Learner inbox and keyset history now restrict events to the current
persisted college and revalidate active user/LEARNER membership with
central `academics.read`. Learner mark-read uses strict Zod UUID, own
recipient, current event college, and `readAt` audit timestamp.
Both the Learner-specific and original shared POST endpoints retain
`isSameOriginRequest`; shared routes dispatch Learner contexts to
the strict service (including suspended memberships). Bulk mark-read
is college-scoped for Learners; other roles retain their shared inbox
behavior. This does not implement non-migrated college announcements or
close general Learner Notifications browser/oracle parity.


**2026-10-14 personal notification history (PARTIAL):** added
`/learn/notifications/history`, linked from the main learner inbox.
Uses the existing registered own-recipient keyset pagination reader
(40 records/page), validating the timestamp/UUID cursor and optional
Unread view through strict Zod. Scope checks include current persisted
active Learner role, membership and user plus central `academics.read`.
Only personal notifications paginate here; readiness-gated announcements
remain in the main inbox. Counts are explicitly page-local, not a fabricated
all-history total. Existing read actions use their same-origin-guarded
endpoint. Cross-role/cross-college DB denial tests and cursor/model/source
tests are authored, but runtime test/CI and browser acceptance remain open.


**Learner-only access and recovery:** `/learn/notifications` now checks
the active Learner membership and existing central tenant permission before
fetching personal notifications or scoped announcements. A dedicated loading
skeleton and retryable error boundary distinguish request failure from an
empty inbox. Role/disabled-account negative unit checks are authored.
Browser validation and notification pagination still remain.


**2026-10-13 implementation update:** Learner's two authorized inbox sources
are now consolidated into one chronological feed, with legacy domain tabs
All / Course / Projects / Announcements / Job. Counts and scope derive from
the complete fetched set; announcements cannot receive personal read-state
mutations. Typed module classification and pinned indicators have unit/source
coverage. The legacy-style detail dialog now shows full content, category, and
timestamp, with an optional safe deep link; large-volume pagination and
mobile/browser proof remain open.

- [ ] Announcement feed behavior matches legacy.
- [ ] Personal notification feed behavior matches legacy.
- [ ] Unread/read semantics are defined and verified.
- [ ] **PARTIAL (L29-009):** recognized assessment notifications retain validated application+round UUID context and show an accurate learner assessment action; destination still enforces own membership. Other notification deep-link types need separate review. Remaining: executed PG/unit/tsc/eslint and browser navigation acceptance.
- [ ] **PARTIAL (L29-016):** personal-feed errors still fail closed; optional announcement failures show a retry alert without hiding the authorized personal inbox. Remaining: executed PostgreSQL/unit, lint/tsc, simulated-announcement-failure and mobile/browser proof.
- [ ] No cross-role or cross-college notifications leak.

# Profile

## Page: Learner Profile

**2026-10-14 career-profile coverage (PARTIAL):** The learner Profile page now reports progress across the 15 non-sensitive career sections, excluding optional Aadhaar/PAN fields from the completion denominator. It recommends an actual missing editable section through a learner-only profile deep link without claiming that fields are verified or that the learner is placement-eligible. The original 16-section detailed checklist remains unchanged. Unit tests and a PostgreSQL read test use a fresh learner and cover foreign-college/suspended/wrong-role denials. Remaining: executed unit/PG/tsc/eslint and responsive/keyboard/browser acceptance, plus separately approved verification-storage workflows.


**2026-10-14 confirmed alternate contact edit (PARTIAL, L30-007):**
The Contacts card now has a mobile-friendly Edit contact details dialog for
the optional **alternate phone** and **contact email** only. It requires a
second confirmation, uses strict Zod and displays pending, safe-cancel, error
and successful-save states. The authenticated
`PATCH /api/profile/me/contacts` is same-origin protected, authorizes
`can(context, "profile.self.manage")` and checks active persisted Learner
membership/user/role in a transaction. It updates only the
`learner_profiles.profile_document.contacts` JSON section rather than
replacing other sections. A transactional
`identity.learner_contact.updated` event records the actor/college and
changed field names **without phone or email values**. Login phone and
account email remain authoritative and unchanged; no verification or
phone/email-change request workflow is implied.

The generic Profile editor no longer offers separate contact text inputs;
its other existing profile sections still use the existing PUT workflow.
A fresh-fixture PostgreSQL integration suite covers saved contacts,
preservation of other sections, audit privacy, forged-college, suspended,
wrong-role, live suspension/role revocation and invalid-input denials.
The tests are authored pending executable PG evidence. Profile image,
resume storage, private identity, verification and browser/oracle
acceptance remain open; parent Profile stays PARTIAL.


**2026-10-14 contact deep-link and completion checklist (PARTIAL,
L30-026):** Profile now accepts strictly validated `?section=contacts`
(and other existing section IDs), scrolls to that actual card on navigation,
and exposes a mobile-responsive 16-section checklist based on the same
persisted `profileDocument` fields already used by the completion badge.
No second score is fabricated, and the checklist updates after successful
profile edits. Aadhaar/PAN details remain optional; checklist completion
does not mean verification. Unsupported Connect Accounts, storage-backed
profile image/resume and Profile Verification are not represented as ready.
Existing Profile loading/retry states and server-owned profile read/update
routes remain in place. Browser and runtime acceptance remain open.


**2026-10-14 academic identity summary (PARTIAL, L30-001):** the Profile
shows the current learner name and, when a single active enrollment is
persisted, the actual program, code, cohort and department. It verifies
the active user, college membership and LEARNER role against registered
tables, checks the program's department is in the same college and denies
ambiguous enrollment. No program is fabricated when none is registered.
The existing Profile completeness/edit workflows remain unchanged.
Unit and disposable PostgreSQL denial tests are authored; browser and
executed test evidence remain open.

**Legacy:** `/learn/profile`

Audited legacy sections:
- user summary;
- profile completeness;
- profile image;
- resume upload/import/remove;
- contacts;
- social profiles;
- address;
- personal details;
- identity;
- Aadhaar/PAN upload/import/replace cleanup;
- experience;
- education/qualifications;
- skills;
- learner projects;
- certifications;
- achievements;
- languages;
- extracurricular activities;
- hobbies;
- metadata;
- Job Preferences intentionally absent from the current learner self-profile;
- Placement Academic Record intentionally absent from the current learner self-profile;
- Profile Verification card for Education and Identity, including incomplete/ready/submitted/sent-back/verified/update-pending states;
- verified-by/date, sent-back reason, changed-since-verification semantics and visible-page refresh;
- marksheet/resume/private identity-document prerequisites for verification;
- deep-link scroll targets for contact/connect-account sections.

Closure checklist:
- [ ] User summary is implemented; profile-image self-service remains BLOCKED on Cloud Storage.
- [x] Profile completeness is calculated and refreshed after edits.
- [ ] Resume upload/import/remove, validation and old-file cleanup remain BLOCKED on Cloud Storage.
- [x] Contacts edit flow is implemented.
- [x] Social profiles edit flow is implemented.
- [x] Address edit flow is implemented.
- [x] Personal details edit flow is implemented.
- [x] Identity edit flow is implemented.
- [ ] Aadhaar/PAN file upload/import/replace remains BLOCKED on secure Cloud Storage; validated masked identity-number editing is implemented.
- [x] Experience add/edit/delete is implemented.
- [x] Education add/edit/delete is implemented.
- [x] Skills add/edit/delete/proficiency is implemented.
- [x] Projects add/edit/delete is implemented.
- [x] Certifications add/edit/delete is implemented.
- [x] Achievements add/edit/delete is implemented.
- [x] Languages add/edit/delete is implemented.
- [x] Extracurricular add/edit/delete is implemented.
- [x] Hobbies edit behavior is implemented.
- [x] Metadata edit behavior is implemented.
- [x] Job Preferences is absent from learner Profile, matching the current production self-profile; placement preferences remain placement-domain data.
- [x] Placement Academic Record is absent from learner Profile, matching the current production self-profile.
- [ ] Profile Verification Education/Identity state machine, learner submit/resubmit actions, verified badge/by/date, sent-back guidance and update-pending semantics remain open.
- [ ] Verification readiness cannot be honestly completed until marksheet/resume/private identity-document storage flows are live; those storage-backed prerequisites remain BLOCKED.
- [ ] **PARTIAL (L30-031):** existing loading and error/retry boundaries remain; returning to a visible Profile tab requests fresh saved data after a cooldown, and new server props never silently overwrite local edits. Remaining: executed PG/unit/tsc/eslint and two-tab/browser concurrent-edit acceptance.
- [x] Role redirect/fence behavior is server-safe.
- [x] Storage-backed items are marked BLOCKED until Cloud Storage is live rather than silently omitted.

## Placement-only notification preferences — chat-4 (2026-10-14)

PARTIAL — New mobile-friendly `/learn/my-placements/notification-preferences` lets the signed-in Learner explicitly confirm updates to the two registered P2 candidate-preferences notification flags. A narrow same-origin PUT uses strict Zod booleans and confirmation, central placements.read, live own-college LEARNER role/paid participation checks, and a single transactional actor audit on real changes. The update preserves role/location/CTC preferences. No-op retries do not generate fake audits. Unique-fixture PostgreSQL tests cover success, suspension, forged college, revoked role and wrong-role denials; they are authored but not executed. This is not a global course/security notification opt-out; producer delivery, browser validation and full legacy parity remain OPEN.

## Learner read-only monthly attendance calendar — chat-4 (2026-10-14)

PARTIAL — Added `/learn/attendance/calendar` alongside the existing
course/month Attendance workspace and Class Schedule day/week/month views.
The new mobile-first seven-day monthly grid shows *registered* attended,
absent, medically/excused/late, unmarked and future scheduled sessions from
the canonical Learner attendance reader, with a filterable per-day list and
links back to Course Attendance. Academic records are restricted to the
signed-in persisted active Learner college membership, role grant and
current authorized course deliveries (central `academics.read`). Zod
restricts month, status and delivery filters; unknown or foreign delivery
identifiers fail closed. India-local day grouping and no-mark denominator
handling are pure and testable. No attendance is changed by this page.

Model unit tests and a fresh-fixture PostgreSQL integration suite are
authored covering present/absent/unmarked/future sessions, pagination-free
month grouping, empty months, forged college, suspended and wrong-role
denials, and test-owned cleanup. Execution, exact legacy browser/mobile
proof and complete canonical attendance evidence remain **OPEN**; neither
Course Attendance nor Attendance summary is marked DONE by this addition.

## Learner placement preparation evidence checklist — chat-4 (2026-10-14)

PARTIAL — A new read-only, mobile-first `/learn/my-placements/preparation`
page links from My Placements and reports **four factual persisted signals**:
active academic program enrollment, at least one profile contact method,
at least one Learner profile skill, and historical placement application
activity (including withdrawn applications). Links return only to existing
authorized Learner profile or application pages. `ALL` / `RECORDED` /
`MISSING` filters use strict Zod and return honest no-match states.
The server requires the canonical persisted active Learner college membership,
role and paid Placements/eligibility scope; it checks central placements.read
and reads only the authorized current user profile/enrollment and own
placement_application rows. It does not expose private identity values,
claim eligibility, invent college requirements, or calculate a subjective
hiring-readiness score. No write route or notification is introduced.

A pure-model unit suite and an isolated fresh-PostgreSQL success/denial
integration test using the same passing Learner fixture as Attendance calendar
were authored for an actual enrolled Learner with a persisted application,
forged college, suspended/disabled account, wrong role, forged actor and
caller-injected membership scopes. Full browser/positive-PG execution
evidence, historic content completeness, and exact legacy acceptance remain
OPEN. The parent Placements dashboard and Self Profile rows remain PARTIAL.


## Chat-7 learner projects — 2026-10-14

- **L20-012 PARTIAL** — The learner Projects list now bulk-loads live, learner-scoped team members, displays primary (or available) mentor and the count of distinct active members per assigned project. Pure model and isolated-PostgreSQL tests authored. **Remaining:** execute TypeScript, ESLint, unit and disposable PostgreSQL suites; browser/mobile visual parity, cross-role producer acceptance and actual account clone verification. No DONE claim.

- **L20-013 PARTIAL** — Learner Project cards now calculate actual DONE/total tasks from authorized persisted tasks. Projects without tasks explicitly show untracked, not 0%; blocked tasks are counted separately and not inferred from unrelated states. Unit and own-learner PostgreSQL tests authored. **Remaining:** execute typecheck, lint, unit, isolated PostgreSQL and responsive browser checks; compare current legacy execution/readiness and cross-role producers.

- **L20-016 PARTIAL** — Learner Projects has a shape-matched loading skeleton and accessible error boundary with Retry. A tested pure model distinguishes no assignments from filter-excluded results only after a successful learner-scoped read; database failure cannot be labelled zero Projects. Unit and own-fixture PG tests authored. **Remaining:** execute tsc/eslint/unit/isolated-PG and loading/failure/keyboard/mobile browser assertions, compare legacy failure and filtering states.

- **L20-017 PARTIAL** — Learner-only mobile search/status/attention/rows filters now collapse behind a touch-sized summary with active selection count, clear/apply actions, max-100 search and full-width inputs. Existing shared desktop and Mentor controls are unchanged; pagination touch targets enlarged in the learner view. Pure-model and scoped-PG tests authored. **Remaining:** run tsc/eslint/unit/isolated-PG; mobile 390px and desktop browser comparison, keyboard/details focus, pagination/Back/Forward and legacy visual acceptance.

- **L25-006 PARTIAL (2026-10-14 chat-7):** Learner Board supports URL-backed, 100-character-bounded search of authorized persisted task title/description; filters the actual workspace tasks rather than only hiding visual cards; counts/filtered empty and mobile form provided. Pure-model and unique-learner PG regression tests authored. **Remaining:** execute typecheck/lint/unit/PG and desktop/mobile/browser Back-Forward verification against frozen legacy; no file or external-send support.

- **L25-002 PARTIAL (chat-7):** learner Board priority filter (LOW/MEDIUM/HIGH/CRITICAL) is applied to authorized persisted task rows and composes with title/description search. Pure model, in-test learner PG positive and role/scope denial cases authored. **Remaining:** type/lint/unit/PG execution, IST-neutral responsive browser, current legacy Board comparison and accessibility testing.

- **L25-003 PARTIAL (chat-7):** authorized learner Board now supports persisted project sprint-ID filtering, composed with task title and priority filters. Only scoped workspace sprint choices are rendered; foreign selector matches no task. Unit and own-learner PG denial fixtures authored. **Remaining:** execute static/unit/PG gates, mobile/desktop browser and legacy sprint-scope parity.

- **L25-005 PARTIAL (chat-7):** learner Board now filters real tasks by their persisted sprint→release association, composable with search, priority and sprint. Only authorized project release choices are rendered. Pure model and unique learner PG success/foreign scope/suspended/wrong-role cases authored. **Remaining:** execute static/unit/PG, mobile keyboard and browser parity; no file feature added.

- **L25-013 PARTIAL (chat-7):** Board distinguishes no persisted tasks from valid tasks excluded by search/priority/sprint/release filters; no fabricated empty state on data failures. Pure model and unique-learner PostgreSQL reads/foreign-scope denial authored. **Remaining:** runtime TypeScript/ESLint/Vitest/PG and mobile/browser parity, including stacked release containers when filtered empty.

- **L25-014 PARTIAL (chat-7):** learner Board filters now collapse behind a compact 44px touch summary on narrow screens, report actual active URL-filter count, and display responsive grid controls on desktop with large input/button targets. Existing project task rendering and authorized data unchanged. Pure-model/unit and unique-learner PG denial tests authored. **Remaining:** execute tsc/eslint/unit/PG, mobile (390px) browser keyboard/details and no-horizontal-scroll checks, legacy layout parity.

- **L25-008 PARTIAL (chat-7):** learner Board has exact task links preserving URL filter state and a native modal showing only authorized task detail, sprint, priority, status, description and acceptance criteria. Foreign task IDs cannot resolve from own scoped workspace; no mutation or contact exposure. Pure/unit and unique-learner PG denial tests authored. **Remaining:** run tsc/lint/Vitest/isolated PostgreSQL and browser focus/escape/back-forward/mobile no-horizontal-scroll/legacy drawer parity.

- **L21-012 PARTIAL (chat-7):** learner Project detail now has skeleton/loading, retryable error UI, and a non-enumerating unavailable page. Missing/foreign-college/suspended/role-revoked Project reads map to not-found while unexpected service errors remain retryable; UUID route validated. Unit plus own-learner isolated-PG success and negative tests authored. **Remaining:** typecheck/lint/Vitest/PG execution, browser not-found/loading/retry/access/keyboard/mobile parity.

- **L22-002 PARTIAL (chat-7):** learner Project Overview now reads goal, description and deliverables solely from its authorized immutable assigned project-template version. Empty authored content is explicitly absent; no invented definition-of-done text. Pure model/unit and own-learner PG success and denial fixtures authored. **Remaining:** execute static/unit/isolated-PG and compare exact legacy Overview/mobile and template authoring producer.

- **L21-008 PARTIAL (chat-7):** legacy learner Project URL `?tab=tasks` now renders canonical Board and sets correct active tab without changing project access rules; canonical links remain `?tab=board`. Pure-model unit and self-fixtured PG read/denial tests authored. **Remaining:** typecheck/lint/Vitest/isolated-PG, Back/Forward and mobile/browser parity.

- **L21-009 PARTIAL:** legacy `?tab=meetings` opens the People & Meetings learner workspace. Unit and own-learner PG denial tests authored. Remaining: executed checks, legacy/browser/mobile acceptance.

- **L25-007 PARTIAL:** learner Board task index shows persisted title, status, priority and sprint. Type and story points are not persisted, not fabricated. Unit and own-learner PG positive/scope/role denial tests authored. Remaining: executed tests/browser parity and migrated type/points producer if required.

- **L21-010 PARTIAL (chat-7):** authorized learner Project final delivery now has an explicit canonical tab, so `?tab=delivery` highlights the matching navigation and displays persisted own Project submission/review flow. No new files or external sends. Unit/own-learner PG scope-denial tests authored. **Remaining:** executable test gates, mobile navigation, Back/Forward and legacy delivery workspace parity.

- **L20-014 PARTIAL (chat-7):** Learner Projects list explicitly labels persisted ARCHIVED instances as read-only without treating COMPLETED projects as archived. No write permission or storage changes. Pure model and PG persisted own-learner/foreign-college/suspended checks authored. **Remaining:** execute tsc/lint/Vitest/isolated PG and confirm archived navigation/disabled actions against legacy mobile/browser behavior.

## 2026-10-14 attendance filter correction — PARTIAL

The Attendance workspace now uses IST for record month membership and date/time labels, including UTC month/year boundaries. The current Course/month selection is resolved from the URL on each navigation, so restored history no longer leaves stale local filters. Query months and Course IDs are validated and constrained to the server-authorized Course list. Existing loading/error/empty and mobile views remain in place. Pure boundary/query tests and an own-enrolled-learner PostgreSQL success/foreign-college/suspended/wrong-role test were added. Disposable PG execution is blocked by root-only sandbox user mapping; mobile/browser Back/Forward acceptance remains outstanding. No parity row is marked DONE.

Board Assignee/Mine remains blocked: registered project_tasks has no assignee column. Course thumbnails remain blocked by the absence of a verified canonical image association; no image or ownership data was fabricated.

## 2026-10-14 assessment deadline consistency — PARTIAL

All Assignments and All Quizzes now advance one service-snapshot clock using elapsed monotonic time after mount, including a visibility-return update. Quiz desktop actions, mobile availability, assignment due/late labels and the submission drawer use the same instant. No render-time device wall clock or unpublished score is exposed. Dates display in IST. Pure deadline-transition tests and an own-enrolled-learner PostgreSQL read/denial test were authored; disposable PG remains unavailable in the root-only sandbox. Browser deadline-crossing, background-tab and mobile verification remain open; text/link submission policy is unchanged and files remain blocked.

## 2026-10-14 Project Activity categories — PARTIAL (L27-002..006, L27-008/010)

The learner Activity tab now filters persisted own-project events by Sprint changes, Task changes, Team and meetings, Resources shared, and Submission updates. Task submissions/reviews stay in the task source category; final-delivery/submission events use Submission updates. Project details is also retained from the legacy filter. It shows IST timestamps, actor names and saved subject labels with wrapping mobile cards. Empty source and filtered-empty states are distinct; Apply/Clear retain the exact project/tab. The feed explicitly states its latest-100-event limit rather than implying full archive search. Pure category tests and an independently seeded own-college PG test cover success, foreign-college event exclusion, suspended/wrong-role/foreign-project denial. PG execution and desktop/mobile browser verification remain open. Missing/unemitted historical event types are not fabricated; date range filtering is still outstanding.

## 2026-10-14 Project Activity IST date range — PARTIAL (L27-007)

Activity now supports From/Through calendar dates in IST, inclusive of the whole end date. Zod rejects impossible/repeated/reversed date bounds and unknown categories with a visible validation state. Category and date restrictions are applied in the PostgreSQL query before the 100-result cap, preserving own-college/project authorization; older matching records can therefore be found independently of the default feed. Apply/Clear, dates and categories share the exact Activity URL. Unit boundary/validation tests and an own-fixture PG test with 101 newer unrelated events were added. This supersedes the prior loaded-page-only category limitation. Executed PG evidence, browser/mobile filtering, completeness of historical event producers and pagination beyond 100 matches remain open; no DONE claims.

## 2026-10-15 continued batch: Activity pagination — PARTIAL

Learner Activity now offers Older matching events and Newest matching events while retaining category and IST date bounds. The read queries 101 rows to prove whether a next page exists and returns at most 100. Validated paired timestamp/UUID cursors use exact PostgreSQL microseconds plus event-ID ordering, avoiding JavaScript millisecond truncation and equal-timestamp gaps. The shared array reader retains its existing shape and 100-row contract. Cursor URL/pair validation units and an independently dated own-fixture PG pagination/role/tenant test were added. This supersedes the earlier pagination blocker. PG execution, browser Back/Forward/mobile acceptance and historical producer completeness remain outstanding; no DONE rows were changed.

## 2026-10-15 learner assignment private-file UI — PARTIAL (L6-015)

The aggregate drawer, exact assignment page and course Learning Path now expose File upload only when the existing server runtime-readiness guard enables it. The client validates allowed metadata/50 MB limit, obtains a same-origin assignment receipt, validates the signed HTTPS grant, PUTs bytes without app cookies, and requires explicit final confirmation before posting the receipt to the existing audited submission service. Upload alone never claims assignment submission. Failed PUTs, expired/mismatched grants, security-attestation failure, concurrent clicks and unmount cancellation are handled; scan failures retain the receipt for a retry and show no false success. Existing storage code, environment, schema and migration files were untouched.

Remaining: `course_upload_receipts`/`assignment_submission_files` are still staged rather than in the registered Drizzle journal; `DB06_ASSIGNMENT_FILES_READY=DB06_VERIFIED` and a real CLEAN scanner attestation are required by the existing APIs. This batch does not activate or bypass either guard. Pure metadata/grant/transfer tests were added, plus own-learner persisted assignment read/denial PG coverage. A real file upload/consume/read PostgreSQL+R2 positive path remains blocked by schema/scanner activation, and all PG execution remains blocked here because useradd fails with `Cannot open audit interface` in the UID-0-only sandbox. Mobile/browser/CORS and submitted-file viewing verification remain open. No DONE claims.

## 2026-10-15 submitted assignment private-file viewing — PARTIAL

The aggregate assignment drawer, exact assignment detail and course Learning Path now provide a guarded submitted-file control through the existing authorized read-grant endpoint. Responses must contain a short-lived, credential-free HTTPS URL and valid saved file metadata. Links are transient component state, expire automatically, suppress referrers and are checked again before opening; request locking and unmount aborts prevent stale drawer responses. Controls are keyed by exact submission ID. No raw object key/public bucket URL, storage edit or browser persistence is introduced. Own-file scan-attestation failures reuse the declared ASSIGNMENT_FILE_NOT_READY message. Unit tests reject expired/overlong/unsafe grants.

Remaining: registered receipt/file tables, runtime readiness and real scanner attestation still gate both upload and viewing. The prior own-enrolled-learner PG read/denial fixture applies to the parent assignment workspace; actual private-file read/denial and R2/CORS/browser acceptance are still blocked on schema/scanner activation and this sandbox's non-root PostgreSQL restriction. No claim of executed file persistence or DONE parity.

## 2026-10-15 Class Schedule day/week IST correction — PARTIAL

Learner day/week desktop grids, mobile agendas, Today count/highlighting and initial calendar month now use the same IST event-day grouping as the month view and displayed times. The server supplies an explicit calendar-day anchor so a device east or west of India cannot shift it across a month/day boundary. Pure tests execute UTC, Tokyo and Los Angeles device timezone cases and midnight/year boundaries; an own-enrolled-learner persisted class/denial PG test was authored. The shared schedule component retains its existing default for other callers; no Faculty route or other lane file was edited. PG execution and browser/device verification remain open. No DONE claims.


**2026-10-15 chat-5 L17-009 PARTIAL:** Month/week desktop calendar cells display up to two real scoped rounds as labelled chips plus an honest overflow count. The entire day opens its schedule; direct chip-to-drawer action and runtime/mobile/browser parity remain to verify. Pure-model and own-fixture PostgreSQL tests authored; not executed.


**2026-10-15 chat-5 L17-002 PARTIAL:** Agenda now spans 30 days starting from the chosen IST day (not a disguised month mode) and Previous/Next move 30-day windows. Events remain scoped through the existing own-learner PostgreSQL read. Runtime and browser verification outstanding.


**2026-10-15 chat-5 L17-003 PARTIAL:** Month view now shows the precise scoped round totals by kind for its IST month alongside the day grid; no missing job-deadline or college events are fabricated. Unit and own-fixture PostgreSQL cases authored, runtime/browser acceptance outstanding.


**2026-10-15 chat-5 L17-004 PARTIAL:** Mobile Week view now preserves seven daily slots (including explicitly empty dates) instead of skipping unscheduled days. Scheduled items still come from the learner-scoped read. Browser/device and executed test acceptance outstanding.


**2026-10-15 chat-5 L17-005 PARTIAL:** Day mode includes a scoped IST-day timeline summary with real first/last scheduled times, distinct from week/month. Tests authored; execute PG, static and browser acceptance before closing.


**2026-10-15 chat-5 L17-006 PARTIAL:** Previous/Next respect view-specific increments and disable when the resulting date is outside the validated 2000–2100 calendar range, avoiding an invalid URL reset to Today. The Today control remains explicit. Tests authored, browser/runtime acceptance pending.


**2026-10-15 chat-5 L17-014 PARTIAL:** Calendar export now respects the visible validated IST date window and event-kind selector, preserving UTC schedule instants in the .ics payload rather than exporting unrelated months. Sensitive round meeting URLs remain excluded. Unit and own-fixture PG coverage authored; execution and real calendar import remain open.


**2026-10-15 chat-5 L11-002 PARTIAL:** First-run Learner Placements now offers explicit mobile-friendly next steps to review placement rules, browse published drives and open the existing job-preferences editor. It appears only with confirmed empty own application history, never when journey availability is unknown; completion state is not invented. Unit and fresh-learner PG authorization coverage authored; execution/browser/source comparison outstanding.


**2026-10-15 chat-5 L29-010 PARTIAL:** Learner inbox interview actions now require either the generic interview route or a strict UUID application+round pair. Cross-college/user query selectors are stripped; malformed/duplicate selectors fail closed. The interview destination still verifies persisted owned round scope. Pure-model and self-seeded learner PostgreSQL tests authored. Executed static/PG and browser navigation remain outstanding.


**2026-10-15 chat-5 L29-011 PARTIAL:** Personal notification actions now support strict direct links to the persisted application detail and its status-history page, not only the generic Applications drawer. Only UUID IDs survive; user/college selectors and unregistered path suffixes are rejected. Destination rechecks own learner scope. Existing owned-application PG tests expanded; static, PostgreSQL and browser acceptance pending.


**2026-10-15 chat-5 L29-012 PARTIAL:** Learner notifications now canonicalize the course list, persisted delivery detail and course home actions, rejecting malformed delivery IDs and unexpected course paths while removing caller-supplied scope parameters. Existing course delivery routes enforce enrollment and learner membership. New pure-model/own-course PostgreSQL tests authored; runtime and mobile navigation acceptance pending. Course feature files remain under chat-7 ownership.


**2026-10-15 chat-5 L29-013 PARTIAL:** Notification project actions now recognize the own Projects directory and exact project instance UUID with a single permitted legacy tab (including Board and Delivery). Arbitrary tenant/actor selectors are stripped; forged/duplicate tabs and unexpected project URLs fail closed. The destination still enforces learner project-membership access. Unit and independent own-membership PostgreSQL denial evidence authored; project producer-to-inbox and browser verification outstanding. No chat-7 Projects files changed.


**2026-10-15 chat-5 L14-005 PARTIAL:** Applications Recent Activity sorting now uses the saved withdrawn timestamp alongside submission, screening decision and round-result activity, so an actual later withdrawal is not incorrectly sorted by the older submission date. Stable tie breaks and tenant-scoped source remain unchanged. Pure model/own-learner DB denial coverage authored; executed tests and browser Back/Forward acceptance pending.


**2026-10-15 chat-5 L29-018 PARTIAL:** Learner Notifications mobile filter tabs now wrap into a two-column layout rather than requiring horizontal scrolling, expose a concise active-filter/result summary, and constrain long notification text and action links at 375px. Only the learner inbox wrapper changes; other role lists are unaffected. Pure model and own-inbox PG tests authored; device/browser/keyboard execution pending.


**2026-10-15 chat-5 L30-023 PARTIAL:** Learner Profile now makes legacy publications/awards discoverable without inventing a dedicated verified publication entity: it labels saved achievements as possible awards and only explicitly publication-labelled, learner-authored metadata as publications. Full section editors remain the canonical authorship workflow, with no promotion to verified status. Pure model and self-seeded own-profile PostgreSQL role/tenant/suspension tests authored. Exact legacy data entry, storage migration, runtime and mobile/browser parity remain open.


**2026-10-15 chat-5 L30-033 PARTIAL:** Learner Profile on narrow screens now has direct quick links to up to four unfinished, non-sensitive career sections; verified/identity status is not inferred. Profile cards/long names wrap within their grid cells, and collection edit/delete actions use full-width minimum-44px mobile hit targets. Unit and own-profile PostgreSQL access/denial tests authored; 375px, keyboard, dialog resizing and browser/mobile verification pending.


**2026-10-15 chat-5 L15-008 PARTIAL:** Assessment rounds can isolate those without an actionable web employer test URL, including dated rounds lacking a link. Filter uses existing own scoped rounds; no submission status is inferred. Pure model and own-fixture PostgreSQL tests authored; execution and mobile/browser acceptance pending.


**2026-10-15 chat-5 L15-013 PARTIAL:** Clicking an authorized employer assessment URL now opens a confirmation dialog before any external navigation. It explains that leaving LMS is not assessment submission, and a time-critical note comes from the saved round start with an explicit no-official-deadline caveat. HTTP(S) URLs only; no external sending. Pure fixed-clock model and own-fixture PostgreSQL denial tests authored; executed browser focus/window, timezone and producer checks pending.


**2026-10-15 chat-5 L11-004 PARTIAL:** The Placements hero now greets the authenticated learner by a bounded persisted display name only after live membership/user/college validation, otherwise uses a generic greeting without fabricating a name. Authorization revocations remain hard denials, while a noncritical name read failure leaves the dashboard functional. Pure sanitization and own-fixture PostgreSQL success/denial cases authored; browser/source and executed CI still pending.


**2026-10-15 chat-5 L11-011 PARTIAL:** The learner dashboard now shows a true five-stage breakdown sourced only from the current own-learner application/screening journey. Withdrawals are separated before screening; no inferred offer, hire, provider completion, or cross-college data. Failure to load the journey displays Unknown rather than zero. Pure-model and own-fixture PostgreSQL authorization tests authored; CI/device/source parity pending.


**2026-10-15 chat-5 L15-007 PARTIAL:** Assessment due buckets, including Later (after the current IST Monday–Sunday calendar week), now support validated, shareable `?due=` navigation. Back/Forward restores the chosen bucket, unknown/duplicate values are rejected on server, and pure URL model strips untrusted selectors without changing learner scope. Owned TEST-round PostgreSQL/denial tests authored; browser/navigation and CI acceptance pending.


**2026-10-15 chat-5 L15-009 PARTIAL:** The no-date assessment bucket now exposes an explicit, scoped and accessible warning: an absent scheduled round time does NOT prove the provider has no deadline. It also counts missing employer URLs independently rather than conflating link availability with scheduling. UTC/IST round date and link data come from the existing own-learner reader. Pure model and independent own-learner PostgreSQL denial tests authored; real browser/source acceptance pending.


**2026-10-15 chat-5 L15-010 PARTIAL:** The past-scheduled assessment bucket now explicitly separates saved round start times from employer submission, attendance, overdue policy, or completion. A real CTA opens the existing authorized, applied-results workspace rather than treating elapsed time as a failed attempt. Pure fixed-UTC-clock model and own-learner PostgreSQL denial tests authored; browser/source and executed CI still pending.


**2026-10-15 chat-5 L29-005 PARTIAL:** Learner Notifications now highlights up to three genuinely college-pinned, learner-visible announcements with a mobile-wrapping, accessible detail action. Pins are sourced solely from the existing authorized college announcement reader; personal notifications cannot be promoted to a pinned college notice even with a forged client flag. Announcement-read status remains separate from personal receipts, and source failure never fabricates a zero. Pure unit and persisted own-learner authorization/notification tests authored; runtime, announcement-producer and browser checks pending.


**2026-10-15 chat-5 L11-014 PARTIAL (round 4):** Needs Attention preview now preserves true chronological ordering across authorized interview and assessment rounds rather than presenting every later test ahead of an earlier interview. Approved reschedules are the effective schedule, with stable ties and a truthful full-count overflow. Fixed-date pure-model regressions authored. PG/browser/CI execution pending.


**2026-10-15 chat-5 L11-016 PARTIAL (round 4):** The Placement dashboard calendar preview now shows seven contiguous Asia/Kolkata calendar days, including days without events, with two own-scheduled rounds per day and honest overflow. This replaces a misleading rolling-168-hour list that could cover eight local dates around midnight. Approved reschedule UTC instants remain authoritative; date-boundary/leap-year pure tests authored. Browser/PG/runtime checks pending.


**2026-10-15 chat-5 L11-009 PARTIAL (round 4):** When a noncritical dashboard source is unavailable but the learner's published-drive source loaded successfully, the hero exposes a safe Browse Drives fallback without inventing a no-activity or zero-jobs state. When drives themselves fail, the CTA is suppressed instead of promising accessible jobs. No new service/scope bypass. Unit cases for partial failures authored; runtime/browser gate pending.


**2026-10-15 chat-5 L11-006 PARTIAL (round 4):** Dashboard now exposes the nearest actual upcoming assessment as an independent, authorized assessment action, even if the general hero instead promotes an earlier interview or an expiring offer. Approved reschedule and own-learner deep-link selectors are preserved; no scheduled start is called an employer deadline. Fixed-clock model regression authored. Typecheck, PG and browser acceptance pending.


**2026-10-15 chat-5 L11-007 PARTIAL (round 4):** Dashboard now separately offers a direct action to the earliest owned upcoming interview, even if a different assessment or offer owns the primary hero. It uses the current saved/approved interview time and the existing application+round membership-scoped destination; it never infers attended/confirmed outcomes. Fixed-date regression authored; PG/browser acceptance pending.


**2026-10-15 chat-5 L11-008 PARTIAL (round 4):** Placement dashboard now retains an independent chronological Next Scheduled Event card and exact learner-scoped destination. Hero urgency can legitimately prefer an expiring offer or later assessment without hiding the actual next scheduled round. UTC effective reschedule sorting remains authoritative, with explicit unavailable/empty distinction. Pure regression authored; PG/browser verification pending.


**2026-10-15 chat-5 L30-027 PARTIAL (round 4):** Profile social-account deep links now scroll to the exact Social Profiles card, which provides a direct Connect or edit accounts action. The existing confirmed profile editor opens from that card, focuses its LinkedIn entry for this validated deep-link section, and reuses document stale-write/version handling; no OAuth or verification is inferred. Pure-model test for allowed focus targets authored; device focus/browser and PG update acceptance pending.


**2026-10-15 chat-5 L14-010 PARTIAL (round 4):** Learner application cards now expose a truthful Last Recorded Activity timestamp drawn from saved submission, withdrawal, screening decision and applied result times, plus a direct saved status-history link for a validated application UUID. This adds discoverable per-application context without exposing reviewer/audit reasons or fabricating a provider outcome. Unit and new own-fixture PG/role/tenant tests authored; browser and runtime verification pending.


**2026-10-15 chat-5 L11-010 PARTIAL (round 5):** Published-drives snapshot distinguishes unique non-expired drives from actionable role options and counts currently not-open-to-apply drives without double-counting multi-role jobs. A nonexpired drive is not falsely labeled eligible for every learner; the published row reader remains own-membership scoped. Fixed-unit duplicate/deadline cases authored. CI/browser gate outstanding.


**2026-10-15 chat-5 L11-012 PARTIAL (round 5):** Interview snapshot distinguishes all future authorized scheduled interview/GD rounds from those in the next seven Asia/Kolkata calendar dates. It respects approved reschedules and never calls schedules confirmed attendance. Fixed-clock unit regression authored; executable PG, lint and browser checks pending.


**2026-10-15 chat-5 L11-013 PARTIAL (round 5):** Upcoming-assessments card differentiates all future authorized TEST/VENDOR_TEST schedules from assessments in the next seven IST calendar dates, reusing approved reschedule instants. The metric does not claim employer submission or a provider deadline. Fixed-clock unit regression authored; PG, lint and browser checks pending.


**2026-10-15 chat-5 L12-006 PARTIAL (round 5):** Deadline-first learner drive sorting now places published, not-expired and parseable upcoming deadlines ahead of expired and malformed/missing deadlines, while preserving explicit closed and eligibility filters. This uses the existing learner-scoped published-drive dataset and does not turn a missing provider deadline into urgency. Pure regression for closed/malformed/valid tie cases authored; CI/mobile/PG gate pending.


**2026-10-15 chat-5 L14-007 PARTIAL (round 5):** Learner Applications' Company A–Z sort now uses stable case-insensitive natural ordering (e.g., Company 2 before Company 10), breaks ties by role then application ID, and never mutates the own scoped input. Real application screening/status filters remain unchanged. Pure-model regression authored; CI/browser/PG acceptance pending.


**2026-10-15 chat-5 L12-008 PARTIAL (round 5):** Highest-CTC learner Drives sorting now computes an actual highest valid disclosed min/max annual pay among registered own-visible role options. Missing, negative, or nonfinite compensation never ranks above known valid salary; ties stay deterministic and no pay amount is inferred for incomplete employer data. Pure model regression authored; PG/browser acceptance pending.


**2026-10-15 chat-5 L29-014 PARTIAL (round 5):** Learner Notifications now shows responsive route loading skeletons for independent personal-inbox and college-announcement sources, keeping filter controls noninteractive until their actual scoped data arrives. Accessible loading text does not fabricate a zero inbox, announcement count or unread receipts. Static-section regression authored; hydrated screen-reader/browser acceptance pending.


**2026-10-15 chat-5 L11-019 PARTIAL (round 5):** Every learner placement dashboard numeric card now explicitly distinguishes an authorized successful zero from a failed source as the word Unknown, with a source-specific accessible action/description to open its own list and retry. Screen readers no longer hear only a dash or falsely imply no records. Pure zero/null/positive state regressions authored; CI/PG/browser acceptance still open.


**2026-10-15 chat-5 L12-002 PARTIAL (round 6):** Drives browser explicitly summarizes all owned-visible published drives separately from their role-option count and distinct drives with actual recorded learner applications. This avoids presenting role rows as a drive count; filters still apply to the role list below. Model regression for multi-role duplicate applications authored; CI/mobile/PG acceptance pending.


**2026-10-15 chat-5 L12-009 PARTIAL (round 6):** Drives employment-type filter options now show actual own-visible role-option counts from the same authorized browse rows, distinguishing multiple options at one employer from a separate drive. No extra people/employer query or inferred type; zero/missing types are not advertised. Unit regression authored; filter-navigation/mobile and PG acceptance pending.


**2026-10-15 chat-5 L12-010 PARTIAL (round 6):** Drive location facets now trim and case-deduplicate the locations provided by own-authorized role records. Selecting one location matches all registered role locations case-insensitively, including multi-location roles, without creating new location guesses or changing eligibility. Pure regression authored; browser/PG/runtime acceptance pending.


**2026-10-15 chat-5 L12-011 PARTIAL (round 6):** Eligible-only Drives filtering now requires both the learner's persisted canApply signal and a non-closed deadline state, preventing stale-positive role eligibility from displaying genuinely expired drives as actionable. This is a defensive client browse guard; the server remains authoritative for application actions. Pure regression authored; executed CI/PG and browser acceptance pending.


**2026-10-15 chat-5 L12-015 PARTIAL (round 6):** Learner Drives pagination now uses a single bounded page-state model for slice indices, result labels and Previous/Next. Stale URL pages after filters clamp to the final valid page with an explicit recovery action, never displaying a false empty list while authorized matching records exist. Pure boundary/zero tests authored; mobile/browser/history and PG acceptance pending.


**2026-10-15 chat-5 L14-004 PARTIAL (round 6):** All/In Progress/Final Recorded Status learner application views now show counts from the same own-authorized application history and explain exactly that rejected/withdrawn are final saved statuses. Shortlists, applied round results, and interview scheduling are not mislabeled hired/offer-completed. Read-side unit cases added, URL state/role scope retained; browser/PG gate pending.


**2026-10-15 chat-5 L14-023 PARTIAL (round 6):** Learner Applications now distinguishes a true first-run zero-record history from a filtered zero-match view using a dedicated deterministic empty-state model. First run links to authorized published Drives; only a filtered mismatch offers reset. No missing source is converted to an empty account (server read failures remain errors). Pure-model regression authored; PG/browser/mobile acceptance outstanding.


**2026-10-15 chat-5 L13-011 PARTIAL (round 6):** Authorized published drive detail now presents a per-role Registration and Evidence Requirements summary based solely on already-returned college eligibility checks, with pass/fail/missing counts and rules/profile routes. Since no independent registration/consent record is read, the UI explicitly says that this evidence checklist cannot certify placement-cell registration. A pure per-role test is authored; actual registration domain parity, browser/PG/CI acceptance remain open.


## 2026-10-15 chat-5 next learner/public parity batch — PARTIAL

- **Profile Verification (PARTIAL):** `/learn/profile/verification` now reads the two persisted DB04 rows for the currently active, DB-rechecked Learner membership via the existing profile self-access service. It renders WAITING / SENT_BACK (own reason only) / VERIFIED / UPDATE_PENDING / NOT_SUBMITTED without exposing snapshots or document object keys. A Profile card and Placement Rules link lead here. **Remaining:** document-generation-verified secure resubmit/upload, direct request/response flow, independent PG denial fixtures, rendered/mobile verification.
- **Coding platform profile (PARTIAL):** own learner Profile displays the saved GitHub social URL only when it normalizes to the expected HTTPS GitHub host; other coding platforms do not yet have a registered learner-authored producer/editor. **Remaining:** coding-platform fields, trusted write controls and cross-role visibility settings.
- **Announcements (PARTIAL):** Learner Placement navigation now links to read-only announcements, with a pinned-only filter over previously scoped rows and explicit caveat that DB10 college notices can include general messages rather than a placement-only TPO publisher. Placement Cell also links directly to notices. **Remaining:** dedicated placement announcement classification, per-learner read status, TPO audience source, PG/mobile acceptance.
- **Offers and applications (PARTIAL):** All Offers is directly reachable in the placement tabs; still-issued offers expiring within 24 hours show a count from persisted dates in the selected view. Applications page now differentiates actual SUBMITTED and WITHDRAWN record counts without calling screening/hire outcomes application statuses. **Remaining:** live browser and persisted-scope PG gates, final legacy card/action coverage.
- **Navigation (PARTIAL):** placement workspace tabs wrap at narrow widths rather than scrolling horizontally; Placement Cell offers direct access to registered own notification preferences. **Remaining:** verified 375px touch and keyboard acceptance.
- **Public /placements, joins and unsubscribe:** no new completion claim. Previously created public pages remain PARTIAL or disabled where token-backed verification, public count publication, and outbound delivery require further integration; signed unsubscribe POST on main is separately implemented by the messaging lane.


## 2026-10-15 chat-5 public + learner continuation (PARTIAL; 10 feature commits plus review fix)

- **Public /placements (PARTIAL):** proposed `placement_public_page_settings` table and SQL live only under `src/modules/placements/public-page/staged-schema.ts` and `docs/proposed-migrations/placement-public-page.sql`. The unauthenticated page now calls a guarded `to_regclass` reader, requires a verified college host, active organization/college, explicit enabled flag and publication timestamp, and suppresses both source counts and cohorts smaller than five. Offers/employers may legitimately exceed unique students and are independently suppressed. No live counts until the owner registers the migration and creates an audited staff publication producer; no claim of published data.
- **Recruit from us (PARTIAL/BLOCKED):** staged college-scoped public enquiry + email challenge schema and proposed migration only; no work-email capture or code transmission is active. A future POST must enforce same-origin, Zod, persistent rate limits, non-prod test allowlist and recipient validation through `src/modules/messaging`. Never suggest the existing informational page has an operational form.
- **College/company join (PARTIAL/BLOCKED):** hashed/expiring/revocable college and company link schemas with migration proposal, table-existence checks, precise scope and active college/organization checks. Public GET now previews only verified live links. Company-domain checks prohibit unrelated work-email domains. No email-code POST, ALREADY_JOINED disclosure, company relationship trust grant, or membership creation has been enabled. A preview does not grant access; it returns unavailable before migration registration.
- **Learner coding-profile links (PARTIAL):** own saved profile now shows strict HTTPS GitHub/LeetCode/CodeChef/Codeforces/HackerRank links, using GitHub social data and exact URL-typed profile metadata keys for other platforms; unsafe hosts and text entries are discarded. The existing profile metadata editor is the authoring surface. These are not verified employer-facing platform identities.
- **Learner Education/Identity resubmit (PARTIAL):** new same-origin strict-Zod `POST /api/profile-verification/self` calls `submitOwnVerification` with the existing PostgreSQL locking/version writer and **actual private R2 object-generation + privileged malware attestation** verifier. A stale version, wrong role, missing/unclean documents or no changed update fails closed. The status page now exposes submission/resubmission buttons only in the allowed profile states, with retry/error feedback. No new public evidence URLs or storage permissions. **Remaining:** in-test-fixture PostgreSQL/role/foreign-scope/stale-version run, configured R2 evidence lifecycle and accessible 375px browser verification.
- **Source-only checks:** unit cases authored for publication and privacy, join scope/domain, saved coding links and verification submission transitions. CI, typecheck, lint, PG and device browser gates were not executed in this chat. Public routes and join activation remain MISSING-equivalent at the functional user-job level, regardless of scaffolding.


## 2026-10-15 chat-5 additional learner and public parity (PARTIAL)

- **Public /placements reporting (PARTIAL):** the existing opted-in, scoped aggregate read now suppresses future-dated or older-than-366-day publications, and displays an explicit source publication date only when a non-suppressed count exists. Counts below five and unregistered-table reads remain suppressed; no learner or employer PII appears. Proposed public-statistics migration and owner-supplied publication producer are still pending, so no live figures are claimed. Unit date-boundary and suppression checks authored, execution pending.
- **Learner placement announcements (PARTIAL):** registered own-user PLACEMENTS activity notifications are now separately displayed beneath college notices with an explicit personal-notice distinction. A strict-Zod URL-filtered unread-only view fetches at most 20 matching own-user, own-college placement notifications; the service also validates every supplied limit at 1–50. The college notice pinned filter remains independent, and neither source is presented as a dedicated official TPO placement-only publisher. Browser, PostgreSQL tenant isolation, and paging beyond 20 remain open.
- **Profile verification (PARTIAL):** own active learner verified read now includes stored submission/review timestamps and only purpose/count/scan-state summaries of private document receipts, excluding revoked or expired items. The UI distinguishes clean scanner receipts from approved verified documents, and shows historical review times and current status without submitted snapshots or storage keys. A signed-link view, receipt-generation HEAD validation and reviewer acceptance remain separately enforced by storage/verification services; scanner clean metadata alone is never treated as proof of ownership or approval. DB fixture, denied-role, stale-version, private-storage lifecycle and 375px/browser acceptance remain open.
- **Offers (PARTIAL):** the already scoped all-offers page adds a direct route to existing pending-response offers when the recorded issued-offer expiry is within 24 hours. Accepted, withdrawn, already expired, or missing-deadline offers are not included. Action authorization remains with the existing server POST and is not inferred from a dashboard badge. Executed unit/integration/browser acceptance remains open.
- **No silent closure claim:** none of these features change the unresolved section-8 public work-email joins, operational recruiter enquiry form, code delivery, ALREADY_JOINED grant, or dedicated placement publication, and no row in `docs/planning/account-surface-parity.md` is modified.


## 2026-10-15 chat-5 next pass — learner offers, notices, public unsubscribe (PARTIAL)

- **All Offers (PARTIAL; L14/L18):** The existing own-membership offer reader now feeds an 80-character-bounded employer/role/job search, a strictly persisted still-ISSUED upcoming-seven-day expiry filter, 15-item page-state with stale-page clamping, and priority/newest/company ordering applied before pagination. The offer actions component retains the authorized server-selected row order. Status, search, due and sorting choices survive status/deadline navigation; changing filters intentionally resets stale pages. The urgent within-24h count is computed from the same *visible* selected offers, not a hidden unfiltered set. No new offer or joining state is inferred. Pure regressions authored; browser, real PostgreSQL fixtures, and responsive acceptance remain outstanding.
- **Learner placement announcements (PARTIAL; section 8):** The authorized college notice reader now permits a max-100-character case-insensitive title/body search, a request-clock thirty-day recent filter (excluding future/invalid dates), and 15-item paging over the *already loaded* authorized feed. Pinned, personal-unread, search and recency controls compose and preserve safe URL query state; result text explicitly identifies loaded notices rather than claiming a complete all-time database total. These are still college announcements plus separate own placement alerts, not an official TPO placement-only publishing/read-receipt source. Source paging, dedicated notice producer, real PG denials, and browser proof remain open.
- **Learner Education/Identity verification (PARTIAL; L30):** Strict response-aware client feedback now distinguishes stale optimistic versions, unchanged evidence and incomplete private documentation. The stale/unchanged response disables repeat posting until the user refreshes; version-keyed UI remounts with the new server record. No private object URLs or reviewer-only details are included. Real storage/PG and accessible browser verification remain open.
- **Public campaign unsubscribe (PARTIAL, section 8 legacy delta):** A read-only server helper now checks the signed expiring token for the page without render-time `Date.now()` or `eslint-disable`. The existing authenticated-scope-independent same-origin POST remains the **only** suppression writer; opening GET does not unsubscribe. The route is not reclassified DONE here without executed integration and browser verification.
- **Other section 8 public MISSING rows unchanged:** Public recruiter enquiry and college/company work-email code joins still require owner-registered staged migrations, delivery through the shared messaging module and rate-limited verification/grant endpoints. A public preview or editor alone is not closure. No `docs/planning/account-surface-parity.md` status was modified.
- **Verification limitations:** All new unit tests are authored, not executed in this connector-only lane. No claim of runtime typecheck, ESLint, PostgreSQL, browser/mobile or migration acceptance.


## 2026-10-15 chat-5 brief continuation — learner offers, notices and profile (PARTIAL)

- **Oracle freshness:** This batch observed legacy FE `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2` and BE `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, with vNext base `c0f9c23c00c5e73666bca6aefd31f16f5e24bd41`. The legacy `NotificationsContent.jsx` and `PlacementCellContent.js` were inspected for notifications/placement user jobs, but this was not a complete current-oracle source + mobile/browser family audit. No ledger row or family is newly CLOSED.
- **L18 offers (PARTIAL):** expiry boundary now consistently treats exact recorded expiration as no longer actionable in the response timing and priority sorter. The authorized all-offers workspace exposes explicit persisted LOI/OFFER document-type filtering and a separately persisted JOINED-only outcome filter without inferring joining from offer acceptance. URL state preserves search, sort, kind and joining filters. New strict page validation rejects query duplicates, numeric aliases and noncanonical coercions. Server offer response permissions remain unchanged. Execute unit, PostgreSQL role/college/stale-action, expiry browser and mobile tests before closure.
- **L18/L29 notices (PARTIAL):** scoped DB10 college announcements show safe persisted sender and audience labels (including TPO only when actual senderType is TPO), and support pinned/newest/oldest sort over the authorized capped feed. The Placements dashboard offers a read-only, at-most-three-notice preview behind existing active learner membership, central placements.read and DB10 readiness; on source failure it does not present a false zero. The announcements page independently tolerates non-authorization failures of personal placement alerts while preserving college notices and continues to throw AuthorizationError for non-leaking denial. This is not a new TPO placement-only producer nor a durable per-learner college-notice read receipt; upstream workflow/PG/mobile acceptance remains open.
- **L30 profile coding links (PARTIAL):** the learner's own saved coding platform metadata viewer ignores spoofed duplicate host entries when a later matching platform URL is valid, always using the existing exact HTTPS host normalization. No external account ownership verification or recruiter-side filter is implied.
- **Tests/closure:** focused pure unit regressions were authored for each of the 11 implemented items (plus a correction for the normalizer's canonical trailing-slash behavior) and committed individually, but no disposable PostgreSQL, full TypeScript/lint, CI, desktop/mobile or cross-role acceptance was executed here. `CLOSED` remains inappropriate. Section 8 public joins, recruiter enquiry and official placement-only publishing remain unresolved. No new tables, migrations, permissions, APIs or mutation handlers were introduced by this batch.


## 2026-10-15 chat-7 course thumbnail read path (PARTIAL; L1-021)

Learner Course cards now read the existing verified-gated authored thumbnail via the already-authorized course list, validating an HTTPS URL and using the bundled fallback for unavailable/invalid records. The `DB05_COURSE_DISPLAY_READY` gate remains disabled until registered migration acceptance; no new schema was introduced. L1-021 remains GAP until a real authored thumbnail is persisted, fetched and browser-compared with the legacy card on desktop and mobile.

**Chat-7 course-search correction (2026-10-15):** overlong pasted queries retain their normalized first 100 characters instead of silently returning every Course; the UI now caps input at 100. Pure tests authored; browser/CI proof outstanding.

**Chat-7 semester selection correction (2026-10-15):** initial/stale Course filters prefer the latest term with an active authorized Learner course; if none remains active, the newest accessible historical term is selected. No client-clock inference. Unit tests authored, browser proof pending.

**Chat-7 progress display correction (2026-10-15):** a non-finite upstream completion percentage is now shown as unavailable instead of `NaN%`; valid values are bounded to 0–100. Unit tests authored; runtime acceptance pending.

**Chat-7 assignment attention (2026-10-15):** active Course cards now call out the count of published overdue but still-unsubmitted assignments, keeping overdue items out of the future-only Next due slot. Past-semester cards remain read-only. No invented attempt or grade state. Unit tests authored; browser proof pending.

**Chat-7 Course time display (2026-10-15):** Overview activity and Learning Path class/assessment timestamps use one fixed Asia/Kolkata formatter; invalid timestamps are hidden rather than printed as authoritative schedules. Pure tests authored; mobile/timezone browser acceptance pending.

**Chat-7 discussion timestamp clarity (2026-10-15):** all Learner Course discussion timestamps now show year and IST timezone and fail to `Time unavailable` for malformed stored dates, avoiding client-local discrepancies. Pure tests authored; desktop/mobile browser acceptance still open.

**Chat-7 Learning Path percentage truth (2026-10-15):** a published path with no trackable items shows `Not measured` rather than a fabricated 0%; tracked zero remains 0%. Non-finite metrics also fail closed. Pure tests authored; mobile/CI/browser evidence still pending (L3-002).

**Chat-7 Learning Path compact-item dialog (2026-10-15; L3-037 PARTIAL):** published content, assignment and quiz rows now show compact summaries opening native, keyboard-dismissable, focus-contained dialogs. The existing authorized actions/players mount only while opened; exact lesson/item deep links auto-open the corresponding dialog. The family remains PARTIAL until side-by-side legacy-modal, mobile/keyboard and actual interaction-regression verification.

**Chat-7 standalone quiz deadline display (2026-10-15):** quiz-attempt deadline labels use the persisted instant in Asia/Kolkata (including midnight crossing) and distinguish missing from malformed deadline data. Server submission fencing remains unchanged. Unit tests authored; mobile/browser/clock-edge acceptance still pending.

**Chat-7 round 2 / Course Home overdue next action (PARTIAL):** unsubmitted published assignments with past due dates are now offered as the first actionable Course Home step with an explicit late-submission notice and exact lesson/item link. Future-only update feed remains chronological. Model tests authored; saved data, legacy visual and browser parity still required.

**Chat-7 round 2 / Learning Path deep links (PARTIAL; L3-006/037):** an exact learner-authorized lesson/item focus now selects its own resource/lecture/assessment/live filter even if the copied URL carried an incompatible filter. Missing/forged item IDs never reveal other lessons. Pure regressions authored; browser Back/Forward and modal verification remain.

**Chat-7 round 2 / Quiz deadline fail-closed policy:** both initial quiz load and live attempt availability now reuse the same deadline guard as final confirmed submission. Malformed deadlines cannot expose an actionable attempt, and exact equality remains allowed. Unit regressions authored; PostgreSQL and real-clock browser verification pending.

**Chat-7 round 2 / Quiz deadline clock:** the attempt now refreshes once per second in the last 60 seconds, every five seconds within ten minutes and every thirty seconds otherwise. The server remains final authority; client controls now catch deadlines without the previous 30-second lag. Unit tests authored, browser timing proof pending.

**Chat-7 round 2 / Aggregate assessment quick states (PARTIAL; L6/L7):** All Assignments/All Quizzes expose count-backed, keyboard-accessible one-tap Needs action, Due soon, Overdue/missed and Published results filters. Counts share the existing persisted-state policy and don't expose unpublished scores. Models and unit cases authored; browser/PG parity remains open.

**Chat-7 round 2 / Course card overdue navigation (PARTIAL):** active Course cards now deep-link to the earliest real overdue unsubmitted assignment under the exact learner-authorized lesson; destination UUIDs are validated by the existing guarded link model. Submitted and historical work cannot present an action. Unit model cases authored; runtime/browser acceptance pending.

**Chat-7 round 2 / Empty published Learning Paths (PARTIAL):** the learner workspace now distinguishes published paths without lessons, published lesson shells without available items and unpublished paths, without inventing progress. Pure tests authored; mobile/browser parity remains pending.

**Chat-7 round 2 / Attendance month recovery (PARTIAL; L10):** while browsing another month, Learner Attendance now provides a one-tap This month action that preserves the currently authorized Course and history preferences, using the server-supplied IST month rather than browser-local guesses. Model tests authored; URL/Back-Forward and browser acceptance pending.

**Chat-7 round 2 / Quiz question-index accessibility (PARTIAL; L8):** question navigation now exposes exact active-step semantics and answered/unanswered accessible labels, with 44px touch targets on mobile. Status reflects only the local selections, not correctness. Pure tests authored; keyboard/screen-reader/browser acceptance still pending.

**Chat-7 round 2 / Quiz empty-question resilience (PARTIAL; L8):** an authorized quiz with no available questions now shows an explicit non-attemptable explanation and route back to All Quizzes rather than misreporting an unattempted closing status. Real question submission and result visibility rules remain unchanged. Pure test authored; browser/DB verification pending.

**Chat-7 follow-up / Learner external resource links (L3 PARTIAL):** published course resource and live-session links now allow only absolute HTTP(S) URLs without embedded credentials or oversized input; invalid legacy values show a warning rather than becoming executable links. No new reads, writes, or authorization bypass. Pure tests authored; browser and producer acceptance outstanding.

**Chat-7 follow-up / Course Home actionable heading (L2-011 PARTIAL):** persisted overdue assignment actions are labeled `Overdue assignment` rather than `Due soon`, and historical Course Home announces past-semester read-only status. Pure unit assertions authored; browser verification outstanding.

**Chat-7 follow-up / historical and missed Course Home states (L2-011 PARTIAL):** prior-semester Course Home never proposes actionable next-item links; when closed quizzes were missed, the summary does not claim all work completed. Unit regressions authored; browser/role acceptance pending.

**Chat-7 follow-up / Course-card timestamp resilience (L1 PARTIAL):** malformed persisted activity or due timestamps no longer throw during Learner Course-card render; legitimate dates are shown in IST. Model regression authored; browser and integration evidence open.

**Chat-7 follow-up / Course-card progress bounds (L1-012 PARTIAL verification):** Learner Course progress labels and aria-valuenow now use one guarded measured-percent projection; empty paths remain unmeasured, corrupt/non-finite values never render into progressbar ARIA or CSS. Pure tests authored; executed/browser evidence pending.

**Chat-7 follow-up / Course Attendance IST month and timestamps (L4-015/018 PARTIAL):** server-provided default month and recorded session grouping now use Asia/Kolkata, including sessions crossing midnight UTC; mobile and desktop attendance date/time labels follow the same zone. No status mutation, external storage or new query. Pure timezone-boundary tests authored; responsive/browser verification pending.

**Chat-7 follow-up / Course Attendance exact status and threshold (L4 PARTIAL):** `Absent` now counts only sessions explicitly marked ABSENT, with Late/Medical/Excused disclosed separately. Threshold badges use exact present-to-marked counts rather than rounded percentages, while unmarked/future sessions remain excluded. No attendance writes; pure tests authored, DB/browser acceptance open.

**Chat-7 follow-up / Aggregate Assignments and Quizzes date resilience (L6/L7 PARTIAL):** malformed persisted creation/deadline strings display `Date unavailable` rather than an untrusted raw value or crashing the list, while null deadlines remain `No deadline`. Same date renderer covers assignment detail drawer and quiz list. Unit tests authored; responsive browser proof outstanding.

**Chat-7 follow-up / Course Attendance current-month navigation (L4 PARTIAL):** learners can return to the server-derived IST current month from historical attendance without losing the own Course delivery or mutating attendance. Unit regression authored; mobile/browser acceptance open.

**Chat-7 follow-up / latest quiz-attempt review (L8 PARTIAL):** the standalone quiz review selects the largest persisted attempt number, not whatever array element happens to be last, preventing stale reordering from showing earlier results. Pure regression authored; PG/browser acceptance pending.

**2026-10-15 chat-7 next round (L2-011 FIXED source, acceptance open):** Course Home no longer reports a no-deadline incomplete Course as 'Course work complete'. It distinguishes real persisted `itemsCompleted` from `itemsTotal`; no item status is guessed. Focused regression authored, browser/PostgreSQL acceptance pending.

**L2-016 (source fix, unverified):** Course Home upcoming quiz actions exclude persisted missed/completed quizzes, validate actual finite due instants and retain only the authorized next-14-day window. Pure regression authored; producer/consumer and browser acceptance open.

**L1 next-due attention (source FIXED, proof open):** missed/completed quizzes and invalid timestamps no longer leak into actionable Course-card due dates. No new read or mutation. Pure regressions authored; runtime/browser verification pending.

**L5 discussion post duplicate guard (source FIXED, proof open):** a synchronous per-mounted-composer lock now prevents double-Enter/double-click races before React applies posting state; read-only/historical composer never starts a POST. Central server permissions unchanged. Regression authored, browser/PG execution pending.

**L5 discussion delivery-change isolation (source FIXED, proof open):** authorized delivery changes remount the discussion component, clearing the prior college-course's client messages, paging cursors and unsent reply state. Full read authorization remains in the server route. Unit test authored; cross-course browser replay and privacy acceptance pending.

**L8 review availability (source FIXED, proof open):** if a published quiz has no currently available question details but its own previously submitted attempt exists, the review preserves the saved-attempt explanation rather than saying the learner never started a quiz. No grades or answers are invented. Pure regression authored; browser/DB verification pending.

**L4 Attendance record badge parity (source FIXED, proof open):** medical/excused statuses no longer display the same error styling as explicitly absent sessions; late remains warning and unrecognized values are neutral. Persisted counts and policy are unchanged. Focused unit test authored; browser/legacy comparison pending.

**L11 Profile remove guard (source FIXED, proof open):** removing a saved career-profile entry requires explicit confirmation and a still-existing saved ID, preventing silent data loss and no-op section overwrites. This is a documented safety correction. Unit regression authored; browser and PostgreSQL acceptance open.

**L2 next-action headline truth (source FIXED, acceptance open):** Course Home now displays `In progress` for uncompleted tracked items without an upcoming timestamp and `Attention` for missed items; `All clear` requires an actual completed denominator. No inferred grades or deadlines. Unit regressions authored; browser and producer verification pending.

**L5 discussion create capability fail-closed (source FIXED, proof open):** the composer stays read-only until a successful same-delivery GET explicitly returns `canPost: true`; missing/failed capability responses cannot default to permission. POST still independently enforces same-origin and persisted membership. Unit test authored; historical/browser denial acceptance pending.

**Chat-7 follow-up / L5 pinned discussion visibility (FIXED source; unverified):** the already-authorized GET response now includes the server's delivery-scoped highlighted pinned message even when outside the newest 60-message page. No extra data read, cache remains private/no-store. Regression authored; DB/browser oracle verification pending.

**Chat-7 follow-up / L5 discussion composer parity (FIXED source; unverified):** the same exported 3,900-character limit now governs the server's Zod boundary and the learner's visible input cap, counter, and Post validation. Overlimit/blank payloads fail closed; authorizations unchanged. Boundary tests authored; execution/browser pending.

**Chat-7 follow-up / L5 polling response order (FIXED source; unverified):** Discussion GET responses now carry a local request generation; stale/failed older requests cannot overwrite a newer authorized feed, permission flag, or error state. This is per-component only; no cross-delivery cache. Unit regression authored; browser network-throttling proof pending.

**Chat-7 follow-up / L5 discussion history request gate (PARTIAL):** a synchronous in-flight guard prevents duplicate `Load earlier` clicks from replaying the same cursor, releases after errors for retry, and latest refresh now clears the initial skeleton even if the first slow request was superseded by polling. Pure regression authored; browser concurrency and PostgreSQL evidence outstanding.

**Chat-7 follow-up / L6-L7 aggregate attention course scope (PARTIAL):** selecting an already-authorized Course now scopes the visible total, submitted/attempted, Needs action, Due soon, Overdue, and Results counters to that Course; All courses retains global totals. No extra data read or authorization change. Regression authored; mobile/browser evidence pending.

**Chat-7 follow-up / L2 Course Home mixed outcomes (PARTIAL):** when a missed quiz coexists with a real next authorized task, the learner sees a `Continue learning` completion summary, not a false `No remaining actionable items` conclusion. The stored missed quiz remains disclosed; no expiry policy changed. Unit regression authored; live state and browser proof open.

**Chat-7 follow-up / L11 saved Profile collection mutation controls (PARTIAL):** Add/Edit/Delete are disabled during an existing profile or contact save, and the handlers check the same guard before destructive mutation to limit stale full-section overwrites. Confirmation remains required. Unit model authored; concurrency/browser/PG proof pending.

**Chat-7 follow-up / L3-006/037 Learning Path item deep-link navigation (PARTIAL):** focused modal keys now incorporate authorized lesson/item and focus state, so in-app navigation between deep-linked items remounts the correct dialog instead of preserving a stale useState(initiallyOpen) modal. No additional content reads or permission changes. Unit model authored; Escape/focus/browser proof pending.

**Chat-7 follow-up / L6-L7 created-date sorting (PARTIAL):** invalid published-creation timestamps now sort after all valid dates, including historical pre-1970 entries, rather than masquerading as a legitimate 1970 timestamp. The authoritative assessment list remains scoped at service load. Unit regression authored; live list/browser proof pending.

**Chat-7 follow-up / L8 quiz question-index answer integrity (PARTIAL):** the question-index accessible label and answered badge now count only option IDs still present in that learner-authorized question, matching answer-progress policy. Stale/deleted option IDs are not represented as answered. Pure unit regression authored; browser/PG proof pending.

**2026-10-15 chat-5 scoped hardening (FIXED source, not final parity closure):**
Learner drive URL filters recover independently and strip malformed/duplicate/untrusted
facets on read and navigation; drive cards use safe persisted deadline labels; application
and dashboard dates fail safe. Application/offer CSV downloads are capped at 1,000 rows
with an explicit on-page truncation notice. Offer sorts handle malformed persisted time
without placing corrupted expiry first as actionable. Drive availability chips count
unique drives rather than role options. The issued-offer page now explicitly identifies
past-deadline ISSUED offers without granting response rights. Tests are authored with
these commits; complete lint/typecheck, isolated PostgreSQL, responsive browser,
legacy-oracle and cross-role acceptance are still required. No master-matrix DONE or
Learner ledger CLOSED status is claimed from these changes.


**2026-10-15 chat-7 learner Courses/Assignments/Quizzes incremental round (PARTIAL; not release-accepted):** After synchronizing current main into chat-7 without discarding its unique learner fixes, this batch adds ten source fixes: missed or closed Quiz cards no longer promise unpublished answer keys; zero remaining attempts disable Start Quiz; malformed deadline metadata fails closed; Course-scoped aggregate assessment count reflects the authorized selected Course; overdue-only current Courses remain in Continue learning; optional due-date sorting surfaces still-actionable overdue work ahead of future due dates within the legacy regular/elective grouping; failed HTTPS Course thumbnail requests fall back to the bundled image; Course Home distinguishes unpublished Learning Paths from actionable published work; exhausted published Quiz attempts offer View Result only when results were released; and All Assignments/Quizzes announces the actually rendered pagination window rather than all filtered records. All changes remain within existing authorized reads and established quiz/submission policies, with no new database migration or external call. Targeted unit regressions were authored/updated but **not executed** in this connector-only round. Relevant ledger gaps (especially L1 image, L2 overview, L3 roadmap, L6/L7 aggregate assessment and L8 quiz state) remain FIXED/PARTIAL/GAP as previously recorded; no row or family is newly CLOSED/VERIFIED. Current observed legacy oracle heads: FE `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`, BE `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`; source comparison, proper upstream producer/store registration, PostgreSQL negative-path execution, TypeScript/lint/unit suite, desktop/mobile browser and final legacy-delta review remain required.


**2026-10-15 chat-7 follow-up — learner Courses/Attendance/Profile/Assessments (PARTIAL; no family sign-off):** Eleven separately pushed learner changes strengthen: (1) truthful Course-card next-step labels when tracked work is unfinished/missed; (2) bounded Learning Path previews even with invalid limits; (3) timezone-independent Attendance month controls; (4) malformed Attendance timestamps sorting last instead of masquerading as 1970; (5) non-disclosing Attendance deep-link recovery for missing/invalid Course/month/status/order; (6) specific aggregate Assignment/Quiz filtered-empty messages; (7) invalid Profile section deep-link explanations; (8) invalid Learning Path filter explanations; (9) Course thumbnail state reset when authored image URL changes; (10) truthful Learning Path incomplete/missed header rather than premature completion; and (11) Assignment drawer dismissed when a newly filtered result set no longer contains that own item. Scope remains existing authorized learner reads, and no registered schema, storage ACL, publication or submission policy was changed. Each feature includes a focused Vitest regression authored in the same implementation commit, **not executed** here. Legacy observed FE `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`, BE `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`. L1/L2/L3/L4/L6/L7/L10/L30 remain PARTIAL/FIXED/GAP as separately recorded, not CLOSED; family freshness, actual TS/ESLint/Vitest execution, PostgreSQL role/tenant tests where relevant, real course display/migration gates, responsive desktop/mobile and oracle browser acceptance are still required.
**2026-10-15 chat-5 parity hardening — offer expiry (PARTIAL):** confirmation preview now denies at the exact persisted expiry instant and on invalid server clocks, matching the protected offer-action deadline. Regression authored; runtime/browser/PG acceptance remains open.

**2026-10-15 chat-5 parity hardening — offers history (PARTIAL):** own-offer browse dates now fail closed to a stable bottom-of-list ordering rather than a NaN comparator. No offer status or authorization semantics were changed; history/date browser evidence still pending.

**2026-10-15 chat-5 parity hardening — applications date order (PARTIAL):** oldest-submitted filtering now consistently puts malformed stored dates after known submissions with a deterministic application-ID tie-break. Authorization/source queries remain unchanged; large-list browser acceptance is still required.

**2026-10-15 chat-5 parity hardening — L14 application stage (PARTIAL):** a stage no longer present among the learner's own persisted applications is explicitly identified and falls back to all stages without discarding other search/view/sort facets. Browser Back/Forward and source-query acceptance pending.

**2026-10-15 chat-5 parity hardening — L29 inbox pinned preview (PARTIAL):** pinned college announcements now obey the selected domain, search and unread-personal filters, so the Job/Unread tabs no longer display unrelated announcement cards above filtered results. No read-state mutation is inferred; mobile/browser verification outstanding.

**2026-10-15 chat-5 parity hardening — L29 notification empties (PARTIAL):** when a loaded learner inbox has records but the selected category/unread/search has none, the empty state no longer incorrectly says no notifications have arrived. Full-history paging and responsive proof remain pending.

**2026-10-15 chat-5 parity hardening — L18/L29 college notice empties (PARTIAL):** a genuine absence of membership-visible notices, search mismatch, pinned filter and thirty-day filter now use distinct messages. This does not conflate personal placement alerts with official TPO notices; browser/source-page verification remains open.

**2026-10-15 chat-5 parity hardening — L18 offer status filters (PARTIAL):** the historical ISSUED tab is now labelled to require deadline review rather than implying that every issued (possibly expired) offer is awaiting an actionable response. Expiry and POST permissions remain authoritative; browser acceptance open.

**2026-10-15 chat-5 parity hardening — L18 offer failures (PARTIAL):** learner offer-response errors now map HTTP conflicts, changed/expired records and permission failures to non-leaking recovery guidance. Arbitrary server `error` payload text is not echoed into the UI; same-origin server POST and transaction checks remain authoritative.

**2026-10-15 chat-5 parity hardening — L11 offer metric (PARTIAL):** dashboard actionable issued-offer count now excludes exact-expiry, older and malformed deadlines, aligned with protected response cutoff and the offer preview. Null documented deadlines remain explicitly recorded as undated; browser boundary/DB acceptance outstanding.

**2026-10-15 chat-5 parity hardening — L29 inbox large volume (PARTIAL):** notifications landing page now discloses that its 60-record personal source is only a bounded preview, distinguishes visible filtered rows from loaded totals, and links directly to the independently authorized keyset history. Full-domain paging and browser/PG verification remain open.



**2026-10-15 chat-7 — Learner assessment/details/Attendance/Profile parity (PARTIAL; acceptance gates open):** Ten distinct commits on `chatgpt/chat-7` integrate (1) policy-checked saved HTTPS links on standalone Assignment detail, showing a safe non-link fallback for untrusted old values; (2) missing published Assignment marks kept unknown rather than zero; (3) Quiz history timestamps shown in Asia/Kolkata; (4) missing per-question marks kept unknown; (5) no-answer and removed-option detail messages for published Quiz reviews; (6) oversized aggregate assessment searches bounded without silently matching all; (7) Attendance CSV spreadsheet-formula neutralization even behind invisible control characters; (8) malformed persisted Attendance session instants skipped from month buckets without crashing other records; (9) invalid Attendance timestamps rendered as desktop/mobile date/time unavailable, without throwing; (10) Profile-authored URLs reject embedded credentials at the common Zod write-validation boundary. Tests accompany each commit in `tests/unit`. These are source fixes, **not executed/accepted parity**; no new migration, permission elevation, role read, signed-object retrieval, grading publication, or app status change. Existing learner service ownership/auth guards and privacy-masking gates remain mandatory. Latest observed legacy oracle FE `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`, BE `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`. Required next: TS/ESLint/Vitest execution, PG membership/foreign-delivery denials, browser mobile/tablet/desktop, legacy comparison and private-storage producer/consumer proof. No learner family VERIFIED, ledger row CLOSED or official DATABASE tracker item DONE from this source-only round.


**2026-10-16 chat-7 learner private file + lesson video UI (source FIXED, acceptance PARTIAL):** Six earlier pushed commits add a typed private-storage grant boundary, per-file XHR signed PUT progress using exactly grant headers with no app cookies, upload completion, staged-file status/verification/removal, multi-file final `submit-files`, and submitted-file listing and short-lived download grant. The learner Lesson VIDEO content card obtains authorized `learner-videos`, resolves only its linked content or matching asset, requests `playback-grant`, resumes at persisted position, renews signed grants before expiry without storing URLs and retains the existing content progress PUT. Legacy labels `Upload File` and `Submit Your Work` are preserved where applicable. Authoring of focused unit tests does **not** count as executed acceptance. This lane has not run npm/Vitest, TypeScript, ESLint, disposable PostgreSQL, external signed R2 PUT/GET, scanner attestation, desktop/mobile browser and cross-role denial checks. Runtime remains gated by configured private R2 env; production VERIFYING rows cannot be submitted or opened until scanner CLEAN attestation. L3-017/L3-018/L3-026/L6-015 are FIXED in source only, not CLOSED or VERIFIED. No tracker DONE or family VERIFIED is claimed.


**2026-10-16 chat-7 legacy navigation correction (source FIXED, acceptance pending):** `docs/audit/legacy-copy-A.md` dev learner `studentNavigationMenu` (lists.js L55–123) has Courses, Quizzes, Assignments, Class Schedule, Attendance, My Placements, Projects, Notifications and Profile, with no Drive Day row. Removed the extra conditional `Drive Day` learner shell row even when a dated coordinator assignment is active. The existing `/tpo/drive-day` coordinator workflow, route and authorization were not changed; role-specific TPO navigation remains. Updated the shell regression. The specific phase2 chat-7 brief is absent from `docs/orchestrator/briefs/phase2/` at this revision, and `docs/audit/logic-fix-backlog.md` has no learner courses-specific IDs for this round. Learner content, assessments and other existing ledger gaps are not being marked CLOSED from source-only work.


## Legacy learner notification audience and bookmark crosswalk (W1 G2-17-026-002)

- Old `classId` maps to a college-owned section UUID, resolved only through an **active** section enrollment and active learner program enrollment for the verified learner membership. It is not a selector for arbitrary learners.
- Old `courseId` or `courseSlug` is resolved within the chosen college to an active course and its non-ended, active course-section deliveries. Class-and-course notice targeting additionally requires that exact course delivery in the exact class, never a cross-college shortcut. Only currently active section enrollments with active users/memberships become delivery recipients.
- Imported notification `classId` and `courseId` in server-authored activity metadata are **additional filters** after the personal recipient query, never new permissions. Private event author and recipient records are not exposed as unrestricted college feeds.
- Old `/learn/notifications?tab=course|project|general|job|all` links redirect to the same authenticated inbox with a validated `category` filter **after** persisted learner membership reauthorization. Unrecognized tabs go to All; conflicting duplicate selectors are rejected. Notification CTA destinations are reduced to safe internal paths; an external assessment link, when allowed, is vetted separately.
- **Known acceptance gap:** SSE reconnect/update frequency is not established by the current migration projection. A page reload and authorized recipient read work independently; do not claim background/live parity without executing a connected-browser and delivery test.

Source: `src/modules/activity/notification-service.ts`, `src/modules/activity/learner-notification-membership-service.ts`, `src/app/(authenticated)/learn/notifications/page.tsx`. This is a **source-level crosswalk**, not production runtime acceptance.


## 2026-10-28 legacy imported profile and placement descendants — source-only acceptance leads

No page family is newly marked green by this section. Source FE SHA: `9d56bb7a347b06f242ef615c19fdc298f83329e0`; full evidence: `docs/audit/legacy-dev-census/2026-10-28-wave4-6-reconciliation.md` and wave-4/5/6 JSON. Group these checks under the **existing profile and placements page families**, not additional route counts.

- Legacy profile `src/components/profile/about.js` calls nested editors for identity, qualifications, address, contact, experience, skills, achievements, certification, publications, social, personal and career data. `src/components/profile/userInfo.js`, `about/qualifications.js`, `about/identity.js` and `ProfileCompleteness.js` add conditional states. Compare with `src/components/profile/learner-profile-workspace.tsx` at vNext `f8231663c0ed30a2473e26d59527e30d33c8bc72`, verifying all edits/validation/cancel/unsaved, refresh, ownership and verification effects. Source import existence is not behavior proof.
- Legacy `src/components/profile/VideoIntroModal.jsx` implements camera/permission, countdown, up-to-two-minute record/preview, 50 MB upload, replace, cancel and failure states. Identify the exact vNext counterpart or document explicit approved redesign/retirement. Current filename/search results were insufficient to certify equivalence or absence. Private media storage, retention and permission negatives require executed tests.
- Legacy `about/MarksheetUpload.jsx:L17-L19` validates PDF/JPG/PNG and 5 MB; `PrivateDocLink.jsx:L23,L42-L43` uses short-lived private-link opening; `Global/SkillsAutocomplete.jsx` contains a full searchable catalog UI. Verify these as separate embedded controls against vNext document receipts, `src/modules/people/learner-profile-document-edit-service.ts`, private storage and skills catalog. Security/authorization and expired-link handling are P0/P1 gates where applicable.
- Placement/job subviews in `Placements/JobDetailContent.jsx`, `JobsListContent.jsx`, `OfferCard.jsx` and `RoundTrack.jsx` need exact apply/round/offer/deep-link state reconciliation. A page wrapper alone cannot close them.

**Evidence status:** 484 imported-source files now represented in the static import graph, with zero unexplored *tree-resolved UI-folder* imports under that parser; this is NOT zero unresolved product behaviors. No runtime, real storage/PG, browser or cross-role acceptance executed and no Implementation Green asserted.
