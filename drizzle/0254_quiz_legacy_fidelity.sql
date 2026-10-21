-- [chat-14] Preserve historical quiz options/question tombstones and attempt status.
ALTER TABLE course_quizzes ADD COLUMN legacy_deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE course_quizzes ADD COLUMN legacy_quiz_version integer;
--> statement-breakpoint
ALTER TABLE course_quizzes ADD COLUMN legacy_results_released boolean;
--> statement-breakpoint
CREATE INDEX course_quizzes_legacy_identity_idx ON course_quizzes(legacy_course_id,legacy_class_id,legacy_quiz_id)
 WHERE legacy_quiz_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE quiz_questions ADD COLUMN legacy_sort_order integer;
--> statement-breakpoint
ALTER TABLE quiz_questions ADD COLUMN legacy_question_type varchar(50);
--> statement-breakpoint
ALTER TABLE quiz_questions ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE quiz_questions ADD COLUMN legacy_was_deleted boolean;
--> statement-breakpoint
CREATE INDEX quiz_questions_active_order_idx ON quiz_questions(quiz_id,sequence,id)
 WHERE deleted_at IS NULL;
--> statement-breakpoint
ALTER TABLE quiz_options ADD COLUMN legacy_sort_order integer;
--> statement-breakpoint
ALTER TABLE quiz_options ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE quiz_options ADD COLUMN legacy_was_deleted boolean;
--> statement-breakpoint
CREATE INDEX quiz_options_active_order_idx ON quiz_options(question_id,sequence,id)
 WHERE deleted_at IS NULL;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN legacy_submitted_local timestamp;
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN legacy_source_time_zone varchar(80);
--> statement-breakpoint
ALTER TABLE quiz_attempts ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
CREATE INDEX quiz_attempts_current_history_idx
 ON quiz_attempts(quiz_id,membership_id,submitted_at,id) WHERE deleted_at IS NULL;