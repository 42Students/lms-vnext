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
-- Preserve custom choice order independent of renames and version timestamps.
ALTER TABLE "placement_tpo_job_types"
 ADD COLUMN "sort_order" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
WITH ranked AS (
 SELECT id, row_number() OVER (PARTITION BY college_id ORDER BY updated_at, id)::integer AS pos
 FROM "placement_tpo_job_types"
)
UPDATE "placement_tpo_job_types" jt SET sort_order = ranked.pos
 FROM ranked WHERE jt.id = ranked.id;
--> statement-breakpoint
-- Preserve the original label grammar and complete boolean placement rule.
UPDATE "placement_tpo_job_types" SET "counts_as_placed" =
 CASE WHEN lower("label") = 'internship' THEN false ELSE true END
 WHERE "counts_as_placed" IS NULL;
--> statement-breakpoint
ALTER TABLE "placement_tpo_job_types"
 ALTER COLUMN "counts_as_placed" SET DEFAULT true,
 ALTER COLUMN "counts_as_placed" SET NOT NULL,
 ALTER COLUMN "label" TYPE varchar(40);
--> statement-breakpoint
ALTER TABLE "placement_tpo_job_types" DROP CONSTRAINT IF EXISTS "placement_tpo_job_types_label_ck";
--> statement-breakpoint
ALTER TABLE "placement_tpo_job_types" ADD CONSTRAINT "placement_tpo_job_types_label_ck"
 CHECK (length(btrim("label")) BETWEEN 2 AND 40
        AND "label" ~ '^[[:alnum:] +&/().,''-]{2,40}$');
--> statement-breakpoint
-- Prevent two custom types with names differing only by case from being persisted.
DROP INDEX IF EXISTS "placement_tpo_job_types_college_label_uq";
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_tpo_job_types_college_label_uq"
 ON "placement_tpo_job_types"("college_id", lower("label"));
--> statement-breakpoint
-- Enforce the last-active rule at commit, including five virtual built-in choices.
-- A deferred trigger permits an atomic bulk edit to hide a built-in while adding
-- another type in the same transaction without a transient false rejection.
CREATE OR REPLACE FUNCTION "assert_tpo_job_types_keep_active"() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE selected_college uuid;
DECLARE active_options integer;
BEGIN
 IF TG_OP = 'DELETE' THEN
  selected_college := OLD.college_id;
 ELSE
  selected_college := NEW.college_id;
 END IF;
 SELECT 5 - count(*) FILTER (WHERE is_builtin)
       + count(*) FILTER (WHERE active)
 INTO active_options
 FROM "placement_tpo_job_types"
 WHERE college_id = selected_college;
 IF active_options < 1 THEN
  RAISE EXCEPTION 'Keep at least one job type switched on'
   USING ERRCODE = '23514', CONSTRAINT = 'placement_tpo_job_types_last_active_ck';
 END IF;
 RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER "placement_tpo_job_types_last_active_ck"
AFTER INSERT OR UPDATE OR DELETE ON "placement_tpo_job_types"
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION "assert_tpo_job_types_keep_active"();
