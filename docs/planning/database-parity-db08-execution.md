# DB08 — Placement policy and outcomes: source-backed parity workstream

**Owner:** parallel workstream `db08-placement-parity-2026` (separate from DB03 and DB04).  
**Baseline:** vNext `db-parity-2026@c489b2569dd2d2742da2ee17ed313a26853dc4da`; legacy `lms@prod-2026:21bad59d4dfaf2fa11fdeaf9353327ce105697d5`; vNext canonical source baseline `5ca60b0f39a25c7b8dc1d0e26f4bbdfe8e5ec15a`.  
**Status:** **SOURCE-AUDITED / NOT IMPLEMENTED OR DATABASE-VERIFIED IN THIS WORKSTREAM.** Never interpret this as a completed DB domain.  
**Machine-readable companion:** `docs/planning/database-parity-db08-field-ledger.json`.

## 31 October 2026 source-integration update

**Historical staging paths in the 11 October field ledger are stale.**
`scripts/sql/db08-registration-staging.sql` and
`scripts/sql/db08-debarment-staging.sql` do not exist on current `main`.
Registration and debarment are already present as typed barrel exports and
a numbered `drizzle/0071_db08_registration_debarments.sql` migration.
The DB08 external-offer schema is also barrel-exported and records migration
0094. Do not attempt to re-create those older candidate SQL files or run
duplicate migrations.

**Not a parity signoff:** 280/280 legacy source fields were reviewed to
candidate families, with 0/280 complete original-semantic runtime
certifications. Mandatory season retirement, registration outcome detail,
offer breakup/bond/dispute, counts-as-placed and inherited eligibility
remain real implementation/acceptance obligations. They must be addressed
through the still-open cross-domain/global audit and runtime phase gates.
This document's historical source map is a review deliverable, **not**
verification that placement product behavior has fully shipped.

## Domain contract and critical discovery

The vNext placement system is not yet behaviorally equivalent to the **latest** legacy placement model. Legacy `V188__placement_batches_and_eligibility.sql` and `docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md` explicitly *replace placement seasons* with academic batches, per-batch registration and eligibility inherited from BATCH → CLASS → LEARNER. The vNext `placement_seasons` table and `season-service.ts` still make a season an obligatory grouping and enforce **only one ACTIVE season per college**. This is a genuine source-contract mismatch; do not close it by adding fields to the season table alone.

Legacy two-gate learner access is (1) college-level Placements module paid/enabled and (2) learner's **resolved** eligibility is ELIGIBLE. `NOT_DECIDED` and `INELIGIBLE` hide the student Placements surface. Per-job `placement_job_eligibility_policies` / `placement_eligibility_overrides` in vNext are **not equivalent** to college placement eligibility. Preserve these as a separate second-stage qualification gate.

The legacy batch/class/learner decision is inherited (LEARNER first, CLASS next, BATCH last); changing batch eligibility affects future and existing learners who have no more-specific overrides. A bulk change is one action ID with a durable event per affected scope and **atomic undo**. Clearing a decision returns to NOT_DECIDED and must not insert a stored third status.

## Source inventory — 18 tables / 280 field candidates, no semantic fields certified

| Legacy table | vNext candidate / disposition | Priority |
| --- | --- | --- |
| `placement_eligibility` | Existing `placement_eligibility_decisions` (0035) is a **partial equivalent**; its polymorphic `scope_id` lacks enforced parent FK/college proof and there is no bulk undo | P0 |
| `placement_eligibility_event` | New `placement_eligibility_events` schema drafted here; unjournaled/unverified | P0 |
| `placement_batch` | New `placement_batch_lifecycles` schema drafted here; unjournaled/unverified | P0 |
| `placement_registration` | No equivalent consented, per-batch registration journey identified; season-linked registration is retired by latest design | P0 |
| `placement_debarment` | No dedicated duration/counter/restore state identified | P1 |
| `external_placement` | No dedicated verified off-campus offer independent of fake job/application found | P1 |
| `learner_saved_job` | No dedicated persisted learner saved-job table identified | P2 |
| `placement_season` | `placement_seasons` exists; **latest legacy redesign retires the season**, requires explicit redesign/retirement mapping | P0 |
| `job` | `placement_jobs`, role options and other models; fields and drive modes not yet reconciled | P1 |
| `job_application` | `placement_applications` plus history; state/recorded-outside fields not yet reconciled | P1 |
| `job_application_status_history` | `placement_application_status_history` exists; history semantics unverified | P1 |
| `job_eligibility_override` | `placement_eligibility_overrides` exists; job-specific only | P1 |
| `application_screening` | `placement_application_screenings` exists, but legacy scored AI/manual evidence may be lost | P2 |
| `interview` | `placement_job_rounds` and round exceptions exist; individual learner interviews/feedback not proven equivalent | P2 |
| `job_offer` | `placement_offers` and joining exist; breakup, bond, dispute/revoke fields require gap review | P1 |
| `job_preferences` | `placement_candidate_preferences`; normalize semantics and consent/options | P2 |
| `round_attendance` | `placement_round_attendance` exists; explicit round–application same-job consistency required | P1 |
| `round_result` | `placement_round_results` exists; application/round job consistency and supersession require proof | P1 |

