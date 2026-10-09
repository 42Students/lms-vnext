# Database parity — Pass 3: hidden invariants and adversarial integrity

**Date:** 2026-10-09 IST. **Pass:** 3 of 5; this is the **first** of three additional sequential passes.  
**Result:** SOURCE AUDIT COMPLETED; database behavior NOT TESTED.  
**Legacy BE SHA:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**vNext schema SHA:** `5ca60b0f39a25c7b8dc1d0e26f4bbdfe8e5ec15a`  
**Audited:** Drizzle snapshot 0036, selected legacy group/elective/placement/profile services, selected vNext placement/academic/project services and integration tests, migration-side behaviors documented in Pass 2. No database live access or PostgreSQL execution occurred.

## Snapshot-level evidence (not a live DB measurement)

| Property | Source count |
| --- | ---: |
| vNext committed Drizzle tables | 84 |
| FK constraints | 195 |
| Single-column FKs | 195 |
| Composite FKs | 0 |
| CHECK constraints | 172 |
| FKs with ON DELETE CASCADE | 9 |
| Tables with >= 2 meaningful parents requiring integrity review | 41 |
| Priority cross-parent consistency scenarios shortlisted | 10 |

**Important:** Zero composite FKs does NOT imply missing authorization or a vulnerability. Source services can and do enforce some parent relationships, but ordinary independent FKs only check that referenced rows exist. A later bypass, new service, import, race or privileged SQL writer can still create invalid parent combinations unless robust application/domain DB invariants are tested.

Machine-readable full 84-table FK graph: `docs/planning/database-parity-pass3-fk-audit.json`.

## New / further-evidenced findings

### P3-01 CRITICAL — polymorphic decision target has no target-table FK

`placement_eligibility_decisions(scope_type,scope_id)` permits `MEMBERSHIP` / `SECTION` / `COHORT`, while the only FKs are to `colleges` and `users`. The snapshot does **not** enforce that `scope_id` exists in the corresponding tenant or matches `college_id`. `src/modules/placements/access-service.ts` reads decisions by college and source IDs and therefore assumes the writer accepted valid scope targets. This is a **confirmed lack of schema-level referential enforcement**, not confirmation that any current HTTP path is unsafe. Require a trusted table-aware target resolver on all writers; reject cross-tenant/deleted targets; verify precedence and effective time; consider normalized typed child tables, a constrained discriminator table or deferrable checks/trigger if needed. Test direct SQL invalid IDs, not only valid API writes.

### P3-02 HIGH — multi-parent tables can combine individually valid but mutually inconsistent FKs

Examples: `project_members` project + membership; `section_enrollments` learner program + section + period; `course_section_deliveries` offering + section; `placement_round_attendance` round + application; `placement_application_round_exceptions` application + round; `assignment_submissions` learner + assignment + submission context; `quiz_attempts` learner + quiz. Need prove **same college AND same logical owning job/offering/cohort/period**.

**Counter-evidence requiring fair interpretation:** vNext `src/modules/projects/member-service.ts` checks membership-college equality, and `src/modules/courses/delivery-service.ts` explicitly compares offering/section college, cohort and period. These show service-level precautions already present, **not absence of checks everywhere**. Pass 3 therefore calls for a matrix across *all writers* plus DB-negative tests; do not label current code insecure based on snapshot alone. Priority queue in JSON covers 10 relationships; remaining 31 are discovery candidates.

### P3-03 HIGH — legacy placement-season rules conflict with vNext service AND DB

Legacy `V161__tpo_v1_drives.sql` says **several seasons may be open** and `is_current` controls default filtering. vNext `placement_seasons_active_college_uq` is unique per college where status=ACTIVE; `src/modules/placements/season-service.ts` rejects a second ACTIVE season, and `tests/integration/placements-p9-seasons.test.ts` asserts `PLACEMENT_SEASON_ACTIVE_EXISTS`. This is a **proven implemented behavioral divergence**, not merely a missing check. Determine whether newer legacy source changed the product rule, or explicitly approve redesign. If parity required, separate active registration vs default season; revise unique index, service, tests and data queries.

### P3-04 HIGH — elective max-pick race requires cross-group serialization

Legacy `ElectiveJoinPolicy.beforeJoin` computes membership counts across sibling offering groups, counting ACTIVE and WAITLISTED. `GroupMembershipService.join` calls this check before the group's atomic `claimSeat`. Locking the individual group's seat alone **does not necessarily serialize** two concurrent joins for different groups in the same slot. The vNext replacement must enforce a **common slot/learner lock** or a separate membership ledger uniqueness/capacity strategy; race-test `max_pick=1` with two concurrent joins and require exactly one success. This is a plausible race in the legacy source path, not proven exploitation.

### P3-05 HIGH — group membership history and state side effects are a transactional contract

Legacy `GroupMembershipService` preserves one row per group/member, enforces locked REMOVED, atomically claims/releases seats and emits an append-only event for transitions. An ACTIVE removal promotes the waitlist head in the same operation. `GroupRuleService` skips locked/non-RULE members and purposely performs per-member transactions during a batch. VNext must preserve user-visible partial-failure reporting and recoverability even if redesigned with an all-or-nothing transaction. Require idempotent repeated join/leave, exact event count, locked state, rule priority, notifications and deterministic race behavior.

