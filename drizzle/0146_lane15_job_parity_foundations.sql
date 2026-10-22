-- Legacy job provenance and optimistic concurrency; no historical data import.
ALTER TABLE placement_jobs
  ADD COLUMN IF NOT EXISTS recorded_outside boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS job_description_object_path text,
  ADD COLUMN IF NOT EXISTS legacy_job_description_url text,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_jobs ADD CONSTRAINT placement_jobs_version_ck CHECK (version > 0)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
