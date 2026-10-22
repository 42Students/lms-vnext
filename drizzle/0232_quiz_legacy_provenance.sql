-- [chat-14] Source-only quiz metadata. Preflight 101..1000-point questions before registration.
ALTER TABLE course_quizzes ADD COLUMN legacy_quiz_id integer;
--> statement-breakpoint
ALTER TABLE course_quizzes ADD COLUMN legacy_course_id integer;
--> statement-breakpoint
ALTER TABLE course_quizzes ADD COLUMN legacy_class_id integer;
--> statement-breakpoint
ALTER TABLE course_quizzes ADD COLUMN legacy_faculty_id integer;
--> statement-breakpoint
ALTER TABLE course_quizzes ADD COLUMN legacy_active boolean;
--> statement-breakpoint
ALTER TABLE course_quizzes ADD COLUMN legacy_enabled boolean;
--> statement-breakpoint
ALTER TABLE quiz_questions ADD COLUMN legacy_question_id integer;
--> statement-breakpoint
ALTER TABLE quiz_options ADD COLUMN legacy_option_id integer;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN legacy_attempt_id integer;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN legacy_learner_id integer;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN legacy_status varchar(24);
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN legacy_score bigint;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN legacy_max_score bigint;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN legacy_deleted boolean;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN legacy_updated_at timestamptz;
--> statement-breakpoint
ALTER TABLE quiz_attempt_answers ADD COLUMN legacy_answer_id integer;
--> statement-breakpoint
ALTER TABLE quiz_attempt_answers ADD COLUMN legacy_option_ids_csv varchar(500);
--> statement-breakpoint
ALTER TABLE quiz_attempt_answers ADD COLUMN legacy_points_awarded bigint;
--> statement-breakpoint
ALTER TABLE quiz_attempt_answers ADD COLUMN legacy_deleted boolean;
--> statement-breakpoint
ALTER TABLE quiz_questions DROP CONSTRAINT quiz_questions_points_ck;
--> statement-breakpoint
ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_points_ck CHECK (points BETWEEN 1 AND 100);
