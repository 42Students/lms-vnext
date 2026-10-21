-- Student V1 §7 "Interviews": "Reschedule request sends the reason and preferred times to the
-- placement cell (today it only sets a status)". The learner-facing request-reschedule endpoint
-- previously took no body at all; this column is where that reason/note/preferred-windows JSON
-- actually lands, read by the admin/TPO reschedule screen.
ALTER TABLE interview
    ADD COLUMN reschedule_request_json JSON NULL
        COMMENT 'Student V1: {reason, note, windows} from the learner''s reschedule request. Null for interviews rescheduled before this existed, or admin-initiated reschedules.';
