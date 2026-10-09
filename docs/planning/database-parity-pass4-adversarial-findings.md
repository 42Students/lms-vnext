# LMS vNext database parity — Pass 4 / 5: field-level semantic sweep

**Status:** **SOURCE FIELD SWEEP COMPLETE / SEMANTIC PARITY NOT VERIFIED**  
**Date:** 2026-10-09 IST  
**Legacy backend:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**vNext:** `42Students/lms-vnext@5ca60b0f39a25c7b8dc1d0e26f4bbdfe8e5ec15a` (Drizzle 0036)

## What was actually processed

- Source MySQL **test** snapshot (`src/test/resources/db/mysql-schema-snapshot.sql`): **137 tables / 2,138 fields**, approximately V150, not live production.
- All **44** subsequent Flyway files V151–V194: **62 new CREATE TABLE declarations with 606 typed fields**; **85 ALTER ADD COLUMN**, **6 MODIFY COLUMN**, **13 RENAME COLUMN** operations, and 25 additional ALTER clauses handled separately as indices, keys or other structural changes. Seven RENAME TABLE pairs consolidated. Dynamic SQL and prior unknown Hibernate DDL are not proven absent.
- **199 unique candidate tables; 2,829 source-derived candidate columns** after these additions and renames, split into 11 domain ledgers with table, column, MySQL type, nullability/default, provenance, history and candidate target columns. A source-derived count is **not** today's physical MySQL count.
- Manual table-level **mapping hypotheses** exist for **58/199** candidates, including intentional splits (`learner` -> user, membership and profile). The other **141** have no mapping *hypothesis*, **not** a confirmed absence from the new product.
- **321 unique legacy field names** have at least one identical-name candidate in proposed vNext tables, yielding **331 tentative source-target field pairs** (identity splits create multiple same-name possibilities). **2,508 fields lack any identical-name target in proposed table mappings**. Neither number measures achieved parity. Same-name matches are never auto-closed; renamed/redesigned/JSONB-composed data may be equivalent.
- **174 source fields** were tagged for potential personal/secret-data review, **477** temporal fields for temporal meaning review, **564** integer ID fields for UUID identity mapping. These use heuristic names/types and can over/under-report sensitive domains.
- Reconciled original model census **112 @Entity classes**, **1 mapped superclass**, **5 non-entity types** against the 199-table candidate registry. **111 tables** have a mapped production JPA entity, **49** nonbackup/Smrithi tables require a JDBC/native-service/repository writer-reader review; historical backup candidates **31**, Smrithi **7**, and Flyway history **1** require explicit decisions.
- **48** reconstructed tables contain a source `version` column; **114** contain source soft-deletion fields. Both require lifecycle/concurrency equivalence, not automatically a same-named target field.
- **0 semantic fields VERIFIED**; neither legacy nor vNext live DB was introspected; no schema migration, integration tests, CI or browser workflows executed in this pass.

### Source files

- `docs/planning/database-parity-pass4-column-index.json` — deterministic index/counts, 11 domain field ledgers.
- `docs/planning/db-pass4-columns-db01_identity_and_tenancy.json` etc. — each original field, source type/null/default/provenance, target field candidates, critical flags.
- `docs/planning/database-parity-pass4-structural-diff.json` — name-only matches and field-type/nullability observations; **NOT a semantic equivalence report**.
- `docs/planning/database-parity-pass4-active-retired-triage.json` — JPA / JDBC-only / backup / Smrithi evidence, **NO retirement yet approved**.
- `docs/planning/db-pass4-raw-ddl-*.json` — typed source SQL per migration batch.
- `docs/planning/database-parity-pass4-review-decisions.json` — granular high-risk signoff and verification queue.

## Adversarial findings with evidence and required proof

### P4-01 — CRITICAL: same-name columns miss most semantics, particularly entity splits

Legacy `learner` has 58 source columns, with **51 no name match** across `users`, `college_memberships`, `learner_profiles`; legacy `faculty` has 50, with **44 unmatched names** across the analogous split. VNext learner profile uses `learner_profiles.profile_document` validated by `src/modules/people/profile-validation.ts`; that **may** preserve many values but no column-name search can prove each key, authorizations, mutable/verified state or defaults. The correct mapping must be a versioned JSON **path** when applicable, not an invented database column.

**Proof:** every active field -> canonical path/typed column, validation rule, read/write API, privacy/tenant scope, null/default contract, tests. Decide what remains a profile vs a placement-specific read model. Do not count 51+44 as confirmed missing data.

### P4-02 — CRITICAL: generic groups and electives are genuinely absent as first-class relational structures

The six source tables contain **79 fields**: group kernel 20, member state 13, rule 8, elective slot 15, plus event/offering. VNext has no equivalent dedicated group/elective tables in snapshot 0036. A course enrollment or project team relationship does not automatically substitute for cross-program rosters, rule refresh, waitlist, capacity, elective max pick and immutable events.

