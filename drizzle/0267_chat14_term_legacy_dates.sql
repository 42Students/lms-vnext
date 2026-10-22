-- [chat-14] Legacy curriculum term date windows and ordered course reads.
ALTER TABLE program_terms ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE program_terms ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE program_terms DROP CONSTRAINT IF EXISTS program_terms_date_order_ck;
ALTER TABLE program_terms ADD CONSTRAINT program_terms_date_order_ck CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date);
CREATE INDEX IF NOT EXISTS program_term_courses_display_order_idx ON program_term_courses (program_term_id,display_order,id);
