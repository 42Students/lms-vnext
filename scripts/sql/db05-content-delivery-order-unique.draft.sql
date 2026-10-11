-- Chat 6 / DB-008 / DATABASE ONLY. UNREGISTERED companion, not a numbered migration.
-- Canonical base: docs/planning/sql/db05-lesson-content-delivery-order-candidate.sql
-- Other companion: scripts/sql/db05-content-delivery-order-scope.draft.sql
-- Integrator: Chat 1. Do not execute in production or count as an eighth DB05
-- independent migration. No runtime PostgreSQL verification has been performed.
--
-- DEFECT: existing PK(lesson_content_id,delivery_id) permits two DIFFERENT
-- lesson contents in the SAME lesson/delivery to share sequence 0 (or any
-- sequence). Unique(delivery_id,sequence) is WRONG: distinct lessons in one
-- delivery legitimately start numbering at 0 independently.
--
-- SOLUTION: persist lesson_id as a witnessed association, prohibit a mismatch
-- with the owning lesson_contents.lesson_id via a COMPOSITE FK, and enforce
-- UNIQUE(delivery_id,lesson_id,sequence). Composite referenced keys require
-- an explicit candidate UNIQUE(id,lesson_id) on the lesson_contents parent
-- even though lesson_contents.id is already the primary key.
--
-- The partial existing ORDER BY/index is retained; this migration is additive.
-- DB05_CONTENT_ORDER_READY must remain disabled until schema, service writer,
-- and integrity/tenant/race acceptance all agree on the same SHA.

BEGIN;

ALTER TABLE lesson_content_delivery_sequences
  ADD COLUMN lesson_id uuid;

-- Greenfield system may have dev/seed rows already. Resolve from the
-- authoritative content parent rather than taking a client-supplied lesson.
UPDATE lesson_content_delivery_sequences AS order_row
SET lesson_id = content.lesson_id
FROM lesson_contents AS content
WHERE order_row.lesson_content_id = content.id
  AND order_row.lesson_id IS NULL;

ALTER TABLE lesson_content_delivery_sequences
  ALTER COLUMN lesson_id SET NOT NULL;

ALTER TABLE lesson_contents
  ADD CONSTRAINT db05_lesson_contents_id_lesson_pair_uq
  UNIQUE (id, lesson_id);

ALTER TABLE lesson_content_delivery_sequences
  ADD CONSTRAINT db05_order_content_lesson_pair_fk
  FOREIGN KEY (lesson_content_id, lesson_id)
  REFERENCES lesson_contents (id, lesson_id)
  ON UPDATE RESTRICT
  ON DELETE CASCADE;

-- DEFERRABLE permits in-transaction UPDATE swaps/resequence after
-- SET CONSTRAINTS db05_order_delivery_lesson_sequence_uq DEFERRED.
-- The current vNext writer instead DELETEs and INSERTs the complete set
-- while locking the delivery, so it does not need to defer the constraint.
ALTER TABLE lesson_content_delivery_sequences
  ADD CONSTRAINT db05_order_delivery_lesson_sequence_uq
  UNIQUE (delivery_id, lesson_id, sequence)
  DEFERRABLE INITIALLY IMMEDIATE;

COMMIT;

-- Mandatory pre-registration evidence (UNEXECUTED):
-- 1. Same delivery, different lessons: both may have sequence 0 (ACCEPT).
-- 2. Same delivery, same lesson, duplicate sequence: 23505 (REJECT).
-- 3. Same content+delivery repeated: original PK rejects (23505).
-- 4. Source content lesson A but asserted lesson_id B: 23503 (REJECT).
-- 5. Reparent content to a different lesson while an override exists:
--    composite FK ON UPDATE RESTRICT rejects; never silently corrupt scope.
-- 6. Cross-offering/section/cohort/college mismatch still rejected by the
--    separate db05-content-delivery-order-scope companion (23514).
-- 7. Concurrent complete reorder writes under READ COMMITTED serialize on
--    delivery FOR UPDATE and cannot persist duplicate sequence positions.
-- 8. Existing rows backfill lesson_id without guessing; orphan rows fail.
-- 9. Replay on fresh PostgreSQL with one migration owner; stage Drizzle
--    lessonId and application inserts atomically with this DDL.
-- 10. Verify deferrable UNIQUE migration representation: Drizzle may not
--     describe DEFERRABLE directly. Compare pg_constraint, not only ORM DSL.
-- 11. Upstream learning-path/offering/section reparenting can invalidate
--     existing overrides without firing the child scope guard: open gate.
