CREATE TABLE "project_delivery_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"event_type" varchar(24) NOT NULL,
	"actor_membership_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_delivery_events_event_type_ck" CHECK ("project_delivery_events"."event_type" in ('LOCKED', 'REOPENED', 'ATTACHMENTS_CHANGED')),
	CONSTRAINT "project_delivery_events_reason_ck" CHECK (length(trim("project_delivery_events"."reason")) between 1 and 4000)
);
--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "locked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "reopened_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "attachments" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "project_submissions_project_id_id_uq" ON "project_submissions" USING btree ("project_id","id");--> statement-breakpoint
ALTER TABLE "project_delivery_events" ADD CONSTRAINT "project_delivery_events_project_id_project_instances_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_instances"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_delivery_events" ADD CONSTRAINT "project_delivery_events_actor_membership_id_college_memberships_id_fk" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_delivery_events" ADD CONSTRAINT "project_delivery_events_submission_fk" FOREIGN KEY ("project_id","submission_id") REFERENCES "public"."project_submissions"("project_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_delivery_events_project_time_idx" ON "project_delivery_events" USING btree ("project_id","occurred_at");--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_attachments_array_ck" CHECK (jsonb_typeof("project_submissions"."attachments") = 'array');