# DB02 unregistered SQL — adversarial migration and integrity review

**Date:** 2026-10-11 · **Worker:** Chat 4 · **Task:** DB-005 (IN_PROGRESS) · **Global phase:** DATABASE  
**Draft inspected:** `scripts/sql/db02-academic-progression-and-rooms-staging.sql`, blob `7da5ab29f3c96c9177a24184a84f3811e12c4040`.  
**Classification:** SOURCE/STATIC REVIEW ONLY. **No migration replay, PostgreSQL execution, typecheck, CI or runtime verification.**  
**Cross-chat caveat:** another Chat 4 continuation edited the same staging draft concurrently. Re-check latest blob/HEAD before acting. Do not integrate a frozen historical draft blindly.

## Source-side progress

- 13 legacy DB02 table candidates/125 source fields have source-side disposition in `docs/planning/db-pass4-columns-db02_academics_and_timetable.json`; no domain-wide database runtime parity has been certified.
- Canonical DB02 progression and curriculum contract is documented in `docs/planning/db02-academic-progression-contract.md`.
- Stage now models `program_terms`, `program_term_courses`, `cohort_progression_state/events`, `lecture_halls`, broader faculty/course association, and term-bound offerings.
- Chat 4 repaired *four* malformed PostgreSQL function dollar-quote delimiters across concurrent drafts; the SQL blob above contains 11 functions/11 paired dollar-quoted bodies. The committed `tests/db02-staging-contract.test.mjs` guards source-level quoting and key invariants; it has **not** been executed against an actual checkout/PG.
- A schedule without a hall now checks faculty-college, active membership and FACULTY role; this fixes an earlier draft direct-SQL tenant bypass, but does not prove live database behavior.

## Remaining adversarial findings — no silent closure

### DB02-S01 · HIGH · Lecture-hall archive versus booking race

The current `db02_guard_schedule_hall_tenant` reads a candidate active `lecture_halls` row without `FOR SHARE`. The stage does not define a lecture-hall archive guard. Thus an archive and schedule insert can interleave after each checks initial state, leaving an active schedule referencing an archived hall. Reproduction on disposable PostgreSQL: writer A inserts a scheduled event with hall; writer B archives the hall before A commits; release both and query the hall/event state. **Fix contract:** hall booking locks its hall row and archiving checks active bookings under the same row-lock serialization order; verify retry/deadlock behavior. An archived hall should not silently erase historical attendance.

### DB02-S02 · HIGH · Referential user deletion conflicts with progression-only update trigger

`cohort_progression_state.updated_by_user_id` currently uses `ON DELETE SET NULL`. Such FK action updates the state row, but `db02_guard_cohort_progression_state` only permits an UPDATE advancing one term and version. Therefore deleting a referenced actor can fail with a progression violation. In parallel, immutable `cohort_progression_events.actor_user_id` is `ON DELETE RESTRICT`. **Fix contract:** choose and document consistent audit/retention versus erasure semantics (e.g. RESTRICT until a separate authorized pseudonymization workflow); do not allow FK-driven updates to forge promotion history.

### DB02-S03 · HIGH · Immutable row triggers do not forbid TRUNCATE

`db02_cohort_progression_events_immutable` is `FOR EACH ROW BEFORE INSERT OR UPDATE OR DELETE`. PostgreSQL `TRUNCATE` does not invoke these row triggers. **Fix contract:** include a statement-level `BEFORE TRUNCATE` rejection trigger and limit table DDL/ownership privileges granted to runtime accounts. A table owner could still disable triggers; application roles must not be table owners with arbitrary DDL rights.

### DB02-S04 · HIGH · Current-year override and source-consumer contract are incomplete

The source `BatchServiceImpl.createBatch` accepts explicit normalized academic year; if absent, it derives the year from a date with a July boundary. Draft cohort insertion auto-initializes the July-boundary year from its start period, but `src/modules/academics/cohort-service.ts` has no explicit initial academic-year override. DB03 elective eligibility requires the persisted cohort current year start and term, not period-equality heuristics. **Fix contract:** canonical read/write API for these values with tenant-scoped source; freeze exact year-normalization rules, promotion side-effects and event history before API wave.

### DB02-S05 · HIGH · In-place NOT NULL offering term migration needs clean replay proof

