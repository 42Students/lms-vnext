-- Part B in the super-admin audit: "Announcements: Schedule for later; set expiry; pin."
-- None of the three existed in any form -- an announcement was visible to its recipients the
-- instant it was created, stayed visible forever, and had no way to be held at the top of the
-- list. An admin wanting a "results are out on Friday" notice had to remember to post it on
-- Friday, and a notice about an event that has passed had to be deleted by hand to stop showing.
--
-- scheduled_at: NULL = visible immediately (every existing row keeps its current behaviour).
-- expires_at:   NULL = never expires (likewise).
-- is_pinned:    NOT NULL DEFAULT FALSE so ordering never has to deal with NULLs.
--
-- The visibility window is enforced in the recipient-facing repository queries only; admin-facing
-- listings deliberately still show scheduled and expired rows, otherwise an admin could not see
-- or manage the announcement they just scheduled.

ALTER TABLE announcements
    ADD COLUMN scheduled_at DATETIME NULL;

ALTER TABLE announcements
    ADD COLUMN expires_at DATETIME NULL;

ALTER TABLE announcements
    ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Recipient queries filter on the window and order pinned-first; without this they scan the table.
CREATE INDEX idx_announcements_visibility ON announcements (scheduled_at, expires_at);
