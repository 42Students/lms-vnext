-- [chat-14] Legacy progress duration is per-attempt, not just content metadata.
-- No mutation of first_completed_at; service must write it once per attempt.
ALTER TABLE learner_content_progress
 ADD COLUMN IF NOT EXISTS duration_seconds integer NOT NULL DEFAULT 0;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE learner_content_progress
 ADD CONSTRAINT learner_content_progress_duration_ck
 CHECK (duration_seconds >= 0)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
