ALTER TABLE "sections" ADD COLUMN "min_size" integer;--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "learner_content_progress" ADD COLUMN "first_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "learner_content_progress" ADD COLUMN "attempt" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD COLUMN "attempt_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD COLUMN "previous_points" integer;--> statement-breakpoint
ALTER TABLE "course_quizzes" ADD COLUMN "shuffle_questions" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "course_quizzes" ADD COLUMN "shuffle_options" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_min_size_ck" CHECK ("sections"."min_size" is null or ("sections"."min_size" >= 0 and ("sections"."capacity" is null or "sections"."min_size" <= "sections"."capacity")));--> statement-breakpoint
ALTER TABLE "learner_content_progress" ADD CONSTRAINT "learner_content_progress_attempt_ck" CHECK ("learner_content_progress"."attempt" >= 1);--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_attempt_ck" CHECK ("assignment_submissions"."attempt_number" >= 1 and ("assignment_submissions"."previous_points" is null or "assignment_submissions"."previous_points" >= 0));