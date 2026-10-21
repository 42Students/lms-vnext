-- 13 Oct 2026: the evening-before interview reminder (InterviewReminderService). Holds the start time the student was reminded
-- of, so the same interview is never reminded twice and a moved interview is reminded again.
ALTER TABLE round_assignment
    ADD COLUMN reminded_for DATETIME NULL COMMENT 'UTC start time of the interview the student was last reminded of';