This is a **field-candidate inventory** from the full source registry, not a current live MySQL schema dump. `legacy` had `hibernate.ddl-auto=update`, so an actual metadata-only read-only inspection remains a DB00 prerequisite. Confirm current source heads before implementing each batch.

## DB08 implementation batches, in dependency order

### DB08-A — batch policy and auditable eligibility (independent from DB03)

1. Model per-cohort `placement_batch_lifecycle`: `cohort_id` immutable PK/FK, `college_id`, optional registration deadline, invited/finished timestamps, optional JSON rules override (null means college policy), actor/time fields, and a foreign/tenant integrity guard. Different departments/cohorts can have independent deadlines. No placement season dependency.
2. **Extend the existing 0035 `placement_eligibility_decisions` table** (do not duplicate). Its existing `scope_type+scope_id` is validated by a parent/college verification trigger in the staged SQL, with length checks, one current decision per scope, and an eventual fully typed FK refactor if desired. The staged trigger is not yet deployed.
3. Model append-only events with action ID, before/after status+reason+note, actor, timestamps, inverse/undone relationship; preserve bulk actions. **Staged** in `src/db/schema/placement-batches.ts` and `scripts/sql/db08-batch-eligibility-staging.sql`, NOT added to the journal. Undo must ensure no intervening conflicting decisions; lock all affected scopes in stable order and transact decision+event changes together. Reject cross-tenant writers and inactive actors. Never delete history on undo.
4. Resolve membership → current section/cohort using authoritative **active** enrollment and section assignment (do not infer from free-form display fields); calculate effective source and reasons for admins. Guard against learner transfers, stale section assignments and college mismatch.
5. Gate student placement UI/API on **both** college module and resolved eligibility. Hide eligibility details from students; allow limited Drive Day coordinator access under its separate authorization rule. Becoming ineligible flags existing applications for TPO review; never auto-withdraw.
6. Decide up front whether feature release is blocked until global gate is wired into every read/write route. Merely creating tables is insufficient.

### DB08-B — registration and debarment

- Per-batch invitation/deadline/reopen workflow and `placement_registration` including consent version and consent timestamp. Do not reintroduce season gating.
- Persist debarments with end time and/or counted-drive duration, lift actor/reason and history, deterministic interaction with eligibility/registration.
- Batch-specific placement rules fall back to the college policy. Preserve job types (full-time, internship, internship + full-time, contract, apprenticeship) and `internship != placed` in outcome calculations.

### DB08-C — external outcomes + offer fidelity

- Keep a verified `external_placement` concept independent of job/application/offer FK chain, including a private document storage reference and reviewer. Only verified outcomes enter held CTC/placed calculations.
- Reconcile offer breakup (fixed/variable/bonus, bond), acceptance/dispute window, revocation and verification; preserve append-only transitions.
- Preserve saved jobs and audit of offers/results, no cross-tenant joins or history-deleting cascades.

### DB08-D — field closure and runtime evidence

- Resolve all **280** indexed legacy fields one by one. Each row needs semantic mapping or signed `REDESIGNED/RETIRED`, target type and owning producer/consumer. Current row status is `UNVERIFIED`.
- Generate official Drizzle migration **and matching snapshot/journal**; replay entire chain from empty disposable Postgres; use separate concurrent-write integration tests. No runtime execution was performed in this source-only pass.
- Recheck `db-parity-2026` and prod legacy heads before merge, preserve DB03/DB04 work; do not directly push to `main`.

