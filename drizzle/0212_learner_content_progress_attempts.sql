-- [chat-14] Repeated learner content attempts: previous unique pair
-- prevented attempt 2. This migration MUST remain unregistered until read and
-- reset services select latest attempt and serialize concurrent attempt starts.
DROP INDEX learner_content_progress_membership_content_uq;
--> statement-breakpoint
CREATE UNIQUE INDEX learner_content_progress_membership_content_attempt_uq
 ON learner_content_progress(membership_id, lesson_content_id, attempt);
--> statement-breakpoint
CREATE INDEX learner_content_progress_latest_attempt_idx
 ON learner_content_progress(membership_id, lesson_content_id, attempt DESC);
