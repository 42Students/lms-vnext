-- [chat-14] Legacy curriculum term date windows and ordered course reads.
ALTER TABLE program_terms ADD COLUMN IF NOT EXISTS start_date date;
--> statement-breakpoint
ALTER TABLE program_terms ADD COLUMN IF NOT EXISTS end_date date;
--> statement-breakpoint
ALTER TABLE program_terms DROP CONSTRAINT IF EXISTS program_terms_date_order_ck;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE program_terms ADD CONSTRAINT program_terms_date_order_ck CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS program_term_courses_display_order_idx ON program_term_courses (program_term_id,display_order,id);