### P3-06 HIGH — placement bulk undo is a concurrency-sensitive operation, not a simple history table

Legacy `PlacementEligibilityService.undo` requires a supplied action ID to equal the **latest not-undone action at that college**, reverses every affected scope in reverse event order, and records `undone_at`. The feature's correctness relies on per-college ordering and same-transaction reversals, including restoring absence (deleting a decision). DB08 must store change group ID, before and after, actor, timestamp, latest-action guard, idempotent undo and competing undo/change semantics. Race-test two different concurrent actions and undo; never apply a stale undo to newer decisions.

### P3-07 HIGH — verification uses simultaneous pending and approved snapshots

Legacy `ProfileVerificationService` keeps **previously verified education** authoritative while an UPDATE_PENDING submission awaits review. A newly verified education snapshot updates `learner_academic_record` for placement eligibility and emits a notification; sent-back changes must not silently change verified values. VNext `learner_profiles.profile_document` and `placement_candidate_academic_evidence.source` cannot alone prove equivalence. Require dual snapshots, immutable submit/review timeline, college-allowed verifier permissions and atomic approval-to-eligibility propagation.

### P3-08 HIGH — 9 ON DELETE CASCADE relationships need retention/audit decisions

The snapshot includes cascade deletes for `placement_round_attendance` (round and application), `placement_drive_day_coordinator_assignments`, `attendance_sessions`, `attendance_records`, `course_discussion_messages` and other dependent structures. Cascade is **not categorically wrong**; but deletion of a parent may erase evidence in attendance/placement/discussions that the product is expected to retain. For each cascade, record whether parent hard deletion is reachable, audit retention needs, regulatory obligations and preferred soft-delete/archival policy. Test delete behavior on disposable DB and document positive/negative retention expectations.

### P3-09 HIGH — MySQL conditional DDL, trigger effects and optimistic versions cannot be ignored

Legacy V125 uses stored procedures and dynamic SQL to conditionally drop Hibernate-created quiz fields; V113 contains the deduplication trigger repair for company. The source JPA census identifies 26 entity types with `@Version`, along with JPA relation-owned join/collection tables. A static model/CREATE TABLE parser misses these. Determine active trigger/routine/view/event state from actual MySQL and document equivalent Postgres partial uniqueness, transaction/optimistic concurrency or service semantics. No historical backup structures need be copied by default.

### P3-10 MEDIUM — timezone/precision and effective-date semantics lack verified equivalence

Legacy MySQL `DATETIME` and Java `LocalDateTime` contrast with vNext `timestamp with time zone`; business deadlines (group self-join until, applications, assessment due, schedule, placement registration) must specify campus-local interpretation, timezones and inclusive/exclusive boundaries. Raw academic grade scale and normalized basis points need explicit rounding and conversion provenance; a field-type match is insufficient.

### P3-11 MEDIUM — domain test suites exist, but integrity coverage has not been fully exercised

VNext includes `tests/integration/database-constraints.test.ts` for foundational tenants, `academics-a2.test.ts`, and `placements-p9-seasons.test.ts` with intentionally single-active-season expectation. This is a positive testing foundation. However **there is no execution evidence in this audit**, no branch CI runs, and no proof the 41 parent-combination cases or 9 cascades were tested. Add targeted cross-table SQL-negative tests and run on clean PostgreSQL before certification.

### P3-12 MEDIUM — crosswalk must preserve renamed recruiter semantics and historic state

V193 changes 7 table and 13 column names from HR/LEAD to Recruiter; 24 code-value update statements are recorded. Review enumerated/stored action codes and historical audit reads, not only table names. The same import or log type can be persisted under old values and later be read through the new interpretation.

## Completion standard for Pass 3

- **Source analysis and inventory:** COMPLETE, limited to evidence listed here.
- **Pass-specific FK graph recorded:** COMPLETE (84 tables, 195 FKs, 41 multi-parent queues).
- **Critical findings filed with source paths:** COMPLETE.
- **Actual PostgreSQL integrity tests:** NOT RUN.
- **Legacy production MySQL metadata:** NOT PROVIDED / NOT VERIFIED.
- **Any business data parity:** NOT VERIFIED.
- **Pass 4:** NOT STARTED. **Pass 5:** NOT STARTED.

Do not use `pass=3 COMPLETE` to claim database parity. This means the **source-oriented adversarial review** is complete; every issue remains tracked for implementation and proof.

## Next distinct passes — do not begin until requested

**Pass 4:** Exhaustive field-by-field and type/null/default/computed/index/cascade diff across the 199 source candidates, classify historical vs active, crosswalk legacy UI/API writers/readers and vNext domain flows, document disputed designs. Prioritize DB01/DB02/DB05/DB06.

**Pass 5:** Threat/race/retention/migration replay audit: invalid tenant parents, stale optimistic versions, transaction boundaries, timezones, restore/delete, massive imports, index/EXPLAIN plans, real clean PostgreSQL tests and final readiness gate. Re-run at freshly pinned heads. No success claims if DB unavailable.