The draft adds `course_offerings.program_term_id uuid NOT NULL` directly. That is valid on a **zero-row** table in a greenfield zero-to-current replay but fails if the vNext target already has any course offerings (e.g. seeded development/test DB). Do not backfill from legacy production. Either explicitly require fresh disposable DB before migration, or create a safe staged transition for extant vNext dev/fixture rows and verify it. Document fixture creation order and do not call this replay verified until actually executed.

### DB02-S06 · MEDIUM/HIGH · Post-link tenant drift and source reassignment

The draft verifies `program_term_courses`, `course_offerings`, and `faculty_course_associations` relationships on insertion/update of linking columns. Re-parenting a referenced program/course/department or changing a membership college later could invalidate already-linked college consistency without invoking those child triggers. Some existing vNext application writers disallow such changes, but database-native tenant claims require either referenced-row invariant triggers or a proved policy making such reparenting impossible (with runnable negative direct-SQL tests).

### DB02-S07 · MEDIUM/HIGH · Schedule role revocation and historical policy

A new scheduled event now checks active faculty membership and `membership_roles.role='FACULTY'`. Existing scheduled events retain their references after a membership is suspended or role revoked. Decide explicitly whether previously scheduled but not-yet-held sessions stay assigned, are blocked from execution, or require reassignment. Preserve historical attendance facts; do not silently cancel or leak scope due to stale membership.

### DB02-S08 · BLOCKING · PostgreSQL exclusion and migration acceptance

`btree_gist` extension support/installation rights, the GiST `tstzrange(starts_at,ends_at,'[)')` constraints, concurrent overlapping/adjacent scheduling, concurrent cohort promotion and direct SQL cross-college tests all require an actual disposable PostgreSQL environment. Source/static assertions do **not** exercise these constraints. The staging SQL is unregistered under Chat 1's shared migration-only writer rule.

## Acceptance matrix / required witnesses

| Witness | Expected result | State |
| --- | --- | --- |
| Zero-to-current numbered journal migration replay | clean database, all expected constraints exist | NOT EXECUTED |
| Two concurrent promotions at same expected version | exactly one commit; one stale writer rejected | NOT EXECUTED |
| Program duration shrink below existing cohort/term | rejected atomically | NOT EXECUTED |
| Direct SQL cross-college program/term/course/hall/faculty association | rejected | NOT EXECUTED |
| Same faculty/section/hall time overlap | rejected; adjacent half-open slots allowed | NOT EXECUTED |
| Archive hall racing new schedule | at most one action succeeds; no active booking to archived hall | NOT EXECUTED |
| Immutable history UPDATE/DELETE/TRUNCATE | rejected for runtime role | NOT EXECUTED |
| Delete audit actor referenced in state/history | documented, consistent referential action | NOT EXECUTED |
| Create cohort with supplied year vs July default; DB03 elective join | source-parity year/term decision applied | NOT EXECUTED |

**Disposition:** DB-005 stays **IN_PROGRESS**. These are registration blockers or explicit decisions, not evidence that any live database failed. Chat 1 owns numbered migration registration and runnable replay; Chat 4 may amend its source contracts and support independent review without claiming tests passed.

## Latest reconciliation against current staging

**Reconciled main:** `4c186c95a173c6f4816f64d75501512051bc6ad8`  
**Current canonical staging blob:** `8007c078bec184dbedd8b96e368476d4e510343b`  
**Current single-session acceptance blob:** `ed5c47421608bf0e851be93e33f5ba9332ebe4a1`  
**Runtime PostgreSQL status:** **NOT EXECUTED**. This reconciliation is source/static evidence only.

