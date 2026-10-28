-- DB-008: immutability of course-content progress and classroom attribution.
-- Persisted columns and typed schema already exist in registered 0098/0160/0201/
-- 0210/0213 migrations. No duplicate ALTER TABLE or staged table registration.
-- All changes are transactionally owned by PostgreSQL and apply to direct SQL.
-- 1. Preserve old first completion when prior code omitted the snapshot.
UPDATE learner_content_progress
SET first_completed_at = completed_at
WHERE first_completed_at IS NULL AND completed_at IS NOT NULL;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db05_progress_first_completion_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_first_completion$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.first_completed_at IS NOT NULL
     AND NEW.first_completed_at IS DISTINCT FROM OLD.first_completed_at THEN
    RAISE EXCEPTION 'first_completed_at is immutable once recorded'
      USING ERRCODE = '23514';
  END IF;
  -- Rewatch/retake may clear completed_at, but the original timestamp remains.
  IF NEW.first_completed_at IS NULL THEN
    IF NEW.completed_at IS NOT NULL THEN
      NEW.first_completed_at := NEW.completed_at;
    END IF;
  ELSIF NEW.completed_at IS NULL
        AND (TG_OP = 'INSERT' OR OLD.first_completed_at IS NULL) THEN
    RAISE EXCEPTION 'first_completed_at requires a recorded completion'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db05_first_completion$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$CREATE TRIGGER db05_progress_first_completion_before_write
    BEFORE INSERT OR UPDATE OF first_completed_at, completed_at
    ON learner_content_progress
    FOR EACH ROW EXECUTE FUNCTION db05_progress_first_completion_guard()$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
-- 2. Classroom snapshots are derived by the DB from the persisted membership
-- identity. Client-supplied sender strings and subsequent profile renames
-- cannot overwrite authorship history. Do not install a hard-delete fence until
-- all delivery cascade/retention and SQL maintenance paths are migrated.
CREATE OR REPLACE FUNCTION db05_classroom_sender_snapshot_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_sender_snapshot$
DECLARE
  trusted_display_name text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.sender_membership_id IS DISTINCT FROM OLD.sender_membership_id
       OR NEW.sender_role IS DISTINCT FROM OLD.sender_role
       OR NEW.sender_name_snapshot IS DISTINCT FROM OLD.sender_name_snapshot THEN
      RAISE EXCEPTION 'classroom sender attribution is immutable'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  SELECT u.display_name INTO trusted_display_name
  FROM college_memberships membership
  JOIN users u ON u.id = membership.user_id
  WHERE membership.id = NEW.sender_membership_id;
  IF trusted_display_name IS NULL OR btrim(trusted_display_name) = '' THEN
    RAISE EXCEPTION 'classroom sender requires a persisted identity'
      USING ERRCODE = '23514';
  END IF;
  NEW.sender_name_snapshot := left(trusted_display_name, 160);
  RETURN NEW;
END;
$db05_sender_snapshot$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$CREATE TRIGGER db05_classroom_sender_snapshot_before_write
    BEFORE INSERT OR UPDATE OF sender_membership_id, sender_role, sender_name_snapshot
    ON course_discussion_messages
    FOR EACH ROW EXECUTE FUNCTION db05_classroom_sender_snapshot_guard()$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
