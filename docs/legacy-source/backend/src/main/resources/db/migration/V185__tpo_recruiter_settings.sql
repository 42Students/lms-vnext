-- Two college settings for recruiters (TPO notes 2026-10-04):
--   hr_drive_needs_approval: a recruiter's drive request waits for the placement cell's approval (1, the default),
--                            or is approved on arrival (0). The placement cell still sets dates and publishes.
--   hr_access_months:        how long a recruiter's access to the college lasts once they join; 0 means no end date.
ALTER TABLE tpo_college_settings
    ADD COLUMN hr_drive_needs_approval TINYINT(1) NOT NULL DEFAULT 1,
    ADD COLUMN hr_access_months INT NOT NULL DEFAULT 6;
