-- 19 Oct 2026: the morning-of interview reminder (InterviewReminderService.remindToday, in the app only). Holds the start time
-- the student was nudged about that morning, so the same interview is never nudged twice and a moved interview is nudged again.
ALTER TABLE round_assignment
    ADD COLUMN reminded_today_for DATETIME NULL COMMENT 'UTC start time of the interview the student was last nudged about on the day';
