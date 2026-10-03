CREATE TABLE "placement_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "college_id" uuid NOT NULL,
  "company_relationship_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "employment_type" varchar(24) NOT NULL,
  "work_mode" varchar(24) NOT NULL,
  "locations" text[] DEFAULT '{}'::text[] NOT NULL,
  "openings" integer,
  "minimum_annual_ctc_inr" integer,
  "maximum_annual_ctc_inr" integer,
  "application_mode" varchar(24) DEFAULT 'INTERNAL' NOT NULL,
  "external_application_url" text,
  "application_deadline" timestamp with time zone,
  "status" varchar(24) DEFAULT 'DRAFT' NOT NULL,
  "published_at" timestamp with time zone,
  "closed_at" timestamp with time zone,
  "archived_at" timestamp with time zone,
  "created_by_user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_jobs_status_ck" CHECK ("placement_jobs"."status" in ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED')),
  CONSTRAINT "placement_jobs_employment_type_ck" CHECK ("placement_jobs"."employment_type" in ('FULL_TIME', 'INTERNSHIP', 'CONTRACT')),
  CONSTRAINT "placement_jobs_work_mode_ck" CHECK ("placement_jobs"."work_mode" in ('ONSITE', 'HYBRID', 'REMOTE')),
  CONSTRAINT "placement_jobs_application_mode_ck" CHECK ("placement_jobs"."application_mode" in ('INTERNAL', 'HYBRID', 'EXTERNAL_ONLY')),
  CONSTRAINT "placement_jobs_openings_ck" CHECK ("placement_jobs"."openings" is null or "placement_jobs"."openings" > 0),
  CONSTRAINT "placement_jobs_ctc_ck" CHECK (("placement_jobs"."minimum_annual_ctc_inr" is null or "placement_jobs"."minimum_annual_ctc_inr" >= 0) and ("placement_jobs"."maximum_annual_ctc_inr" is null or "placement_jobs"."maximum_annual_ctc_inr" >= 0) and ("placement_jobs"."minimum_annual_ctc_inr" is null or "placement_jobs"."maximum_annual_ctc_inr" is null or "placement_jobs"."maximum_annual_ctc_inr" >= "placement_jobs"."minimum_annual_ctc_inr")),
  CONSTRAINT "placement_jobs_external_url_ck" CHECK (("placement_jobs"."application_mode" <> 'EXTERNAL_ONLY') or ("placement_jobs"."external_application_url" is not null)),
  CONSTRAINT "placement_jobs_lifecycle_ck" CHECK (("placement_jobs"."status" = 'DRAFT' and "placement_jobs"."published_at" is null and "placement_jobs"."closed_at" is null and "placement_jobs"."archived_at" is null) or ("placement_jobs"."status" = 'PUBLISHED' and "placement_jobs"."published_at" is not null and "placement_jobs"."closed_at" is null and "placement_jobs"."archived_at" is null) or ("placement_jobs"."status" = 'CLOSED' and "placement_jobs"."published_at" is not null and "placement_jobs"."closed_at" is not null and "placement_jobs"."archived_at" is null) or ("placement_jobs"."status" = 'ARCHIVED' and "placement_jobs"."archived_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD CONSTRAINT "placement_jobs_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD CONSTRAINT "placement_jobs_company_relationship_id_placement_company_relationships_id_fk" FOREIGN KEY ("company_relationship_id") REFERENCES "public"."placement_company_relationships"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD CONSTRAINT "placement_jobs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "placement_jobs_college_status_idx" ON "placement_jobs" USING btree ("college_id","status");
--> statement-breakpoint
CREATE INDEX "placement_jobs_relationship_idx" ON "placement_jobs" USING btree ("company_relationship_id");