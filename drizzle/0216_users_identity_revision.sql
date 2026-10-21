-- [chat-14] Global identity CAS, independent of per-college membership and profile document versions.
ALTER TABLE users ADD COLUMN version integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE users ADD CONSTRAINT users_version_ck CHECK (version > 0);