## Mandatory adversarial tests / evidence gate

| ID | Proof required |
| --- | --- |
| DB08-A01 | College feature OFF hides all student placement routes and rejects API mutations even when eligibility ELIGIBLE |
| DB08-A02 | No decision → NOT_DECIDED; batch ELIGIBLE → inherited; class INELIGIBLE overrides; learner ELIGIBLE overrides class |
| DB08-A03 | Changing class/cohort for an existing learner recalculates inheritance; explicit learner override remains |
| DB08-A04 | Wrong-college cohort/section/membership rejected by writer **and** negative direct-SQL integrity test |
| DB08-A05 | Ineligible without reason rejected; note length and actor validity checked |
| DB08-A06 | Bulk 100 changes share action ID; rollback leaves no partial updates/events |
| DB08-A07 | Undo restores null/non-null previous state, preserves original event trail; competing action makes stale undo fail |
| DB08-A08 | Concurrent decide/undo on same scope produces one serializable outcome and correct event count |
| DB08-A09 | Ineligible student sees no eligibility reason; existing applications preserved, flagged for manager |
| DB08-A10 | Student coordinator retains **only** limited Drive Day permissions while ineligible |
| DB08-B01 | Two cohorts in one college have independent invitations, deadlines and finished state |
| DB08-B02 | Consent version and exact registration timestamp retained after invitation/reopen |
| DB08-B03 | Finished batch not available for learner self-apply; historic reports retained |
| DB08-B04 | Debarment drive-count concurrency, timed expiry and manual lift are idempotent and audited |
| DB08-C01 | External offer verified without job/application; held CTC and placed count correct |
| DB08-C02 | Pending/rejected external request never counts as placed; private letter not accessible cross-tenant |
| DB08-C03 | Offer component rounding, dispute/revoke, joining/outcomes preserve durable history |
| DB08-C04 | Round/application IDs from different jobs cannot be attached even with valid individual FKs |
| DB08-D01 | Full migrations from empty disposable PostgreSQL with check/FK/unique negative tests |
| DB08-D02 | Every candidate field crosswalk closed and API/UI producer-consumer path observed |

## Ownership and handoff rule

Only this branch owns DB08 files, its fresh specs/ledgers, and (after reconciliation) placement eligibility/batch/registration schema and services. DB03 remains with the groups/electives chat, DB04 with the profiles/verification chat. Touch shared `src/db/schema/index.ts`, `drizzle/meta`, broad access gates and central trackers only during explicit rebase/integration to avoid racing the other chats. **No partial work may be advertised as complete or merged based on source inspection alone.**

Sources: `V188__placement_batches_and_eligibility.sql`, `V161__tpo_v1_drives.sql`, `V172__external_placement.sql`, `docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md`, `PlacementEligibilityService.java`, `src/db/schema/placements.ts`, `src/db/schema/drive-day.ts`, `src/modules/placements/eligibility-service.ts`, and `src/modules/placements/season-service.ts`.


## Implementation checkpoint — 2026-10-10, DB08-A source authoring

**Code authored and pushed to the DB08 branch (not integrated):**

- `src/db/schema/placement-batches.ts`: `placement_batch_lifecycles` and append-only `placement_eligibility_events` declarations. Reuses the **preexisting** `placement_eligibility_decisions` (0035) as the single current-state store; no duplicate table.
- `scripts/sql/db08-batch-eligibility-staging.sql`: non-journaled draft of the new tables, parent/college verification triggers, immutable event guard and length constraints on the existing current-state table. **Do not run in shared or production databases.**
- `src/modules/placements/batch-participation-service.ts`: transactional upsert for independent batch settings, recorded invitation/finish timestamps, manager bulk decisions, stale-safe full-action undo and private learner access policy. Decisions and undo lock their college row to serialize even the missing-row case; this is correctness-oriented and may need partitioned locks after measured load testing.
- `tests/integration/placements-db08-batches.test.ts`: six isolated PostgreSQL test cases for bulk/undo, stale undo, cross-college writer and direct SQL negatives, immutable history, concurrency and per-batch lifecycle. Require **all** `DB08_ISOLATED_TEST_DATABASE=1`, `DB08_MIGRATION_APPLIED=1` and matching `DATABASE_URL`/`TEST_DATABASE_URL`; guard intentionally fails if database preparation is absent.
- `src/modules/placements/batch-eligibility-policy.ts` and `tests/unit/placement-batch-eligibility-policy.test.ts`: inherited learner/class/batch decisions and private boolean-only participation policy.
- `scripts/db08-parity-status.mjs`, `tests/db08-parity-status.test.mjs` and `docs/planning/database-parity-db08-field-ledger.json`: 280-field exhaustiveness and evidence gate (all remain `UNVERIFIED`; no inflated parity claims).

