CREATE TABLE "placement_company_applicant_share_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"share_id" uuid NOT NULL,
	"college_id" uuid NOT NULL,
	"event_kind" varchar(12) NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pcas_views_kind_ck" CHECK ("placement_company_applicant_share_views"."event_kind" IN ('VIEW','CSV'))
);
--> statement-breakpoint
CREATE TABLE "placement_company_applicant_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"created_by_membership_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pcas_hash_shape_ck" CHECK ("placement_company_applicant_shares"."token_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "pcas_expiry_ck" CHECK ("placement_company_applicant_shares"."expires_at" > "placement_company_applicant_shares"."created_at")
);
--> statement-breakpoint
CREATE INDEX "pcas_views_share_idx" ON "placement_company_applicant_share_views" USING btree ("share_id","occurred_at" DESC NULLS LAST);
--> statement-breakpoint
CREATE UNIQUE INDEX "pcas_token_hash_uq" ON "placement_company_applicant_shares" USING btree ("token_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX "pcas_share_id_college_uq" ON "placement_company_applicant_shares" USING btree ("id","college_id");
--> statement-breakpoint
CREATE INDEX "pcas_college_job_idx" ON "placement_company_applicant_shares" USING btree ("college_id","job_id");
--> statement-breakpoint
ALTER TABLE "placement_company_applicant_share_views" ADD CONSTRAINT "placement_company_applicant_share_views_share_id_placement_company_applicant_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."placement_company_applicant_shares"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_company_applicant_share_views" ADD CONSTRAINT "placement_company_applicant_share_views_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_company_applicant_share_views" ADD CONSTRAINT "pcas_views_tenant_fk" FOREIGN KEY ("share_id","college_id") REFERENCES "public"."placement_company_applicant_shares"("id","college_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_company_applicant_shares" ADD CONSTRAINT "placement_company_applicant_shares_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_company_applicant_shares" ADD CONSTRAINT "placement_company_applicant_shares_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_company_applicant_shares" ADD CONSTRAINT "placement_company_applicant_shares_created_by_membership_id_college_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_company_applicant_shares" ADD CONSTRAINT "pcas_job_tenant_fk" FOREIGN KEY ("job_id","college_id") REFERENCES "public"."placement_jobs"("id","college_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_company_applicant_shares" ADD CONSTRAINT "pcas_actor_tenant_fk" FOREIGN KEY ("created_by_membership_id","college_id") REFERENCES "public"."college_memberships"("id","college_id") ON DELETE no action ON UPDATE no action;
