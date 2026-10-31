# DB-014 — cross-domain tenant/FK integrity sweep

## DB014 0328–0329 identity and actor-grant hardening — 31 October 2026

Registered forward-only migrations now additionally protect immutable
`activity_events` identity and `lms_group_member_events` actor-role grants:

- `0328_db014_activity_identity_immutable.sql` denies direct UPDATE to
  persisted tenant/actor/subject/idempotency identity (23514), preventing
  notification references from being re-scoped after delivery. The legal
  metadata/delivery-status UPDATE remains unaffected.
- `0329_db014_group_history_actor_grants.sql` locks the group and the actual
  active user/college-membership/role grant (or the platform SUPER_ADMIN
  grant) before accepting a non-SYSTEM history actor. The SYSTEM actor
  remains NULL-user and the audited member-type/college checks from 0318
  remain active. This prevents same-college actors from forging elevated
  audit roles or revoking a grant concurrently with accepted attribution.
- Both migrations have chained, no-structural-column-change Drizzle
  snapshots 0328 and 0329; both are journal-registered.
- Source witnesses: `tests/db014-activity-identity-source.test.mjs` and
  `tests/db014-group-history-actor-grants-source.test.mjs`, alongside
  registered PG17 negative suites with actor-change, metadata-positive,
  role-impersonation and 55P03 grant-revocation cases.

