CREATE TABLE "placement_job_role_options" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "job_id" uuid NOT NULL,
  "title" text NOT NULL,
  "employment_type" varchar(24) NOT NULL,
  "work_mode" varchar(24) NOT NULL,
  "locations" text[] DEFAULT '{}'::text[] NOT NULL,
  "openings" integer,
  "minimum_annual_ctc_inr" integer,
  "maximum_annual_ctc_inr" integer,
  "is_primary" boolean DEFAULT false NOT NULL,
  "status" varchar(24) DEFAULT 'ACTIVE' NOT NULL,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_job_role_options_status_ck" CHECK ("placement_job_role_options"."status" in ('ACTIVE', 'ARCHIVED')),
  CONSTRAINT "placement_job_role_options_employment_type_ck" CHECK ("placement_job_role_options"."employment_type" in ('FULL_TIME', 'INTERNSHIP', 'CONTRACT')),
  CONSTRAINT "placement_job_role_options_work_mode_ck" CHECK ("placement_job_role_options"."work_mode" in ('ONSITE', 'HYBRID', 'REMOTE')),
  CONSTRAINT "placement_job_role_options_openings_ck" CHECK ("placement_job_role_options"."openings" is null or "placement_job_role_options"."openings" > 0),
  CONSTRAINT "placement_job_role_options_ctc_ck" CHECK (("placement_job_role_options"."minimum_annual_ctc_inr" is null or "placement_job_role_options"."minimum_annual_ctc_inr" >= 0)
        and ("placement_job_role_options"."maximum_annual_ctc_inr" is null or "placement_job_role_options"."maximum_annual_ctc_inr" >= 0)
        and ("placement_job_role_options"."minimum_annual_ctc_inr" is null or "placement_job_role_options"."maximum_annual_ctc_inr" is null or "placement_job_role_options"."maximum_annual_ctc_inr" >= "placement_job_role_options"."minimum_annual_ctc_inr")),
  CONSTRAINT "placement_job_role_options_archive_shape_ck" CHECK (("placement_job_role_options"."status" = 'ARCHIVED') = ("placement_job_role_options"."archived_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "placement_job_role_options" ADD CONSTRAINT "placement_job_role_options_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "placement_job_role_options" (
  "job_id",
  "title",
  "employment_type",
  "work_mode",
  "locations",
  "openings",
  "minimum_annual_ctc_inr",
  "maximum_annual_ctc_inr",
  "is_primary"
)
SELECT
  "id",
  "title",
  "employment_type",
  "work_mode",
  "locations",
  "openings",
  "minimum_annual_ctc_inr",
  "maximum_annual_ctc_inr",
  true
FROM "placement_jobs";
--> statement-breakpoint
ALTER TABLE "placement_applications" ADD COLUMN "role_option_id" uuid;
--> statement-breakpoint
UPDATE "placement_applications" AS "application"
SET "role_option_id" = "role"."id"
FROM "placement_job_role_options" AS "role"
WHERE "role"."job_id" = "application"."job_id"
  AND "role"."is_primary" = true
  AND "role"."status" = 'ACTIVE';
--> statement-breakpoint
ALTER TABLE "placement_applications" ALTER COLUMN "role_option_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_role_option_id_placement_job_role_options_id_fk" FOREIGN KEY ("role_option_id") REFERENCES "public"."placement_job_role_options"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
DROP INDEX "placement_applications_job_membership_uq";
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_job_role_options_job_title_uq" ON "placement_job_role_options" USING btree ("job_id","title") WHERE "placement_job_role_options"."status" = 'ACTIVE';
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_job_role_options_primary_uq" ON "placement_job_role_options" USING btree ("job_id") WHERE "placement_job_role_options"."is_primary" = true and "placement_job_role_options"."status" = 'ACTIVE';
--> statement-breakpoint
CREATE INDEX "placement_job_role_options_job_status_idx" ON "placement_job_role_options" USING btree ("job_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_applications_role_membership_uq" ON "placement_applications" USING btree ("role_option_id","membership_id");
--> statement-breakpoint
CREATE INDEX "placement_applications_job_membership_idx" ON "placement_applications" USING btree ("job_id","membership_id");
