-- Profile verification (docs/tpo-ux/PROFILE-VERIFICATION-DESIGN.md): the college verifies a student's Education and Identity.
-- One row per student per section. Incomplete and Ready are worked out from the profile and have no row.
CREATE TABLE profile_verification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    section VARCHAR(20) NOT NULL COMMENT 'EDUCATION | IDENTITY',
    status VARCHAR(20) NOT NULL COMMENT 'SUBMITTED | SENT_BACK | VERIFIED | UPDATE_PENDING',
    submitted_snapshot JSON NULL COMMENT 'What the student sent (identity numbers masked)',
    verified_snapshot JSON NULL COMMENT 'What was verified; stays in force while an update is pending',
    submitted_at DATETIME NULL,
    decided_at DATETIME NULL,
    decided_by_type VARCHAR(20) NULL COMMENT 'ADMIN | SUPER_ADMIN | TPO',
    decided_by_id INT NULL,
    decided_by_name VARCHAR(200) NULL,
    note VARCHAR(500) NULL COMMENT 'Why it was sent back',
    verified_at DATETIME NULL,
    verified_by_name VARCHAR(200) NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_profile_verification (learner_id, section),
    INDEX idx_profile_verification_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Every submit, verify and send back, with who and what (the history behind "Verified by X on date").
CREATE TABLE profile_verification_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    section VARCHAR(20) NOT NULL,
    action VARCHAR(20) NOT NULL COMMENT 'SUBMITTED | UPDATE_SUBMITTED | VERIFIED | SENT_BACK',
    actor_type VARCHAR(20) NOT NULL,
    actor_id INT NULL,
    actor_name VARCHAR(200) NULL,
    note VARCHAR(500) NULL,
    snapshot JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_profile_verification_event (learner_id, section, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- The college admin decides whether the placement cell (TPO admins, never coordinators) may verify. On by default.
ALTER TABLE tpo_college_settings
    ADD COLUMN tpo_can_verify_profiles TINYINT(1) NOT NULL DEFAULT 1;
