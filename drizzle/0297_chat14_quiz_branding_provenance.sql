-- [chat-14] Legacy quiz and branding provenance; never make source URLs public.
ALTER TABLE course_quizzes
  ADD COLUMN IF NOT EXISTS legacy_total_points bigint,
  ADD COLUMN IF NOT EXISTS legacy_due_at_local varchar(64);
--> statement-breakpoint
ALTER TABLE college_branding
  ADD COLUMN IF NOT EXISTS legacy_logo_source_url text,
  ADD COLUMN IF NOT EXISTS legacy_branding_archived_at timestamptz;
--> statement-breakpoint
-- Only verified private-object uploads may populate the existing logo_url.
-- Zero/oversized legacy quiz scores stay in legacy_total_points for manual
-- review; total_points is never silently clamped into a scored assessment.
