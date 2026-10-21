-- TPO V1: drives, rounds, offers, placement rules. See docs/hr-tpo-flows/TPO V1 - Locked.docx.
--
-- Additive only. Extends job/job_application/interview so existing learner-facing Placements
-- pages keep working unchanged. Nothing here removes or renames an existing column.
--
-- Design choices made for V1 (owner: Claude, overnight build 2026-09-28):
--   - Eligibility and role options are JSON columns on `job`, not new tables. This is enough for
--     a closed V1 rule set (see JobEligibility.java / JobRoleOption.java for the shape) and keeps
--     the migration small. A real join table can follow if reporting ever needs to query inside
--     them at the SQL level.
--   - `job_round` is a real table: order and per-round status genuinely need queries.
--   - `round_result` is the staging table results wait in before the TPO applies them.
--   - `job_offer` is separate from `job_application.application_status`; only releasing an offer
--     sets the application to OFFERED, so the existing learner accept/decline flow is untouched.

-- ---------------------------------------------------------------- season
CREATE TABLE placement_season (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    registration_deadline DATETIME NULL,
    is_registration_open BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_dates JSON NULL COMMENT 'Array of {date, label} exam/blocked dates for the season',
    is_current BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Several seasons may be open at once; this only drives default filters',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_placement_season_college (college_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- drive group (multi-college HR drives)
CREATE TABLE drive_group (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hr_user_id BIGINT NULL,
    industry_company_id BIGINT NULL,
    shared_form_json JSON NULL COMMENT 'The common job/pay/eligibility/rounds payload sent to every college in this group',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- job extensions
ALTER TABLE job
    ADD COLUMN drive_mode VARCHAR(20) NOT NULL DEFAULT 'ON_CAMPUS' COMMENT 'ON_CAMPUS | POOL | OFF_CAMPUS',
    ADD COLUMN lifecycle_status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED' COMMENT 'REQUEST|SENT_BACK|REJECTED|DRAFT|PUBLISHED|CLOSED|CANCELLED — kept in sync with is_draft/is_active by JobLifecycleService, never written directly elsewhere',
    ADD COLUMN category VARCHAR(20) NULL COMMENT 'REGULAR|DREAM|SUPER_DREAM — defaults from CTC, can be overridden with a reason',
    ADD COLUMN category_override_reason VARCHAR(255) NULL,
    ADD COLUMN season_id BIGINT NULL,
    ADD COLUMN owner_faculty_id INT NULL COMMENT 'Drive owner: TPO admin or a delegated faculty coordinator',
    ADD COLUMN drive_group_id BIGINT NULL COMMENT 'Set when this job is one college''s copy of a multi-college HR drive',
    ADD COLUMN hr_user_id BIGINT NULL COMMENT 'HR who requested this drive, if any; null on the no-login (TPO-run) path',
    ADD COLUMN requires_external_registration BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN external_portal_name VARCHAR(100) NULL COMMENT 'e.g. "TCS NextStep"',
    ADD COLUMN external_portal_url VARCHAR(500) NULL,
    ADD COLUMN external_apply_url VARCHAR(500) NULL COMMENT 'Off-campus/virtual drives: the company''s own application link',
    ADD COLUMN host_college_name VARCHAR(200) NULL COMMENT 'Pool drives: the host college',
    ADD COLUMN reporting_at DATETIME NULL COMMENT 'Pool/off-campus: when/where to report',
    ADD COLUMN travel_note VARCHAR(500) NULL,
    ADD COLUMN eligibility_json JSON NULL COMMENT 'Closed V1 rule set: branchIds, minCgpa/minPct, maxActiveBacklogs, maxPastBacklogs, tenthMinPct, twelfthMinPct or diplomaMinPct, ugMinPct, maxGapYears, programIds, passingYears, gender. See JobEligibility.java',
    ADD COLUMN role_options_json JSON NULL COMMENT 'Array of {name, ctcLpa, fixedLpa, variableLpa, joiningBonusLpa, bondMonths, bondAmount, stipendPerMonth, stipendMonths}. See JobRoleOption.java',
    ADD COLUMN results_auto_apply BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Per-drive: apply HR/company decisions automatically instead of waiting for the TPO',
    ADD COLUMN closed_at DATETIME NULL,
    ADD COLUMN cancelled_at DATETIME NULL,
    ADD COLUMN cancelled_reason VARCHAR(500) NULL,
    ADD COLUMN sent_back_note VARCHAR(1000) NULL COMMENT 'TPO''s note when sending an HR request back for changes',
    ADD INDEX idx_job_season (season_id),
    ADD INDEX idx_job_drive_group (drive_group_id),
    ADD INDEX idx_job_lifecycle (lifecycle_status);

-- Backfill lifecycle_status from the existing is_draft/is_active flags so nothing already
-- published silently becomes invisible, and existing drafts are not miscounted as Requests.
UPDATE job SET lifecycle_status = CASE
    WHEN is_active = FALSE THEN 'CLOSED'
    WHEN is_draft = TRUE THEN 'DRAFT'
    ELSE 'PUBLISHED'
END;

-- ---------------------------------------------------------------- eligibility overrides (per-student include/exclude)
CREATE TABLE job_eligibility_override (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    learner_id INT NOT NULL,
    override_type VARCHAR(10) NOT NULL COMMENT 'INCLUDE | EXCLUDE',
    reason VARCHAR(500) NOT NULL,
    created_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_job_eligibility_override (job_id, learner_id),
    INDEX idx_job_eligibility_override_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- rounds
CREATE TABLE job_round (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    seq INT NOT NULL COMMENT 'Display and processing order',
    kind VARCHAR(20) NOT NULL COMMENT 'TALK|TEST|VENDOR_TEST|GD|INTERVIEW',
    name VARCHAR(100) NOT NULL,
    mode VARCHAR(20) NULL COMMENT 'ON_CAMPUS|VIRTUAL',
    scheduled_date DATETIME NULL COMMENT 'Null = "to be decided"',
    venue VARCHAR(255) NULL,
    meeting_url VARCHAR(500) NULL,
    what_to_bring VARCHAR(500) NULL,
    platform VARCHAR(100) NULL COMMENT 'Test/vendor-test: Mettl, HackerRank, etc.',
    test_link VARCHAR(500) NULL,
    duration_minutes INT NULL,
    results_due DATETIME NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING|SCHEDULED|COMPLETED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_job_round_job (job_id, seq)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE job_application
    ADD COLUMN current_round_id BIGINT NULL COMMENT 'Which job_round this applicant is currently in; independent of the coarse application_status bucket',
    ADD COLUMN external_ref VARCHAR(100) NULL COMMENT 'Company portal reference ID (e.g. TCS CT/DT number), filled in by the student',
    ADD COLUMN public_ref VARCHAR(16) NULL COMMENT 'Stable, non-sequential ID handed to companies/ATS instead of the internal DB id',
    ADD COLUMN internal_reason VARCHAR(1000) NULL COMMENT 'HR/TPO-only note on a stage change. NEVER serialised to the learner. rejection_reason (existing column) is the student-facing message only.',
    ADD COLUMN withdrawal_reason VARCHAR(30) NULL COMMENT 'SELF|PLACED_ELSEWHERE|TPO_APPROVED|INELIGIBLE|DRIVE_CANCELLED',
    ADD COLUMN applied_by_college BOOLEAN NOT NULL DEFAULT FALSE COMMENT '"Apply on behalf" — the student did not click apply themselves',
    ADD COLUMN applied_by_college_opt_out_until DATETIME NULL,
    ADD UNIQUE KEY uk_job_application_public_ref (public_ref),
    ADD INDEX idx_job_application_current_round (current_round_id);

-- Backfill public_ref for existing rows so the column can be relied on going forward.
UPDATE job_application SET public_ref = CONCAT('A', LPAD(CONV(SUBSTRING(MD5(CONCAT(id, '-', RAND())), 1, 10), 16, 10), 10, '0'))
WHERE public_ref IS NULL;

-- ---------------------------------------------------------------- results staging
CREATE TABLE round_result (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    round_id BIGINT NOT NULL,
    outcome VARCHAR(20) NOT NULL COMMENT 'PASS|FAIL|ABSENT|HOLD (HOLD = waitlist)',
    waitlist_rank INT NULL,
    score DOUBLE NULL,
    reason_category VARCHAR(30) NULL COMMENT 'APTITUDE|TECHNICAL|COMMUNICATION|OTHER — feeds readiness, never shown outside the college',
    comment VARCHAR(1000) NULL COMMENT 'Company-private when source = PANELIST; never exported',
    source VARCHAR(20) NOT NULL COMMENT 'HR|PANELIST|DRIVE_DAY|EXCEL|TPO',
    submitted_by_type VARCHAR(20) NOT NULL,
    submitted_by_id INT NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    applied_at DATETIME NULL COMMENT 'Null = still staged, waiting for the TPO (or auto-apply) to apply it',
    applied_by INT NULL,
    superseded_by BIGINT NULL COMMENT 'Set when a later result for the same application+round replaces this one',
    INDEX idx_round_result_application (application_id),
    INDEX idx_round_result_round (round_id),
    INDEX idx_round_result_pending (round_id, applied_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- offers
CREATE TABLE job_offer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    kind VARCHAR(10) NOT NULL DEFAULT 'OFFER' COMMENT 'LOI | OFFER',
    role_option_name VARCHAR(100) NULL,
    ctc_lpa DECIMAL(10,2) NULL,
    fixed_lpa DECIMAL(10,2) NULL,
    variable_lpa DECIMAL(10,2) NULL,
    joining_bonus_lpa DECIMAL(10,2) NULL,
    bond_months INT NULL,
    bond_amount DECIMAL(10,2) NULL,
    joining_date DATE NULL COMMENT 'Null = "to be announced"',
    respond_by DATETIME NULL,
    letter_url VARCHAR(500) NULL,
    status VARCHAR(25) NOT NULL DEFAULT 'SELECTED' COMMENT 'SELECTED|PENDING_VERIFICATION|RELEASED|ACCEPTED|DECLINED|EXPIRED|WITHDRAWN|REVOKED',
    acceptance_channel VARCHAR(15) NULL COMMENT 'IN_APP | EXTERNAL_IMPORT',
    accepted_disputable_until DATETIME NULL COMMENT 'For EXTERNAL_IMPORT acceptances: the 48h window the student can dispute in before the cascade runs',
    joining_status VARCHAR(15) NULL COMMENT 'JOINED|DEFERRED|NOT_JOINED',
    cascade_id VARCHAR(36) NULL COMMENT 'Groups every application row this offer''s accept auto-withdrew, so a reversal can undo exactly that set',
    revoke_reason VARCHAR(500) NULL,
    created_by_type VARCHAR(10) NOT NULL DEFAULT 'TPO' COMMENT 'TPO | HR',
    created_by_id INT NULL,
    verified_by INT NULL,
    released_at DATETIME NULL,
    responded_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_job_offer_application (application_id),
    INDEX idx_job_offer_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Backfill: every existing OFFERED/HIRED application gets a RELEASED/ACCEPTED job_offer row so
-- reports and the new Offers screens see history correctly instead of a wall of blanks.
INSERT INTO job_offer (application_id, ctc_lpa, letter_url, status, created_by_type, released_at, responded_at)
SELECT ja.id, NULL, ja.offer_letter_url,
       CASE WHEN ja.application_status = 'HIRED' THEN 'ACCEPTED' ELSE 'RELEASED' END,
       'TPO', COALESCE(ja.offer_letter_sent_at, ja.status_updated_at), ja.status_updated_at
FROM job_application ja
WHERE ja.application_status IN ('OFFERED', 'HIRED');

-- ---------------------------------------------------------------- verified academic record
CREATE TABLE learner_academic_record (
    learner_id INT NOT NULL PRIMARY KEY,
    cgpa DECIMAL(4,2) NULL,
    active_backlogs INT NULL,
    past_backlogs INT NULL,
    tenth_pct DECIMAL(5,2) NULL,
    twelfth_pct DECIMAL(5,2) NULL,
    diploma_pct DECIMAL(5,2) NULL,
    ug_pct DECIMAL(5,2) NULL,
    gap_years INT NULL DEFAULT 0,
    is_lateral_entry BOOLEAN NOT NULL DEFAULT FALSE,
    passing_year INT NULL,
    gender VARCHAR(20) NULL,
    source VARCHAR(15) NOT NULL DEFAULT 'SELF' COMMENT 'VERIFIED | SELF',
    import_batch_id VARCHAR(36) NULL,
    imported_at DATETIME NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- registration
CREATE TABLE placement_registration (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    season_id BIGINT NOT NULL,
    choice VARCHAR(20) NOT NULL COMMENT 'PLACEMENTS|HIGHER_STUDIES|NOT_INTERESTED',
    consent_version VARCHAR(10) NULL,
    consent_at DATETIME NULL,
    source VARCHAR(15) NOT NULL DEFAULT 'SELF' COMMENT 'SELF|TPO|BACKFILL',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_placement_registration (learner_id, season_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- debarment
CREATE TABLE placement_debarment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    reason VARCHAR(500) NOT NULL,
    until_date DATE NULL,
    until_drives INT NULL COMMENT 'Alternative to a date: debarred for the next N drives',
    drives_counted INT NOT NULL DEFAULT 0,
    created_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lifted_at DATETIME NULL,
    lifted_reason VARCHAR(500) NULL,
    INDEX idx_placement_debarment_learner (learner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- generic student request queue
CREATE TABLE student_request (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    type VARCHAR(30) NOT NULL COMMENT 'WITHDRAWAL|OFFER_EXTENSION|REGISTRATION_CHANGE|ABSENCE_DISPUTE|CORRECTION|EXTERNAL_OFFER|PAP',
    job_id INT NULL,
    application_id INT NULL,
    payload_json JSON NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING|APPROVED|REJECTED|AUTO_APPROVED',
    reason VARCHAR(1000) NULL,
    decided_by INT NULL,
    decided_at DATETIME NULL,
    decision_reason VARCHAR(500) NULL,
    escalate_at DATETIME NULL COMMENT 'When a pending request (e.g. a withdrawal 24h before a round) escalates to all TPO admins',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_request_learner (learner_id),
    INDEX idx_student_request_status (status, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- leads (slim CRM)
-- Named tpo_lead, not "lead": LEAD() is a reserved word (window function) in MySQL 8.
CREATE TABLE tpo_lead (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    company_id BIGINT NULL,
    hr_user_id BIGINT NULL,
    name VARCHAR(150) NOT NULL,
    designation VARCHAR(100) NULL,
    email_norm VARCHAR(150) NULL,
    phone_norm VARCHAR(20) NULL,
    company_name VARCHAR(150) NULL,
    company_logo VARCHAR(500) NULL,
    owner_faculty_id INT NULL,
    manual_stage VARCHAR(15) NOT NULL DEFAULT 'NEW' COMMENT 'NEW|CONTACTED|NOT_NOW — derived stages (Invited/Joined/Drive planned/Recruited) are computed, never stored',
    not_now_reason VARCHAR(255) NULL,
    not_now_until DATE NULL,
    source VARCHAR(30) NULL,
    invite_token_hash VARCHAR(128) NULL,
    invite_sent_at DATETIME NULL,
    invite_clicked_at DATETIME NULL,
    invite_reminder_sent_at DATETIME NULL,
    invite_bounced_at DATETIME NULL,
    unsubscribed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lead_college (college_id),
    INDEX idx_lead_email (email_norm),
    INDEX idx_lead_phone (phone_norm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE lead_activity (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL COMMENT 'CALL|WHATSAPP|EMAIL|MEETING|NOTE|SYSTEM',
    outcome VARCHAR(30) NULL,
    note VARCHAR(2000) NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lead_activity_lead (lead_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE follow_up (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    due_at DATETIME NOT NULL,
    owner_faculty_id INT NULL,
    note VARCHAR(500) NULL,
    done_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_follow_up_due (due_at, done_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- prep assignment (readiness -> assign prep)
CREATE TABLE prep_assignment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    course_id INT NULL,
    assessment_id INT NULL,
    due_at DATETIME NULL,
    assigned_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prep_assignment_learner (learner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- notification outbox
CREATE TABLE notification_outbox (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event VARCHAR(50) NOT NULL,
    recipient_type VARCHAR(15) NOT NULL COMMENT 'LEARNER|HR|FACULTY',
    recipient_id INT NOT NULL,
    channel VARCHAR(10) NOT NULL COMMENT 'APP|EMAIL|SMS',
    payload_json JSON NULL,
    send_after DATETIME NOT NULL COMMENT 'Now + 30s for the Undo hold; immediate for non-undoable sends',
    status VARCHAR(15) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING|SENT|CANCELLED|FAILED',
    undo_group_id VARCHAR(36) NULL,
    claimed_at DATETIME NULL,
    sent_at DATETIME NULL,
    failure_reason VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notification_outbox_pending (status, send_after),
    INDEX idx_notification_outbox_undo_group (undo_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE email_suppression (
    email_norm VARCHAR(150) NOT NULL PRIMARY KEY,
    reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- HR grant capability list (extends V159)
-- HrCapability.KNOWN was empty; V1 TPO-granted access needs a real set to check against.
-- (See HrCapability.java for the enum; this just documents the contract in the schema.)
ALTER TABLE hr_college_access
    ADD COLUMN granted_by_type VARCHAR(15) NULL DEFAULT 'SUPER_ADMIN' COMMENT 'SUPER_ADMIN | TPO — V1 lets a TPO grant access to their own college',
    ADD COLUMN verification VARCHAR(20) NOT NULL DEFAULT 'VERIFIED_DOMAIN' COMMENT 'VERIFIED_DOMAIN | TPO_APPROVED | PENDING',
    ADD COLUMN hiring_for_company_id BIGINT NULL,
    ADD COLUMN agency_for_company_name VARCHAR(150) NULL COMMENT 'Set when this HR is an agency/RPO hiring for a named client';
