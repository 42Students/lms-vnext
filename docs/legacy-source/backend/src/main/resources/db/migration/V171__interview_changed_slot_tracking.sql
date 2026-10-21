-- Student V1 §7: "Changed slot" badge — the old value struck through, "changed 2h ago",
-- confirm again. Cleared once the student re-confirms (see confirmInterview).
ALTER TABLE interview
    ADD COLUMN previous_scheduled_date DATETIME(6) NULL
        COMMENT 'The slot this interview was rescheduled FROM, until the student confirms the new one.',
    ADD COLUMN scheduled_date_changed_at DATETIME(6) NULL
        COMMENT 'When the slot last changed. Both columns null once the student re-confirms, or if this interview was never rescheduled.';
