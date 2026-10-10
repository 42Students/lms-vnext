# DB03 — Chat 5 elective program eligibility source audit

**State:** Corrective code and regression test are staged on an isolated Chat 5 branch. **NOT VERIFIED / NOT MERGED.**
**Active global phase:** DATABASE · **Queue task:** DB-006 · **Worker:** Chat 5 · **Worker issue:** #25.
**Legacy backend source SHA:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`.
**Legacy frontend source SHA:** `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.

## Observable legacy behavior versus historical SQL comment

Legacy migration `V167__electives.sql` describes potential allocation from learners in any program at the college. That broad *design comment* conflicts with the actual legacy application rule:

- `src/main/java/com/_42students/lms/service/electives/ElectiveService.java`, `allocate(...)` calls `learnerEligibilityError(slot, learner)` for every candidate.
- That method calls `classEligibilityError(slot, sourceClass)`, which **rejects** when `sourceClass.getProgramId()` differs from `slot.getProgramId()`. It also rejects when the learner's batch current semester differs from the slot's semester, or the academic-year start differs when both are present.
- Therefore **same-program restriction is the observable legacy producer contract** today. Treat the SQL comment as a documented intent discrepancy, not proof that cross-program allocation is already delivered.

## vNext discrepancy and staged correction

Before this batch, `src/modules/groups/elective-eligibility.ts` accepted active same-college academic enrollment even when `learner_program_enrollments.program_id` differed from `elective_slots.program_id`. The shared `roster-access.ts` check also retained learning/course access after the learner changed to a different program. The PostgreSQL DB03 roster regression explicitly expected cross-program permission, which contradicted the actual legacy service.

Staged source changes:

1. Require primary program enrollment to match the elective slot's `program_id` in the transaction eligibility predicate.
2. Require the same program relationship in the common backed-delivery roster access predicate, so stale `ACTIVE` group membership cannot bypass the primary program rule.
3. Replace the misleading cross-program positive fixture with a negative PostgreSQL regression specifying stale-read denial and rejected rejoin after administrative removal. The learner's primary section is never moved automatically.

## Unresolved evidence and decisions

- **Runtime not executed:** no disposable PostgreSQL migration replay, test run, lint, typecheck or build has been executed during this batch. The test is **AUTHORED only**; it must not be reported as PASS.
- **Semester/year blocker:** Current vNext eligibility checks an academic-period relationship but does not prove parity with legacy `Batch.currentSemester` and `Batch.academicYear`. Coordinate the DB02 persisted cohort/term policy before any `WORKFLOW_VERIFIED` claim.
- **Product discrepancy:** If cross-program elective allocation is desired intentionally, approve it as a separate redesign and reconcile producer/UI/error behavior; do not silently treat a migration comment as live legacy behavior.
- **DB03 overall:** 79 historical columns already have proposed paths, but zero field-semantic PostgreSQL verifications. DB-006 is **not DONE_VERIFIED** because this is only one bounded invariant correction, not a completed 79-field audit.

## Second source/DB gap — backed-delivery program identity

The same legacy `ElectiveService.createOffering` constructs its group-backed class using `backed.setProgramId(slot.getProgramId())`. V167 explicitly persists `elective_offering.backed_class_id` as this GROUP_BACKED class. In vNext, the replacement is an elective `course_section_deliveries` record reached through `course_offerings.cohort_id → cohorts.program_id`.

**Previously unguarded:** `createElectiveOffering` accepted a same-college delivery from a different program; the deployed DB03 trigger source `drizzle/0039_db03_scope_triggers.sql` checks delivery course/cohort/period/status and college but **not** equality between the slot's `program_id` and backed delivery's cohort program. A normal FK cannot express that multi-parent relationship alone. Incorrectly linked deliveries may expose the wrong program's learning/timetable/attendance producer context even though group membership remains tenant-scoped.

**Staged correction in draft PR #55:**
- Producer `src/modules/electives/service.ts`: select `cohorts.program_id` for the backed delivery and reject a mismatch to `elective_slots.program_id` with `ELECTIVE_DELIVERY_MISMATCH`.
- Consumer `src/modules/groups/roster-access.ts`: join the delivery cohort and require `cohorts.program_id = elective_slots.program_id` so a forged or subsequently stale relationship cannot grant group-backed course access.
- PostgreSQL fixture `tests/integration/groups-db03.test.ts`: authored negative service test using two programs at the same college; require rejected creation and no elective offering persisted. **Not executed**.

**Migration handoff to Chat 1 (sole migration integrator):** register a new forward-only migration to extend `db03_guard_elective_offering_scope()`: load `elective_slots.program_id` plus `cohorts.program_id` through `course_offerings.cohort_id`, and reject mismatches (`SQLSTATE 23514`). The existing trigger runs only on `elective_offerings` INSERT / selected UPDATE columns; it does **not** independently protect subsequent parent edits (`cohorts.program_id`, `course_offerings.cohort_id`, `elective_slots.program_id`, `course_section_deliveries.offering_id`). Audit mutability and enforce reverse parent-update protection or an immutable parent contract before declaring DB-level invariant verified. Do not rewrite migration 0039. Explicit `pg_trigger` inspection and adversarial UPDATE tests are required on disposable PostgreSQL. The SQL draft will not be treated as registered or executed.

This is a source-confirmed missing constraint, **not** a claim that any production row has violated it. vNext is greenfield; no legacy data needs backfilling.

## Required acceptance on a disposable database

Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`, disposable migration replay and the guarded `tests/integration/groups-db03-roster.test.ts` suite with `DB03_ISOLATED_TEST_DATABASE=1`. Independently verify SQL-level cross-college FK triggers and privilege boundaries and recheck current legacy `prod-2026` SHA before closure.
