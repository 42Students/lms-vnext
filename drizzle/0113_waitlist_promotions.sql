CREATE TABLE "placement_waitlist_promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"seat_number" integer NOT NULL,
	"waitlist_rank" integer NOT NULL,
	"status" varchar(16) DEFAULT 'PENDING' NOT NULL,
	"reason" text NOT NULL,
	"offer_id" uuid,
	"promoted_by_user_id" uuid NOT NULL,
	"promoted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone,
	CONSTRAINT "placement_waitlist_promotions_rank_ck" CHECK ("placement_waitlist_promotions"."waitlist_rank">0 and "placement_waitlist_promotions"."seat_number">0),
	CONSTRAINT "placement_waitlist_promotions_status_ck" CHECK ("placement_waitlist_promotions"."status" in ('PENDING','RELEASED')),
	CONSTRAINT "placement_waitlist_promotions_release_ck" CHECK (("placement_waitlist_promotions"."status"='PENDING' and "placement_waitlist_promotions"."offer_id" is null and "placement_waitlist_promotions"."released_at" is null) or ("placement_waitlist_promotions"."status"='RELEASED' and "placement_waitlist_promotions"."offer_id" is not null and "placement_waitlist_promotions"."released_at" is not null)),
	CONSTRAINT "placement_waitlist_promotions_reason_ck" CHECK (length(trim("placement_waitlist_promotions"."reason"))>=3)
);
--> statement-breakpoint
ALTER TABLE "placement_waitlist_promotions" ADD CONSTRAINT "placement_waitlist_promotions_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_waitlist_promotions" ADD CONSTRAINT "placement_waitlist_promotions_round_id_placement_job_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."placement_job_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_waitlist_promotions" ADD CONSTRAINT "placement_waitlist_promotions_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_waitlist_promotions" ADD CONSTRAINT "placement_waitlist_promotions_offer_id_placement_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."placement_offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_waitlist_promotions" ADD CONSTRAINT "placement_waitlist_promotions_promoted_by_user_id_users_id_fk" FOREIGN KEY ("promoted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_waitlist_promotions" ADD CONSTRAINT "waitlist_promotion_round_job_fk" FOREIGN KEY ("round_id","job_id") REFERENCES "public"."placement_job_rounds"("id","job_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "placement_waitlist_promotions_application_uq" ON "placement_waitlist_promotions" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_waitlist_promotions_job_seat_uq" ON "placement_waitlist_promotions" USING btree ("job_id","seat_number");--> statement-breakpoint
CREATE INDEX "placement_waitlist_promotions_job_status_idx" ON "placement_waitlist_promotions" USING btree ("job_id","status");