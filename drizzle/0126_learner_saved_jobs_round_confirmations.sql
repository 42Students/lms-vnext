CREATE TABLE "placement_learner_round_confirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"status" varchar(16) DEFAULT 'CONFIRMED' NOT NULL,
	"confirmed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_learner_round_confirmations_status_ck" CHECK ("placement_learner_round_confirmations"."status" in ('CONFIRMED','CANCELLED'))
);
--> statement-breakpoint
ALTER TABLE "placement_learner_round_confirmations" ADD CONSTRAINT "placement_learner_round_confirmations_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_learner_round_confirmations" ADD CONSTRAINT "placement_learner_round_confirmations_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_learner_round_confirmations" ADD CONSTRAINT "placement_learner_round_confirmations_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_learner_round_confirmations" ADD CONSTRAINT "placement_learner_round_confirmations_round_id_placement_job_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."placement_job_rounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "placement_learner_round_confirmations_uq" ON "placement_learner_round_confirmations" USING btree ("application_id","round_id");--> statement-breakpoint
CREATE INDEX "placement_learner_round_confirmations_owner_idx" ON "placement_learner_round_confirmations" USING btree ("college_id","membership_id","updated_at" desc);