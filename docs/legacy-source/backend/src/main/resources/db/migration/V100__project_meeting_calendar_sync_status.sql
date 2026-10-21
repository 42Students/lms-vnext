-- Calendar create/update/remove calls run async after the DB transaction commits (deferred to
-- avoid holding a transaction across a slow external API call) and any failure was silently
-- swallowed — a meeting saved successfully in the LMS even when its Calendar invite never went
-- out, with zero signal anywhere. Add explicit sync status so failures are visible and retryable.
ALTER TABLE project_meeting
    ADD COLUMN calendar_sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN calendar_sync_error VARCHAR(500) NULL;
