-- [chat-14] Historical lesson resource JSON mapping; never store source private URL/token.
ALTER TABLE lesson_content_materials ADD COLUMN legacy_source_content_id integer;
--> statement-breakpoint
ALTER TABLE lesson_content_materials ADD COLUMN legacy_item_index integer;
--> statement-breakpoint
ALTER TABLE lesson_content_materials ADD COLUMN legacy_file_metadata jsonb;
--> statement-breakpoint
ALTER TABLE lesson_content_materials ADD CONSTRAINT lesson_content_materials_legacy_item_ck
  CHECK (legacy_item_index IS NULL OR legacy_item_index >= 0);
