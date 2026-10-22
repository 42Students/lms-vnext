-- Scoped profile storage keys. Never persist signed URLs or trust caller-supplied paths.
ALTER TABLE learner_profiles
  ADD COLUMN IF NOT EXISTS resume_object_path varchar(1024),
  ADD COLUMN IF NOT EXISTS profile_document_version integer NOT NULL DEFAULT 0;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE learner_profiles
  ADD CONSTRAINT learner_profiles_document_version_ck CHECK (profile_document_version >= 0)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
ALTER TABLE faculty_profiles
  ADD COLUMN IF NOT EXISTS avatar_object_path varchar(1024);
