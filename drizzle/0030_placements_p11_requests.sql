CREATE TABLE "placement_learner_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL,
  "request_type" varchar(40) NOT NULL,
  "round_id" uuid,
  "offer_id" uuid,
  "scope_key" text NOT NULL,
  "reason" text NOT NULL,
  "effect_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" varchar(24) DEFAULT 'PENDING' NOT NULL,
  "requested_by_user_id" uuid NOT NULL,
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "decided_by_user_id" uuid,
  "decided_at" timestamp with time zone,
  "decision_note" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_learner_requests_type_ck" CHECK ("placement_learner_requests"."request_type" in ('APPLICATION_WITHDRAWAL', 'ROUND_RESCHEDULE', 'OFFER_EXTENSION')),
  CONSTRAINT "placement_learner_requests_status_ck" CHECK ("placement_learner_requests"."status" in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  CONSTRAINT "placement_learner_requests_reason_ck" CHECK (length(trim("placement_learner_requests"."reason")) >= 3),
  CONSTRAINT "placement_learner_requests_target_shape_ck" CHECK (("placement_learner_requests"."request_type" = 'APPLICATION_WITHDRAWAL' and "placement_learner_requests"."round_id" is null and "placement_learner_requests"."offer_id" is null)
        or ("placement_learner_requests"."request_type" = 'ROUND_RESCHEDULE' and "placement_learner_requests"."round_id" is not null and "placement_learner_requests"."offer_id" is null)
        or ("placement_learner_requests"."request_type" = 'OFFER_EXTENSION' and "placement_learner_requests"."round_id" is null and "placement_learner_requests"."offer_id" is not null)),
  CONSTRAINT "placement_learner_requests_lifecycle_ck" CHECK (("placement_learner_requests"."status" = 'PENDING' and "placement_learner_requests"."decided_by_user_id" is null and "placement_learner_requests"."decided_at" is null)
        or ("placement_learner_requests"."status" in ('APPROVED', 'REJECTED', 'CANCELLED') and "placement_learner_requests"."decided_by_user_id" is not null and "placement_learner_requests"."decided_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "placement_application_round_exceptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL,
  "round_id" uuid NOT NULL,
  "request_id" uuid NOT NULL,
  "scheduled_at" timestamp with time zone NOT NULL,
  "timezone" varchar(64) NOT NULL,
  "mode" varchar(24) NOT NULL,
  "venue" text,
  "meeting_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_application_round_exceptions_mode_ck" CHECK ("placement_application_round_exceptions"."mode" in ('ON_CAMPUS', 'VIRTUAL')),
  CONSTRAINT "placement_application_round_exceptions_delivery_ck" CHECK (("placement_application_round_exceptions"."mode" = 'ON_CAMPUS' and coalesce(length(trim("placement_application_round_exceptions"."venue")), 0) > 0 and "placement_application_round_exceptions"."meeting_url" is null)
        or ("placement_application_round_exceptions"."mode" = 'VIRTUAL' and coalesce(length(trim("placement_application_round_exceptions"."meeting_url")), 0) > 0 and "placement_application_round_exceptions"."venue" is null))
);
--> statement-breakpoint
ALTER TABLE "placement_learner_requests" ADD CONSTRAINT "placement_learner_requests_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_learner_requests" ADD CONSTRAINT "placement_learner_requests_round_id_placement_job_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."placement_job_rounds"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_learner_requests" ADD CONSTRAINT "placement_learner_requests_offer_id_placement_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."placement_offers"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_learner_requests" ADD CONSTRAINT "placement_learner_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_learner_requests" ADD CONSTRAINT "placement_learner_requests_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_application_round_exceptions" ADD CONSTRAINT "placement_application_round_exceptions_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_application_round_exceptions" ADD CONSTRAINT "placement_application_round_exceptions_round_id_placement_job_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."placement_job_rounds"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_application_round_exceptions" ADD CONSTRAINT "placement_application_round_exceptions_request_id_placement_learner_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."placement_learner_requests"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_learner_requests_pending_scope_uq" ON "placement_learner_requests" USING btree ("scope_key") WHERE "placement_learner_requests"."status" = 'PENDING';
--> statement-breakpoint
CREATE INDEX "placement_learner_requests_application_status_idx" ON "placement_learner_requests" USING btree ("application_id","status","requested_at");
--> statement-breakpoint
CREATE INDEX "placement_learner_requests_type_status_idx" ON "placement_learner_requests" USING btree ("request_type","status","requested_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_application_round_exceptions_scope_uq" ON "placement_application_round_exceptions" USING btree ("application_id","round_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_application_round_exceptions_request_uq" ON "placement_application_round_exceptions" USING btree ("request_id");
--> statement-breakpoint
CREATE INDEX "placement_application_round_exceptions_round_idx" ON "placement_application_round_exceptions" USING btree ("round_id","scheduled_at");