| Finding | Current draft status | Current evidence / remaining gate |
| --- | --- | --- |
| DB02-S01 hall archive vs booking race | **STATICALLY MITIGATED / runtime open** | Booking takes a hall row `FOR SHARE`; archive guard serializes on the hall and rejects future SCHEDULED references. `db02-postgres-concurrency-unregistered.sh` carries both archive-wins and booking-wins races. |
| DB02-S02 actor deletion vs progression guard/history | **STATICALLY MITIGATED / runtime open** | `66ab926` permits only FK-triggered `updated_by_user_id -> NULL` when canonical state/version are unchanged; history trigger no longer fires for actor-only nulling. `cfb4a73` adds a disposable-PG witness that state version/term and event count remain unchanged while state/event actor refs null. |
| DB02-S03 immutable events and TRUNCATE | **STATICALLY MITIGATED / runtime open** | Canonical stage now adds `db02_cohort_progression_events_no_truncate` with a statement-level BEFORE TRUNCATE guard. Runtime role ownership/DDL privileges still need deployment verification. |
| DB02-S04 explicit academic-year override | **DATABASE DEFAULT DEFINED / API producer open** | Cohort insert initializes July-boundary canonical year; DB02 API handoff explicitly requires create/update support for a supplied legacy year override. This is API-phase work after database registration. |
| DB02-S05 NOT NULL offering term replay | **OPEN RUNTIME GATE** | `course_offerings.program_term_id NOT NULL` is valid for the agreed greenfield zero-to-current path. A non-empty vNext dev DB must be reset or use a reviewed staged transition; no legacy production backfill is required. Disposable replay is still mandatory. |
| DB02-S06 parent/reassignment tenant drift | **CONSOLIDATED STATIC MITIGATION / runtime open** | Learner/section/faculty parent guards, identity immutability and SHARE-lock serialization now live in the single canonical DB02 staging SQL. Historic offering/delivery/event parent guards are consolidated there too. Chat 1 still must reconcile/register with DB01/DB03 and prove them on PostgreSQL. |
| DB02-S07 faculty de-role/suspension lifecycle | **STATICALLY MITIGATED / runtime open** | Role removal or membership non-ACTIVE closes broad/course/section assignments and unassigns future SCHEDULED events without rewriting past attribution. Acceptance harness covers no auto-reactivation. |
| DB02-S08 PostgreSQL exclusion/replay/concurrency | **OPEN RUNTIME GATE** | Static contract checks are strong, but `btree_gist`, exclusion constraints, replay, promotion CAS and two-session races remain unexecuted until a disposable PostgreSQL runner exists. CI billing is not treated as a work blocker; no PASS is claimed. |

### Additional static pre-integration checks

The current staging has one definition for every DB02-created table/function/trigger inspected, paired PL/pgSQL `$` bodies, a stable `course_offerings.program_term_id`, a distinct broad `faculty_course_associations` pool, cohort/class compatibility fields, lecture-hall identity, and three half-open GiST overlap exclusions. The single-session acceptance harness covers tenant scope, program terms, CORE/ELECTIVE rules, zero credits, batch counts, class bounds/dates, learner parent history, progression corrections/promotions, faculty lifecycle, room archive/cancellation, and overlap behavior. These checks improve registration readiness but are **not PostgreSQL execution evidence**.

## Follow-up: parent/learner tenant and history guards are consolidated

The former standalone parent/enrollment draft has been merged into `scripts/sql/db02-academic-progression-and-rooms-staging.sql` and deleted. `tests/db02-academic-parent-tenancy-contract.test.mjs` now reads only the canonical stage.

Current static contract includes college-owner immutability, cohort/program-term identity, learner tenant/role scope, section-enrollment cohort/period scope, learner role/end lifecycle cleanup, section-history reparent protection, and SHARE-lock serialization. Historic offering/delivery/event parent immutability and attendance locks are also canonical.

**Static/source evidence only. No Node test execution or PostgreSQL acceptance is claimed.**

## Follow-up: timestamp resurrection, progression identity, historical parent reassignment

**Status as of 2026-10-11, later Chat 4 continuation:** Other concurrent Chat 4 edits consolidated the parent/enrollment draft, timestamp-room overlay, and history-parent draft into the ONE canonical source file `scripts/sql/db02-academic-progression-and-rooms-staging.sql`. **Do not execute/refer to removed standalone draft paths.** Canonical structural inspection after consolidation found **45/45 functions with paired dollar quote delimiters, 53 uniquely named triggers, zero duplicate function/trigger names, and 0 unmatched PL/pgSQL delimiters.** Static inspection is NOT execution/acceptance.

### DB02-S09 · HIGH · Archived lecture hall timestamp-only event resurrection

A `SCHEDULED` historical event could exist against a now-ARCHIVED hall, then be moved from the past into the future by `UPDATE starts_at, ends_at` alone. The earlier canonical schedule hall guard fired only for section/faculty/hall/status changes and did not re-check an archive transition on pure time edits.