**Verification not performed:** TypeScript typecheck, Vitest, generated Drizzle migration/snapshot diff, migration replay or race tests on disposable PostgreSQL. These source files are **not** a green CI result. The Drizzle schema entrypoint is `src/db/schema/index.ts`; the new schema is deliberately not exported from that shared file until coordinated migration integration. API/routes/sidebar/job-application gating also remains unwired. Do not deploy this branch as-is.

**Remaining P0 release blockers** (must not be marked complete):
1. Rebase on the current DB03 + DB04 head when safe; update `src/db/schema/index.ts`, generate/inspect official migration and journal+snapshot, remove or reconcile the staged draft, replay full migration chain.
2. Execute six DB08 integration cases and add cross-tenant **MEMBERSHIP and SECTION** parent negatives, FK/orphan deletion tests, permission denials and batch invitation notification verification. Current SQL parent guard only checks at row write; parent deletion/move must also be protected with true referential constraints or parent-side guard triggers.
3. Wire global participation checks to every student placement API/sidebar/job application, preserving coordinator-only Drive Day access. Do not use job-specific eligibility as a substitute.
4. Implement batch invite email outbox/delivery before exposing `markPlacementBatchInvited` in an HTTP route (it currently records a checkpoint only). Persist manager-visible ineligible flags on existing applications without withdrawing.
5. Add decision actor revocation/cross-college tests; test 2,000-row bulk behavior under load before broad rollout. Track the difference between authorized manager writes and module-paid access.
6. Field-by-field review of all 280 source candidates with verified producer/consumer mapping; complete DB08-B, DB08-C and DB08-D.

**Important scope nuance:** `placement_eligibility_decisions` is already present in the committed `0035_learner_module_access.sql`, so its absence was a provisional first-pass census error now corrected in the field ledger. There are **six**, not seven, legacy DB08 tables without a direct dedicated vNext table candidate in the inspected schema; even those may be intentionally redesigned and must be individually reviewed.


## DB08-B checkpoint — batch registration + manual debarment (2026-10-10)

**Status:** CODE AND STAGED SQL AUTHORED, **NOT** MIGRATION-JOURNALED, RUNTIME-VERIFIED OR WIRED TO ROUTES.

### Implemented on the isolated DB08 branch (source level)

- `src/db/schema/placement-registration.ts`: batch-scoped registrations with real cohort/member references, unique member+cohort, `PLACEMENTS/HIGHER_STUDIES/NOT_INTERESTED/ENTREPRENEURSHIP/COMPETITIVE_EXAMS` choices, source, stored consent version+instant, and immutable history candidates. The latest legacy `BatchRegistrationService` opens invitation windows per academic batch, while older `TpoStudentService` stores `season_id`; vNext deliberately uses cohort as the durable registration partition.
- `src/modules/placements/batch-registration-policy.ts`: deadline is exclusive, invited but unfinished batch required, original `v1` placement consent version, and Legacy V1 date-before-drives debarment precedence.
- `src/modules/placements/batch-registration-service.ts`: authenticated learner-only transaction; real active membership/user binding, active cohort/section validation, two-gate eligibility and module check, invitation/deadline check, a single mutable per-cohort registration row. Duplicate same-choice submissions preserve the first consent timestamp. Administrative choices are deliberately *not* permitted through this self-service writer.
- `scripts/sql/db08-registration-staging.sql`: cross-college/member/cohort guards, SELF identity and invitation-window guard; SQL-owned `AFTER INSERT/UPDATE` audit creates an immutable event even if the row is changed by another authorized writer. The service does not duplicate SQL-created events.
- `src/db/schema/placement-debarments.ts`: durable manual debarments, drive-counter evidence and immutable CREATE/DRIVE_COUNTED/LIFTED history; preserves date/drive duration and manual lift.
- `src/modules/placements/debarment-service.ts`: manager permission and tenant checks, manual create/lift, idempotent per-job drive counting requiring an actual learner application. Historical actions are not erased on lift.
- `scripts/sql/db08-debarment-staging.sql`: direct-SQL tenant check, immutable audit and distinct drive events, SQL-owned counter increment, counter-to-history reconciliation, expiry checks. A repeated job does not increase the count.
- `tests/unit/placement-batch-registration-policy.test.ts` and `tests/integration/placements-db08-registration.test.ts`: unit specs for consent/time boundaries/duration; gated disposable PostgreSQL specs for registration idempotence/change history, deadline, wrong references, debarment create/lift.

