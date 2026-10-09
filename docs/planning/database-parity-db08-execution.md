# DB08 — Placement policy and outcomes: source-backed parity workstream

**Owner:** parallel workstream `db08-placement-parity-2026` (separate from DB03 and DB04).  
**Baseline:** vNext `db-parity-2026@c489b2569dd2d2742da2ee17ed313a26853dc4da`; legacy `lms@prod-2026:21bad59d4dfaf2fa11fdeaf9353327ce105697d5`; vNext canonical source baseline `5ca60b0f39a25c7b8dc1d0e26f4bbdfe8e5ec15a`.  
**Status:** **SOURCE-AUDITED / NOT IMPLEMENTED OR DATABASE-VERIFIED IN THIS WORKSTREAM.** Never interpret this as a completed DB domain.  
**Machine-readable companion:** `docs/planning/database-parity-db08-field-ledger.json`.

## Domain contract and critical discovery

The vNext placement system is not yet behaviorally equivalent to the **latest** legacy placement model. Legacy `V188__placement_batches_and_eligibility.sql` and `docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md` explicitly *replace placement seasons* with academic batches, per-batch registration and eligibility inherited from BATCH → CLASS → LEARNER. The vNext `placement_seasons` table and `season-service.ts` still make a season an obligatory grouping and enforce **only one ACTIVE season per college**. This is a genuine source-contract mismatch; do not close it by adding fields to the season table alone.

Legacy two-gate learner access is (1) college-level Placements module paid/enabled and (2) learner's **resolved** eligibility is ELIGIBLE. `NOT_DECIDED` and `INELIGIBLE` hide the student Placements surface. Per-job `placement_job_eligibility_policies` / `placement_eligibility_overrides` in vNext are **not equivalent** to college placement eligibility. Preserve these as a separate second-stage qualification gate.

The legacy batch/class/learner decision is inherited (LEARNER first, CLASS next, BATCH last); changing batch eligibility affects future and existing learners who have no more-specific overrides. A bulk change is one action ID with a durable event per affected scope and **atomic undo**. Clearing a decision returns to NOT_DECIDED and must not insert a stored third status.

## Source inventory — 18 tables / 280 field candidates, no semantic fields certified

| Legacy table | vNext candidate / disposition | Priority |
| --- | --- | --- |
| `placement_eligibility` | No equivalent global scoped-decision table; job-level policy is NOT equivalent | P0 |
| `placement_eligibility_event` | No equivalent bulk-action + undo event table | P0 |
| `placement_batch` | No equivalent per-academic-batch registration/rules lifecycle table; `placement_seasons` is not equivalent | P0 |
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
2. Model current scoped eligibility decisions with **one of** `cohort_id` / `section_id` / `membership_id` present (CHECK exactly one), real FKs, college owner, `ELIGIBLE|INELIGIBLE`, mandatory trimmed reason for INELIGIBLE, optional note, deciding user and timestamp, unique active decision per scope. Avoid a polymorphic `scope_type+unconstrained scope_id` FK hole.
3. Model append-only events with action ID, before/after status+reason+note, actor, timestamps, inverse/undone relationship; preserve bulk actions. Undo must ensure no intervening conflicting decisions; lock all affected scopes in stable order and transact decision+event changes together. Reject cross-tenant writers and inactive actors. Never delete history on undo.
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
