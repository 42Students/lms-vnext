-- DB-008 / Chat 6. UNREGISTERED, NOT EXECUTED, W01 INTEGRATION ONLY.
-- COMPANION to docs/planning/sql/db05-lesson-content-delivery-order-candidate.sql
-- and scripts/sql/db05-content-delivery-order-scope.draft.sql.
-- Staged table's PK(lesson_content_id,delivery_id) and nonunique delivery/
-- sequence index allow duplicate positions in one lesson. An unscoped
-- UNIQUE(delivery_id,sequence) is WRONG: different lessons can each use 0..N.
-- Do not run this SQL against production. W01 folds exactly once into
-- numbered migrations after base order table exists and PG negative tests.
--
-- Backfill intentionally fails on orphaned/duplicate data (no silent cleanup).
-- Upstream content reparent is RESTRICTED while overrides exist. Delete/rebuild
-- rows with authorization and offering/college checks before reparenting.
BEGIN;

-- Composite FK requires unique pair even though lesson_contents.id is PK.
CREATE UNIQUE INDEX db05_lesson_contents_id_lesson_uq
  ON lesson_contents (id, lesson_id);

ALTER TABLE lesson_content_delivery_sequences
  ADD COLUMN lesson_id uuid;

UPDATE lesson_content_delivery_sequences row
SET lesson_id = content.lesson_id
FROM lesson_contents content
WHERE content.id = row.lesson_content_id;

ALTER TABLE lesson_content_delivery_sequences
  ALTER COLUMN lesson_id SET NOT NULL;

ALTER TABLE lesson_content_delivery_sequences
  ADD CONSTRAINT db05_delivery_order_content_lesson_fk
  FOREIGN KEY (lesson_content_id, lesson_id)
  REFERENCES lesson_contents (id, lesson_id)
  ON UPDATE RESTRICT ON DELETE CASCADE;

-- Unique within each lesson in each delivery. Other lessons can use 0.
CREATE UNIQUE INDEX db05_delivery_order_lesson_sequence_uq
  ON lesson_content_delivery_sequences (delivery_id, lesson_id, sequence);

-- Current service omits lesson_id, so derive it from trusted parent; reject
-- any caller trying to supply a mismatched lesson_id.
CREATE OR REPLACE FUNCTION db05_delivery_order_lesson_integrity_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_order_lesson$
DECLARE
  actual_lesson_id uuid;
BEGIN
  SELECT content.lesson_id INTO actual_lesson_id
    FROM lesson_contents content
    WHERE content.id = NEW.lesson_content_id;

  IF actual_lesson_id IS NULL THEN
    RAISE EXCEPTION 'lesson order content does not resolve to a lesson'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.lesson_id IS NOT NULL
     AND NEW.lesson_id IS DISTINCT FROM actual_lesson_id THEN
    RAISE EXCEPTION 'delivery order lesson does not match lesson content'
      USING ERRCODE = '23514';
  END IF;

  NEW.lesson_id := actual_lesson_id;
  RETURN NEW;
END;
$db05_order_lesson$;

CREATE TRIGGER db05_delivery_order_lesson_before_write
BEFORE INSERT OR UPDATE OF lesson_content_id, lesson_id, sequence, delivery_id
ON lesson_content_delivery_sequences
FOR EACH ROW EXECUTE FUNCTION db05_delivery_order_lesson_integrity_guard();

COMMIT;

-- UNEXECUTED GATES:
-- 1. Same lesson/delivery duplicate position rejects 23505.
-- 2. Different lessons within one delivery can both have sequence=0.
-- 3. Existing composite content/delivery PK still rejects duplicate content.
-- 4. Wrong lesson supplied on raw INSERT/UPDATE rejects 23514.
-- 5. Existing service omitted lesson_id derives trusted parent on INSERT.
-- 6. Parent lesson_id update with existing overrides rejected by FK RESTRICT.
-- 7. Service delete+reinsert full reorder atomically under delivery FOR UPDATE.
-- 8. Separate db05-content-delivery-order-scope guard validates same offering,
--    same cohort/period/college, delivery-specific content and nonarchived row.
-- 9. Clean PostgreSQL replay, rollback, historical duplicates, two-connection
--    reorders and upstream course/lesson/offering mutations all remain NOT RUN.
