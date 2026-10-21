-- Soft-delete announcement rows that contain learner-targeted notification text.
-- These were incorrectly inserted into the announcements table (likely via admin create API)
-- and show up on the teacher's notifications page.

UPDATE announcements
SET is_deleted = 1
WHERE (is_deleted IS NULL OR is_deleted = 0)
  AND (
    -- Assignment submitted notifications (learner-targeted)
    title LIKE '%Assignment submitted%'
    OR message LIKE '%You have submitted%'
    -- Grade published notifications (learner-targeted)
    OR title LIKE '%Grade published%'
    OR message LIKE '%Your grade for%has been published%'
    OR message LIKE '%has been graded%'
  );
