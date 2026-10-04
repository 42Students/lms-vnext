CREATE TABLE "placement_learner_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL,
  "membership_id" uuid NOT NULL,
  "round_id" uuid,
  "offer_id" uuid,
  "request_type" varchar(32) NOT NULL,
  "status" varchar(24) DEFAULT 'PENDING' NOT NULL,
  "reason" text NOT NULL,
  "requested_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "decision_reason" text,
  "requested_by_user_id" uuid NOT NULL,
  "decided_by_user_id" uuid,
  "decided_at" timestamp with time zone,
  "effect_applied_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_learner_requests_type_ck" CHECK ("placement_learner_requests"."request_type" in ('APPLICATION_WITHDRAWAL', 'ROUND_RESCHEDULE', 'ABSENCE_DISPUTE', 'CORRECTION', 'OFFER_EXTENSION', 'OTHER')),
  CONSTRAINT "placement_learner_requests_status_ck" CHECK ("placement_learner_requests"."status" in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  CONSTRAINT "placement_learner_requests_reason_ck" CHECK (length(trim("placement_learner_requests"."reason")) > 0),
  CONSTRAINT "placement_learner_requests_payload_ck" CHECK (jsonb_typeof("placement_learner_requests"."requested_payload") = 'object'),
  CONSTRAINT "placement_learner_requests_target_ck" CHECK (("placement_learner_requests"."request_type" in ('ROUND_RESCHEDULE', 'ABSENCE_DISPUTE') and "placement_learner_requests"."round_id" is not null and "placement_learner_requests"."offer_id" is null)
    or ("placement_learner_requests"."request_type" = 'OFFER_EXTENSION' and "placement_learner_requests"."offer_id" is not null and "placement_learner_requests"."round_id" is null)
    or ("placement_learner_requests"."request_type" in ('APPLICATION_WITHDRAWAL', 'CORRECTION', 'OTHER') and "placement_learner_requests"."round_id" is null and "placement_learner_requests"."offer_id" is null)),
  CONSTRAINT "placement_learner_requests_rejection_reason_ck" CHECK ("placement_learner_requests"."status" <> 'REJECTED' or coalesce(length(trim("placement_learner_requests"."decision_reason")), 0) > 0),
  CONSTRAINT "placement_learner_requests_lifecycle_ck" CHECK (("placement_learner_requests"."status" = 'PENDING' and "placement_learner_requests"."decided_by_user_id" is null and "placement_learner_requests"."decided_at" is null and "placement_learner_requests"."effect_applied_at" is null and "placement_learner_requests"."cancelled_at" is null)
    or ("placement_learner_requests"."status" = 'APPROVED' and "placement_learner_requests"."decided_by_user_id" is not null and "placement_learner_requests"."decided_at" is not null and "placement_learner_requests"."effect_applied_at" is not null and "placement_learner_requests"."cancelled_at" is null)
    or ("placement_learner_requests"."status" = 'REJECTED' and "placement_learner_requests"."decided_by_user_id" is not null and "placement_learner_requests"."decided_at" is not null and "placement_learner_requests"."effect_applied_at" is null and "placement_learner_requests"."cancelled_at" is null)
    or ("placement_learner_requests"."status" = 'CANCELLED' and "placement_learner_requests"."decided_by_user_id" is null and "placement_learner_requests"."decided_at" is null and "placement_learner_requests"."effect_applied_at" is null and "placement_learner_requests"."cancelled_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "placement_learner_requests" ADD CONSTRAINT "placement_learner_requests_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_learner_requests" ADD CONSTRAINT "placement_learner_requests_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_learner_requests" ADD CONSTRAINT "placement_learner_requests_round_id_placement_job_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."placement_job_rounds"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_learner_requests" ADD CONSTRAINT "placement_learner_requests_offer_id_placement_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."placement_offers"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_learner_requests" ADD CONSTRAINT "placement_learner_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_learner_requests" ADD CONSTRAINT "placement_learner_requests_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_learner_requests_pending_type_uq" ON "placement_learner_requests" USING btree ("application_id","request_type") WHERE "placement_learner_requests"."status" = 'PENDING';
--> statement-breakpoint
CREATE INDEX "placement_learner_requests_application_status_idx" ON "placement_learner_requests" USING btree ("application_id","status","created_at");
--> statement-breakpoint
CREATE INDEX "placement_learner_requests_membership_status_idx" ON "placement_learner_requests" USING btree ("membership_id","status","created_at");
