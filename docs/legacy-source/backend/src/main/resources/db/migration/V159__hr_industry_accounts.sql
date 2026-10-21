-- HR (industry recruiter) accounts. See docs/hr-tpo/DESIGN.md.
--
-- An HR is NOT a faculty or learner row. One hr_user per real person (phone is unique); the
-- colleges they may enter are grants in hr_college_access, managed only by a super admin.
-- Capabilities per grant start empty: an HR can log in and see their colleges, nothing else.
-- Every HR feature added later is a new capability name, checked through HrAccessService.
-- Additive only (new tables), so rolling the application back leaves existing data untouched.

CREATE TABLE industry_company (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    website VARCHAR(500) NULL,
    industry VARCHAR(100) NULL,
    logo_url VARCHAR(500) NULL,
    created_by_user_id INT NULL,
    created_by_user_type VARCHAR(20) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_industry_company_name (name)
);

CREATE TABLE hr_user (
    id INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NULL,
    -- Normalised 10-digit mobile (OnboardingMobileNumber). Unique across soft-deleted rows too:
    -- re-adding a deleted HR restores the same identity instead of creating a second one.
    contact_mobile VARCHAR(15) NOT NULL,
    contact_mail VARCHAR(255) NULL,
    designation VARCHAR(150) NULL,
    industry_company_id INT NULL,
    -- Non-null means suspended. Login and every request are refused while set.
    suspended_at DATETIME(6) NULL,
    suspension_reason VARCHAR(500) NULL,
    -- Bumped on suspend / revoke-sessions / delete so every issued token dies immediately.
    token_version INT NOT NULL DEFAULT 0,
    last_login_at DATETIME(6) NULL,
    created_by_user_id INT NULL,
    created_by_user_type VARCHAR(20) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_hr_user_contact_mobile (contact_mobile),
    KEY idx_hr_user_company (industry_company_id),
    CONSTRAINT fk_hr_user_industry_company
        FOREIGN KEY (industry_company_id) REFERENCES industry_company (id)
);

CREATE TABLE hr_college_access (
    id INT NOT NULL AUTO_INCREMENT,
    hr_user_id INT NOT NULL,
    college_id INT NOT NULL,
    organization_id INT NULL,
    -- ACTIVE or REVOKED. A revoked grant is kept (not deleted) so the history stays auditable;
    -- granting the same college again re-activates this row.
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    -- Optional end of access (e.g. one placement drive). Past this instant the grant is inactive.
    valid_until DATETIME(6) NULL,
    granted_by_user_id INT NULL,
    granted_by_user_type VARCHAR(20) NULL,
    granted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    revoked_by_user_id INT NULL,
    revoked_by_user_type VARCHAR(20) NULL,
    revoked_at DATETIME(6) NULL,
    revoke_reason VARCHAR(500) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_hr_college_access_user_college (hr_user_id, college_id),
    KEY idx_hr_college_access_college_status (college_id, status),
    CONSTRAINT fk_hr_college_access_hr_user
        FOREIGN KEY (hr_user_id) REFERENCES hr_user (id),
    CONSTRAINT fk_hr_college_access_college
        FOREIGN KEY (college_id) REFERENCES college (id)
);

CREATE TABLE hr_college_access_capability (
    access_id INT NOT NULL,
    capability VARCHAR(64) NOT NULL,
    granted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (access_id, capability),
    CONSTRAINT fk_hr_college_access_capability_access
        FOREIGN KEY (access_id) REFERENCES hr_college_access (id) ON DELETE CASCADE
);
