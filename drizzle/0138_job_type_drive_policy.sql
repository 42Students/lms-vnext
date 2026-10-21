-- Job Types parity: retain the college-facing label and per-drive placement rule.
-- Existing greenfield drives use the historic built-in answer (internships do not count).
ALTER TABLE "placement_jobs"
 ADD COLUMN "job_type_label" varchar(40);
--> statement-breakpoint
ALTER TABLE "placement_jobs"
 ADD COLUMN "counts_as_placed" boolean NOT NULL DEFAULT true;
--> statement-breakpoint
UPDATE "placement_jobs" SET
 "job_type_label" = CASE "employment_type"
  WHEN 'INTERNSHIP' THEN 'Internship'
  WHEN 'CONTRACT' THEN 'Contract'
  ELSE 'Full-time' END,
 "counts_as_placed" = ("employment_type" <> 'INTERNSHIP')
 WHERE "job_type_label" IS NULL;
--> statement-breakpoint
-- Prevent two custom types with names differing only by case from being persisted.
DROP INDEX IF EXISTS "placement_tpo_job_types_college_label_uq";
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_tpo_job_types_college_label_uq"
 ON "placement_tpo_job_types"("college_id", lower("label"));