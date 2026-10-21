-- Extend the existing TPO message author guard for roster-based private group discussions.
-- Direct conversations preserve their original two-party access contract.
CREATE OR REPLACE FUNCTION tpo_internal_message_author_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM placement_tpo_internal_threads t
    WHERE t.id = NEW.thread_id AND t.college_id = NEW.college_id
      AND (
        (t.kind = 'DIRECT' AND NEW.author_membership_id IN
          (t.started_by_membership_id, t.invited_membership_id))
        OR (t.kind IN ('TOPIC','DRIVE','COMPANY') AND EXISTS (
          SELECT 1 FROM placement_tpo_internal_thread_participants p
          WHERE p.thread_id = t.id AND p.college_id = t.college_id
            AND p.membership_id = NEW.author_membership_id AND p.left_at IS NULL
        ))
      )
  ) THEN
    RAISE EXCEPTION 'Author is not a participant of this TPO internal thread' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
