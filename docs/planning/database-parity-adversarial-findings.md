# LMS vNext — Adversarial database parity findings

**Audit batch:** 2026-10-09, `db-parity-2026`  
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**vNext baseline:** `42Students/lms-vnext@5ca60b0f39a25c7b8dc1d0e26f4bbdfe8e5ec15a`  
**Evidence:** MySQL migration sources, selected JPA entities, vNext `drizzle/meta/0036_snapshot.json`; **no live DB or executed tests yet**.

### F-001 — CRITICAL — dual legacy schema management makes source-only schema completeness unverifiable

`src/main/resources/application.properties` configures `spring.jpa.hibernate.ddl-auto=update` and `spring.flyway.enabled=true`. Hibernate may materialize fields not created in Flyway; migration history is not an authoritative physical table list. Full read-only `information_schema` capture is mandatory.  
**State:** DIAGNOSED; physical DB verification BLOCKED pending export.

### F-002 — HIGH — group/elective kernel not represented as the legacy relational concept

`V166__groups_kernel.sql` has group/membership/history/rule; `V167__electives.sql` adds slot/offering and group-backed classes. Latest vNext Drizzle schema has no corresponding six dedicated tables. Current ordinary section/course enrollment tables do not by themselves demonstrate configurable groups, waitlist, capacity-claim, rules, locked members, audit history or elective baskets.  
**State:** DESIGN_GAP; no implementation yet.  
**Required:** field/behavior crosswalk; atomic capacity/waitlist + membership lifecycle; type-safe owner scope; section/group roster consumption; tests for concurrent joins and locked-removal.

### F-003 — HIGH — Education/Identity verification has no clearly corresponding full state/history tables

Legacy `V187__profile_verification.sql` creates `profile_verification` and `profile_verification_event` with submitted/verified snapshots, submit/sent-back/update-pending semantics and actor audit. vNext `learner_profiles.profile_document` plus `placement_candidate_academic_evidence.source` do not establish those semantics or immutable history. **Legacy `LearnerVerification` is OTP/account verification, not this workflow.**  
**State:** DESIGN_GAP. Require documents/storage and authorization before verification can be called operational.

### F-004 — HIGH — placement eligibility bulk-event/undo and batch lifecycle lack obvious persistence

Legacy `V188__placement_batches_and_eligibility.sql` has `placement_eligibility_event` with action_id, before/after, actor and undo; `placement_batch` with registration/invited/finished dates and batch-specific rules. vNext `placement_eligibility_decisions` stores a decision but does not model those histories/lifecycle as dedicated records in the latest snapshot.  
**State:** DESIGN_GAP; verify any alternative event modeling before adding tables.

### F-005 — HIGH — placement-season cardinality potentially conflicts with legacy behavior

Legacy `V161__tpo_v1_drives.sql` documents: multiple seasons may be open; `is_current` only selects default filtering. vNext has unique index `placement_seasons_active_college_uq` on `college_id` **where status = 'ACTIVE'**, allowing at most one active placement season per college. This is a concrete **schema-policy mismatch** unless legacy changed materially in later code/migrations.  
**State:** CONFIRMED_DIFFERENCE, intent/revised-spec VERIFY. Do not drop a useful invariant until verifying current product behavior; model `is_current` separately if the product still permits concurrent seasons.

### F-006 — HIGH — raw student academic grades/college-specific conversion may lose fidelity

Legacy `V192__academic_marks_as_earned.sql` persists `learner_academic_record.marks_json` with original marks/scale/max, plus `tpo_college_settings.cgpa_to_pct` conversion policy. vNext `placement_candidate_academic_evidence` stores CGPA hundredths and percentage basis points but has no obvious original *per-education-level* grade representation or college-specific conversion policy. Distinct raw/normalized values must be preserved to avoid corrupting eligibility, visibility or exports.  
**State:** SEMANTIC_GAP_TO_CONFIRM; deeper field-level comparison required.

### F-007 — HIGH — composite tenant and parent-child consistency not enforced by several individual FKs

vNext snapshot has ordinary FKs linking `project_members.project_id` to projects and `membership_id` to membership, but no schema-level composite constraint ensuring their college matches. Analogous examples: `section_enrollments` (learner program, section and academic period), `course_section_deliveries` (offering and section), `placement_round_attendance` (round and application), `placement_application_round_exceptions` (round and application). Individual FK validity alone does **not** enforce that both parents share a tenant or underlying job/course.  
**State:** SCHEMA-LEVEL GUARD GAP; **not proof of an exploitable bug** because services might validate. Review service transactions, negative tests and whether composite FKs or trigger/transactional guards are needed. Unit tests alone are insufficient.

### F-008 — MEDIUM — TPO operational domain decomposition needs exact persisted producer/consumer contracts

Legacy `V161`/`V162`/`V165` creates lead/follow-up, company visibility/placement policy, secure share-link/audit, slots and assignments, messages, team, saved views, user prefs, notes, audit and notifications. Several concepts are not represented by distinct vNext schema tables. Some may fit `activity_events`, `in_app_notifications` or other models, but without a checked lifecycle crosswalk no parity claim is possible.  
**State:** INVENTORY_STARTED: 45 CREATE TABLE declarations and 469 created-column candidates from eight migrations now have row-level source ledger.

### F-009 — MEDIUM — original vNext engineering completion metric is not database completeness

The original checklist can mark core Projects/Academics done while the latest legacy groups, verification, privacy, eligibility, and ops structures are not mapped. Engineering task count ≠ schema completeness.  
**State:** PROCESS_FIX: new DB00–DB12 dependency gate precedes backend/UI clone sign-off.

### F-010 — MEDIUM — local generated schema and actual DB remain unverified

A committed Drizzle snapshot records 84 tables, 27 enums and 837 column definitions. These are **source evidence only**. No live vNext `information_schema` diff or migration replay execution evidence has been produced in this session.  
**State:** BLOCKED pending executable DB environment; do not mark DB11 complete.

## Next execution order

1. Obtain read-only legacy physical-schema export, then reconcile JPA/Flyway differences.
2. DB03 group/elective typed schema, migration generation and constraints + concurrent behavior tests.
3. DB04 profile verification and secure document references.
4. DB08 placement eligibility undo/batch + raw grade fidelity.
5. DB09 TPO operations and multi-season policy decisions.
6. Repeat a full source/live field/FK/index/default/enum/race/tenant audit until all blockers are closed.

A missing dedicated table means the physical model differs; a semantic capability might still exist elsewhere. Each flagged concept needs an **explicit field and workflow crosswalk** before declaring it implemented or retired.
