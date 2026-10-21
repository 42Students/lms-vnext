-- V206: recruiter sees applicants setting
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Recruiter phase 1, N6: whether a recruiter sees their drive's applicants as they apply (DIRECT) or only once the placement
-- cell shares them (AFTER_REVIEW, today's behaviour and the default).
ALTER TABLE tpo_college_settings ADD COLUMN recruiter_sees_applicants VARCHAR(20) NOT NULL DEFAULT 'AFTER_REVIEW';
