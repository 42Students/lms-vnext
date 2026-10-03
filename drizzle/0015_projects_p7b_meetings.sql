CREATE TABLE "project_meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'REQUESTED' NOT NULL,
	"meeting_type" varchar(20) DEFAULT 'GENERAL' NOT NULL,
	"title" text NOT NULL,
	"agenda" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"time_zone" varchar(80) NOT NULL,
	"meeting_url" text,
	"requested_by_membership_id" uuid,
	"scheduled_by_user_id" uuid,
	"scheduled_by_membership_id" uuid,
	"linked_sprint_id" uuid,
	"linked_task_id" uuid,
	"outcome" text,
	"cancellation_note" text,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_meetings_status_ck" CHECK ("project_meetings"."status" in ('REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED')),
	CONSTRAINT "project_meetings_type_ck" CHECK ("project_meetings"."meeting_type" in ('GENERAL', 'PLANNING', 'STANDUP', 'REVIEW', 'RETRO')),
	CONSTRAINT "project_meetings_time_order_ck" CHECK ("project_meetings"."ends_at" > "project_meetings"."starts_at"),
	CONSTRAINT "project_meetings_request_shape_ck" CHECK ("project_meetings"."status" <> 'REQUESTED' or "project_meetings"."requested_by_membership_id" is not null),
	CONSTRAINT "project_meetings_schedule_shape_ck" CHECK ("project_meetings"."status" not in ('SCHEDULED', 'COMPLETED') or ("project_meetings"."scheduled_by_user_id" is not null and "project_meetings"."meeting_url" is not null))
);
--> statement-breakpoint
ALTER TABLE "project_meetings" ADD CONSTRAINT "project_meetings_project_id_project_instances_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_instances"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_meetings" ADD CONSTRAINT "project_meetings_requested_by_membership_id_college_memberships_id_fk" FOREIGN KEY ("requested_by_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_meetings" ADD CONSTRAINT "project_meetings_scheduled_by_user_id_users_id_fk" FOREIGN KEY ("scheduled_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_meetings" ADD CONSTRAINT "project_meetings_scheduled_by_membership_id_college_memberships_id_fk" FOREIGN KEY ("scheduled_by_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_meetings" ADD CONSTRAINT "project_meetings_linked_sprint_id_project_sprints_id_fk" FOREIGN KEY ("linked_sprint_id") REFERENCES "public"."project_sprints"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_meetings" ADD CONSTRAINT "project_meetings_linked_task_id_project_tasks_id_fk" FOREIGN KEY ("linked_task_id") REFERENCES "public"."project_tasks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_meetings" ADD CONSTRAINT "project_meetings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_meetings_project_start_idx" ON "project_meetings" USING btree ("project_id","starts_at");--> statement-breakpoint
CREATE INDEX "project_meetings_project_status_idx" ON "project_meetings" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "project_meetings_requester_idx" ON "project_meetings" USING btree ("requested_by_membership_id","status");