-- calendar_event_id was overloaded to hold two different things: a manually-pasted meeting URL
-- (for meetings not synced to Google Calendar) AND the opaque Google Calendar event id (for
-- synced meetings, needed later to call updateCalendarEvent/deleteCalendarEvent). The frontend's
-- "Join link" only ever renders when this field looks like an http(s) URL, so a synced meeting's
-- real, working Google Meet link (returned by the Calendar API alongside the event id) was never
-- stored anywhere and the Join link never appeared for any auto-synced meeting.
ALTER TABLE project_meeting
    ADD COLUMN meet_link VARCHAR(500) NULL AFTER calendar_event_id;