### Parity inventory update

The existing 18/280 legacy DB08 source census is unchanged and **all 280 fields remain UNVERIFIED**. Source-authored (but unjournaled) candidates are now attached to legacy `placement_batch`, `placement_eligibility_event`, `placement_registration`, and `placement_debarment`. Only `external_placement` and `learner_saved_job` still have no dedicated table candidate in this workstream; this is NOT a complete semantic diff.

### Critical release blockers — do not claim DB08-B complete

1. **Drizzle source integration:** `src/db/schema/index.ts` does not yet export DB08-A/B schemas. Source files and draft SQL are not active migrations. Rebase after DB03+DB04 coordination, generate official Drizzle migration plus exact snapshot/journal, compare staged SQL, replay full chain on isolated disposable PostgreSQL.
2. **No executed tests:** Neither `vitest`, TypeScript typecheck nor Postgres constraints/concurrency have been executed in this chat. Unit/integration test files are authored, not passing evidence. `DB08_B_MIGRATION_APPLIED=1` must only be set after real disposable DB migration.
3. **Invitation emails:** DB08-A currently records `invitedAt` but has no transactional outbox/notification sender. Never expose an Invite or Remind UI action until actual deliveries/recipients and idempotency are proved.
4. **Self-service gating:** Module-enabled check currently occurs before the database transaction; synchronize module writes and learner registration under a common college-level lock or re-check against the authoritative module rules inside the transaction to prevent a paid-module OFF race.
5. **No route or UI parity:** Student registration, TPO Batches/Students grids, drive progression, debarment counter integration, manager bulk actions and paid-module eligibility have not been wired to their actual APIs/sidebar/jobs. No page parity claim.
6. **Timezones:** `debarment-service.ts` and SQL staging intentionally use `Asia/Kolkata` to match the existing India-centric legacy deployment, but per-college timezone configuration must replace this assumption before multi-region tenants launch.
7. **Writer trust:** Privileged direct SQL `TPO/BACKFILL` registration could bypass application actor permissions; enforce writer roles/grants and protected DB functions. Parent-side academic reparenting may invalidate scoped foreign relationships unless blocked or reconciled.
8. **Database and workflow tests:** Real Postgres must test cross-college MEMBER/SECTION/COHORT, concurrent bulk undo and enrollment transfer, duplicate drive-count events, expired debarment, immutable change logs, consent overwrite, debarment status visibility to companies, and audit/consistency under rollback.
9. **Behavioral sign-off:** Manager bulk registration and manager choices (`ENTREPRENEURSHIP`, `COMPETITIVE_EXAMS`) are stored as data candidates only. Decide exposed workflows from legacy FE. Explicit verified consent text/version is a release requirement.
10. **Remaining DB08:** External placements, saved jobs, full offer fidelity, 280-field semantic crosswalk and full account UI/API parity remain outstanding.

### Quality note

A source-shape review checked 18 listed invariants (files, guards, tracking and test presence). That is **not** TypeScript/SQL runtime validation or a database parity percentage.


## Main integration and DB08-C kickoff — 2026-10-10

