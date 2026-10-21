-- Scoped profile storage keys. Never persist signed URLs or trust caller-supplied paths.
ALTER TABLE learner_profiles
  ADD COLUMN resume_object_path varchar(1024),
  ADD COLUMN profile_document_version integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE learner_profiles
  ADD CONSTRAINT learner_profiles_document_version_ck CHECK (profile_document_version >= 0);
--> statement-breakpoint
ALTER TABLE faculty_profiles
  ADD COLUMN avatar_object_path varchar(1024);
