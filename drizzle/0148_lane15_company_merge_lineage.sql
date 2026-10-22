-- Canonical company merger links preserve all original company/job IDs.
CREATE TABLE IF NOT EXISTS placement_company_merge_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_company_id uuid NOT NULL REFERENCES placement_companies(id) ON DELETE RESTRICT,
  target_company_id uuid NOT NULL REFERENCES placement_companies(id) ON DELETE RESTRICT,
  reason text,
  merged_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  merged_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_company_merge_distinct_ck CHECK (source_company_id <> target_company_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS placement_company_merge_source_uq
  ON placement_company_merge_history(source_company_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_company_merge_target_idx
  ON placement_company_merge_history(target_company_id);
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_company_relationships
  ADD CONSTRAINT placement_company_relationships_notes_len_ck
  CHECK (internal_notes IS NULL OR length(internal_notes) <= 2000)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
