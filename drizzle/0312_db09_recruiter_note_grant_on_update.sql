-- DB-079 forward-only security correction. PG17 registered-journal migration.
-- Existing 0075 trigger was restricted to UPDATE OF identity columns. A note
-- content/rating UPDATE after recruiter grant revocation never ran the active
-- same-company grant check. Preserve the original scope function and history.
-- No data rewrite, no table shape change, no new provider privilege.
DO $db079_note_guard_preflight$
BEGIN
  IF to_regprocedure('db09_assert_recruiter_private_note_scope()') IS NULL
     OR NOT EXISTS (
       SELECT 1
         FROM pg_trigger
        WHERE tgname = 'db09_recruiter_private_note_scope_guard'
          AND tgrelid = 'placement_recruiter_applicant_notes'::regclass
          AND NOT tgisinternal
     ) THEN
    RAISE EXCEPTION 'DB079 missing registered recruiter private note guard'
      USING ERRCODE = '23514';
  END IF;
END
$db079_note_guard_preflight$;
--> statement-breakpoint
-- Recheck current active grant for every UPDATE, including rating/note edits.
-- DB09 lifecycle trigger independently retains immutable identity and
-- monotone updated_at protections.
CREATE OR REPLACE TRIGGER db09_recruiter_private_note_scope_guard
  BEFORE INSERT OR UPDATE
  ON placement_recruiter_applicant_notes
  FOR EACH ROW
  EXECUTE FUNCTION db09_assert_recruiter_private_note_scope();
