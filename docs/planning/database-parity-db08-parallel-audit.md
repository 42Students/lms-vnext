# DB08 — Placement policy and outcomes: independent parallel audit

**Created:** 2026-10-10 (IST)  
**Claim:** [GitHub issue #4](https://github.com/42Students/lms-vnext/issues/4)  
**Branch:** `db08-placement-policy-outcomes-2026`, based on `db-parity-2026@c489b2569dd2d2742da2ee17ed313a26853dc4da`  
**Legacy BE oracle:** `42Students/lms@prod-2026` `21bad59d4dfaf2fa11fdeaf9353327ce105697d5` (verified 2026-10-10)  
**Legacy FE oracle:** `42Students/lms2-fe@prod-2026` `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2` (verified 2026-10-10)  
**vNext base schema:** `42Students/lms-vnext@c489b2569dd2d2742da2ee17ed313a26853dc4da`  
**Source field register:** `docs/planning/db-pass4-columns-db08_placement_policy_and_outcomes.json`  
**Independent semantic tracker:** `docs/planning/database-parity-db08-parallel-tracker.json`

> **Confidence:** Preliminary static/source audit only. 18 candidate legacy tables, 280 source-derived fields, 53 same-name field candidates. These do NOT establish the live legacy schema or semantic parity. No DB08 fields are `WORKFLOW_VERIFIED`; no disposable PostgreSQL tests have run. Legacy uses `hibernate.ddl-auto=update`, so physical-schema completeness requires the metadata-only check in DB00.

## Scope boundary and dependency graph

DB08 owns eligibility decisions/action history, participation registration, batch-specific placement lifecycle, debarments, job applications/screening/rounds, on- and off-campus outcomes, joining and offer lifecycle. It may update `src/modules/placements/*`, DB08-owned additions to `src/db/schema/*`, its own tests, and DB08-specific docs **on this branch only**.

**DB03 owns** groups/electives/academic roster consumer work, including `drizzle/0037_*`. **DB04 owns** learner private identity/profile verification, original academic grades and verified snapshot provenance. DB08 consumes DB04's *effective verified* evidence; DB08 must not make policy decisions from a pending/unverified profile or duplicate the DB04 schema. **DB09 owns** TPO operational settings/companies/recruiter controls/drive planning and college-wide policy-setting UI. DB08 owns application of those placement rules to participation and outcomes, with a narrow explicit integration contract. Do not edit shared `drizzle/meta/_journal.json` while concurrent branches are active.

## Table-level initial disposition

These rows are candidate mappings, **not field sign-off**:

| Legacy candidate | Candidate vNext persistence | Initial audit verdict |
|---|---|---|
| `application_screening` | `placement_application_screenings`, `placement_application_screening_history` | Candidate: compare partial score, skills/exclusion, version, actor and history |
| `external_placement` | No dedicated vNext off-campus outcome table found | **Gap suspected**: verified outside offer must count as placed without creating a fictional job |
| `interview` | `placement_job_rounds`, `placement_job_round_events` | **Review**: per-application schedule/feedback/rescheduling is not automatically a round definition |
| `job` | `placement_jobs` plus role options/config | Candidate: verify targeting, drive mode, category, published lifecycle, outside-counted policy |
| `job_application` | `placement_applications` | Candidate: withdraw/reapply, resume history, assessment, current round, version |
| `job_application_status_history` | `placement_application_status_history` | Candidate: prove append-only, actor and audit fields |
| `job_eligibility_override` | `placement_eligibility_overrides` | Candidate: scope, revocation and override precedence |
| `job_offer` | `placement_offers`, `placement_offer_status_history`, `placement_joining_outcomes` | Candidate: verify values, acceptance/revocation, joining and financial units |
| `job_preferences` | `placement_candidate_preferences` | **Review**: legacy PAP/exam slot preferences may not match generic job preferences |
| `learner_saved_job` | No dedicated bookmark table found | **Gap suspected** |
| `placement_batch` | No placement-batch lifecycle table found | **Gap suspected**: cannot substitute academic cohort or placement season without behavior proof |
| `placement_debarment` | No dedicated debarment record found | **Gap suspected**: date, drive count, lifted history |
| `placement_eligibility` | `placement_eligibility_decisions` in `placement-access.ts` | Candidate: legacy BATCH→CLASS→LEARNER; vNext COHORT→SECTION→MEMBERSHIP. Verify cross-tenant ownership and precedence |
| `placement_eligibility_event` | No dedicated bulk/action undo event table found | **Gap suspected**: per-change before/after, action_id, actor and undone_at |
| `placement_registration` | No per-learner-per-season choice/consent table found | **Gap suspected** |
| `placement_season` | `placement_seasons` | **Partial semantic overlap**: legacy registration deadline, open flag, blocked dates, current marker; vNext active-only uniqueness |
| `round_attendance` | `placement_round_attendance` in `drive-day.ts` | Candidate: ensure marked-by/role provenance, room, event lifecycle |
| `round_result` | `placement_round_results` | Candidate: supersession, per-round effect, waitlist, applied audit |

The source registry's 280 fields must be reviewed one by one before any table is called mapped. The separate JSON tracker starts each field as `UNMAPPED` with possible destination hints and source risk flags; hints are not a parity claim.

## Source-verified invariants to preserve

### Eligibility resolution (V188)

- Eligibility is tri-state: **ELIGIBLE / INELIGIBLE / NOT_DECIDED**. In the absence of a decision at every level, result is NOT_DECIDED, not automatically eligible.
- Precedence is **learner > class > batch**. In vNext's terminology this is MEMBERSHIP > SECTION > COHORT. A more specific decision overrides both eligible and ineligible parents. The vNext resolver (`src/modules/placements/access-service.ts`) currently follows its incoming chain order; test that the *caller* supplies canonical order, or sort defensively.
- An ineligible decision requires a non-empty reason. The vNext `placement_eligibility_decisions` CHECK enforces this; production write paths, user-level authorization and target-scope-to-college FKs still need verification.
- A bulk decision has a single `action_id` and an **append-only before/after event for every touched scope**. Undo must not clobber a later change or another college's decision. Claim safe conditional undo through serialized/action-version-aware writes. Do not silently delete events.
- Legacy V188 uses a uniqueness key on `scope_type,scope_id` and college_id separately; vNext has the same scope uniqueness shape, so polymorphic scope and ownership require explicit validation. A globally unique UUID is not itself tenant permission.

### Placement-batch lifecycle (V188)

- `placement_batch` is keyed by the **academic batch** but is *not the same concept* as `placement_season` (which has independent registration/placement calendar).
- No `placement_batch` row means **not started**. Persist optional `registration_deadline`, `invited_at`, `finished_at` and `rules_json` (override of college defaults). NULL values are meaningful, not omitted defaults.
- Store timezone-aware instants and validate ordering/business transitions. Prevent registration after the active deadline, invitation after finished, and out-of-college references. Confirm whether legacy intentionally allows any exceptional state before hardening.

### Registration/debarment (V161)

- `placement_registration` is unique per learner/season, with `choice = PLACEMENTS | HIGHER_STUDIES | NOT_INTERESTED`, `consent_version`, `consent_at`, `source`, and later `outcome_label/outcome_detail`; it must not be conflated with job candidate preferences.
- `placement_debarment` has a recorded reason, either an until-date or a number of subsequent drives, a count of drives, actor, lift date and lift reason. Drive-counter increment needs idempotency and no double counting on retries/participant replays. Historical lifted records are not simply deleted.
- Joining/accepted-offer exclusion and college policy interactions are cross-domain; test registration/debarment independently of job eligibility.

### External/off-campus outcomes (V172)

- Verified off-campus placement is a *first-class outcome* with learner/college, optional request, company name, CTC, letter reference, verifier, verification time and soft deletion.
- The legacy explicitly states that it contributes to **held CTC and counts-as-placed calculations** without inventing a fake Job/Application/Offer record. Ensure exact same policy calculation path for both on-campus offers and external verified outcomes.
- Letter evidence must become a scoped private object reference with access controls (contract with DB04 evidence/storage), not a public URL; this is a documented secure parity exception if legacy served a public URL.
- A request being approved is not proof that the external outcome exists and is verified. Ensure idempotent approval-to-outcome effects and reversal policy.

### Per-job and offer lifecycle

- Legacy `interview` captures per-application meeting mode, schedule, reschedule history, interviewer and feedback. A global round template is insufficient when each candidate can have a distinct appointment.
- `job_offer` contains fixed/variable/bonus CTC, bond fields, dates, acceptance channel, status and version. Convert lpa→INR precisely and test precision; preserve offer status history and joining.
- `placement_season` has legacy `registration_deadline`, `is_registration_open`, `blocked_dates` and `is_current`; vNext `placement_seasons` has `start_date/end_date/status` and exactly one ACTIVE season per college. **Do not equate the two lifecycles** until concrete product-workflow verification.

## First implementation batches (exclusive ownership)

| Batch | Code/schema area | Proof to close |
|---|---|---|
| DB08-A | Eligibility decision event/undo and scope authorization; no changes to DB03 groups | Bulk decision idempotency; actor snapshots; stale undo blocked; type/tenant mismatch denied; precedence |
| DB08-B | Placement batches + registration/consent | Empty row = not started; deadlines; invite/finish; unique learner/season; opt-out; permission and time-zone negatives |
| DB08-C | Debarment + placement cascade policy | Duration/drive count; retry safety; lift/correction history; job eligibility and UI consistency |
| DB08-D | External verified outcomes | Request decision effects, CTC aggregation with on-campus held offers, soft delete, private letter access |
| DB08-E | Saved jobs, legacy interview semantics, season divergence and remaining field proofs | Per-candidate interview changes, stale round result suppression, saved-job uniqueness, full 280-field audit |
| DB08-F | Post-merge migration replay + end-to-end verification | Fresh migration numbering; disposable PostgreSQL checks; negative tenancy; API+UI producer-consumer; latest-oracle freeze |

**Merge constraint:** Work in this branch and open a draft PR. Integrate only after DB03 and DB04 heads are reviewed and migration journal conflicts resolved. Schema/model code alone is never counted as runtime-verified; publish actual executed commands and outputs.

## Concrete adversarial tests to add

1. A learner belongs to college A but submits a college B `scope_id` for an eligibility write; reject and verify no rows/events.
2. Parent batch INELIGIBLE, class ELIGIBLE, learner INELIGIBLE: learner prevails; remove learner and verify class prevails; remove class and verify parent; remove all and verify NOT_DECIDED.
3. Two concurrent bulk actions overlap the same membership. Undo the *older* action; must not overwrite the newer decision.
4. Retry a bulk action id: no duplicate action events, no new decision timestamp.
5. Set INELIGIBLE with blank/whitespace reason through raw SQL and through API; both denied.
6. Registration in college A against season in B and an expired enrollment deadline; both denied.
7. Two concurrent registrations for same learner and season; exactly one record/consent decision.
8. A drive attendance replay must not double-increment debarment's `drives_counted`; a lifted debarment remains auditable.
9. Approve an external offer request twice; at most one verified external placement created; reject a learner/college mismatched request.
10. A verified outside offer raises held CTC/cascade under the same rule as an accepted campus offer; unverified/retracted outcomes do not count.
11. Changing a pending DB04 academic profile must not change eligibility until verification becomes effective.
12. Two offers contend for a single candidate's joining/acceptance; prevent inconsistent state, preserve actor and revocation audit.
13. Save/unsave a job under concurrent requests and an inaccessible college; bookmarks remain unique and unauthorized writes fail.
14. An interview appointment is rescheduled: previous time, actor, feedback provenance and candidate-specific slot survive.
15. Migration replay from clean PostgreSQL; repeated migration/snapshot diff; cold-start test of all FK/unique/check constraints.

## DB08-A staged implementation checkpoint (2026-10-10)

**Code authored, not yet migrated or executed.** This distinction is a release gate, not a minor caveat.

- `src/db/schema/placement-eligibility-actions.ts`: separate idempotent action header and before/after event ledger, original actor/time snapshots, undo timestamps, composite `(action_id,college_id)` foreign-key constraints. `placement_eligibility_decisions.last_action_id` records causal history.
- `src/modules/placements/eligibility-action-validation.ts`: Zod scope/type validation, normalized reason/note, duplicate-scope denial, 200-target bound and stable retry ordering.
- `src/modules/placements/eligibility-action-service.ts`: TPO/College Admin permission check, per-scope college ownership via real membership/academic joins, deterministic transaction advisory locks, replay-safe action IDs, atomic bulk decisions and stale-safe undo. No new HTTP route intentionally exposed until migration exists.
- `docs/planning/database-parity-db08-staged-migration.sql`: **non-active** PostgreSQL DDL review artifact. Do not apply manually to production or move into `drizzle/` without regenerating numbering/journal from a fresh shared base.
- `tests/unit/placement-eligibility-actions.test.ts`: validation/reason/duplicate/canonical payload regression cases authored.
- `tests/integration/placements-db08-actions.test.ts`: seven **gated and currently skipped** DB tests (requires `DB08_SCHEMA_READY=1`, `DB08_ISOLATED_TEST_DATABASE=1`, `TEST_DATABASE_URL`). Covers replay, undo ordering, tenant substitution, atomic validation, mismatched payloads, FK rejection, role denial. **Not run**.
- Existing `src/modules/placements/access-service.ts` has explicit MEMBER > SECTION > COHORT precedence independent of caller ordering, with regression tests authored but **not run**.

**Known required follow-ups before merge:** Drizzle-generated numbered migration and snapshot; replay on clean PostgreSQL; typecheck/lint/unit DB suite and CI; test effects from legacy TPO/learner endpoints and browser. The Drizzle source currently describes tables not present on DBs migrated only to the shared journal. Do not publish the new service via API until migration and tests pass.

**Concurrency/source drift:** DB08 branch forked at `c489b2569dd2d2742da2ee17ed313a26853dc4da`. While authoring, shared `db-parity-2026` advanced to `1a0f00557babf68407ad8189c80c973e1324a18c` (14 commits beyond the fork when observed). Integration must inspect the **newest** shared head and review DB03/DB04 changes, not rebase blindly.

## DB08-B/C/D/E staging checkpoint — 2026-10-10

**Source parity:** 18 legacy candidate tables, 280 source-derived fields. Independent ledger now has **68 MAPPED (reviewed staged destinations), 14 BLOCKED (specific structural/behavioral mismatches) and 198 UNMAPPED**. These are field-reconciliation states, *not* database/application completion percentages. Zero DB08 migration, DB tests or end-to-end workflow gates have been verified.

### Newly authored files and semantics

- `src/db/schema/placement-db08-lifecycle.ts`: placement-specific batch lifecycle (cohort keyed); per-learner-per-season registration/consent/outcome; debarment with date/drive count/lift history and unique counted drive receipts; verified off-campus placement with soft revocation and private object-path field. External CTC uses BIGINT annual INR to preserve legacy DECIMAL(10,2) LPA numerical range (still needs policy integration).
- `src/db/schema/placement-saved-jobs.ts`: dedicated learner bookmark table, independent of applications and job preferences.
- `src/modules/placements/db08-batch-registration-service.ts`: TPO college+cohort ownership checks; explicit batch invite/finish; learner vs TPO registration control; active program enrollment and deadline gate; repeated identical consent does not rewrite the original timestamp.
- `src/modules/placements/db08-debarment-service.ts`: historical lift; date-based and counted-drive restrictions; transaction row lock and one receipt per job under the debarment. **Still requires confirmation that a job corresponds to exactly one legacy counted drive.**
- `src/modules/placements/db08-external-outcome-service.ts`: TPO-only verified outside placement, revocation and policy-neutral union of accepted on-campus and verified off-campus CTC evidence. **No placement-cascade policy wired**; `EXTERNAL_OFFER` request type remains unavailable in current vNext learner request model.
- `src/modules/placements/db08-saved-job-service.ts`: learner bookmark save/unsave/list; job must be published for initial save; unique per learner/job.
- `src/modules/placements/db08-lifecycle-validation.ts`: UUID/choice/date/consent/debarment/amount validation.
- `docs/planning/database-parity-db08-lifecycle-staged-migration.sql`: **review artifact only**, not a numbered migration.
- `tests/unit/placement-db08-lifecycle.test.ts` and `tests/unit/placement-db08-schema.test.ts`: contracts and schema declarations, **not executed**.
- `tests/integration/placements-db08-lifecycle.test.ts`: isolated-Postgres gating for missing/finished batch, consent replay, registration deadline and cross-college cohort. **Requires DB08_SCHEMA_READY=1, DB08_ISOLATED_TEST_DATABASE=1, TEST_DATABASE_URL and a fresh actual schema migration.**

### Important unresolved correctness and parity work

1. DB00 actual legacy live physical schema still not introspected; legacy Hibernate ddl-auto=update prevents full physical coverage proof.
2. Raw PostgreSQL cross-tenant polymorphic/reference ownership for batch/cohort, registration/season/membership, external outcome/membership and bookmark/job needs **database-level guardrails** in DB11, beyond service checks. Do not expose the new APIs until this is proven.
3. DB04 private uploaded evidence verification and original grades/CGPA source of truth are not integrated. The external outcome service currently accepts a namespaced object key but has no verified object receipt. This is a **blocker**, not completed private evidence.
4. DB09 college placement rules, held CTC, uplift, counts-as-placed and registration/outcome configuration are not yet integrated. A policy-neutral evidence union does not prove parity.
5. The legacy V188 batch model displaces parts of V161 seasons. vNext season has one ACTIVE per college whereas legacy supported more than one open season with an independent `is_current` filter. Mark as a product-state divergence until reviewed, not an automatic design improvement.
6. Legacy individual learner interviews, role/job settings, screenings, offer version/financial components and remaining fields still require semantic proof. There are 198 UNMAPPED source fields in this ledger.
7. GitHub Actions CI reports failure on current DB08 commits. The job-step API returned no steps and the redirected log could not be fetched, so **code failure vs runner/billing infrastructure failure is unresolved**. No passing lint/typecheck/unit/build/Postgres proof can be claimed.
8. Avoid edits to shared `drizzle/meta/_journal.json` during parallel DB03/DB04 development. Regenerate numbered Drizzle migration and run disposable-DB replay after reconciling latest shared head.
9. New DB08 B/C/D/E services have **no public HTTP endpoints by design** until migrations, tenant DB integrity and tests are green. Never count staged source as released functionality.

## Coordination handoff

- [x] Branch isolated, GitHub issue claim established.
- [x] Current legacy/backend, legacy/frontend and vNext base SHAs pinned.
- [x] Initial 18-table disposition and high-priority invariants documented.
- [x] Eligibility pure resolver now enforces explicit MEMBERSHIP > SECTION > COHORT precedence independent of input chain ordering (`src/modules/placements/access-service.ts`).
- [x] Three additional precedence/fallback/NOT_DECIDED unit regression cases authored in `tests/unit/placement-access.test.ts`; **not executed**.
- [x] Two automated tracker-gate tests authored in `tests/unit/placement-db08-ledger.test.ts` (every table/field accounted for; no evidence-free verification); **not executed**.
- [x] Bulk eligibility action/event schema, transaction service, and stale-safe undo **authored on branch only** (migration and runtime proof pending).
- [ ] 280/280 source fields fully workflow-verified (68 staged MAPPED, 14 BLOCKED, 198 UNMAPPED, 0 DB_TESTED/WORKFLOW_VERIFIED).
- [ ] DB08 schema/API implemented.
- [ ] PostgreSQL and role/tenant tests executed.
- [ ] Full legacy FE/API workflow comparison + acceptance sign-off.
- [ ] Rebased against new DB03/DB04 and migration journal regenerated.

The shared `database-parity-master.md` is not modified in a parallel branch. Integrator should update the central domain queue **after** reviewing the DB08 draft PR, not mark DB08 DONE merely because this claim or audit exists.
