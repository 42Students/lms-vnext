CREATE TABLE "project_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" varchar(32) DEFAULT 'DRAFT' NOT NULL,
	"summary" text NOT NULL,
	"source_url" text,
	"demo_url" text,
	"notes" text,
	"created_by_membership_id" uuid NOT NULL,
	"submitted_by_membership_id" uuid,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_submissions_version_ck" CHECK ("project_submissions"."version" >= 1),
	CONSTRAINT "project_submissions_status_ck" CHECK ("project_submissions"."status" in ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED')),
	CONSTRAINT "project_submissions_submit_shape_ck" CHECK ((
        ("project_submissions"."status" = 'DRAFT'
          and "project_submissions"."submitted_by_membership_id" is null
          and "project_submissions"."submitted_at" is null)
        or
        ("project_submissions"."status" in ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED')
          and "project_submissions"."submitted_by_membership_id" is not null
          and "project_submissions"."submitted_at" is not null)
      ))
);
--> statement-breakpoint
CREATE TABLE "project_submission_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"decision" varchar(32) NOT NULL,
	"feedback" text,
	"reviewed_by_user_id" uuid NOT NULL,
	"reviewed_by_membership_id" uuid,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_submission_reviews_decision_ck" CHECK ("project_submission_reviews"."decision" in ('CHANGES_REQUESTED', 'APPROVED')),
	CONSTRAINT "project_submission_reviews_feedback_ck" CHECK ("project_submission_reviews"."decision" <> 'CHANGES_REQUESTED' or ("project_submission_reviews"."feedback" is not null and length(trim("project_submission_reviews"."feedback")) > 0))
);
--> statement-breakpoint
CREATE TABLE "project_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"evaluator_user_id" uuid NOT NULL,
	"evaluator_membership_id" uuid,
	"total_score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"summary" text,
	"evaluated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_evaluations_score_ck" CHECK ("project_evaluations"."max_score" > 0 and "project_evaluations"."total_score" >= 0 and "project_evaluations"."total_score" <= "project_evaluations"."max_score")
);
--> statement-breakpoint
CREATE TABLE "project_evaluation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"criterion" text NOT NULL,
	"score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"feedback" text,
	"sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_evaluation_items_score_ck" CHECK ("project_evaluation_items"."max_score" > 0 and "project_evaluation_items"."score" >= 0 and "project_evaluation_items"."score" <= "project_evaluation_items"."max_score"),
	CONSTRAINT "project_evaluation_items_sequence_ck" CHECK ("project_evaluation_items"."sequence" >= 0)
);
--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_project_id_project_instances_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_instances"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_created_by_membership_id_college_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_submitted_by_membership_id_college_memberships_id_fk" FOREIGN KEY ("submitted_by_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_submission_reviews" ADD CONSTRAINT "project_submission_reviews_project_id_project_instances_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_instances"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_submission_reviews" ADD CONSTRAINT "project_submission_reviews_submission_id_project_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."project_submissions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_submission_reviews" ADD CONSTRAINT "project_submission_reviews_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_submission_reviews" ADD CONSTRAINT "project_submission_reviews_reviewed_by_membership_id_college_memberships_id_fk" FOREIGN KEY ("reviewed_by_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_evaluations" ADD CONSTRAINT "project_evaluations_project_id_project_instances_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_instances"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_evaluations" ADD CONSTRAINT "project_evaluations_submission_id_project_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."project_submissions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_evaluations" ADD CONSTRAINT "project_evaluations_evaluator_user_id_users_id_fk" FOREIGN KEY ("evaluator_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_evaluations" ADD CONSTRAINT "project_evaluations_evaluator_membership_id_college_memberships_id_fk" FOREIGN KEY ("evaluator_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_evaluation_items" ADD CONSTRAINT "project_evaluation_items_evaluation_id_project_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."project_evaluations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_submissions_project_version_uq" ON "project_submissions" USING btree ("project_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "project_submissions_open_project_uq" ON "project_submissions" USING btree ("project_id") WHERE "project_submissions"."status" in ('DRAFT', 'SUBMITTED');--> statement-breakpoint
CREATE INDEX "project_submissions_project_status_idx" ON "project_submissions" USING btree ("project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "project_submission_reviews_submission_uq" ON "project_submission_reviews" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "project_submission_reviews_project_idx" ON "project_submission_reviews" USING btree ("project_id","reviewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "project_evaluations_submission_uq" ON "project_evaluations" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "project_evaluations_project_idx" ON "project_evaluations" USING btree ("project_id","evaluated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "project_evaluation_items_evaluation_sequence_uq" ON "project_evaluation_items" USING btree ("evaluation_id","sequence");--> statement-breakpoint
CREATE INDEX "project_evaluation_items_evaluation_idx" ON "project_evaluation_items" USING btree ("evaluation_id");