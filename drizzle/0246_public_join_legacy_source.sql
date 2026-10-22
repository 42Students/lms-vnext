-- [chat-14] Historic college_public_link settings crosswalk.
-- Never import raw link nonce or bypass current drive review authorization.
ALTER TABLE placement_public_join_links ADD COLUMN IF NOT EXISTS legacy_college_id integer;
--> statement-breakpoint
ALTER TABLE placement_public_join_links ADD COLUMN IF NOT EXISTS legacy_nonce_digest varchar(64);
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_public_join_links ADD CONSTRAINT placement_public_join_links_legacy_nonce_ck
  CHECK(legacy_nonce_digest IS NULL OR legacy_nonce_digest ~ '^[a-f0-9]{64}$')$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
