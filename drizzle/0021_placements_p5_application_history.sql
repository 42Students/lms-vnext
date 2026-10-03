CREATE TABLE "placement_application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" varchar(24),
	"to_status" varchar(24) NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_application_status_history_from_ck" CHECK ("placement_application_status_history"."from_status" is null or "placement_application_status_history"."from_status" in ('SUBMITTED', 'WITHDRAWN')),
	CONSTRAINT "placement_application_status_history_to_ck" CHECK ("placement_application_status_history"."to_status" in ('SUBMITTED', 'WITHDRAWN')),
	CONSTRAINT "placement_application_status_history_transition_ck" CHECK (("placement_application_status_history"."from_status" is null and "placement_application_status_history"."to_status" = 'SUBMITTED')
        or ("placement_application_status_history"."from_status" = 'SUBMITTED' and "placement_application_status_history"."to_status" = 'WITHDRAWN'))
);
--> statement-breakpoint
ALTER TABLE "placement_application_status_history" ADD CONSTRAINT "placement_application_status_history_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_application_status_history" ADD CONSTRAINT "placement_application_status_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "placement_application_status_history_application_idx" ON "placement_application_status_history" USING btree ("application_id","created_at");