**Proof:** DB03 target design needs every field/state/event mapped before migration and tested for cross-group concurrency.

### P4-03 — HIGH: profile verification event/snapshot state not represented by a separate persisted workflow

Legacy `profile_verification` **15 fields** plus `profile_verification_event` **10 fields** preserve submitted/verified snapshots and actor+event history. VNext learner profile and `placement_candidate_academic_evidence.verified_at` are not proof of the pending-vs-approved two-snapshot model. JSONB in `profile_document` is mutable profile data, not automatically a state-specific review ledger.

**Proof:** submit/sent back/resubmit/verify/update-pending transitions, reviewer permissions, audited history, verified value isolation and secure document pointers, including negative tests.

### P4-04 — HIGH: bulk placement eligibility has lost direct source event/undo mapping

Legacy `placement_eligibility` **11 columns** has eight name candidates in vNext `placement_eligibility_decisions`, but action history `placement_eligibility_event` **16 fields** lacks a dedicated target. The legacy `PlacementEligibilityService.undo` explicitly allows undo **only for the latest college action** and restores before states or absence. Must map `action_id`, previous/next decision, actor, reason, `undone_at`, transactional order and replay safety.

**Proof:** an intentionally equivalent event stream is acceptable only with cross-table/actor fidelity and ordered transaction tests.

### P4-05 — HIGH: placement batch lifecycle lacks a demonstrated equivalent

`placement_batch` **8 fields** records `registration_deadline`, `invited_at`, `finished_at`, `rules_json`. A general `cohorts` or `placement_seasons` table is not automatically an equivalent placement-batch lifecycle.

**Proof:** owner, registration scope and deadlines, invite/publish/close process, batch + class + learner overrides, historic eligibility and counterexamples.

### P4-06 — HIGH: placement season schema and policy mismatch is broader than ACTIVE uniqueness

Legacy `placement_season` **12 fields** includes `registration_deadline`, `is_registration_open`, `blocked_dates`, `is_current`, `version`. VNext `placement_seasons` has different `status` semantics, no identically named fields for those five, and a unique ACTIVE season per college. VNext season service **and tests** enforce one ACTIVE season; the V161 source comment permits several open seasons and `is_current` determines default.

**Proof:** explicit legacy/current domain decision; if keeping parity, model default independently from allowed simultaneous registration; test date restrictions and operations.

### P4-07 — HIGH: custom placement outcomes and job types need durable college-level policy

Legacy V190 `job.counts_as_placed`, `tpo_college_settings.job_types_json` and `outcome_labels_json`, plus `placement_registration.outcome_label` / `outcome_detail`, let colleges define custom job types/outcomes and whether each offer counts as placed. VNext `placement_jobs.employment_type` CHECK currently restricts to `FULL_TIME`, `INTERNSHIP`, `CONTRACT`. This is a **structural divergence** unless another typed subtype/configuration explicitly supports arbitrary college types.

**Proof:** all custom type/outcome lifecycle, per-drive override, authorization and reports, placements-count calculations, ordering/case/locale behavior.

### P4-08 — HIGH: recruiter access duration and approval require mapping

Legacy V185 / V193 `tpo_college_settings.recruiter_access_months` and `recruiter_drive_needs_approval` are policy fields; legacy `recruiter_college_access.valid_until` stores bounded membership access. The vNext `placement_recruiter_college_grants` table has status/revocation but no `valid_until` column. This **does not prove expiry enforcement absent** in service code; it requires a field/contract and proof through all access endpoints.

### P4-09 — HIGH: raw academic-grade provenance is not resolved by normalized evidence values

Legacy V192 `learner_academic_record.marks_json` preserves original grades/scale, while `tpo_college_settings.cgpa_to_pct` defines conversion. VNext `placement_candidate_academic_evidence` stores normalized basis points and CGPA hundredths with source/verified timestamp, while profile JSON validation includes gradeObtained/maxGrade. Exact *raw -> normalized -> verified* provenance and formula-version linkage across educational levels is unverified.

**Proof:** original marks unchanged, college formula/version and reproducibility, verified snapshot consistency, exports and eligibility accuracy after policy updates.

### P4-10 — HIGH: projects are a one-to-many schema redesign, not a table-name diff

The 16 project-family source tables contain **358 fields**; **77** fields have same-name target hints. Examples: legacy `project_task.submission_url`, `submitted_by`, `submitted_at` introduced in V174 while vNext stores versioned `project_task_submissions`. This can be a stronger design, not necessarily a gap. Legacy `project_workspace.team_group_id` (V191), sprint lifecycle provenance (V181), template snapshot/backfill and reversible content history **still need explicit path mappings**.

**Proof:** all source fields map to the correct vNext table+version/JSON path; reconstruct tasks/sprints/releases/workspaces/templates from committed state; rollback/restore and cross-role approvals.

