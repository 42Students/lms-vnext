-- [chat-14] Global identity CAS, independent of per-college membership and profile document versions.
ALTER TABLE users ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE users ADD CONSTRAINT users_version_ck CHECK (version > 0)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
