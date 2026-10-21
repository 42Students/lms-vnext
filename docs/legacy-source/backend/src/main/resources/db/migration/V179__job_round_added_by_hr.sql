-- A recruiter can add a round to a drive of their own. Remember who, so they can fix or remove only the rounds they added.
ALTER TABLE job_round
    ADD COLUMN added_by_hr_user_id BIGINT NULL COMMENT 'Set when the recruiter added this round after the drive was requested; null for rounds the placement cell made';
