-- PROPOSAL ONLY: do not execute until orchestrator registers and reviews migration.
-- No route may assume this column exists before a runtime table/column readiness guard.
ALTER TABLE lesson_contents ADD COLUMN visible_to_students boolean NOT NULL DEFAULT true;
CREATE INDEX lesson_contents_visible_for_students_idx
  ON lesson_contents(lesson_id, delivery_id, status)
  WHERE visible_to_students = true;
