CREATE TABLE "placement_job_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"kind" varchar(24) NOT NULL,
	"name" text NOT NULL,
	"mode" varchar(24),
	"scheduled_at" timestamp with time zone,
	"timezone" varchar(64),
	"venue" text,
	"meeting_url" text,
	"what_to_bring" text,
	"platform" text,
	"test_url" text,
	"duration_minutes" integer,
	"results_due_at" timestamp with time zone,
	"status" varchar(24) DEFAULT 'PENDING' NOT NULL,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_job_rounds_sequence_ck" CHECK ("placement_job_rounds"."sequence" > 0),
	CONSTRAINT "placement_job_rounds_kind_ck" CHECK ("placement_job_rounds"."kind" in ('TALK', 'TEST', 'VENDOR_TEST', 'GD', 'INTERVIEW')),
	CONSTRAINT "placement_job_rounds_mode_ck" CHECK ("placement_job_rounds"."mode" is null or "placement_job_rounds"."mode" in ('ON_CAMPUS', 'VIRTUAL')),
	CONSTRAINT "placement_job_rounds_status_ck" CHECK ("placement_job_rounds"."status" in ('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED')),
	CONSTRAINT "placement_job_rounds_duration_ck" CHECK ("placement_job_rounds"."duration_minutes" is null or ("placement_job_rounds"."duration_minutes" > 0 and "placement_job_rounds"."duration_minutes" <= 1440)),
	CONSTRAINT "placement_job_rounds_schedule_pair_ck" CHECK (("placement_job_rounds"."scheduled_at" is null and "placement_job_rounds"."timezone" is null)
        or ("placement_job_rounds"."scheduled_at" is not null and "placement_job_rounds"."timezone" is not null)),
	CONSTRAINT "placement_job_rounds_results_due_ck" CHECK ("placement_job_rounds"."results_due_at" is null
        or "placement_job_rounds"."scheduled_at" is null
        or "placement_job_rounds"."results_due_at" >= "placement_job_rounds"."scheduled_at"),
	CONSTRAINT "placement_job_rounds_delivery_ck" CHECK ("placement_job_rounds"."status" not in ('SCHEDULED', 'COMPLETED')
        or ("placement_job_rounds"."mode" = 'ON_CAMPUS'
          and coalesce(length(trim("placement_job_rounds"."venue")), 0) > 0)
        or ("placement_job_rounds"."mode" = 'VIRTUAL'
          and coalesce(length(trim("placement_job_rounds"."meeting_url")), 0) > 0)),
	CONSTRAINT "placement_job_rounds_lifecycle_ck" CHECK (("placement_job_rounds"."status" = 'PENDING'
          and "placement_job_rounds"."scheduled_at" is null
          and "placement_job_rounds"."timezone" is null
          and "placement_job_rounds"."completed_at" is null
          and "placement_job_rounds"."cancelled_at" is null)
        or ("placement_job_rounds"."status" = 'SCHEDULED'
          and "placement_job_rounds"."scheduled_at" is not null
          and "placement_job_rounds"."timezone" is not null
          and "placement_job_rounds"."mode" is not null
          and "placement_job_rounds"."completed_at" is null
          and "placement_job_rounds"."cancelled_at" is null)
        or ("placement_job_rounds"."status" = 'COMPLETED'
          and "placement_job_rounds"."scheduled_at" is not null
          and "placement_job_rounds"."timezone" is not null
          and "placement_job_rounds"."mode" is not null
          and "placement_job_rounds"."completed_at" is not null
          and "placement_job_rounds"."cancelled_at" is null)
        or ("placement_job_rounds"."status" = 'CANCELLED'
          and "placement_job_rounds"."completed_at" is null
          and "placement_job_rounds"."cancelled_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "placement_job_round_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"event_type" varchar(32) NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_job_round_events_type_ck" CHECK ("placement_job_round_events"."event_type" in ('CREATED', 'UPDATED', 'SCHEDULED', 'RESCHEDULED', 'REORDERED', 'COMPLETED', 'CANCELLED'))
);
--> statement-breakpoint
ALTER TABLE "placement_job_rounds" ADD CONSTRAINT "placement_job_rounds_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_job_rounds" ADD CONSTRAINT "placement_job_rounds_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_job_round_events" ADD CONSTRAINT "placement_job_round_events_round_id_placement_job_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."placement_job_rounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_job_round_events" ADD CONSTRAINT "placement_job_round_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "placement_job_rounds_active_sequence_uq" ON "placement_job_rounds" USING btree ("job_id","sequence") WHERE "placement_job_rounds"."status" <> 'CANCELLED';--> statement-breakpoint
CREATE INDEX "placement_job_rounds_job_status_idx" ON "placement_job_rounds" USING btree ("job_id","status");--> statement-breakpoint
CREATE INDEX "placement_job_round_events_round_created_idx" ON "placement_job_round_events" USING btree ("round_id","created_at");
