-- TPO V1 completion: everything the locked spec needs that V161/V162 did not create.
-- Additive only. No existing column changes meaning.

-- ---- Messages: HR <-> TPO conversations, grouped by drive, plus one General thread per HR ----
CREATE TABLE tpo_message_thread (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    hr_user_id BIGINT NOT NULL,
    job_id INT NULL COMMENT 'Null = the General thread for this HR',
    last_message_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tpo_thread (college_id, hr_user_id, job_id),
    INDEX idx_tpo_thread_college (college_id, last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tpo_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    thread_id BIGINT NOT NULL,
    sender_type VARCHAR(10) NOT NULL COMMENT 'TPO | HR',
    sender_id INT NOT NULL,
    body VARCHAR(4000) NOT NULL,
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tpo_message_thread (thread_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- Secure share links (applicants shared with a company) ----
CREATE TABLE tpo_share_link (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    job_id INT NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    recipient_email VARCHAR(150) NOT NULL,
    code_hash VARCHAR(128) NULL COMMENT 'SHA-256 of the one-time email code',
    email_code_hash VARCHAR(128) NULL COMMENT 'SHA-256 of the code the company asked us to email them',
    email_code_expires DATETIME NULL,
    columns_json JSON NULL,
    max_stage VARCHAR(30) NULL COMMENT 'Applicants past this stage are excluded; phone only after SHORTLISTED',
    shortlist_by DATETIME NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tpo_share_token (token_hash),
    INDEX idx_tpo_share_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tpo_share_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    share_id BIGINT NOT NULL,
    action VARCHAR(20) NOT NULL COMMENT 'CREATED|OPENED|DOWNLOADED_LIST|DOWNLOADED_ZIP|REVOKED',
    detail VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tpo_share_event (share_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- Scheduling: slots, per-student assignment, reschedule requests ----
CREATE TABLE round_slot (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    round_id BIGINT NOT NULL,
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,
    room VARCHAR(100) NULL,
    panel VARCHAR(100) NULL,
    capacity INT NOT NULL DEFAULT 1,
    proposed_by VARCHAR(5) NOT NULL DEFAULT 'TPO' COMMENT 'TPO | HR',
    status VARCHAR(12) NOT NULL DEFAULT 'PROPOSED' COMMENT 'PROPOSED|CONFIRMED',
    INDEX idx_round_slot_round (round_id, starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE round_assignment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    round_id BIGINT NOT NULL,
    application_id INT NOT NULL,
    slot_id BIGINT NULL,
    room VARCHAR(100) NULL,
    student_confirmed_at DATETIME NULL COMMENT 'Set when the student confirms a changed slot',
    notified_at DATETIME NULL,
    UNIQUE KEY uk_round_assignment (round_id, application_id),
    INDEX idx_round_assignment_slot (slot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reschedule_request (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    round_id BIGINT NOT NULL,
    application_id INT NOT NULL,
    reason VARCHAR(1000) NULL,
    preferred_times VARCHAR(500) NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING|MOVED|KEPT',
    reply VARCHAR(1000) NULL,
    decided_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reschedule_round (round_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- Drive day attendance ----
CREATE TABLE round_attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    round_id BIGINT NOT NULL,
    application_id INT NOT NULL,
    status VARCHAR(15) NOT NULL COMMENT 'WAITING|PRESENT|IN_INTERVIEW|DONE|ABSENT',
    room VARCHAR(100) NULL,
    marked_by INT NULL,
    marked_by_role VARCHAR(20) NULL COMMENT 'TPO_ADMIN|FACULTY|STUDENT_COORDINATOR',
    marked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_round_attendance (round_id, application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- Team and roles ----
CREATE TABLE tpo_team_member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    faculty_id INT NOT NULL,
    role VARCHAR(25) NOT NULL COMMENT 'TPO_ADMIN | FACULTY_COORDINATOR',
    department VARCHAR(100) NULL COMMENT 'Faculty coordinators see only this department',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tpo_team (college_id, faculty_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tpo_coordinator_assignment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    job_id INT NOT NULL,
    learner_id INT NOT NULL COMMENT 'The student coordinator',
    on_date DATE NOT NULL,
    created_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tpo_coordinator (job_id, learner_id, on_date),
    INDEX idx_tpo_coordinator_learner (learner_id, on_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- College-wide TPO settings (templates, branding, trusted domains, SMS cap) ----
CREATE TABLE tpo_college_settings (
    college_id INT NOT NULL PRIMARY KEY,
    invite_email_template VARCHAR(4000) NULL,
    reminder_email_template VARCHAR(4000) NULL,
    whatsapp_template VARCHAR(2000) NULL,
    student_email_wording VARCHAR(4000) NULL,
    sms_monthly_cap INT NOT NULL DEFAULT 500,
    email_signature VARCHAR(1000) NULL,
    logo_url VARCHAR(500) NULL,
    trusted_domains_json JSON NULL,
    prep_course_ids_json JSON NULL COMMENT 'The LMS courses whose tests count toward readiness',
    prep_threshold_pct INT NOT NULL DEFAULT 60 COMMENT 'Average on those tests a student needs to count as prepared',
    notify_toggles_json JSON NULL COMMENT 'On/off for the optional student notices: driveOpenEmail, resultApplied, nudges, prepAssigned',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tpo_user_prefs (
    faculty_id INT NOT NULL PRIMARY KEY,
    prefs_json JSON NULL COMMENT 'Which optional notifications this person receives',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- Saved views (Students, Leads, Drives tables) ----
CREATE TABLE tpo_saved_view (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    faculty_id INT NOT NULL,
    scope VARCHAR(20) NOT NULL COMMENT 'STUDENTS|LEADS|DRIVES',
    name VARCHAR(100) NOT NULL,
    filters_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tpo_saved_view (college_id, faculty_id, scope)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- Student notes and audit log ----
CREATE TABLE tpo_student_note (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    learner_id INT NOT NULL,
    note VARCHAR(2000) NOT NULL,
    created_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tpo_student_note (learner_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tpo_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    actor_type VARCHAR(10) NOT NULL COMMENT 'TPO | HR | SYSTEM | STUDENT',
    actor_id INT NULL,
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(30) NULL COMMENT 'DRIVE|LEAD|STUDENT|OFFER|ROUND|SHARE|SETTINGS',
    entity_id BIGINT NULL,
    detail VARCHAR(1000) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tpo_audit_college (college_id, created_at),
    INDEX idx_tpo_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- Bell: things that happened, for information ----
CREATE TABLE tpo_bell (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body VARCHAR(500) NULL,
    link VARCHAR(200) NULL,
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tpo_bell (college_id, read_at, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- Recruiters: consent for an existing account, and the new drive-work capability ----
ALTER TABLE hr_college_access
    ADD COLUMN pending_lead_id BIGINT NULL COMMENT 'Set while an existing recruiter has been invited but has not accepted yet (status PENDING_HR)';

-- Every recruiter who could request a drive can also work on the drives they asked for.
INSERT INTO hr_college_access_capability (access_id, capability)
SELECT c.access_id, 'DRIVE_WORK' FROM hr_college_access_capability c
WHERE c.capability = 'DRIVE_REQUEST'
  AND NOT EXISTS (SELECT 1 FROM hr_college_access_capability x WHERE x.access_id = c.access_id AND x.capability = 'DRIVE_WORK');

ALTER TABLE job_offer
    ADD COLUMN expiring_notified_at DATETIME NULL COMMENT 'Set once the holder was told the offer expires within 24 hours';

-- ---- Small column additions ----
ALTER TABLE job
    ADD COLUMN application_deadline_notified_at DATETIME NULL COMMENT 'Set once the deadline has passed and the Home "share with company" card was raised',
    ADD COLUMN previous_request_json JSON NULL COMMENT 'What an HR request looked like before it was resubmitted, so the TPO can see what changed';

ALTER TABLE job_application
    ADD COLUMN ineligible_flag_at DATETIME NULL COMMENT 'Set when a corrected or imported academic record made an existing applicant ineligible; the applicant is flagged, never removed';

ALTER TABLE learner_academic_record
    ADD COLUMN batch VARCHAR(20) NULL COMMENT 'Batch / passing-out year label used by Students and Reports filters';
