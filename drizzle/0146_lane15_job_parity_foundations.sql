-- Legacy job provenance and optimistic concurrency; no historical data import.
ALTER TABLE placement_jobs
  ADD COLUMN recorded_outside boolean NOT NULL DEFAULT false,
  ADD COLUMN job_description_object_path text,
  ADD COLUMN legacy_job_description_url text,
  ADD COLUMN version integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE placement_jobs ADD CONSTRAINT placement_jobs_version_ck CHECK (version > 0);
