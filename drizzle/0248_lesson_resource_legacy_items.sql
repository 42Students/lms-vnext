-- [chat-14] Historical lesson resource JSON mapping; never store source private URL/token.
ALTER TABLE lesson_content_materials ADD COLUMN IF NOT EXISTS legacy_source_content_id integer;
--> statement-breakpoint
ALTER TABLE lesson_content_materials ADD COLUMN IF NOT EXISTS legacy_item_index integer;
--> statement-breakpoint
ALTER TABLE lesson_content_materials ADD COLUMN IF NOT EXISTS legacy_file_metadata jsonb;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE lesson_content_materials ADD CONSTRAINT lesson_content_materials_legacy_item_ck
  CHECK (legacy_item_index IS NULL OR legacy_item_index >= 0)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
