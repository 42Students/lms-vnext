-- Audit 5.5 / non-security #24: progress has no class/semester/attempt scope.
--
-- Progress was keyed on (learner_id, lesson_content_id) alone, so a learner repeating a semester
-- kept every completion from the first time round: on day one of the retake every video already
-- showed as watched. There was no way to express "completed in semester 1, retaking in semester 3"
-- — the second attempt could only overwrite the first.
--
-- ## Why an attempt counter rather than a semester id
--
-- Nothing in the schema records that a learner is *repeating* anything: a retake shows up only as
-- a batch's current_semester moving, which is a property of the whole batch and not of one
-- learner. Keying progress on semester would therefore mean inferring a retake from data that
-- does not describe one, and inferring it wrongly means silently wiping a learner's real
-- progress. An explicit attempt, advanced by a deliberate admin action, cannot fire by accident.
--
-- Existing rows become attempt 1, which is exactly what they are, so nothing changes for anyone
-- who is not repeating.

ALTER TABLE learner_content_progress
    ADD COLUMN attempt INT NOT NULL DEFAULT 1;

-- The old key allowed exactly one row per learner+content, which is the constraint being lifted.
ALTER TABLE learner_content_progress
    DROP INDEX unique_learner_lesson_content;

ALTER TABLE learner_content_progress
    ADD UNIQUE KEY unique_learner_lesson_content_attempt (learner_id, lesson_content_id, attempt);

-- Every read resolves the learner's current (highest) attempt for a piece of content, so that
-- lookup needs to be indexed rather than scanning a learner's whole history.
CREATE INDEX idx_learner_content_progress_current
    ON learner_content_progress (learner_id, lesson_content_id, attempt DESC);
