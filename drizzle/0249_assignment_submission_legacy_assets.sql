-- [chat-14] Historical source submission asset map. The live mixed FILE flow needs signed receipt service changes.
ALTER TABLE assignment_submission_links ADD COLUMN legacy_asset_id integer;
--> statement-breakpoint
ALTER TABLE assignment_submission_links ADD COLUMN legacy_asset_index integer;
--> statement-breakpoint
ALTER TABLE assignment_submission_links ADD COLUMN legacy_asset_metadata jsonb;
--> statement-breakpoint
ALTER TABLE assignment_submission_links ADD CONSTRAINT assignment_submission_links_legacy_index_ck
  CHECK (legacy_asset_index IS NULL OR legacy_asset_index >= 0);
