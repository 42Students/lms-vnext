# DB05 — lesson-content order upstream reparent integrity

**Chat 6 / DB-008 / DATABASE. SOURCE-ONLY, UNREGISTERED, NOT PostgreSQL tested.**

Canonical drafts:
- `scripts/sql/db05-content-delivery-order-scope.draft.sql` — the child-write same-offering/cohort/period/college guard, now taking `pg_advisory_xact_lock(605008003::bigint)`.
- `scripts/sql/db05-content-delivery-order-unique.draft.sql` — witnessed lesson ID, composite content-lesson FK and deferrable `UNIQUE(delivery_id,lesson_id,sequence)`.
- `scripts/sql/db05-content-order-upstream-reparent.draft.sql` — six ancestor-update triggers taking that **same** advisory lock under READ COMMITTED. Must be folded by **Chat 1** after the base order table is registered; not an eighth independent migration.

## Why the extra guard exists

An already-valid `lesson_content_delivery_sequences` override is not revalidated when a related course lesson, learning path, offering, section or delivery changes. All independent foreign keys may remain valid even when an existing order row crosses an offering or tenant boundary. The child-only insert/update trigger is insufficient.

The proposed upstream function fails closed when an override exists and a scope-changing UPDATE occurs:

| Ancestor | Changes guarded |
| --- | --- |
| `lesson_contents` | `lesson_id`, `delivery_id`, transition to `ARCHIVED` |
| `course_lessons` | `learning_path_id` |
| `course_learning_paths` | `offering_id` |
| `course_section_deliveries` | `offering_id`, `section_id` |
| `course_offerings` | `course_id`, `cohort_id`, `academic_period_id`; both source and target paths checked |
| `sections` | `cohort_id`, `academic_period_id` |

A no-op update is allowed; deleting the old override as part of an **authorized and atomic** reparent operation may allow the move. All guard mutations require READ COMMITTED until multi-session evidence establishes a broader isolation contract. Wrong-scope reparent should fail with SQLSTATE `23514`; disallowed transaction isolation should fail `25001`.

## Acceptance matrix, entirely NOT RUN

1. Valid overrides for two lessons in the same delivery allow each lesson to start at sequence 0; duplicate sequence within one lesson/delivery fails `23505`.
2. Wrong content-to-lesson pairing fails the composite FK `23503`; wrong offering/college/cohort/period/delivery fails child scope guard `23514`.
3. For each of the six guarded ancestors, attempt every relevant field change while an override exists; require `23514` and no persisted change.
4. Repeat the same updates **without overrides** and with no-op values; correct allowed operations must succeed.
5. With an override, archive lesson content; it must fail until the order association is handled.
6. Perform authorized clear-then-reparent in one transaction, then verify the resulting graph and order.
7. Two-session INSERT override vs ancestor UPDATE races must never both commit a contradictory graph; exercise both lock orders, rollback, lock waits and deadlock-retry behavior.
8. Under non-READ-COMMITTED isolation, child and ancestor update paths must fail closed with `25001`.
9. Run real PG migration replay and query `pg_constraint` for the deferrable unique and composite FK; confirm no duplicate trigger names after Chat 1 combines the companions.
10. Execute `node --test tests/db05-content-order-upstream-reparent.test.mjs tests/db05-content-delivery-order-unique.test.mjs`, typecheck, service and build tests on a recorded SHA using an available runner.

## Explicitly unresolved

- Direct `academic_periods.college_id` and `departments.college_id` changes, which may be protected by other DB02/DB05 guards but require combined tests.
- Upstream DELETE/CASCADE behavior, historical/soft-deletion retention, course ownership/role and accessibility semantics.
- Actual transaction snapshots, row-lock/advisory-lock deadlocks and concurrent parent graph moves.
- W01 registered migration integration, staging rollout, real PostgreSQL tests and consumer/browser verification.

The new source file and regression definitions **do not certify any DB05 fields**. DB-008 remains IN_PROGRESS; DATABASE remains the only active global phase.
