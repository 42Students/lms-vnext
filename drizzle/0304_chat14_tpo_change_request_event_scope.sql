-- [chat-14] DB09: an EVENT or quoted request must refer to the same
-- placement job as its canonical recruiter/TPO thread. The single-column FK
-- alone allowed a request from another tenant to masquerade as conversation
-- context. Retain message/quote history; reject only mismatched references.
-- Lane 15 owns journal registration and PostgreSQL negative tests.
CREATE FUNCTION lms_tpo_message_change_request_scope()
RETURNS trigger LANGUAGE plpgsql AS $tpo_event_scope$
DECLARE
  request_job_id uuid;
  thread_job_id uuid;
BEGIN
  IF NEW.change_request_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT job_id INTO request_job_id
    FROM placement_drive_change_requests
    WHERE id = NEW.change_request_id;
  SELECT job_id INTO thread_job_id
    FROM placement_tpo_message_threads
    WHERE id = NEW.thread_id FOR SHARE;
  IF request_job_id IS NULL OR
     thread_job_id IS NULL OR
     thread_job_id IS DISTINCT FROM request_job_id THEN
    RAISE EXCEPTION 'message references a change request outside its job thread'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$tpo_event_scope$;
--> statement-breakpoint
CREATE TRIGGER lms_tpo_message_change_request_scope_trg
BEFORE INSERT OR UPDATE OF thread_id,change_request_id
ON placement_tpo_messages
FOR EACH ROW EXECUTE FUNCTION lms_tpo_message_change_request_scope();
--> statement-breakpoint
CREATE FUNCTION lms_tpo_thread_job_change_guard()
RETURNS trigger LANGUAGE plpgsql AS $tpo_thread_scope$
BEGIN
  IF NEW.job_id IS DISTINCT FROM OLD.job_id
     AND EXISTS (
       SELECT 1 FROM placement_tpo_messages m
       WHERE m.thread_id=OLD.id AND m.change_request_id IS NOT NULL
     ) THEN
    RAISE EXCEPTION 'cannot move a thread containing job change-request references'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$tpo_thread_scope$;
--> statement-breakpoint
CREATE TRIGGER lms_tpo_thread_job_change_guard_trg
BEFORE UPDATE OF job_id ON placement_tpo_message_threads
FOR EACH ROW EXECUTE FUNCTION lms_tpo_thread_job_change_guard();
