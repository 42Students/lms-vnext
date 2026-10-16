CREATE TABLE "placement_drive_selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"role_title" text NOT NULL,
	"annual_ctc_inr" integer,
	"status" varchar(16) DEFAULT 'SELECTED' NOT NULL,
	"recorded_by_user_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_by_user_id" uuid,
	"verified_at" timestamp with time zone,
	"released_offer_id" uuid,
	"released_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_drive_selections_status_ck" CHECK ("placement_drive_selections"."status" in ('SELECTED','VERIFIED','RELEASED')),
	CONSTRAINT "placement_drive_selections_ctc_ck" CHECK ("placement_drive_selections"."annual_ctc_inr" is null or "placement_drive_selections"."annual_ctc_inr" between 0 and 100000000),
	CONSTRAINT "placement_drive_selections_verified_ck" CHECK (("placement_drive_selections"."status" = 'SELECTED' and "placement_drive_selections"."verified_at" is null and "placement_drive_selections"."released_at" is null and "placement_drive_selections"."released_offer_id" is null) or ("placement_drive_selections"."status" = 'VERIFIED' and "placement_drive_selections"."verified_at" is not null and "placement_drive_selections"."released_at" is null and "placement_drive_selections"."released_offer_id" is null) or ("placement_drive_selections"."status" = 'RELEASED' and "placement_drive_selections"."verified_at" is not null and "placement_drive_selections"."released_offer_id" is not null and "placement_drive_selections"."released_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "placement_drive_selections" ADD CONSTRAINT "placement_drive_selections_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_drive_selections" ADD CONSTRAINT "placement_drive_selections_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_drive_selections" ADD CONSTRAINT "placement_drive_selections_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_drive_selections" ADD CONSTRAINT "placement_drive_selections_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_drive_selections" ADD CONSTRAINT "placement_drive_selections_released_offer_id_placement_offers_id_fk" FOREIGN KEY ("released_offer_id") REFERENCES "public"."placement_offers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "placement_drive_selections_application_uq" ON "placement_drive_selections" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "placement_drive_selections_job_status_idx" ON "placement_drive_selections" USING btree ("job_id","status");