**Staged remedy (now folded into canonical):** `db02_guard_future_schedule_room_lifecycle` with `BEFORE INSERT OR UPDATE OF starts_at, ends_at, status, lecture_hall_id`, `statement_timestamp()` and `SELECT ... FROM lecture_halls ... FOR SHARE` to serialize with hall status changes. This does not restrict preserving truly historical past events when a hall is archived. **Acceptance authored:** `scripts/sql/db02-schedule-progression-integrity-acceptance-unregistered.sql` (rollback-only). **NOT EXECUTED.**

### DB02-S10 · HIGH · Canonical progression identity could be reassigned or removed

The original progression guard enforced version and term changes but did not fire for direct `UPDATE cohort_progression_state SET cohort_id=...`, `DELETE`, or `TRUNCATE`. This could detach academic state from immutable progression history or remove it from a living cohort.

**Staged remedy (now folded into canonical):** `db02_guard_progression_state_identity` with `BEFORE UPDATE OF cohort_id OR DELETE` plus `BEFORE TRUNCATE`. The separate actor-FK lifecycle fix is now directly in canonical `db02_guard_cohort_progression_state`: nested FK-driven user deletion may only null `updated_by_user_id` with all academic progression fields unchanged; `db02_cohort_progression_history` now ignores actor-only updates. **Acceptance authored:** same rollback-only overlay acceptance script. Direct actor-forgery still must fail. **NOT EXECUTED.**

### DB02-S11 · HIGH · History-backed offering/delivery/event parent mutation

Link-time matching of course offering → delivery → event is insufficient if the parent later changes course, cohort, term, section, or period. Similarly moving a schedule event to another section after attendance can mutate historical student/faculty associations without changing the attendance record. Merely relying on FKs' KEY SHARE locks does not serialize against non-key parent UPDATEs.

**Staged remedy (now folded into canonical):** `db02_guard_historic_offering_parent`, `db02_guard_historic_delivery_parent`, `db02_guard_historic_event_section` reject changes after dependent history; history-producing writers take parent `FOR SHARE` locks, including deliveries, course teaching, event-course links, attendance sessions and attendance records. **Acceptance authored:** `scripts/sql/db02-historic-parent-reassignment-acceptance-unregistered.sql` (rollback-only). **NOT EXECUTED.**

### Source test consolidation and freshness

Three new/update source contract test suites were reconciled after deletion of the superseded drafts:

- `tests/db02-academic-parent-tenancy-contract.test.mjs` — 11 cases.
- `tests/db02-schedule-progression-integrity-overlay.test.mjs` — 7 cases, reads canonical.
- `tests/db02-historic-parent-reassignment-contract.test.mjs` — 7 cases, now reads canonical.
- `tests/db02-staging-contract.test.mjs` — 12 cases.

**37 authored source-test cases across these four files; 0 node:test runs and 0 PostgreSQL runs claimed by this continuation.** Static file-inspection checks found no stale references to the removed parent/enrollment, lifecycle overlay, or history-parent draft SQL paths. This is not substitute evidence for source tests actually executing.

**Registration gate unchanged:** Chat 1 alone authors numbered Drizzle/schema-index integration and must run a full zero-to-current disposable PostgreSQL migration replay, all three rollback-only acceptance scripts, the two-session concurrency harness and tenant/history negative tests. The new history-parent lock ordering needs race/deadlock evaluation before certification; other DB domain triggers may interact. No DB02 field can be marked runtime-verified on static source proof alone.

## DB02-S12 · HIGH · Promotion bypasses active target semester and mapped curriculum

**Live canonical stage observed:** `scripts/sql/db02-academic-progression-and-rooms-staging.sql` (DB02 unregistered draft; 48 PL/pgSQL functions / 56 triggers as of this pass, subject to concurrent changes). `db02_guard_cohort_progression_state` validates monotonic term advancement and program-duration upper bound, but DOES NOT validate the cohort is ACTIVE or that its **target program-specific term** exists, is active and has at least one mapped curriculum course. Therefore a direct SQL writer can advance to an unconfigured semester while satisfying `current_term_number +1`, `version +1`, and duration.

