-- One name (docs/naming/RECRUITER-NAMING-PLAN-2026-10-05.md): a person a college reaches out to is a recruiter lead; one who joined,
-- with a 42LMS login, is a recruiter (was "HR"). Tables, columns and stored codes follow. RENAME TABLE / RENAME COLUMN / RENAME INDEX
-- are metadata-only in MySQL 8 (instant, no copy). Foreign key constraint names (fk_hr_*) keep their old names: renaming them means
-- dropping and re-adding the key, which is not worth it for a name nobody reads. Undo: docs/naming/V193-undo.sql.

-- ---------------------------------------------------------------- tables
RENAME TABLE hr_user TO recruiter,
             hr_college_access TO recruiter_college_access,
             hr_college_access_capability TO recruiter_college_access_capability,
             hr_notification_read TO recruiter_notification_read,
             hr_applicant_note TO recruiter_applicant_note,
             tpo_lead TO recruiter_lead,
             lead_activity TO recruiter_lead_activity;

-- ---------------------------------------------------------------- columns
ALTER TABLE recruiter_college_access RENAME COLUMN hr_user_id TO recruiter_id, RENAME COLUMN pending_lead_id TO pending_recruiter_lead_id;
ALTER TABLE recruiter_notification_read RENAME COLUMN hr_user_id TO recruiter_id;
ALTER TABLE recruiter_applicant_note RENAME COLUMN hr_user_id TO recruiter_id;
ALTER TABLE recruiter_lead RENAME COLUMN hr_user_id TO recruiter_id;
ALTER TABLE recruiter_lead_activity RENAME COLUMN lead_id TO recruiter_lead_id;
ALTER TABLE follow_up RENAME COLUMN lead_id TO recruiter_lead_id;
ALTER TABLE drive_group RENAME COLUMN hr_user_id TO recruiter_id;
ALTER TABLE job RENAME COLUMN hr_user_id TO recruiter_id;
ALTER TABLE job_round RENAME COLUMN added_by_hr_user_id TO added_by_recruiter_id;
ALTER TABLE tpo_message_thread RENAME COLUMN hr_user_id TO recruiter_id;
ALTER TABLE tpo_college_settings RENAME COLUMN hr_access_months TO recruiter_access_months,
                                 RENAME COLUMN hr_drive_needs_approval TO recruiter_drive_needs_approval;

-- ---------------------------------------------------------------- index names
ALTER TABLE recruiter RENAME INDEX idx_hr_user_company TO idx_recruiter_company,
                      RENAME INDEX uk_hr_user_contact_mail TO uk_recruiter_contact_mail,
                      RENAME INDEX uk_hr_user_contact_mobile TO uk_recruiter_contact_mobile;
ALTER TABLE recruiter_college_access RENAME INDEX idx_hr_college_access_college_status TO idx_recruiter_college_access_college_status,
                                     RENAME INDEX uk_hr_college_access_user_college TO uk_recruiter_college_access_user_college;
ALTER TABLE recruiter_applicant_note RENAME INDEX idx_hr_applicant_note_job TO idx_recruiter_applicant_note_job,
                                     RENAME INDEX uk_hr_applicant_note TO uk_recruiter_applicant_note;
ALTER TABLE recruiter_lead RENAME INDEX idx_lead_college TO idx_recruiter_lead_college,
                           RENAME INDEX idx_lead_email TO idx_recruiter_lead_email,
                           RENAME INDEX idx_lead_phone TO idx_recruiter_lead_phone;
ALTER TABLE recruiter_lead_activity RENAME INDEX idx_lead_activity_lead TO idx_recruiter_lead_activity_lead;

-- ---------------------------------------------------------------- room for the new codes ('RECRUITER' is 9 characters)
ALTER TABLE round_slot MODIFY proposed_by VARCHAR(20) NOT NULL DEFAULT 'TPO' COMMENT 'TPO | RECRUITER';
ALTER TABLE job_offer MODIFY created_by_type VARCHAR(20) NOT NULL DEFAULT 'TPO' COMMENT 'TPO | RECRUITER';
ALTER TABLE tpo_message MODIFY sender_type VARCHAR(20) NOT NULL COMMENT 'TPO | RECRUITER';
ALTER TABLE tpo_audit_log MODIFY actor_type VARCHAR(20) NOT NULL COMMENT 'TPO | RECRUITER | SYSTEM | STUDENT';

-- ---------------------------------------------------------------- stored codes: who did it
UPDATE tpo_audit_log SET actor_type = 'RECRUITER' WHERE actor_type = 'HR';
UPDATE tpo_message SET sender_type = 'RECRUITER' WHERE sender_type = 'HR';
UPDATE round_slot SET proposed_by = 'RECRUITER' WHERE proposed_by = 'HR';
UPDATE job_offer SET created_by_type = 'RECRUITER' WHERE created_by_type = 'HR';
UPDATE round_result SET source = 'RECRUITER' WHERE source = 'HR';
UPDATE round_result SET submitted_by_type = 'RECRUITER' WHERE submitted_by_type = 'HR';
UPDATE notification_outbox SET recipient_type = 'RECRUITER' WHERE recipient_type = 'HR';
UPDATE tpo_bell_read SET reader_type = 'RECRUITER' WHERE reader_type = 'HR';
UPDATE mobile_login_attempt SET user_type = 'RECRUITER' WHERE user_type = 'HR';
UPDATE refresh_token_blocklist SET user_type = 'RECRUITER' WHERE user_type = 'HR';
UPDATE user_session SET user_type = 'RECRUITER' WHERE user_type = 'HR';
UPDATE admin_audit_log SET actor_user_type = 'RECRUITER' WHERE actor_user_type = 'HR';
UPDATE placement_eligibility SET decided_by_type = 'RECRUITER' WHERE decided_by_type = 'HR';
UPDATE placement_eligibility_event SET actor_type = 'RECRUITER' WHERE actor_type = 'HR';
UPDATE lms_group SET created_by_type = 'RECRUITER' WHERE created_by_type = 'HR';
UPDATE lms_group_member_event SET actor_type = 'RECRUITER' WHERE actor_type = 'HR';

-- ---------------------------------------------------------------- stored codes: what happened, to what
UPDATE tpo_audit_log SET action = CONCAT('RECRUITER_', SUBSTRING(action, 4)) WHERE action LIKE 'HR\_%';
UPDATE tpo_audit_log SET action = CONCAT('RECRUITER_', action) WHERE action LIKE 'LEADS\_%' OR action LIKE 'LEAD\_%';
UPDATE tpo_audit_log SET entity_type = 'RECRUITER_LEAD' WHERE entity_type = 'LEAD';
UPDATE tpo_bell SET type = CONCAT('RECRUITER_', SUBSTRING(type, 4)) WHERE type LIKE 'HR\_%';
UPDATE tpo_bell SET link = CONCAT('/tpo/recruiters', SUBSTRING(link, 11)) WHERE link LIKE '/tpo/leads%';
UPDATE admin_audit_log SET action_key = CONCAT('RECRUITER_', SUBSTRING(action_key, 4)) WHERE action_key LIKE 'HR\_%';
UPDATE admin_audit_log SET entity_type = 'recruiter' WHERE entity_type = 'hr_user';
UPDATE tpo_saved_view SET scope = 'RECRUITER_LEADS' WHERE scope = 'LEADS';
