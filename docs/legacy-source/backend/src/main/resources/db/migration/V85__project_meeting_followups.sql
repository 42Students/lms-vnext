ALTER TABLE project_meeting
    ADD COLUMN action_items JSON NULL AFTER attendees,
    ADD COLUMN follow_up_at DATETIME NULL AFTER reminder_channel,
    ADD COLUMN follow_up_status VARCHAR(40) NULL AFTER follow_up_at,
    ADD COLUMN follow_up_notes TEXT NULL AFTER follow_up_status;
