-- Lane 15 TPO job-type bridge; owner must approve/replay. Do not execute the obsolete, unjournaled 0138_job_type_drive_policy.sql alongside this migration.
-- Built-ins remain virtual until a TPO override is saved. Jobs snapshot their type label, preserving historic hidden/custom choices without a false FK.
ALTER TABLE placement_jobs ADD COLUMN IF NOT EXISTS job_type_label varchar(40);
--> statement-breakpoint
-- Fallback only when an old drive has NO saved type label. Never overwrite custom labels.
UPDATE placement_jobs SET job_type_label = CASE employment_type
  WHEN 'FULL_TIME' THEN 'Full-time'
  WHEN 'INTERNSHIP' THEN 'Internship'
  WHEN 'CONTRACT' THEN 'Contract'
  ELSE NULL END
 WHERE job_type_label IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_jobs_college_job_type_idx
 ON placement_jobs (college_id, lower(job_type_label));
--> statement-breakpoint
ALTER TABLE placement_tpo_job_types ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
--> statement-breakpoint
WITH numbered AS (
 SELECT id, row_number() OVER (PARTITION BY college_id ORDER BY updated_at, id)::integer AS position
 FROM placement_tpo_job_types
)
UPDATE placement_tpo_job_types t SET sort_order = numbered.position
 FROM numbered WHERE t.id = numbered.id AND t.sort_order = 0;
--> statement-breakpoint
-- The legacy default was true for unknown custom types; Internship was explicitly false.
UPDATE placement_tpo_job_types
 SET counts_as_placed = (lower(label) <> 'internship')
 WHERE counts_as_placed IS NULL;
--> statement-breakpoint
-- Fail closed on ambiguous case-only duplicates or overlong stored labels; do not destroy legacy choices silently.
DO $lane15_job_types$
BEGIN
 IF EXISTS (SELECT 1 FROM placement_tpo_job_types WHERE char_length(label) > 40 OR char_length(btrim(label)) < 2) THEN
   RAISE EXCEPTION 'Invalid historical job-type label; reconcile before migration';
 END IF;
 IF EXISTS (SELECT 1 FROM placement_tpo_job_types GROUP BY college_id, lower(label) HAVING count(*) > 1) THEN
   RAISE EXCEPTION 'Case-insensitive job-type collision; reconcile before migration';
 END IF;
END;
$lane15_job_types$;
--> statement-breakpoint
ALTER TABLE placement_tpo_job_types
 ALTER COLUMN counts_as_placed SET DEFAULT true,
 ALTER COLUMN counts_as_placed SET NOT NULL,
 ALTER COLUMN label TYPE varchar(40);
--> statement-breakpoint
ALTER TABLE placement_tpo_job_types DROP CONSTRAINT IF EXISTS placement_tpo_job_types_label_ck;
--> statement-breakpoint
ALTER TABLE placement_tpo_job_types ADD CONSTRAINT placement_tpo_job_types_label_ck
 CHECK (length(btrim(label)) BETWEEN 2 AND 40 AND label ~ '^[[:alnum:] +&/().,''-]{2,40}$');
--> statement-breakpoint
DROP INDEX IF EXISTS placement_tpo_job_types_college_label_uq;
--> statement-breakpoint
CREATE UNIQUE INDEX placement_tpo_job_types_college_label_uq
 ON placement_tpo_job_types (college_id, lower(label));
-- Existing application service synchronizes renamed labels and changed placement answers across jobs in its college-scoped transaction.
-- Per-drive counts_as_placed remains nullable when unaudited; do not silently invent placement outcomes from employment_type.
