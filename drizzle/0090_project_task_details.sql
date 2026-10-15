CREATE TABLE "project_task_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"author_membership_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_task_comments_body_ck" CHECK (length(trim("project_task_comments"."body")) between 1 and 4000)
);
--> statement-breakpoint
ALTER TABLE "project_tasks" ADD COLUMN "blocker_reason" text;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD COLUMN "estimate_points" integer;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD COLUMN "task_type" varchar(16);--> statement-breakpoint
CREATE UNIQUE INDEX "project_tasks_project_id_id_uq" ON "project_tasks" USING btree ("project_id","id");--> statement-breakpoint
ALTER TABLE "project_task_comments" ADD CONSTRAINT "project_task_comments_project_id_project_instances_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_instances"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_task_comments" ADD CONSTRAINT "project_task_comments_author_membership_id_college_memberships_id_fk" FOREIGN KEY ("author_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_task_comments" ADD CONSTRAINT "project_task_comments_project_task_fk" FOREIGN KEY ("project_id","task_id") REFERENCES "public"."project_tasks"("project_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_task_comments_task_time_idx" ON "project_task_comments" USING btree ("task_id","created_at");--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_estimate_points_ck" CHECK ("project_tasks"."estimate_points" is null or ("project_tasks"."estimate_points" >= 0 and "project_tasks"."estimate_points" <= 1000));--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_task_type_ck" CHECK ("project_tasks"."task_type" is null or "project_tasks"."task_type" in ('STORY', 'BUG', 'CHORE', 'SPIKE'));