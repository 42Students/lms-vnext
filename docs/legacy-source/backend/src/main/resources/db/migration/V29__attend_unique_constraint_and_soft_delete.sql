-- Remove duplicate attendance records, keeping one per (student_id, class_schedule_id).
-- Then add unique constraint and ensure is_deleted column exists for soft-delete.

-- Deduplicate: keep the row with the smallest id per (student_id, class_schedule_id).
DELETE a1 FROM attend a1
INNER JOIN attend a2
  ON a1.student_id = a2.student_id
  AND a1.class_schedule_id = a2.class_schedule_id
  AND a1.id > a2.id;

-- Add unique constraint to prevent future duplicates.
ALTER TABLE attend
  ADD UNIQUE KEY uk_attend_student_schedule (student_id, class_schedule_id);
