-- Old option integer IDs, deleted flags, and last-updated dates are
-- historic provenance, not active quiz-option state. Resolve option and
-- question identities through the same-college quiz map. Deleted options
-- remain in immutable submitted attempt snapshots but not current builders.
-- Preserve zero-based sequence and source chronology before importing.
CREATE TYPE "public"."course_quiz_status" AS ENUM('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."quiz_question_type" AS ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE');--> statement-breakpoint
CREATE TABLE "course_quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"delivery_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"due_at" timestamp with time zone,
	"max_attempts" integer DEFAULT 1 NOT NULL,
	"total_points" integer NOT NULL,
	"sequence" integer NOT NULL,
	"status" "course_quiz_status" DEFAULT 'DRAFT' NOT NULL,
	"results_published" boolean DEFAULT false NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_quizzes_max_attempts_ck" CHECK ("course_quizzes"."max_attempts" between 1 and 20),
	CONSTRAINT "course_quizzes_total_points_ck" CHECK ("course_quizzes"."total_points" between 1 and 10000),
	CONSTRAINT "course_quizzes_sequence_ck" CHECK ("course_quizzes"."sequence" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"question_type" "quiz_question_type" NOT NULL,
	"prompt" text NOT NULL,
	"points" integer NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_questions_points_ck" CHECK ("quiz_questions"."points" between 1 and 1000),
	CONSTRAINT "quiz_questions_sequence_ck" CHECK ("quiz_questions"."sequence" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quiz_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_options_sequence_ck" CHECK ("quiz_options"."sequence" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"delivery_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_attempts_number_ck" CHECK ("quiz_attempts"."attempt_number" >= 1),
	CONSTRAINT "quiz_attempts_score_ck" CHECK ("quiz_attempts"."max_score" > 0 and "quiz_attempts"."score" >= 0 and "quiz_attempts"."score" <= "quiz_attempts"."max_score")
);
--> statement-breakpoint
CREATE TABLE "quiz_attempt_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"question_type" "quiz_question_type" NOT NULL,
	"prompt_snapshot" text NOT NULL,
	"points_possible" integer NOT NULL,
	"selected_option_ids" jsonb NOT NULL,
	"options_snapshot" jsonb NOT NULL,
	"correct" boolean NOT NULL,
	"points_awarded" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_attempt_answers_points_ck" CHECK ("quiz_attempt_answers"."points_possible" >= 1 and "quiz_attempt_answers"."points_awarded" >= 0 and "quiz_attempt_answers"."points_awarded" <= "quiz_attempt_answers"."points_possible")
);
--> statement-breakpoint
ALTER TABLE "course_quizzes" ADD CONSTRAINT "course_quizzes_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_quizzes" ADD CONSTRAINT "course_quizzes_delivery_id_course_section_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."course_section_deliveries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_quizzes" ADD CONSTRAINT "course_quizzes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_course_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."course_quizzes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_course_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."course_quizzes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_delivery_id_course_section_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."course_section_deliveries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_quizzes_generic_active_name_uq" ON "course_quizzes" USING btree ("lesson_id",lower("title")) WHERE "course_quizzes"."delivery_id" is null and "course_quizzes"."status" <> 'ARCHIVED';--> statement-breakpoint
CREATE UNIQUE INDEX "course_quizzes_delivery_active_name_uq" ON "course_quizzes" USING btree ("lesson_id","delivery_id",lower("title")) WHERE "course_quizzes"."delivery_id" is not null and "course_quizzes"."status" <> 'ARCHIVED';--> statement-breakpoint
CREATE UNIQUE INDEX "course_quizzes_generic_active_sequence_uq" ON "course_quizzes" USING btree ("lesson_id","sequence") WHERE "course_quizzes"."delivery_id" is null and "course_quizzes"."status" <> 'ARCHIVED';--> statement-breakpoint
CREATE UNIQUE INDEX "course_quizzes_delivery_active_sequence_uq" ON "course_quizzes" USING btree ("lesson_id","delivery_id","sequence") WHERE "course_quizzes"."delivery_id" is not null and "course_quizzes"."status" <> 'ARCHIVED';--> statement-breakpoint
CREATE INDEX "course_quizzes_lesson_status_idx" ON "course_quizzes" USING btree ("lesson_id","status");--> statement-breakpoint
CREATE INDEX "course_quizzes_delivery_status_idx" ON "course_quizzes" USING btree ("delivery_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_questions_quiz_sequence_uq" ON "quiz_questions" USING btree ("quiz_id","sequence");--> statement-breakpoint
CREATE INDEX "quiz_questions_quiz_idx" ON "quiz_questions" USING btree ("quiz_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_options_question_sequence_uq" ON "quiz_options" USING btree ("question_id","sequence");--> statement-breakpoint
CREATE INDEX "quiz_options_question_idx" ON "quiz_options" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_attempts_quiz_membership_number_uq" ON "quiz_attempts" USING btree ("quiz_id","membership_id","attempt_number");--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_delivery_idx" ON "quiz_attempts" USING btree ("quiz_id","delivery_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_membership_idx" ON "quiz_attempts" USING btree ("membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_attempt_answers_attempt_question_uq" ON "quiz_attempt_answers" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "quiz_attempt_answers_attempt_idx" ON "quiz_attempt_answers" USING btree ("attempt_id");