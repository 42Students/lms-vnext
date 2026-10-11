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
| DB02-S06 parent/reassignment tenant drift | **PROPOSED MITIGATION / integration + runtime open** | Canonical stage locks/guards core academic parents; `db02-academic-parent-enrollment-tenant-guards.draft.sql` adds learner/section/faculty parent history protections. Chat 1 must deconflict/register it with DB01/DB03 before PostgreSQL proof. |
| DB02-S07 faculty de-role/suspension lifecycle | **STATICALLY MITIGATED / runtime open** | Role removal or membership non-ACTIVE closes broad/course/section assignments and unassigns future SCHEDULED events without rewriting past attribution. Acceptance harness covers no auto-reactivation. |
| DB02-S08 PostgreSQL exclusion/replay/concurrency | **OPEN RUNTIME GATE** | Static contract checks are strong, but `btree_gist`, exclusion constraints, replay, promotion CAS and two-session races remain unexecuted until a disposable PostgreSQL runner exists. CI billing is not treated as a work blocker; no PASS is claimed. |

### Additional static pre-integration checks

The current staging has one definition for every DB02-created table/function/trigger inspected, paired PL/pgSQL `$` bodies, a stable `course_offerings.program_term_id`, a distinct broad `faculty_course_associations` pool, cohort/class compatibility fields, lecture-hall identity, and three half-open GiST overlap exclusions. The single-session acceptance harness covers tenant scope, program terms, CORE/ELECTIVE rules, zero credits, batch counts, class bounds/dates, learner parent history, progression corrections/promotions, faculty lifecycle, room archive/cancellation, and overlap behavior. These checks improve registration readiness but are **not PostgreSQL execution evidence**.

## Follow-up: isolated parent/learner tenant guard proposal

**Draft committed:** `scripts/sql/db02-academic-parent-enrollment-tenant-guards.draft.sql`  
**Authored source test:** `tests/db02-academic-parent-tenancy-contract.test.mjs` (10 test cases).  
**Source execution:** 12/12 independent read-only structure checks passed against current draft blob. **No Node project test runner or PostgreSQL session executed.**

This draft proposes a bounded remedy for **DB02-S06** without editing Chat 1's shared migration journal or colliding with simultaneous canonical staging changes. It forbids cross-college parent reparenting, permits same-college program/course department reassignment, enforces cohort/period/learner/faculty tenant relations with role checks, and protects source section-history identities. A generic `FOR SHARE` section parent-lock trigger is attached to learner enrollment, faculty assignment, course delivery and schedule event writes. Those locks are intended to conflict with concurrent `NO KEY UPDATE` section reparenting.

**DB02-S06 disposition: PROPOSED MITIGATION / NOT ACCEPTED.** Chat 1 must reconcile with existing DB01 and DB03 parent triggers, register an approved migration and run disposable PostgreSQL direct-SQL and concurrent writer tests. Broader cross-organization `colleges.organization_id` ownership remains a DB01 responsibility. Membership suspension/role revocation after historical assignments, and the controlled legacy class-with-roster transfer workflow, remain separate behavioral decisions.

Do not count the 10 authored source tests or 12 static source checks as PostgreSQL runtime acceptance. DB-005 and the DATABASE global phase remain IN_PROGRESS.
