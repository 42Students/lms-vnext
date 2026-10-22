-- [chat-14] Source-only quiz metadata. Preflight 101..1000-point questions before registration.
ALTER TABLE course_quizzes ADD COLUMN IF NOT EXISTS legacy_quiz_id integer;
--> statement-breakpoint
ALTER TABLE course_quizzes ADD COLUMN IF NOT EXISTS legacy_course_id integer;
--> statement-breakpoint
ALTER TABLE course_quizzes ADD COLUMN IF NOT EXISTS legacy_class_id integer;
--> statement-breakpoint
ALTER TABLE course_quizzes ADD COLUMN IF NOT EXISTS legacy_faculty_id integer;
--> statement-breakpoint
ALTER TABLE course_quizzes ADD COLUMN IF NOT EXISTS legacy_active boolean;
--> statement-breakpoint
ALTER TABLE course_quizzes ADD COLUMN IF NOT EXISTS legacy_enabled boolean;
--> statement-breakpoint
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS legacy_question_id integer;
--> statement-breakpoint
ALTER TABLE quiz_options ADD COLUMN IF NOT EXISTS legacy_option_id integer;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS legacy_attempt_id integer;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS legacy_learner_id integer;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS legacy_status varchar(24);
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS legacy_score bigint;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS legacy_max_score bigint;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS legacy_deleted boolean;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS legacy_updated_at timestamptz;
--> statement-breakpoint
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS legacy_answer_id integer;
--> statement-breakpoint
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS legacy_option_ids_csv varchar(500);
--> statement-breakpoint
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS legacy_points_awarded bigint;
--> statement-breakpoint
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS legacy_deleted boolean;
--> statement-breakpoint
ALTER TABLE quiz_questions DROP CONSTRAINT quiz_questions_points_ck;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_points_ck CHECK (points BETWEEN 1 AND 100)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
