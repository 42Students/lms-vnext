CREATE TABLE "placement_application_screenings" (
	"application_id" uuid PRIMARY KEY NOT NULL,
	"status" varchar(24) DEFAULT 'PENDING' NOT NULL,
	"candidate_message" text,
	"internal_reason" text,
	"decided_by_user_id" uuid,
	"decided_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_application_screenings_status_ck" CHECK ("placement_application_screenings"."status" in ('PENDING', 'HOLD', 'SHORTLISTED', 'REJECTED')),
	CONSTRAINT "placement_application_screenings_shape_ck" CHECK (("placement_application_screenings"."status" = 'PENDING'
          and "placement_application_screenings"."decided_by_user_id" is null
          and "placement_application_screenings"."decided_at" is null
          and "placement_application_screenings"."candidate_message" is null
          and "placement_application_screenings"."internal_reason" is null)
        or ("placement_application_screenings"."status" = 'HOLD'
          and "placement_application_screenings"."decided_by_user_id" is not null
          and "placement_application_screenings"."decided_at" is not null
          and coalesce(length(trim("placement_application_screenings"."internal_reason")), 0) > 0)
        or ("placement_application_screenings"."status" = 'SHORTLISTED'
          and "placement_application_screenings"."decided_by_user_id" is not null
          and "placement_application_screenings"."decided_at" is not null)
        or ("placement_application_screenings"."status" = 'REJECTED'
          and "placement_application_screenings"."decided_by_user_id" is not null
          and "placement_application_screenings"."decided_at" is not null
          and coalesce(length(trim("placement_application_screenings"."candidate_message")), 0) > 0))
);
--> statement-breakpoint
CREATE TABLE "placement_application_screening_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" varchar(24) NOT NULL,
	"to_status" varchar(24) NOT NULL,
	"candidate_message" text,
	"internal_reason" text,
	"actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_application_screening_history_status_ck" CHECK ("placement_application_screening_history"."from_status" in ('PENDING', 'HOLD', 'SHORTLISTED', 'REJECTED')
        and "placement_application_screening_history"."to_status" in ('HOLD', 'SHORTLISTED', 'REJECTED')),
	CONSTRAINT "placement_application_screening_history_transition_ck" CHECK (("placement_application_screening_history"."from_status" = 'PENDING'
          and "placement_application_screening_history"."to_status" in ('HOLD', 'SHORTLISTED', 'REJECTED'))
        or ("placement_application_screening_history"."from_status" = 'HOLD'
          and "placement_application_screening_history"."to_status" in ('SHORTLISTED', 'REJECTED')))
);
--> statement-breakpoint
ALTER TABLE "placement_application_screenings" ADD CONSTRAINT "placement_application_screenings_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_application_screenings" ADD CONSTRAINT "placement_application_screenings_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_application_screening_history" ADD CONSTRAINT "placement_application_screening_history_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_application_screening_history" ADD CONSTRAINT "placement_application_screening_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "placement_application_screenings_status_idx" ON "placement_application_screenings" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "placement_application_screening_history_application_idx" ON "placement_application_screening_history" USING btree ("application_id","created_at");--> statement-breakpoint
INSERT INTO "placement_application_screenings" ("application_id")
SELECT "id" FROM "placement_applications"
ON CONFLICT ("application_id") DO NOTHING;