**Pinned legacy producer evidence:** `42Students/lms@prod-2026` `src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java` blob `9727013167f5c4ffd4eafa8064d45786b14c3dde`, method `validatePromotion`:
- rejects promotion when batch status is not `ACTIVE`;
- requires exact target current+1 and bound by `NewProgram.durationYears*2`;
- rejects missing / isDeleted / isActive=false target `Semester`;
- rejects target semester with zero ordered `SemesterCourse` mappings;
- staffing readiness/active assignments are *preview data*, not a mandatory promotion precondition.

**Additional unregistered Chat 4 staging** (do not register independently without Chat 1 reconciliation):
- `scripts/sql/db02-promotion-readiness-guard.draft.sql`: `BEFORE UPDATE OF current_term_number`, program-scoped target term / one-course `FOR SHARE` locks and source-equivalent ACTIVE status check; allows initial term1 and same-term year/period corrections without requiring ready curriculum.
- `scripts/sql/db02-promotion-readiness-acceptance-unregistered.sql`: rollback-only disposable PostgreSQL negative witnesses for missing/inactive/empty term, inactive cohort, further unconfigured next term, and a valid promotion with one immutable event.
- `scripts/sql/db02-promotion-readiness-concurrency-unregistered.sh`: two-session deactivation-first and last-curriculum-course-deletion-first races. The script asserts the specific promotion-readiness error, not merely any failed SQL command, to avoid false positives.
- `tests/db02-promotion-readiness-contract.test.mjs`: six authored source test cases.

**Source inspection:** 12/12 static JS structural assertions true (no Node test runner). **Executed Node tests: 0; disposable PostgreSQL tests: 0; production database tests: 0; registered migration: 0.**

**Remaining integration decisions:** preserve service-level optimistic compare-and-set `WHERE cohort_id=? AND version=?` so two simultaneous user requests do not *both* advance term; do not infer expected user version from database state alone. Keep outgoing teaching assignment deactivation atomic in the future API implementation. Test row-lock contention, deadlock behavior, disabled semester transitions and concurrent course-map deletion on disposable PostgreSQL before DB-005 closure. Do not overrestrict historical read after admins later deactivate a previously delivered semester.

## DB02-S13 · HIGH · Mutating materialized CORE curriculum type breaks existing offerings

**Found by Chat 4:** `program_term_courses.type` was editable after a `CORE` offering had already been created referencing the row via `course_offerings.program_term_course_id`. The canonical `db02_guard_course_offering_program_term_scope` verifies `ptc.type = 'CORE'` on offering INSERT/update, but does not fire when only the parent curriculum's type changes. A foreign key protects deletion/key moves, **not non-key type mutation**. Result: direct SQL could leave historic CORE offerings referencing ELECTIVE curriculum rows.

**Remedy in canonical staging:** `db02_guard_program_term_course_type_history` and `db02_program_term_course_type_history_guard` reject only a materialized type change, preserving legacy-supported edits to credits/display order and allowing edits to unused curriculum rows. The existing CORE offering guard takes `FOR SHARE` on that parent row, serializing type updates and offering creation.

**Authored acceptance:**
- `scripts/sql/db02-curriculum-type-history-acceptance-unregistered.sql` — rollback-only fixture, unused curriculum retyping allowed, 0-credit CORE offering, metadata editing allowed, historical CORE type change denied even when offering is ARCHIVED.
- `scripts/sql/db02-curriculum-type-history-concurrency-unregistered.sh` — two-session curriculum-edit-first and offering-insert-first races, checking exact error messages and final row states.
- `tests/db02-curriculum-type-history-contract.test.mjs` — six source-only test cases.

**Consolidation:** Chat 4 folded S13 and S12 promotion-readiness into `scripts/sql/db02-academic-progression-and-rooms-staging.sql` at commit `087013aaa8942532f063716d18286b9241ab3584`, with **51 structurally paired functions and 59 distinct trigger names**. The independent proposal drafts are superseded and must **NOT** be applied after canonical SQL. The updated tests read canonical directly, and disposable acceptance scripts target that canonical stage. Chat 1 alone registers numbered migration/schema-barrel and runs PostgreSQL.

**Status:** source inspection only; **0 PostgreSQL executions/0 runtime-verified DB02 fields**. Must test actual migration, both concurrency orderings, historical read consistency and role privileges before DONE_VERIFIED.
