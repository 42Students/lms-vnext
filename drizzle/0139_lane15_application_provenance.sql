-- Lane 15 applicant source, provenance and protected attachments.
-- Existing application rows retain their role-option cardinality.
ALTER TABLE placement_applications
  ADD COLUMN IF NOT EXISTS source_provider varchar(50),
  ADD COLUMN IF NOT EXISTS pap_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_ref varchar(33),
  ADD COLUMN IF NOT EXISTS external_ref text,
  ADD COLUMN IF NOT EXISTS current_round_id uuid,
  ADD COLUMN IF NOT EXISTS applied_by_college boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS applied_by_college_opt_out_until timestamptz,
  ADD COLUMN IF NOT EXISTS ineligible_flag_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawal_reason varchar(64),
  ADD COLUMN IF NOT EXISTS status_before_withdrawal varchar(30),
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_updated_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
--> statement-breakpoint
UPDATE placement_applications
  SET public_ref = 'A' || upper(replace(id::text, '-', ''))
  WHERE public_ref IS NULL;
--> statement-breakpoint
ALTER TABLE placement_applications
  ALTER COLUMN public_ref SET DEFAULT ('A' || upper(replace(gen_random_uuid()::text, '-', ''))),
  ALTER COLUMN public_ref SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS placement_applications_public_ref_uq ON placement_applications(public_ref);
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_applications ADD CONSTRAINT placement_applications_version_ck CHECK (version > 0)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_applications ADD CONSTRAINT placement_applications_current_round_job_fk
  FOREIGN KEY (current_round_id, job_id)
  REFERENCES placement_job_rounds(id, job_id) ON DELETE RESTRICT NOT VALID$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS placement_application_private_artifacts (
  application_id uuid PRIMARY KEY REFERENCES placement_applications(id) ON DELETE RESTRICT,
  assessment_url text,
  resume_object_path text,
  legacy_resume_url text,
  resume_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  internal_notes text,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_application_private_resume_history_ck CHECK (jsonb_typeof(resume_history) = 'array')
);
