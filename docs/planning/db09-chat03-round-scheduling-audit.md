# DB-012 · Round scheduling / reschedule source-gap audit

**Chat 3 · 2026-10-11 IST · Global phase DATABASE**

Legacy oracle `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, migrations `V165__tpo_v1_complete.sql` and `V193__recruiter_naming.sql`. vNext source inspected: `src/db/schema/placements.ts`, `src/db/schema/drive-day.ts`, staged `placement_application_round_exceptions` and existing DB09 scheduling candidate.

## Active data concepts to preserve (source DDL only; runtime consumers unverified)

| Legacy table | Candidate fields | Business contract that cannot be dropped silently |
|---|---:|---|
| `round_slot` | 9 | Round's times, room, panel, capacity, proposing actor `TPO` or final V193 `RECRUITER`, and PROPOSED→CONFIRMED state |
| `round_assignment` | 7 | One application per round, optional chosen slot, room, learner confirmation and notification timestamps |
| `reschedule_request` | 9 | Applicant requests preferred times/reason; status PENDING/MOVED/KEPT, reply, actor and creation time |

The existing `placement_application_round_exceptions` carries per-application scheduling overrides but is **not a proven substitute** for a shared slot with capacity and proposer/confirmation state. `placement_round_attendance` preserves separate attendance state, not slot allocation, learner notification or reschedule history. These are independent workflows, not synonyms.

## Staged implementation candidate (not registered)

[DB09 round-scheduling candidate SQL](sql/db09-round-scheduling-candidate.sql) contains PostgreSQL tables for slots, assignments and reschedule decisions, composite `(id,job_id)` / `(id,round_id,job_id)` ownership keys, finite status enums and SQL CHECK constraints. It is a **migration design artifact only**; Chat 1 must reconcile with DB08's application/round model and own the numbered migration and replay. The SQL file was already present on `main` when this audit was authored, so this audit does not claim to be its creator.

## Must-fail adversarial witnesses on a migrated disposable database

1. Round belongs to job A, application belongs to job B, yet both UUIDs exist: assignment/reschedule insert must fail FK.
2. Slot belongs to round A, forged assignment references round B: insert must fail FK.
3. Two concurrent users assign different applications to final available seat on a capacity-1 slot: only one may commit. The staged FK/CHECK **does not** enforce counting/locking by itself; a future transaction writer must lock the slot or use a safe atomic reservation strategy.
4. Concurrent reschedule approval vs canceled/closed round: no stale final slot or notification; version-CAS and side effects must be atomic.
5. Notification and student-confirmation timestamps may not be set by an arbitrary cross-college actor; test requester, reviewer and TPO admin scopes.
6. `proposed_by='HR'` must not silently reappear after V193; the supported final code is `RECRUITER`.
7. Reject invalid time range, nonpositive slot capacity, wrong-college job/round, duplicate application in round, and invalid status via SQL constraints.
8. Verify daylight-saving/timezone semantics for scheduled dates, and decide whether physical meeting-room overlap across rounds needs a capacity/room reservation rule.

## Open acceptance gates

- Prove native legacy service/controller/frontend producers and consumers (migration evidence alone is not runtime use proof).
- Decide authoritative slot/reschedule state machine and how `placement_application_round_exceptions` interoperates with it; do not duplicate independent writers.
- Execute TypeScript compile, generated Drizzle SQL replay, negative PostgreSQL races and business workflow integration tests. No execution witnessed here.
- The current ledger entries remain `UNVERIFIED_FIELD_SEMANTICS`; none of the 25 scheduling fields is certified.