### P4-11 — HIGH: historical quiz/assessment tables must be retired selectively, not cloned mechanically

The assessment/attendance queue has **21 tables / 248 source fields**, including superseded first-generation quiz/exam tables. Legacy V125 says embedded lesson-content quiz was retired, with dynamic conditional DROP COLUMN and a dropped `quiz_draft`, while first-class quiz entities remain. The V150 test snapshot also contains backup quiz data. A snapshot's physical existence cannot establish active learner capability.

**Proof:** distinguish active first-class quiz/assignment/attendance/grade workflows from legacy backup/exam surfaces by actual controllers, FE routes and service reads/writes; do not silently retire an active feature or recreate an obsolete one.

### P4-12 — HIGH: precision/timezone/identifiers require semantic conversion contracts

The **331** tentative same-name field pairs include **106** integer->UUID conversions (expected greenfield redesign but requires parentage proof), **112** datetime/timestamp differences needing locale-aware interpretation, **3** DATE-only boundary comparisons, and **96** legacy-nullable -> target-required tightenings. Tightened target nullability can be **better**, but prefill, API validation, optional legacy workflows and drafts must be verified before it is approved. No direct same-name match with source NOT NULL and target nullable was seen in this candidate subset. Salary CTC amount vs LPA and grade scale/basis points require precise money/grade conversion tests.

### P4-13 — HIGH: historic soft-delete/optimistic locking semantics risk regression

**114** candidate source tables have delete flags; **48** have `version` fields (includes snapshots/other historic candidates). Original JPA census separately identified 26 entity classes with `@Version` annotations. VNext often uses status+archived timestamps or immutable versioned child tables instead of numeric optimistic versions. This is not inherently wrong. Map **delete/restore/access/history** and **stale-write prevention** for each active business entity, including conflicting updates and cancellation.

### P4-14 — HIGH: operational/audit/notification data is under-mapped

`admin_audit_log`, `grade_audit_log`, `notification_template`, `lms_notification_template`, SMS delivery, bug tracker, log alerts, `notification_outbox`, recruiter bell/unread and email suppression have distinct persistence needs. Mapping everything to `activity_events` or `in_app_notifications` is insufficient without proving immutable event payload, receipt/read delivery status, retry, idempotency, retention and sensitive recipient scoping.

### P4-15 — HIGH: historically present candidate tables still need explicit active/retired decisions

**31** historical backup structures, **7** Smrithi tables and Flyway history are included in 199 source-derived candidate tables. No migration of historical user data is required for this clean greenfield product. However no entity should be excluded merely by name without establishing whether there is a still-active capability or regulatory retention need. **111** candidates have a JPA entity declaration; **49** others not in the designated historic categories still need source writer/reader scans (many legitimate JDBC workflows).

### P4-16 — MEDIUM: privacy/security names require independent review, not regex-only proof

**174** source columns were flagged as potential personally identifying or secret data by a conservative name heuristic. It can miss content in generic `payload_json` or `snapshot`. Map owner, college, access level, document storage, redaction, consent, deletion, export, audit and credential encryption/hashing behavior. `profile_verification_event.snapshot` and `recruiter_student_notes` may be sensitive even where column names are generic.

### P4-17 — MEDIUM: migration DDL contains more than fields

V151–V194 yielded **25** ALTER clauses not treated as column changes, commonly keys, indexes, foreign-key or index renames. The source field ledger is **not** a reconstructed physical constraint schema and cannot certify unique/partial keys, triggers, row-level policies, cascade or missing dynamic migrations. Use the Pass 3 FK graph plus read-only MySQL/PostgreSQL catalog exports and real DB tests before certification.

### P4-18 — BLOCKER: no physical or product-layer sign-off can be made yet

All **2,829** source-derived fields are tracked as **UNVERIFIED** / historical-retirement candidate. No field was signed off as semantically equivalent, redesigned or retired. The actual live MySQL schema may differ because both Flyway and Hibernate `ddl-auto=update` manage it. The actual vNext PostgreSQL schema, runtime migrations, product UI/API readers/writers and CI execution were not independently verified in this pass. This remains a **hard block** for claiming database parity.

## Pass 4 completion / handoff

**Pass 4 complete as source inventory + automated structural comparison**; **NOT completed as active-field semantic verification**. The 199 table and 2,829 field mapping questions are now concrete and reproducible instead of hidden.

- **Do not initiate Pass 5 until user asks to continue.**
- Future DB implementation batches should consume `database-parity-pass4-review-decisions.json`, the per-domain ledgers and the live catalog exports.
- Priority implementation crosswalk: DB03 groups/electives, DB04 profile verification, DB08 batch/eligibility/season, DB09 policies/recruiter, then Learner/Faculty + Projects/Course domain splits.
- A source field may map to a table column, typed JSONB path, validated computed value, managed external object or **explicitly approved retirement**. A mere matching name does not close it.