**Integrated:** PR [#14](https://github.com/42Students/lms-vnext/pull/14) merged the **19 DB08-only files** from `db08-placement-parity-2026` into `main` as squash commit `b9bbabee6b44726e44b605a35104e345db9dd194`. This deliberately did **not** merge the stale DB-parity/DB03/DB04 history. **From this checkpoint onward, this DB08 chat writes directly to `main`** and must re-fetch `main` for each write to preserve other agents' contributions. The original isolated branch is historical, not the active target.

**Build gate:** PR #14 GitHub CI marked failure but the GitHub Actions job had **zero steps, zero runner assignment, and finished within ~3 seconds**. This is *not a passing check*, and it does not establish a code failure. Before any live schema/route integration, separately run typecheck, lint, unit tests, build, generated migrations, disposable PostgreSQL and affected Playwright.

**DB08-C source files added on `main`:**
- `src/db/schema/placement-external.ts`: independent external offer with `SUBMITTED → VERIFIED/REJECTED → REVOKED` semantics, explicit verification/revocation actors/timestamps, private letter object path, original `ctc_lpa` numeric precision, immutable-event candidate and separate `placement_saved_jobs` model. These avoid inventing an on-campus job, application or offer for a student's real off-campus placement.
- `src/modules/placements/external-offer-policy.ts`: a submitted/rejected/revoked external offer must never count as placed or influence uplift/held CTC. Only a reviewer-confirmed VERIFIED offer is eligible. Convert numeric `ctc_lpa` to annual INR using exact integer arithmetic; unknown salary stays unknown, not zero.
- `tests/unit/placement-external-offer-policy.test.ts`: source-authored unit tests for verification guard, revocation, exact CTC and invalid salary.
- `docs/planning/database-parity-db08-field-ledger.json`: all 18 source tables have **candidate destination models** now; **zero of 280 fields are semantically certified**. Candidate table presence is not parity.

**Still NOT implemented or verified:** actual SQL migrations (staging drafts are not in Drizzle journal), external-offer service/APIs, reviewer request workflow, private signed letter delivery, saved-job service/UI, placement report aggregation, offer-status fidelity, and all producer/consumer parity. DB08 work is not finished.


## Six-chat W04 implementation checkpoint — 2026-10-10

**Owner:** W04 / Issue [#24](https://github.com/42Students/lms-vnext/issues/24); `main` only. Latest legacy refs used: backend `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, frontend `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`. See `docs/planning/w04-placement-closure-checklist.md` for the fine-grained domain and UI queue.

**Code committed on main:**
- `learner-participation-guard.ts`: use **already migrated** current decisions (0035) for a single fail-closed paid-college-module + membership/section/cohort eligibility check. Authenticated user's real ACTIVE learner membership, exactly one ACTIVE same-college program/cohort and non-archived matching section are required; details of the eligibility decision are never included in user errors.
- Wired two-gate access into learner job feed, new applications, application history/detail/withdrawal, placement journey, results, offers, learner requests and request workspace, selected GET/PUT evidence/preferences and self job-eligibility endpoints, plus the server-side learner placement layout (deep links return 404 on permission denial).
- Drive Day coordinators remain eligible for **only limited operational work**, even if marked learner-INELIGIBLE, but are blocked when the college-wide paid Placements switch is OFF and cannot use a cross-college job assignment.
- `batch-participation-service.ts` rejects two ACTIVE academic enrollments or an inactive class; no first-row-wins authorization.
- New test fixture `tests/support/w04-placement-access-fixture.ts` explicitly creates the academic cohort, paid-module and member-eligibility prerequisite for historical W04 integration tests; eleven existing W04 integration suites were updated. The learner job-feed suite additionally describes paid-module-OFF, learner-INELIGIBLE and forged-user negative paths.
- New **staged only** DB08 job batch-target relation `placement_job_cohort_targets` in `src/db/schema/placement-job-cohorts.ts`, draft parent/college/DRAFT-state SQL trigger `scripts/sql/db08-job-cohort-targets-staging.sql`, manager draft-target writer `cohort-target-service.ts`, pure fail-closed target predicate and three authored unit checks. This table is NOT yet in the journal or runtime API.

**Hard release gates remain:**
1. W01 (#21) must journal/replay the canonical DB08 tables, validate SQL tenant guards and parent FKs, and retire mandatory `placement_jobs.season_id` before cohort-target publication; W04 must not edit the shared migration journal.
2. The active application two-gate check currently occurs before the application transaction; synchronize with eligibility/paid-module writers to close disable-after-check races, and require finished cohort gating once DB08 migration exists.
3. Neither SQL/PostgreSQL tests nor lint/typecheck/Vitest/build/E2E/browser ran successfully in this workstream. GitHub Actions currently reports failed jobs without assigned runner/step evidence. Test files are **authored**, not **passing**.
4. Old job/season APIs, recruiter/manager module gating, complete offer breakdown and external verified outcome workflows, secure private letters, per-drive round/applicant integrity and the full placement pages/modal/status parity remain open.
5. Source-derived field inventory: 18 legacy DB08 tables / 280 fields, **0 semantically runtime verified**. This checkpoint is deliberately **not** a DONE claim.


## Chat 5 global DB-011 reconciliation — 2026-10-11

This checkpoint reconciles the historical DB08 workstream into the global
DATABASE queue. It does **not** supersede the 280-field evidence gate and does
not claim runtime verification.

### Source-review result

- All **18 legacy tables / 280 fields** are present in the canonical source census
  and now carry source-reviewed **domain candidate sets** on current `main`.
- Exact field semantic status remains **280 UNVERIFIED / 0 runtime verified** in
  `database-parity-db08-field-ledger.json`; candidate table presence is not
  field parity.
- The current canonical model is the one already integrated on `main`.
  The archived alternate DB08 branch remains superseded and must not be merged
  wholesale.

### Blocking source mismatches confirmed from latest legacy V188/V190

1. **Season retirement is not implemented.** Legacy V188 and the locked
   Batches/Eligibility design remove `placement_season` and all
   `season_id` drive/registration/report filters. Current vNext still has an
   active `placement_seasons` model and requires
   `placement_jobs.season_id NOT NULL`. Cohort targets are source-authored but
   not an active journalled replacement yet.
2. **DB08 A/B/C/D candidate schemas are not active migrations.**
   `placement-batches.ts`, `placement-registration.ts`,
   `placement-debarments.ts`, `placement-external.ts`, and
   `placement-job-cohorts.ts` are not exported through the schema barrel and
   their staged SQL is not a numbered Drizzle migration. Only the migration
   integrator may perform that shared registration work.
3. **Placed-count policy gap.** Latest legacy `job.counts_as_placed` persists
   the per-drive decision used by placed counts/held-offer logic. No equivalent
   persisted field was found in current `placement_jobs` or role options.
4. **Non-placement outcome gap.** Latest legacy
   `placement_registration.outcome_label` and `outcome_detail` persist
   college-specific Higher Studies/Entrepreneurship/Competitive Exam outcome
   detail. The canonical `placement_batch_registrations` candidate does not
   currently persist those fields.
5. **Offer fidelity gap.** Current `placement_offers` preserves core role,
   annual CTC, joining date, expiry and lifecycle history, but does not yet
   persist the full legacy fixed/variable/joining-bonus breakup, bond terms and
   dispute/revocation metadata as explicit equivalents.
6. **Audit identity decision needed.** Eligibility current/event candidates use
   durable actor user IDs and append-only reversal events. Legacy also snapshots
   actor/decider type and display name and carried `undone_at`; the stronger
   reversal model is sound, but snapshot retention needs an explicit
   preserve/redesign disposition rather than silent loss.

### Source contracts that are represented

The current services do source-author the important two-gate learner rule
(paid college Placements module **and** resolved inherited eligibility), the
MEMBERSHIP > SECTION > COHORT precedence, atomic bulk decide/append-only undo
logic, batch-specific registration windows/consent history, dedicated external
offers without fake jobs, debarment history, and the limited Drive Day
coordinator exception that never bypasses the paid college module switch.

These claims are source inspection only. The runner/disposable PostgreSQL gate
is still blocked, so no authored DB08 unit/integration suite is reported as
passing.

### Global queue disposition

DB-011 may be marked **COMPLETED for source reconciliation only** after this
checkpoint and the source census update are committed. It must remain
**not DONE_VERIFIED**. DB-019 must disposition the exact 280 field mappings and
DB-020 must require the season retirement/migration integration plus executable
PostgreSQL evidence before the DATABASE phase can advance.
