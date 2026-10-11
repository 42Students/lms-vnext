# DB03 elective slot-program oracle decision

**Task:** DB-026 · **Global phase:** DATABASE  
**Decision:** the executable legacy service is the clone-parity oracle for elective learner program eligibility.  
**Observed vNext main before this decision file:** `23c0c53006d997ec7c80d22c8beefeb0cc8932d6`  
**Pinned legacy backend:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Pinned legacy frontend:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`

This document resolves one specific contradiction. It does **not** certify DB03 runtime parity or the DATABASE phase.

## 1. Contradictory source evidence

Legacy `V167__electives.sql` contains older design prose suggesting an elective allocation may draw learners from any program in the same college. That prose is not the behavior currently executed by the pinned legacy application.

The current `ElectiveService.allocate(...)` calls `learnerEligibilityError(slot, learner)` for every learner candidate. That resolves the learner's primary class and calls `classEligibilityError(slot, sourceClass)`.

`classEligibilityError` rejects when:

1. `sourceClass.programId != slot.programId`;
2. the primary class is not attached to a batch;
3. `batch.currentSemester != slot.semesterNumber`;
4. both academic-year starts exist and do not match.

The first check is unconditional. Therefore the current observable legacy contract is **same elective-slot program**, not merely same college.

Clone parity follows executable producer/consumer behavior when a historical migration comment conflicts with current application code. If product later wants cross-program electives, that is an explicit redesign and must change DB/API/UI/error semantics together.

## 2. vNext decision

vNext MUST reject an elective learner whose canonical ACTIVE learner program enrollment does not match `elective_slots.program_id`.

The rule applies to both write and read paths:

- a learner cannot newly join/rejoin the elective group from a different program;
- an admin move cannot use a different-program learner as a valid elective candidate;
- a historical ACTIVE group membership must stop authorizing the backed delivery if the learner later transfers programs;
- course listing, direct learning read access and learner schedule projection must use the same fail-closed roster predicate.

This does **not** mutate the learner's home section or create an elective section enrollment. Elective membership remains group-owned.

## 3. Current main evidence

Source-level inspection on the observed main SHA found all required DB-026 guards:

| Contract | Current vNext evidence | Source check |
| --- | --- | --- |
| Join/move learner must match slot program | `src/modules/groups/elective-eligibility.ts` compares `learner_program_enrollments.program_id` with `elective_slots.program_id` | PRESENT |
| Stale group membership must not grant backed-delivery read | `src/modules/groups/roster-access.ts` requires the ACTIVE learner program enrollment to match the slot program | PRESENT |
| Backed delivery itself must belong to slot program | `roster-access.ts` requires backed offering cohort program = slot program | PRESENT |
| Offering creation rejects a same-college delivery from another program | `src/modules/electives/service.ts` loads the backing cohort program and rejects mismatch with `ELECTIVE_DELIVERY_MISMATCH` | PRESENT |
| Regression replaces cross-program positive behavior | `tests/integration/groups-db03-roster.test.ts` denies stale read and rejoin after a learner moves programs | AUTHORED, NOT EXECUTED |
| Offering mismatch regression | `tests/integration/groups-db03.test.ts` rejects a backed elective delivery from another program in the same college and asserts no elective offering is persisted | AUTHORED, NOT EXECUTED |
| Contradictory positive cross-program roster assertion | Reviewed current DB03 roster integration source | NOT FOUND |

These are source checks. No PostgreSQL test result is implied.

## 4. Canonical learner program semantics

Current vNext has a partial unique index allowing only one ACTIVE `learner_program_enrollments` row per membership:

`learner_program_enrollments_active_membership_uq WHERE status = 'ACTIVE'`.

The DB03 predicate also requires an ACTIVE section enrollment whose section cohort equals the learner enrollment cohort. This is a reasonable canonical analogue of the legacy learner's primary class **for program identity**.

It is **not yet sufficient for semester/year parity**.

## 5. DB02 boundary — do not fake semester/year parity

Legacy eligibility compares mutable `Batch.currentSemester` and `Batch.academicYear`, not simply academic-period identity.

At this checkpoint current registered vNext academic schema has no canonical persisted `currentTermNumber` / `currentAcademicYearStart` equivalent in `src/db/schema/academics.ts`. DB02 is still IN_PROGRESS.

Therefore DB03 deliberately does **not** claim that:

`section_enrollments.academic_period_id == elective_slots.academic_period_id`

is equivalent to legacy current semester/year. Academic-period matching may remain a useful scope check, but it cannot close the legacy term/year contract.

DB-026 completion must preserve this dependency and must not introduce a second DB03-owned progression representation.

## 6. SQL-integrity boundary

The service/read guards prevent normal application flows from creating or consuming a wrong-program backed delivery. Database-level parity is still stricter:

`elective_offerings.backed_delivery_id → course_section_deliveries → course_offerings.cohort_id → cohorts.program_id`

must agree with:

`elective_offerings.slot_id → elective_slots.program_id`.

The registered DB03 trigger set must ultimately enforce that relationship, including relevant upstream parent edits, in a **new forward-only migration** owned by the migration integrator. DB-026 does not edit `drizzle/**` or the shared schema barrel.

Until that migration is registered and replayed on disposable PostgreSQL, direct privileged SQL remains outside the proof supplied by this task.

## 7. Acceptance witnesses still required

Before DB03 may be `DONE_VERIFIED`, execute on the exact integrated source SHA:

1. same-program learner joins and receives backed-delivery access;
2. same-college different-program learner is rejected before membership creation;
3. valid learner joins, then transfers program while membership remains ACTIVE; backed delivery disappears from course/read/schedule projections;
4. rejoin after transfer is rejected;
5. admin same-slot move for an ineligible learner is rejected atomically;
6. offering creation with a same-college different-program backed delivery is rejected and persists nothing;
7. direct SQL wrong-program offering linkage is rejected by the registered database trigger;
8. upstream cohort/offering/slot program re-parent edits cannot bypass the invariant;
9. DB02 current-term/current-academic-year contract is registered and the legacy semester/year mismatch cases are tested.

No item above is marked passing merely because a test exists.

## 8. Disposition of stale draft PR #55

PR #55 was created before the user switched the working rule to direct-to-`main` only. Its branch is hundreds of commits behind current main. The DB-026 runtime-oracle corrections it was meant to stage are now present directly on current main.

The stale PR must not be merged wholesale. Close it as superseded by direct-main DB-026 reconciliation; retain it only as historical review evidence.
