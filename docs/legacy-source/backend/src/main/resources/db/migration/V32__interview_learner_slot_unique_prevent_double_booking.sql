-- HARDENING: Prevent interview double-booking for same learner in same hour.
-- scheduled_date_hour = truncated to hour; unique (learner_id, scheduled_date_hour) for SCHEDULED/CONFIRMED.
-- CANCELLED/COMPLETED etc. keep scheduled_date_hour NULL so they do not participate in unique constraint.

ALTER TABLE interview ADD COLUMN scheduled_date_hour DATETIME NULL;

-- Backfill: set hour slot for existing SCHEDULED/CONFIRMED interviews (truncate to hour).
-- MySQL: DATE_FORMAT(scheduled_date, '%Y-%m-%d %H:00:00')
UPDATE interview
SET scheduled_date_hour = DATE_FORMAT(scheduled_date, '%Y-%m-%d %H:00:00')
WHERE interview_status IN ('SCHEDULED', 'CONFIRMED')
  AND (is_deleted = 0 OR is_deleted IS NULL)
  AND scheduled_date IS NOT NULL;

-- Unique index: one SCHEDULED/CONFIRMED interview per learner per hour.
-- Rows with scheduled_date_hour NULL (e.g. CANCELLED) do not conflict.
CREATE UNIQUE INDEX idx_interview_learner_slot ON interview (learner_id, scheduled_date_hour);
