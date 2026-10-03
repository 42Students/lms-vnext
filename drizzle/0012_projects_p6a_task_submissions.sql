CREATE TABLE "project_task_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"submitted_by_membership_id" uuid NOT NULL,
	"submission_url" text NOT NULL,
	"note" text,
	"status" varchar(32) DEFAULT 'SUBMITTED' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_by_membership_id" uuid,
	"reviewed_at" timestamp with time zone,
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_task_submissions_version_ck" CHECK ("project_task_submissions"."version" >= 1),
	CONSTRAINT "project_task_submissions_status_ck" CHECK ("project_task_submissions"."status" in ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED')),
	CONSTRAINT "project_task_submissions_review_ck" CHECK ((
        ("project_task_submissions"."status" = 'SUBMITTED'
          and "project_task_submissions"."reviewed_by_user_id" is null
          and "project_task_submissions"."reviewed_by_membership_id" is null
          and "project_task_submissions"."reviewed_at" is null
          and "project_task_submissions"."feedback" is null)
        or
        ("project_task_submissions"."status" in ('CHANGES_REQUESTED', 'APPROVED')
          and "project_task_submissions"."reviewed_by_user_id" is not null
          and "project_task_submissions"."reviewed_at" is not null)
      ))
);
--> statement-breakpoint
ALTER TABLE "project_task_submissions" ADD CONSTRAINT "project_task_submissions_project_id_project_instances_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_instances"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_task_submissions" ADD CONSTRAINT "project_task_submissions_task_id_project_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_task_submissions" ADD CONSTRAINT "project_task_submissions_submitted_by_membership_id_college_memberships_id_fk" FOREIGN KEY ("submitted_by_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_task_submissions" ADD CONSTRAINT "project_task_submissions_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_task_submissions" ADD CONSTRAINT "project_task_submissions_reviewed_by_membership_id_college_memberships_id_fk" FOREIGN KEY ("reviewed_by_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_task_submissions_task_version_uq" ON "project_task_submissions" USING btree ("task_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "project_task_submissions_active_uq" ON "project_task_submissions" USING btree ("task_id") WHERE "project_task_submissions"."status" = 'SUBMITTED';--> statement-breakpoint
CREATE INDEX "project_task_submissions_project_task_idx" ON "project_task_submissions" USING btree ("project_id","task_id");--> statement-breakpoint
CREATE INDEX "project_task_submissions_submitter_idx" ON "project_task_submissions" USING btree ("submitted_by_membership_id");