**Executed earlier retention acceptance:** [DB014 PG17 run 41151271993](https://github.com/42Students/lms-vnext/actions/runs/41151271993)
was SUCCESS through the **0326** journal, with 11 parent DELETE fences,
10 TRUNCATE fences, real 23514 negative deletes, two-session 55P03 races,
registered tenant scope and activity dedupe negatives, and idempotent
migration replay. Do not present this older exact-SHA run as acceptance
for newly registered 0328 or 0329.

**Latest migration replay evidence:** [DB020 PG17 run 41151964447](https://github.com/42Students/lms-vnext/actions/runs/41151964447)
was SUCCESS through **0328**, including clean replay/idempotence and canonical
generation/cat-alog checks. It does not execute DB014's new 0328 identity
negative or 0329 actor-grant negative. A new exact-journal DB014 workflow
run is needed to close those gates.

**Still OPEN:** 0329 registered replay and new runtime negative tests,
full producer/consumer retention and authorization acceptance, and the
independent DB001/DB018/DB019/DB020/DB045/global database gates.
The source-authored tests are not counted as executed PG17 success.

## Registered 0325 parent-delete retention fences — 31 October 2026

The registered `0325_db014_cascade_retention_fences.sql` closes an unsafe
CASCADE parent-deletion path without changing existing foreign-key shape:
an enabled `BEFORE DELETE` trigger refuses to hard-delete the parent while
a protected operational/history child exists (SQLSTATE 23514). Ten parent
tables also refuse `TRUNCATE` (which bypasses row-level DELETE triggers).
Deletion of an empty draft parent still works. These guards prevent
**parent-triggered erasure**, but do **not** block deliberate direct child
DELETE/TRUNCATE or replace API permissions, privacy retention policies,
producer authorization, or release-level audit evidence.

The current registered catalog has **21** cascade FKs (not the historical
snapshot-0040 count of nine). Every registered edge is explicitly classified:

| Child → parent | FKs | DB014 retention disposition |
| --- | ---: | --- |
| `assignment_submission_links → assignment_submissions` | 1 | Protected: submission receipt/evidence must not disappear through parent deletion |
| `attendance_records → section_schedule_events` | 1 | Protected: marked attendance; DB045 immutable ledger remains the definitive producer acceptance |
| `attendance_sessions → section_schedule_events` | 1 | Protected: whole-roster marking status |
| `course_discussion_messages → course_section_deliveries` | 1 | Protected: persisted classroom contribution including deleted/hidden message history |
| `placement_cell_announcement_reads → announcements` | 1 | Protected: announcement delivery/read receipt |
| `placement_cell_announcement_reads → colleges` | 1 | Protected: college-scoped read receipt |
| `placement_drive_day_coordinator_assignments → placement_jobs` | 1 | Protected: coordinator/drive assignment |
| `placement_drive_day_coordinator_assignments → college_memberships` | 1 | Protected: assignment tied to learner identity |
| `placement_round_attendance → placement_applications` | 1 | Protected: interview/check-in status evidence |
| `placement_round_attendance → placement_job_rounds` | 1 | Protected: round check-in status evidence |
| `platform_broadcast_targets → platform_broadcasts` | 1 | Protected: persisted delivery-target evidence |
| `cohort_progression_state → cohorts` | 1 | Derived current-state snapshot; keep cascade subject to cohort deletion authorization |
| `lesson_content_delivery_sequences → lesson_contents` | 2 | Derived display-order mapping, including paired composite FK; cascade together |
| `lesson_content_delivery_sequences → course_section_deliveries` | 2 | Derived display-order mapping, including paired composite FK; cascade together |
| `lesson_content_materials → lesson_contents` | 1 | Owned lesson content material, not independently immutable audit; source cleanup only |
| `log_alert_daily_counts → log_alert_signatures` | 1 | Derived log-signature aggregate; purge with signature |
| `log_alert_signature_accounts → log_alert_signatures` | 1 | Derived signature/account summary; purge with signature |
| `placement_job_role_options → placement_jobs` | 1 | Job-owned option; validated application role-option FKs RESTRICT deletion of referenced offers |
| `section_schedule_event_courses → section_schedule_events` | 1 | Owned course schedule link; DB045 attendance history FK RESTRICT protects audited links |

**Implementation/test surface:** `tests/db014-cascade-retention-source.test.mjs`,
`tests/db014-cascade-retention-registered-pg.test.mjs`, and the DB014
PostgreSQL 17 workflow. The generic DELETE guard is additionally exercised
against a disposable synthetic parent/child FK that actually cascades, with
the rejected DELETE retaining both rows, an accepted empty-parent DELETE,
and a rejected TRUNCATE, all under ROLLBACK.

**Acceptance remains open** for the newly registered 0328/0329 runtime
negatives and full producer/consumer/authorization signoff. The earlier 0325
retention and cascade race checks did pass on disposable PG17; do not claim
latest-head acceptance from that earlier run.

## Registered PostgreSQL 17 integration update — 31 October 2026

The earlier snapshot-0040 findings below remain a historical baseline and **must
not** be mistaken for the current registered catalog. The exact-main disposable
PostgreSQL witness now passes on 319 registered journal entries:

- `0317_db014_placement_fk_validation.sql` permanently validates the two
  preexisting `placement_applications` role-option and current-round same-job
  foreign keys. A locking, fail-closed dirty-row preflight runs first.
- `0318_db014_cross_domain_event_guards.sql` registers three tenant/scope
  triggers: activity actor membership, in-app notification recipient, and
  group-member history actor/member/role. It refuses a nonempty unreviewed
  affected ledger at migration time rather than inventing retrospective audit
  evidence. SQL source parser regression protects PL/pgSQL quoting.
- <https://github.com/42Students/lms-vnext/actions/runs/41129019399>:
  zero-to-head replay and migration idempotence PASS, 319/319 applied,
  PostgreSQL 17 registered catalog 276 tables/732 FKs/116 composite FKs,
  zero unvalidated FKs, three active guards, two formerly NOT VALID FKs
  validated, and five staged/registered negative and two-session race
  subtests passed. The staged test now exercises **registered** guards rather
  than installing duplicate rollback-only triggers.

This is **substantial DB-014 integration evidence**, not global DB-014
acceptance. There are still 21 registered CASCADE FKs whose ownership and
retention behavior needs explicit disposition; global tenant/actor/producer
authorization and uniqueness semantics need wider domain-level negatives.
DB-018 and DB-020 have not certified the overall database phase. The source
stage and final certification are separate.


**Observed:** 2026-10-11 IST  
**Global phase:** DATABASE · **Worker:** Chat 1  
**Registered journal head:** `0040_db03_history_actor_types`  
**Machine artifact:** `docs/planning/database-parity-db014-tenant-fk-sweep.json`

This is a **source/registered-schema reconciliation**, not PostgreSQL certification. DB-001 still prevents migration replay, direct negative writes and catalog introspection.

## Fresh registered baseline

The old Pass-3 FK audit was frozen at Drizzle snapshot 0036. The current registered snapshot is **0040**:

| Metric | 0036 | 0040 |
| --- | ---: | ---: |
| Tables | 84 | **90** |
| Foreign keys | 195 | **211** |
| Composite FKs | 0 | **0** |
| CHECK constraints | 172 | **201** |
| Unique indexes | 91 | **97** |
| Tables with `deleted_at` | 0 | **3** |
| Multi-parent tables | 41 candidate rows in old audit | **65 structural multi-parent tables** |

The six registered tables added since 0036 are the DB03 group/elective foundation: `lms_groups`, `lms_group_members`, `lms_group_member_events`, `lms_group_rules`, `elective_slots`, and `elective_offerings`.

## Composite-FK finding

Snapshot 0040 still contains **zero composite foreign keys**. A normal FK proves that each referenced row exists, but it does not prove that two independently valid parents agree on:

- college/tenant;
- project;
- placement job/round/application;
- course delivery/cohort/term;
- group/elective scope.

This does **not** mean all 65 multi-parent tables are broken. The sweep preserves three classes:

1. **41 existing Pass-3 candidates** where cross-parent semantics were already identified and still need proof.
2. **4 new DB03 cross-parent candidates:** `lms_group_members`, `lms_group_member_events`, `elective_slots`, `elective_offerings`.
3. **20 new multi-parent context rows** where the additional parent is commonly an actor/history/user context. These need authorization/retention review, but a same-college equality rule must not be invented from shape alone.

## Registered trigger guards are invisible to snapshots

Drizzle snapshot JSON does not describe user-defined triggers. Registered migration `0039_db03_scope_triggers.sql` materially improves four relationships:

- `lms_group_members`: group college ↔ membership college, active membership/user, member role/type;
- `elective_slots`: slot college ↔ program/academic-period college;
- `elective_offerings`: slot/group/course/delivery plus delivery/section cohort/period consistency;
- `project_instances.team_group_id`: team group must be same-college, COLLEGE-owned and PROJECT_TEAM kind.

These guards are **registered source**, not executed proof. DB-001 still prevents confirming that they replay and reject forged writes in PostgreSQL.

One new gap remains explicit: `lms_group_member_events` has group + membership + actor parents but no equivalent registered DB03 tenant trigger. Service emission is transactional, yet a direct SQL writer can only be ruled out by a DB guard or accepted threat-model decision plus negative evidence.

## Cascade / retention review

Snapshot 0040 has **9 ON DELETE CASCADE** FKs. Seven edges touch operational/history-like children and require an explicit hard-delete/retention contract:

- attendance sessions → schedule event;
- attendance records → schedule event;
- course discussion messages → delivery;
- drive-day coordinator assignments → job;
- drive-day coordinator assignments → learner membership;
- placement round attendance → round;
- placement round attendance → application.

Cascade is not automatically wrong. It becomes dangerous if a parent can be hard-deleted after the child becomes audit/history evidence. Later runtime acceptance must prove the parent is never hard-deleted in those states, or change the retention strategy.

The three current soft-delete tables are `lms_groups`, `elective_slots`, and `elective_offerings`; none is directly touched by the nine current cascades.

## Tenant-scoped unique review

Five unique indexes live on tables with a direct `college_id` but omit `college_id` from the index:

- tenant domain host;
- project team-group uniqueness;
- activity event dedupe key;
- placement eligibility-decision scope;
- drive coordinator job/member/date.

The first two are plausibly intentionally global (host and team-group IDs are globally unique). The others rely on globally unique parent/scope identifiers or a globally constructed key. They are **review items, not defects** until their producer contracts prove the intended namespace.

## Snapshot/version-history warning

Registered schema history now includes DB03 triggers that snapshots cannot express. Any future “snapshot equals database” check must compare:

1. Drizzle snapshot/table/FK/index/check state;
2. numbered migration journal and SQL;
3. user-defined triggers/routines from `pg_catalog`;
4. executed zero-to-head replay.

A snapshot-only diff can miss an enforcement regression even when table/column/FK counts are unchanged.

## Completion boundary

DB-014 can be source-complete when this refreshed classification and its static guard are merged. It **cannot be DONE_VERIFIED** until disposable PostgreSQL executes:

- zero-to-head migration replay;
- catalog/trigger introspection;
- forged cross-tenant/cross-parent negative writes;
- cascade/retention witnesses;
- uniqueness namespace witnesses where ambiguity remains.

Those executed gates remain blocked by DB-001 and belong to the later DB-018/DB-020 acceptance flow.
